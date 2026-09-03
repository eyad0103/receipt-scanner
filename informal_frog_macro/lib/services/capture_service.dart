import 'dart:async';
import 'dart:ffi';
import 'dart:typed_data';

import 'package:ffi/ffi.dart';
import 'package:win32/win32.dart';

import '../models/frame_model.dart';
import '../models/roblox_window.dart';
import 'log_service.dart';

class CaptureService {
  static const int targetFps = 30;
  static const int maxRetryAttempts = 3;
  static const int retryDelayMs = 500;

  final LogService logService;
  final RobloxWindow Function() getCurrentWindow;

  int _frameNumber = 0;
  int _totalCaptured = 0;
  int _totalCaptureTimeMs = 0;
  int _slowestCaptureMs = 0;
  int _retryAttempts = 0;

  FrameModel? _latestFrame;
  CaptureStatus _status = CaptureStatus.idle;
  Timer? _captureTimer;
  bool _isDisposed = false;

  CaptureService(this.logService, this.getCurrentWindow);

  FrameModel? get latestFrame => _latestFrame;
  CaptureStatus get status => _status;
  int get frameNumber => _frameNumber;
  int get droppedFrames => _frameNumber - _totalCaptured;
  int get totalCaptureTimeMs => _totalCaptureTimeMs;
  int get slowestCaptureMs => _slowestCaptureMs;
  int get averageCaptureMs =>
      _totalCaptured > 0 ? _totalCaptureTimeMs ~/ _totalCaptured : 0;
  int get totalCaptured => _totalCaptured;

  void startCapture() {
    if (_captureTimer?.isActive == true) return;

    logService.logInfo('Capture Started', subsystem: 'capture');
    _status = CaptureStatus.capturing;
    _frameNumber = 0;
    _retryAttempts = 0;

    final intervalMs = (1000 ~/ targetFps).round();
    _captureTimer = Timer.periodic(
      Duration(milliseconds: intervalMs),
      (_) => _captureFrame(),
    );
  }

  void stopCapture() {
    if (_captureTimer?.isActive != true) return;

    _captureTimer?.cancel();
    _captureTimer = null;
    _status = CaptureStatus.idle;
    logService.logInfo('Capture Stopped', subsystem: 'capture');
  }

  void captureSingleFrame() {
    _captureFrame();
  }

  void _captureFrame() {
    if (_isDisposed) return;

    final robloxWindow = getCurrentWindow();

    if (robloxWindow.state == RobloxWindowState.notRunning) {
      if (_status != CaptureStatus.notFound) {
        _status = CaptureStatus.notFound;
        logService.logInfo('Roblox Lost', subsystem: 'capture');
      }
      return;
    }

    if (_status == CaptureStatus.notFound) {
      _status = CaptureStatus.capturing;
      logService.logInfo('Roblox Found', subsystem: 'capture');
    }

    if (robloxWindow.state == RobloxWindowState.minimized) {
      if (_status != CaptureStatus.paused) {
        _status = CaptureStatus.paused;
        logService.logInfo('Capture Paused', subsystem: 'capture');
      }
      return;
    }

    if (_status == CaptureStatus.paused) {
      _status = CaptureStatus.capturing;
      logService.logInfo('Capture Resumed', subsystem: 'capture');
    }

    final stopwatch = Stopwatch()..start();

    try {
      final frame = _doCapture(robloxWindow);
      stopwatch.stop();

      if (frame != null && frame.imageData != null) {
        _frameNumber++;
        _totalCaptured++;
        _totalCaptureTimeMs += stopwatch.elapsedMilliseconds;
        if (stopwatch.elapsedMilliseconds > _slowestCaptureMs) {
          _slowestCaptureMs = stopwatch.elapsedMilliseconds;
        }

        _latestFrame = frame;
        _status = CaptureStatus.capturing;
        _retryAttempts = 0;
      } else {
        stopwatch.stop();
        _handleCaptureFailure();
      }
    } catch (e, st) {
      stopwatch.stop();
      logService.logError(
        'Capture failed: $e\n$st',
        subsystem: 'capture',
      );
      _handleCaptureFailure();
    }
  }

  void _handleCaptureFailure() {
    _retryAttempts++;
    if (_retryAttempts > maxRetryAttempts) {
      if (_status != CaptureStatus.error) {
        _status = CaptureStatus.error;
        logService.logError(
          'Capture failed after $maxRetryAttempts attempts',
          subsystem: 'capture',
        );
      }
      _retryAttempts = 0;
    }
  }

  FrameModel? _doCapture(RobloxWindow window) {
    final hwnd = window.handle;
    if (hwnd == null || hwnd == 0) return null;

    final width = window.width;
    final height = window.height;
    if (width <= 0 || height <= 0) return null;

    final hdcScreen = GetDC(hwnd);
    if (hdcScreen == 0) return null;

    final hdcMem = CreateCompatibleDC(hdcScreen);
    if (hdcMem == 0) {
      ReleaseDC(hwnd, hdcScreen);
      return null;
    }

    final hBitmap = CreateCompatibleBitmap(hdcScreen, width, height);
    if (hBitmap == 0) {
      DeleteDC(hdcMem);
      ReleaseDC(hwnd, hdcScreen);
      return null;
    }

    final oldBitmap = SelectObject(hdcMem, hBitmap);

    var result = BitBlt(
      hdcMem,
      0,
      0,
      width,
      height,
      hdcScreen,
      0,
      0,
      SRCCOPY,
    );

    if (result == 0) {
      result = _captureWithPrintWindow(hwnd, hdcMem, width, height);
    }

    if (result == 0) {
      SelectObject(hdcMem, oldBitmap);
      DeleteObject(hBitmap);
      DeleteDC(hdcMem);
      ReleaseDC(hwnd, hdcScreen);
      return null;
    }

    final bitmapInfoPtr = _createBitmapInfo(width, height);
    final byteCount = width * height * 4;
    final bitsPtr = calloc<Uint8>(byteCount);

    final gotBits = GetDIBits(
      hdcMem,
      hBitmap,
      0,
      height,
      bitsPtr.cast<Uint8>(),
      bitmapInfoPtr,
      DIB_RGB_COLORS,
    );

    SelectObject(hdcMem, oldBitmap);
    DeleteObject(hBitmap);
    DeleteDC(hdcMem);
    ReleaseDC(hwnd, hdcScreen);
    calloc.free(bitmapInfoPtr);

    if (gotBits == 0) {
      calloc.free(bitsPtr);
      return null;
    }

    final imageData = Uint8List.fromList(bitsPtr.asTypedList(byteCount));
    calloc.free(bitsPtr);

    final now = DateTime.now().millisecondsSinceEpoch;

    return FrameModel(
      timestamp: now,
      width: width,
      height: height,
      frameNumber: _frameNumber + 1,
      captureDurationMs: _measureCaptureDuration(),
      source: FrameSource.robloxWindow,
      imageData: imageData,
      status: CaptureStatus.capturing,
    );
  }

  int _captureWithPrintWindow(int hwnd, int hdcMem, int width, int height) {
    final hdcScreen = GetDC(hwnd);
    if (hdcScreen == 0) return 0;

    final result = PrintWindow(
      hwnd,
      hdcMem,
      0,
    );

    ReleaseDC(hwnd, hdcScreen);
    return result;
  }

  int _measureCaptureDuration() {
    return _totalCaptured > 0
        ? _totalCaptureTimeMs ~/ _totalCaptured
        : 0;
  }

  Pointer<BITMAPINFO> _createBitmapInfo(int width, int height) {
    final infoPtr = calloc<BITMAPINFO>();
    final info = infoPtr.ref;
    info.bmiHeader.biSize = sizeOf<BITMAPINFOHEADER>();
    info.bmiHeader.biWidth = width;
    info.bmiHeader.biHeight = -height;
    info.bmiHeader.biPlanes = 1;
    info.bmiHeader.biBitCount = 32;
    info.bmiHeader.biCompression = BI_RGB;
    info.bmiHeader.biSizeImage = 0;
    info.bmiHeader.biXPelsPerMeter = 0;
    info.bmiHeader.biYPelsPerMeter = 0;
    info.bmiHeader.biClrUsed = 0;
    info.bmiHeader.biClrImportant = 0;
    for (var i = 0; i < 3; i++) {
      info.bmiColors[i].rgbBlue = 0;
      info.bmiColors[i].rgbGreen = 0;
      info.bmiColors[i].rgbRed = 0;
      info.bmiColors[i].rgbReserved = 0;
    }
    return infoPtr;
  }

  void dispose() {
    _isDisposed = true;
    _captureTimer?.cancel();
    _captureTimer = null;
    _status = CaptureStatus.idle;
  }
}