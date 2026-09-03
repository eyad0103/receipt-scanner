import 'dart:async';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';

import '../models/frame_model.dart';
import 'capture_service.dart';
import 'log_service.dart';

class CaptureController {
  final CaptureService _captureService;
  final LogService _logService;

  final StreamController<FrameModel?> _frameController =
      StreamController<FrameModel?>.broadcast();

  Timer? _uiUpdateTimer;
  int _savedFrameCount = 0;

  bool get isCapturing => _captureService.status == CaptureStatus.capturing ||
      _captureService.status == CaptureStatus.paused;
  bool get isActive => _captureService.status == CaptureStatus.capturing;
  bool get isPaused => _captureService.status == CaptureStatus.paused;
  bool get isNotFound => _captureService.status == CaptureStatus.notFound;
  bool get hasError => _captureService.status == CaptureStatus.error;

  CaptureStatus get status => _captureService.status;
  int get frameNumber => _captureService.frameNumber;
  int get droppedFrames => _captureService.droppedFrames;
  int get averageCaptureMs => _captureService.averageCaptureMs;
  int get slowestCaptureMs => _captureService.slowestCaptureMs;
  int get totalCaptured => _captureService.totalCaptured;
  FrameModel? get latestFrame => _captureService.latestFrame;
  int get savedFrameCount => _savedFrameCount;

  Stream<FrameModel?> get frameStream => _frameController.stream;

  static const int uiUpdateIntervalMs = 1000 ~/ 30;

  CaptureController(this._captureService, this._logService);

  void startCapture() {
    _captureService.startCapture();
    _startUiUpdateTimer();
  }

  void stopCapture() {
    _captureService.stopCapture();
    _stopUiUpdateTimer();
  }

  void captureSingleFrame() {
    _captureService.captureSingleFrame();
  }

  Future<void> saveCurrentFrame() async {
    final frame = _captureService.latestFrame;
    if (frame == null || frame.imageData == null) {
      _logService.logWarning(
          'Cannot save frame: no frame available',
          subsystem: 'capture');
      return;
    }

    try {
      final appDir = await getApplicationSupportDirectory();
      final capturesDir =
          Directory('${appDir.parent.path}/captures');
      if (!await capturesDir.exists()) {
        await capturesDir.create(recursive: true);
      }

      final timestamp =
          DateFormat('yyyy-MM-dd_HH-mm-ss').format(DateTime.now());
      final filename = '$timestamp.png';
      final filePath = '${capturesDir.path}/$filename';

      final result = await _writePng(frame, filePath);
      if (result) {
        _savedFrameCount++;
        _logService.logInfo('Frame Saved: $filename', subsystem: 'capture');
      } else {
        _logService.logError(
            'Failed to save frame as PNG',
            subsystem: 'capture');
      }
    } catch (e, st) {
      _logService.logError(
          'Error saving frame: $e\n$st',
          subsystem: 'capture');
    }
  }

  Future<bool> _writePng(FrameModel frame, String filePath) async {
    final width = frame.width;
    final height = frame.height;
    final data = frame.imageData!;

    final rgbaData = Uint8List.fromList(data);
    for (var i = 0; i < rgbaData.length; i += 4) {
      final b = rgbaData[i];
      final g = rgbaData[i + 1];
      final r = rgbaData[i + 2];
      rgbaData[i] = r;
      rgbaData[i + 1] = g;
      rgbaData[i + 2] = b;
    }

    final pngData = await _encodePng(width, height, rgbaData);
    if (pngData == null) return false;

    final file = File(filePath);
    await file.writeAsBytes(pngData);
    return file.exists();
  }

  Future<Uint8List?> _encodePng(int width, int height, Uint8List rgbaData) {
    final completer = Completer<Uint8List?>();

    ui.decodeImageFromPixels(
      rgbaData,
      width,
      height,
      ui.PixelFormat.rgba8888,
      (img) {
        img.toByteData(format: ui.ImageByteFormat.png).then((byteData) {
          img.dispose();
          if (byteData != null) {
            completer.complete(byteData.buffer.asUint8List());
          } else {
            completer.complete(null);
          }
        });
      },
    );

    return completer.future;
  }

  void _startUiUpdateTimer() {
    _uiUpdateTimer = Timer.periodic(
      const Duration(milliseconds: uiUpdateIntervalMs),
      (_) => _publishFrame(),
    );
  }

  void _stopUiUpdateTimer() {
    _uiUpdateTimer?.cancel();
    _uiUpdateTimer = null;
  }

  void _publishFrame() {
    _frameController.add(_captureService.latestFrame);
  }

  Future<void> clearSavedFrames() async {
    try {
      final appDir = await getApplicationSupportDirectory();
      final capturesDir = Directory('${appDir.parent.path}/captures');
      if (await capturesDir.exists()) {
        final files = capturesDir.listSync();
        for (final f in files) {
          if (f is File && f.path.endsWith('.png')) {
            await f.delete();
          }
        }
      }
      _savedFrameCount = 0;
      _logService.logInfo('Saved frames cleared', subsystem: 'capture');
    } catch (e, st) {
      _logService.logError(
          'Error clearing saved frames: $e\n$st',
          subsystem: 'capture');
    }
  }

  void dispose() {
    _captureService.dispose();
    _uiUpdateTimer?.cancel();
    _uiUpdateTimer = null;
    _frameController.close();
  }
}