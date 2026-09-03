import 'package:flutter/material.dart';
import '../models/roblox_window.dart';

class TelemetryRow extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const TelemetryRow({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 14),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: isDark ? const Color(0xFF2A2A2A) : Colors.grey.shade200,
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 16),
          const SizedBox(width: 12),
          SizedBox(
            width: 160,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                color: isDark ? Colors.grey[500] : Colors.grey[600],
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: isDark ? Colors.grey[300] : Colors.grey[800],
              ),
              textAlign: TextAlign.right,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

String windowStateToString(RobloxWindowState state) {
  switch (state) {
    case RobloxWindowState.notRunning:
      return 'Not Running';
    case RobloxWindowState.running:
      return 'Running';
    case RobloxWindowState.visible:
      return 'Visible';
    case RobloxWindowState.hidden:
      return 'Hidden';
    case RobloxWindowState.minimized:
      return 'Minimized';
    case RobloxWindowState.foreground:
      return 'Foreground';
    case RobloxWindowState.background:
      return 'Background';
  }
}