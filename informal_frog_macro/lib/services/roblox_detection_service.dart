import 'dart:async';
import 'dart:ffi';

import 'package:ffi/ffi.dart';
import 'package:win32/win32.dart';

import '../models/roblox_window.dart';
import 'log_service.dart';

class RobloxDetectionService {
  static const int pollingIntervalMs = 500;

  static const int _processQueryInformation = 0x0400;

  static const List<String> robloxProcessNames = [
    'robloxplayerbeta.exe',
    'robloxplayerlauncherbeta.exe',
    'robloxplayerforpc.exe',
  ];

  static const List<String> robloxWindowTitles = [
    'roblox',
    'roblox player',
    'robloxplayer',
  ];

  static _RobloxWindowInfo? _foundWindow;

  final LogService logService;
  final StreamController<RobloxEventType> _eventController =
      StreamController<RobloxEventType>.broadcast();
  final StreamController<RobloxWindow> _windowController =
      StreamController<RobloxWindow>.broadcast();

  Timer? _pollingTimer;
  RobloxWindow _previousWindow = RobloxWindow.notFound;
  bool _isDisposed = false;

  Stream<RobloxEventType> get eventStream => _eventController.stream;
  Stream<RobloxWindow> get windowStream => _windowController.stream;

  RobloxWindow get currentWindow => _previousWindow.copy();

  RobloxDetectionService(this.logService);

  void start() {
    logService.logInfo('Roblox detection service starting',
        subsystem: 'roblox');
    _pollingTimer = Timer.periodic(
      Duration(milliseconds: pollingIntervalMs),
      (timer) => _poll(),
    );
  }

  void stop() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
    logService.logInfo('Roblox detection service stopped',
        subsystem: 'roblox');
  }

  void _poll() {
    if (_isDisposed) return;

    try {
      final currentWindow = _detectRoblox();
      _compareAndEmit(currentWindow);
    } catch (e, st) {
      logService.logError(
          'Error during Roblox detection: $e\n$st',
          subsystem: 'roblox');
    }
  }

  RobloxWindow _detectRoblox() {
    final windowInfo = _findRobloxWindowByEnum();
    if (windowInfo == null) {
      return RobloxWindow.notFound;
    }

    final isForeground = GetForegroundWindow() == windowInfo.handle;

    RobloxWindowState state = RobloxWindowState.running;
    bool isMinimized = false;

    final placement = calloc<WINDOWPLACEMENT>();
    placement.ref.length = sizeOf<WINDOWPLACEMENT>();

    if (GetWindowPlacement(windowInfo.handle, placement) != 0) {
      final showCmd = placement.ref.showCmd;
      if (showCmd == SW_SHOWMINIMIZED) {
        isMinimized = true;
        state = RobloxWindowState.minimized;
      }
    }
    calloc.free(placement);

    if (!isMinimized) {
      if (IsWindowVisible(windowInfo.handle) != 0) {
        state = RobloxWindowState.visible;
      } else {
        state = RobloxWindowState.hidden;
      }
    }

    if (isForeground) {
      state = RobloxWindowState.foreground;
    } else if (state == RobloxWindowState.visible ||
        state == RobloxWindowState.running) {
      state = RobloxWindowState.background;
    }

    return RobloxWindow(
      handle: windowInfo.handle,
      title: windowInfo.title,
      x: windowInfo.x,
      y: windowInfo.y,
      width: windowInfo.width,
      height: windowInfo.height,
      state: state,
      isForeground: isForeground,
      processId: windowInfo.processId,
    );
  }

  _RobloxWindowInfo? _findRobloxWindowByEnum() {
    _foundWindow = null;

    final callbackPtr =
        Pointer.fromFunction<WNDENUMPROC>(_enumWindowsProc, 0);
    EnumWindows(callbackPtr, 0);
    return _foundWindow;
  }

  static int _enumWindowsProc(int hwnd, int lParam) {
    _foundWindow ??= _checkWindow(hwnd);
    return _foundWindow == null ? 1 : 0;
  }

  static _RobloxWindowInfo? _checkWindow(int hwnd) {
    final title = _getWindowTitle(hwnd);
    if (title.isEmpty || !_isRobloxWindowTitle(title)) return null;

    final pidPtr = calloc<Uint32>();
    GetWindowThreadProcessId(hwnd, pidPtr);
    final pid = pidPtr.value;
    calloc.free(pidPtr);

    if (pid == 0) return null;

    final processName = _getProcessName(pid);
    if (processName == null || !robloxProcessNames.contains(processName)) {
      return null;
    }

    final rectPtr = calloc<RECT>();
    if (GetWindowRect(hwnd, rectPtr) != 0) {
      final rect = rectPtr.ref;
      final info = _RobloxWindowInfo(
        handle: hwnd,
        title: title,
        x: rect.left,
        y: rect.top,
        width: rect.right - rect.left,
        height: rect.bottom - rect.top,
        processId: pid,
      );
      calloc.free(rectPtr);
      return info;
    }
    calloc.free(rectPtr);
    return null;
  }

  static String _getWindowTitle(int hwnd) {
    final length = GetWindowTextLength(hwnd);
    if (length == 0) return '';

    final buffer = calloc<Uint16>(length + 1);
    try {
      GetWindowText(hwnd, buffer.cast<Utf16>(), length + 1);
      return buffer.cast<Utf16>().toDartString();
    } finally {
      calloc.free(buffer);
    }
  }

  static String? _getProcessName(int processId) {
    final handle = OpenProcess(_processQueryInformation | 0x0010, 0, processId);

    if (handle == 0 || handle == INVALID_HANDLE_VALUE) {
      return null;
    }

    try {
      final size = 512;
      final buffer = calloc<Uint16>(size);
      final sizePtr = calloc<Uint32>();
      sizePtr.value = size;

      if (QueryFullProcessImageName(handle, 0,
              buffer.cast<Utf16>(), sizePtr) !=
          0) {
        final path = buffer.cast<Utf16>().toDartString();
        final name = path.substring(path.lastIndexOf('\\') + 1);
        calloc.free(buffer);
        calloc.free(sizePtr);
        return name.toLowerCase();
      }
      calloc.free(buffer);
      calloc.free(sizePtr);
      return null;
    } finally {
      CloseHandle(handle);
    }
  }

  static bool _isRobloxWindowTitle(String title) {
    if (title.isEmpty) return false;
    final lowerTitle = title.toLowerCase();
    for (final robloxTitle in robloxWindowTitles) {
      if (lowerTitle.startsWith(robloxTitle)) {
        return true;
      }
    }
    return false;
  }

  void _compareAndEmit(RobloxWindow current) {
    final RobloxWindow previous = _previousWindow.copy();

    if (previous.state == RobloxWindowState.notRunning &&
        current.state != RobloxWindowState.notRunning) {
      logService.logInfo(
          'Roblox detected. Process ID: ${current.processId}',
          subsystem: 'roblox');
      _emitEvent(RobloxEventType.started);
      _emitWindow(current);

      if (current.handle != null &&
          current.state != RobloxWindowState.notRunning) {
        _emitEvent(RobloxEventType.windowFound);
      }
    } else if (previous.state != RobloxWindowState.notRunning &&
        current.state == RobloxWindowState.notRunning) {
      logService.logInfo('Roblox closed.', subsystem: 'roblox');
      _emitEvent(RobloxEventType.closed);
      _emitEvent(RobloxEventType.windowLost);
      _emitWindow(current);
    } else if (current.handle != null && previous.handle != null) {
      if (current.x != previous.x || current.y != previous.y) {
        logService.logInfo(
            'Window moved. X: ${current.x}, Y: ${current.y}',
            subsystem: 'roblox');
        _emitEvent(RobloxEventType.windowMoved);
      }

      if (current.width != previous.width ||
          current.height != previous.height) {
        logService.logInfo(
            'Window resized. Width: ${current.width}, Height: ${current.height}',
            subsystem: 'roblox');
        _emitEvent(RobloxEventType.windowResized);
      }

      if (current.isForeground != previous.isForeground) {
        if (current.isForeground) {
          logService.logInfo('Window entered foreground',
              subsystem: 'roblox');
        } else {
          logService.logInfo('Window entered background',
              subsystem: 'roblox');
        }
        _emitEvent(RobloxEventType.foregroundChanged);
      }

      if (current.state == RobloxWindowState.minimized &&
          previous.state != RobloxWindowState.minimized) {
        logService.logInfo('Window minimized', subsystem: 'roblox');
        _emitEvent(RobloxEventType.windowMinimized);
      } else if (previous.state == RobloxWindowState.minimized &&
          current.state != RobloxWindowState.minimized) {
        logService.logInfo('Window restored', subsystem: 'roblox');
        _emitEvent(RobloxEventType.windowRestored);
      }
    }

    _previousWindow = current.copy();
    _emitWindow(current);
  }

  void _emitEvent(RobloxEventType eventType) {
    if (!_isDisposed) {
      _eventController.add(eventType);
    }
  }

  void _emitWindow(RobloxWindow window) {
    if (!_isDisposed) {
      _windowController.add(window);
    }
  }

  void dispose() {
    _isDisposed = true;
    _pollingTimer?.cancel();
    _eventController.close();
    _windowController.close();
  }
}

class _RobloxWindowInfo {
  final int handle;
  final String title;
  final int x;
  final int y;
  final int width;
  final int height;
  final int processId;

  _RobloxWindowInfo({
    required this.handle,
    required this.title,
    required this.x,
    required this.y,
    required this.width,
    required this.height,
    required this.processId,
  });
}
