import 'dart:typed_data';

enum FrameSource {
  robloxWindow,
  desktopBackup,
}

enum CaptureStatus {
  idle,
  capturing,
  paused,
  notFound,
  error,
}

class FrameModel {
  final int timestamp;
  final int width;
  final int height;
  final int frameNumber;
  final int captureDurationMs;
  final FrameSource source;
  final Uint8List? imageData;
  final CaptureStatus status;

  const FrameModel({
    required this.timestamp,
    required this.width,
    required this.height,
    required this.frameNumber,
    required this.captureDurationMs,
    required this.source,
    required this.imageData,
    required this.status,
  });

  static const FrameModel empty = FrameModel(
    timestamp: 0,
    width: 0,
    height: 0,
    frameNumber: 0,
    captureDurationMs: 0,
    source: FrameSource.robloxWindow,
    imageData: null,
    status: CaptureStatus.idle,
  );

  FrameModel copyWith({
    int? timestamp,
    int? width,
    int? height,
    int? frameNumber,
    int? captureDurationMs,
    FrameSource? source,
    Uint8List? imageData,
    CaptureStatus? status,
  }) {
    return FrameModel(
      timestamp: timestamp ?? this.timestamp,
      width: width ?? this.width,
      height: height ?? this.height,
      frameNumber: frameNumber ?? this.frameNumber,
      captureDurationMs: captureDurationMs ?? this.captureDurationMs,
      source: source ?? this.source,
      imageData: imageData ?? this.imageData,
      status: status ?? this.status,
    );
  }
}