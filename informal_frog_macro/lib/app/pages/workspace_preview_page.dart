import 'package:flutter/material.dart';
import '../../models/roblox_window.dart';
import '../../models/workspace_layout.dart';
import '../../services/workspace_manager.dart';

class WorkspacePreviewPage extends StatelessWidget {
  static const String route = '/_dev_workspace';

  final WorkspaceManager workspaceManager;
  final RobloxWindow robloxWindow;

  const WorkspacePreviewPage({
    super.key,
    required this.workspaceManager,
    required this.robloxWindow,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? const Color(0xFF121212) : const Color(0xFFF5F5F5);
    final panelColor =
        isDark ? const Color(0xFF1E1E1E) : const Color(0xFF2A2A2A);

    final layout = workspaceManager.currentLayout;

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
                  'Workspace Preview',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: isDark ? Colors.white : Colors.black87,
                  ),
                ),
                TextButton.icon(
                  onPressed: () {
                    workspaceManager.recenterRoblox();
                  },
                  icon: const Icon(Icons.center_focus_strong_outlined, size: 16),
                  label: const Text('Re-center'),
                ),
              ],
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (layout != null) ...[
                    _buildRectInfo(context, 'Desktop Bounds', layout.windowBounds,
                        Colors.grey, isDark),
                    const SizedBox(height: 12),
                    _buildRectInfo(context, 'Left Panel', layout.leftPanel,
                        Colors.green, isDark),
                    const SizedBox(height: 12),
                    _buildRectInfo(context, 'Roblox Area (Reserved)',
                        layout.robloxArea, Colors.red, isDark),
                    const SizedBox(height: 12),
                    _buildRectInfo(context, 'Right Panel', layout.rightPanel,
                        Colors.orange, isDark),
                    const SizedBox(height: 12),
                    if (robloxWindow.state != RobloxWindowState.notRunning)
                      _buildRectInfo(context, 'Roblox Actual Window',
                          Rectangle(
                            x: robloxWindow.x,
                            y: robloxWindow.y,
                            width: robloxWindow.width,
                            height: robloxWindow.height,
                          ),
                          Colors.purple,
                          isDark),
                    const SizedBox(height: 24),
                    _buildVisualization(context, layout, robloxWindow, isDark),
                  ] else
                    Text(
                      'No workspace layout available yet.',
                      style: TextStyle(
                        color: isDark ? Colors.grey[400] : Colors.grey[600],
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRectInfo(
    BuildContext context,
    String label,
    Rectangle rect,
    Color color,
    bool isDark,
  ) {
    final isValid = rect.isValid;
    final dims = isValid
        ? '${rect.x}, ${rect.y} | ${rect.width} × ${rect.height}'
        : 'Empty';

    return Row(
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: color.withAlpha(120),
            border: Border.all(color: color, width: 2),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? Colors.grey[500]! : Colors.grey[600]!,
                ),
              ),
              Text(
                dims,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: isDark ? Colors.grey[300]! : Colors.grey[800]!,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildVisualization(
    BuildContext context,
    WorkspaceLayout layout,
    RobloxWindow robloxWindow,
    bool isDark,
  ) {
    final desktop = layout.windowBounds;
    final scale = (desktop.width > 0 && desktop.height > 0)
        ? (600.0 / desktop.height).clamp(0.1, 5.0)
        : 1.0;

    final visWidth = (desktop.width * scale).toInt();
    final visHeight = (desktop.height * scale).toInt();

    return SizedBox(
      width: visWidth.toDouble(),
      height: visHeight.toDouble(),
      child: CustomPaint(
        painter: _WorkspacePainter(
          layout: layout,
          robloxWindow: robloxWindow,
          scale: scale,
          isDark: isDark,
        ),
      ),
    );
  }
}

class _WorkspacePainter extends CustomPainter {
  final WorkspaceLayout layout;
  final RobloxWindow robloxWindow;
  final double scale;
  final bool isDark;

  _WorkspacePainter({
    required this.layout,
    required this.robloxWindow,
    required this.scale,
    required this.isDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;
    final borderPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    final desktop = layout.windowBounds;

    void drawRect(Rectangle r, Color color, {bool border = false}) {
      if (!r.isValid) return;
      final x = (r.x - desktop.x) * scale;
      final y = (r.y - desktop.y) * scale;
      final w = r.width * scale;
      final h = r.height * scale;
      if (border) {
        borderPaint.color = color;
        canvas.drawRect(Offset(x, y) & Size(w, h), borderPaint);
      } else {
        paint.color = color;
        canvas.drawRect(Offset(x, y) & Size(w, h), paint);
      }
    }

    drawRect(layout.windowBounds,
        isDark ? const Color(0x333A3A3A) : const Color(0x33E0E0E0));

    drawRect(layout.leftPanel,
        isDark ? Colors.green.withAlpha(60) : Colors.green.withAlpha(80));

    drawRect(layout.rightPanel,
        isDark ? Colors.orange.withAlpha(60) : Colors.orange.withAlpha(80));

    drawRect(layout.robloxArea,
        isDark ? Colors.red.withAlpha(100) : Colors.red.withAlpha(120));

    if (robloxWindow.state != RobloxWindowState.notRunning) {
      drawRect(
        Rectangle(
          x: robloxWindow.x,
          y: robloxWindow.y,
          width: robloxWindow.width,
          height: robloxWindow.height,
        ),
        Colors.transparent,
        border: true,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _WorkspacePainter oldDelegate) {
    return oldDelegate.layout != layout ||
        oldDelegate.robloxWindow != robloxWindow ||
        oldDelegate.scale != scale;
  }
}
