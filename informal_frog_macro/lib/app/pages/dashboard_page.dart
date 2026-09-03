import 'package:flutter/material.dart';
import '../../models/roblox_window.dart';
import '../../ui/telemetry_row.dart';

class DashboardPage extends StatelessWidget {
  final RobloxWindow robloxWindow;

  const DashboardPage({super.key, required this.robloxWindow});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    String statusValue;
    Color statusColor;

    if (robloxWindow.state == RobloxWindowState.notRunning) {
      statusValue = 'Not Running';
      statusColor = isDark ? Colors.red[300]! : Colors.red[700]!;
    } else {
      statusValue = 'Running';
      statusColor = isDark ? Colors.green[300]! : Colors.green[700]!;
    }

    final positionText = robloxWindow.state == RobloxWindowState.notRunning
        ? '—'
        : 'X: ${robloxWindow.x}, Y: ${robloxWindow.y}';
    final sizeText = robloxWindow.state == RobloxWindowState.notRunning
        ? '—'
        : '${robloxWindow.width} × ${robloxWindow.height}';
    final stateText = windowStateToString(robloxWindow.state);
    final foregroundText = robloxWindow.state == RobloxWindowState.notRunning
        ? '—'
        : robloxWindow.isForeground ? 'Yes' : 'No';

    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A1A1A) : Colors.white,
      ),
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            'Roblox',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.grey[400] : Colors.grey[600],
            ),
          ),
          const SizedBox(height: 12),
          TelemetryRow(
            label: 'Status',
            value: statusValue,
            icon: Icons.circle,
            color: statusColor,
          ),
          TelemetryRow(
            label: 'Window Position',
            value: positionText,
            icon: Icons.crop_rotate_outlined,
            color: isDark ? Colors.grey[400]! : Colors.grey[700]!,
          ),
          TelemetryRow(
            label: 'Window Size',
            value: sizeText,
            icon: Icons.aspect_ratio_outlined,
            color: isDark ? Colors.grey[400]! : Colors.grey[700]!,
          ),
          TelemetryRow(
            label: 'Window State',
            value: stateText,
            icon: Icons.visibility_outlined,
            color: isDark ? Colors.grey[400]! : Colors.grey[700]!,
          ),
          TelemetryRow(
            label: 'Foreground',
            value: foregroundText,
            icon: Icons.star_outlined,
            color: isDark ? Colors.grey[400]! : Colors.grey[700]!,
          ),
        ],
      ),
    );
  }
}