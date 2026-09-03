import 'dart:ffi';
import 'package:ffi/ffi.dart';
import 'package:win32/win32.dart' hide Rectangle;

import '../models/workspace_layout.dart';
import 'log_service.dart';

class WindowTracker {
  static const int monitorPollingMs = 2000;

  final LogService logService;

  DesktopInfo? _cachedDesktop;
  int _lastDisplayCount = 0;

  static final List<_MonitorInfo> _displays = [];

  DesktopInfo? get cachedDesktop => _cachedDesktop;

  WindowTracker(this.logService);

  DesktopInfo refresh() {
    final info = _getDesktopInfo();
    final monitorCount = info.displays.length;

    if (_cachedDesktop == null || monitorCount != _lastDisplayCount) {
      if (_cachedDesktop == null) {
        logService.logInfo(
            'Monitor configuration detected: $monitorCount display(s)',
            subsystem: 'workspace');
      } else {
        logService.logInfo(
            'Monitor configuration changed: $monitorCount display(s)',
            subsystem: 'workspace');
      }
      _cachedDesktop = info;
      _lastDisplayCount = monitorCount;
    }

    return info;
  }

  DesktopInfo _getDesktopInfo() {
    _displays.clear();

    final callbackPtr =
        Pointer.fromFunction<MONITORENUMPROC>(_enumMonitorsProc, 0);

    EnumDisplayMonitors(0, nullptr, callbackPtr, 0);

    if (_displays.isEmpty) {
      final workArea = calloc<RECT>();
      SystemParametersInfo(SPI_GETWORKAREA, 0, workArea, 0);
      final r = workArea.ref;
      if (r.right == 0 && r.bottom == 0) {
        r.left = 0;
        r.top = 0;
        r.right = 1920;
        r.bottom = 1080;
      }
      _displays.add(_MonitorInfo(
        rect: Rectangle(
          x: r.left,
          y: r.top,
          width: r.right - r.left,
          height: r.bottom - r.top,
        ),
        deviceName: 'Primary Display',
        isPrimary: true,
      ));
      calloc.free(workArea);
    }

    _MonitorInfo? primary;
    for (final d in _displays) {
      if (d.isPrimary) {
        primary = d;
        break;
      }
    }
    primary ??= _displays.first;

    final displays = _displays.map((d) => d.rect).toList();
    final totalWidth = displays
        .map((d) => d.width)
        .reduce((a, b) => a > b ? a : b);
    final totalHeight = displays
        .map((d) => d.height)
        .reduce((a, b) => a > b ? a : b);

    final primaryDisplay = primary.rect;

    String monitorDesc;
    if (displays.length == 1) {
      monitorDesc = primary.deviceName;
    } else {
      monitorDesc = '${displays.length} Display(s)';
    }

    final info = DesktopInfo(
      primaryDisplay: primaryDisplay,
      displays: List.unmodifiable(displays),
      totalWidth: totalWidth,
      totalHeight: totalHeight,
      currentMonitorDescription: monitorDesc,
    );

    _cachedDesktop = info;
    return info;
  }

  static int _enumMonitorsProc(int hMonitor, int hdc, Pointer lprc, int lParam) {
    if (lprc.address != 0) {
      final rectPtr = lprc.cast<RECT>();
      final r = rectPtr.ref;
      final isPrimary = _isPrimaryMonitor(hMonitor);
      final deviceName = _getMonitorDeviceName(hMonitor, isPrimary);
      _displays.add(_MonitorInfo(
        rect: Rectangle(
          x: r.left,
          y: r.top,
          width: r.right - r.left,
          height: r.bottom - r.top,
        ),
        deviceName: deviceName,
        isPrimary: isPrimary,
      ));
    }
    return 1;
  }

  static bool _isPrimaryMonitor(int hMonitor) {
    final infoPtr = calloc<MONITORINFO>();
    infoPtr.ref.cbSize = sizeOf<MONITORINFO>();
    final result = GetMonitorInfo(hMonitor, infoPtr);
    if (result != 0) {
      final isPrimary = (infoPtr.ref.dwFlags & 1) != 0;
      calloc.free(infoPtr);
      return isPrimary;
    }
    calloc.free(infoPtr);
    return false;
  }

  static String _getMonitorDeviceName(int hMonitor, bool isPrimary) {
    final infoExPtr = calloc<MONITORINFOEX>();
    infoExPtr.ref.monitorInfo.cbSize = sizeOf<MONITORINFO>();
    final result = GetMonitorInfo(hMonitor, infoExPtr.cast<MONITORINFO>());
    if (result != 0) {
      final name = infoExPtr.ref.szDevice;
      calloc.free(infoExPtr);
      return name.isNotEmpty ? name : (isPrimary ? 'Primary Display' : 'Unknown Monitor');
    }
    calloc.free(infoExPtr);
    return isPrimary ? 'Primary Display' : 'Unknown Monitor';
  }

  int get monitorPollingIntervalMs => monitorPollingMs;
}

class _MonitorInfo {
  final Rectangle rect;
  final String deviceName;
  final bool isPrimary;

  _MonitorInfo({
    required this.rect,
    required this.deviceName,
    required this.isPrimary,
  });
}
