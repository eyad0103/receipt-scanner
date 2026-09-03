import 'package:flutter/material.dart';

import '../../models/frame_model.dart';
import '../../services/capture_controller.dart';

class DeveloperCapturePage extends StatefulWidget {
  static const String route = '/_dev_capture';

  final CaptureController captureController;

  const DeveloperCapturePage({
    super.key,
    required this.captureController,
  });

  @override
  State<DeveloperCapturePage> createState() => _DeveloperCapturePageState();
}

class _DeveloperCapturePageState extends State<DeveloperCapturePage> {
  late Stream<FrameModel?> _frameStream;

  @override
  void initState() {
    super.initState();
    _frameStream = widget.captureController.frameStream;
  }

  Widget _buildStatusString(CaptureStatus status) {
    String text;
    Color color;
    switch (status) {
      case CaptureStatus.idle:
        text = 'Idle';
        color = Colors.grey;
        break;
      case CaptureStatus.capturing:
        text = 'Capturing';
        color = Colors.green;
        break;
      case CaptureStatus.paused:
        text = 'Paused (Roblox Minimized)';
        color = Colors.orange;
        break;
      case CaptureStatus.notFound:
        text = 'Waiting for Roblox...';
        color = Colors.red;
        break;
      case CaptureStatus.error:
        text = 'Error';
        color = Colors.red;
        break;
    }
    return Text(
      text,
      style: TextStyle(color: color, fontWeight: FontWeight.w500),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? const Color(0xFF121212) : const Color(0xFFF5F5F5);
    final panelColor =
        isDark ? const Color(0xFF1E1E1E) : const Color(0xFF2A2A2A);

    return Scaffold(
      backgroundColor: bgColor,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              color: panelColor,
              border: Border(
                bottom: BorderSide(
                  color: isDark ? Colors.grey[800]! : Colors.grey[300]!,
                  width: 1,
                ),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Developer Mode - Roblox Live Capture',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: isDark ? Colors.white : Colors.black87,
                  ),
                ),
                Row(
                  children: [
                    _buildControlButton(
                      'Start Capture',
                      Icons.play_arrow,
                      widget.captureController.isCapturing
                          ? Colors.orange
                          : Colors.green,
                      () {
                        if (widget.captureController.isCapturing) {
                          widget.captureController.stopCapture();
                        } else {
                          widget.captureController.startCapture();
                        }
                        setState(() {});
                      },
                      isDark,
                    ),
                    const SizedBox(width: 8),
                    _buildControlButton(
                      'Single Frame',
                      Icons.camera_alt_outlined,
                      Colors.blue,
                      () {
                        widget.captureController.captureSingleFrame();
                        setState(() {});
                      },
                      isDark,
                    ),
                    const SizedBox(width: 8),
                    _buildControlButton(
                      'Save Frame',
                      Icons.save_outlined,
                      Colors.purple,
                      () => widget.captureController.saveCurrentFrame(),
                      isDark,
                    ),
                    const SizedBox(width: 8),
                    _buildControlButton(
                      'Clear Saved',
                      Icons.clear_outlined,
                      Colors.red,
                      () {
                        widget.captureController.clearSavedFrames();
                        setState(() {});
                      },
                      isDark,
                    ),
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            color: panelColor,
            child: Wrap(
              spacing: 24,
              runSpacing: 8,
              children: [
                _buildMetric('FPS', _calculateFps(widget.captureController)),
                _buildMetric('Resolution',
                    '${widget.captureController.latestFrame?.width ?? 0} x ${widget.captureController.latestFrame?.height ?? 0}'),
                _buildMetric('Capture Time',
                    '${widget.captureController.latestFrame?.captureDurationMs ?? 0} ms'),
                _buildMetric('Frame Number',
                    '${widget.captureController.frameNumber}'),
                _buildMetric('Total Captured',
                    '${widget.captureController.totalCaptured}'),
                _buildMetric('Dropped Frames',
                    '${widget.captureController.droppedFrames}'),
                _buildMetric('Avg Capture',
                    '${widget.captureController.averageCaptureMs} ms'),
                _buildMetric('Slowest Capture',
                    '${widget.captureController.slowestCaptureMs} ms'),
                _buildMetric('Saved Frames',
                    '${widget.captureController.savedFrameCount}'),
              ],
            ),
          ),
          Expanded(
            child: Container(
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? Colors.black : Colors.grey[200],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isDark ? Colors.grey[800]! : Colors.grey[300]!,
                  width: 1,
                ),
              ),
              child: StreamBuilder<FrameModel?>(
                stream: _frameStream,
                initialData: widget.captureController.latestFrame,
                builder: (context, snapshot) {
                  final frame = snapshot.data;
                  if (frame == null || frame.imageData == null) {
                    return Center(
                      child: _buildStatusString(widget.captureController.status),
                    );
                  }
                  return Center(
                    child: Image.memory(
                      frame.imageData!,
                      width: frame.width.toDouble(),
                      height: frame.height.toDouble(),
                      gaplessPlayback: true,
                      filterQuality: FilterQuality.none,
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildControlButton(
    String label,
    IconData icon,
    Color color,
    VoidCallback onPressed,
    bool isDark,
  ) {
    return SizedBox(
      height: 32,
      child: TextButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, size: 14, color: color),
        label: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: color,
            fontWeight: FontWeight.w500,
          ),
        ),
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          backgroundColor: isDark
              ? Colors.grey[800]!.withAlpha(180)
              : Colors.grey[200],
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(4),
          ),
        ),
      ),
    );
  }

  Widget _buildMetric(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[500],
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.white70,
          ),
        ),
      ],
    );
  }

  String _calculateFps(CaptureController controller) {
    final captured = controller.totalCaptured;
    if (captured == 0) return '0 FPS';

    final frame = controller.latestFrame;
    if (frame == null) return '0 FPS';

    final elapsed =
        (DateTime.now().millisecondsSinceEpoch - frame.timestamp).abs();
    if (elapsed == 0) return '0 FPS';

    final fps = captured / (elapsed / 1000.0);
    return '${fps.toStringAsFixed(1)} FPS';
  }
}
