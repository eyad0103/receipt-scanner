import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/app_state.dart';
import '../models/roblox_window.dart';
import '../models/workspace_state.dart';
import '../services/log_service.dart';
import '../services/workspace_manager.dart';
import 'telemetry_row.dart';

class RightPanel extends StatefulWidget {
  final RobloxWindow robloxWindow;
  final LogService logService;
  final WorkspaceManager workspaceManager;

  const RightPanel({
    super.key,
    required this.robloxWindow,
    required this.logService,
    required this.workspaceManager,
  });

  @override
  State<RightPanel> createState() => _RightPanelState();
}

class _RightPanelState extends State<RightPanel> {
  late Timer _clockTimer;
  DateTime _currentTime = DateTime.now();
  late StreamSubscription<WorkspaceStatus> _statusSub;

  @override
  void initState() {
    super.initState();
    _clockTimer = Timer.periodic(
        const Duration(seconds: 1), (timer) {
      setState(() {
        _currentTime = DateTime.now();
      });
    });

    _statusSub = widget.workspaceManager.statusStream.listen((_) {
      if (mounted) {
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _clockTimer.cancel();
    _statusSub.cancel();
    super.dispose();
  }

  Color _statusColor(WorkspaceStatus status, bool isDark) {
    switch (status) {
      case WorkspaceStatus.waiting:
        return isDark ? Colors.orange[300]! : Colors.orange[700]!;
      case WorkspaceStatus.anchoring:
        return isDark ? Colors.blue[300]! : Colors.blue[700]!;
      case WorkspaceStatus.anchored:
        return isDark ? Colors.green[300]! : Colors.green[700]!;
      case WorkspaceStatus.outOfAlignment:
        return isDark ? Colors.red[300]! : Colors.red[700]!;
      case WorkspaceStatus.error:
        return isDark ? Colors.red[300]! : Colors.red[700]!;
    }
  }

  bool get _canRecenter {
    final status = widget.workspaceManager.currentStatus;
    final roblox = widget.robloxWindow;
    final hasAnchored = widget.workspaceManager.hasAnchored;
    return roblox.state != RobloxWindowState.notRunning &&
        (status == WorkspaceStatus.outOfAlignment || !hasAnchored);
  }

  @override
  Widget build(context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final appState = Provider.of<AppState>(context);
    final dateFormat = DateFormat('HH:mm:ss');
    final logCount = widget.logService.entries.length;
    final layout = widget.workspaceManager.currentLayout;

    String robloxStatusValue;
    Color robloxStatusColor;

    if (widget.robloxWindow.state == RobloxWindowState.notRunning) {
      robloxStatusValue = 'Not Running';
      robloxStatusColor =
          isDark ? Colors.red[300]! : Colors.red[700]!;
    } else {
      robloxStatusValue = 'Running';
      robloxStatusColor =
          isDark ? Colors.green[300]! : Colors.green[700]!;
    }

    final appStatusColor =
        isDark ? Colors.green[300]! : Colors.green[700]!;

    final windowStateStr = windowStateToString(widget.robloxWindow.state);
    final foregroundStr =
        widget.robloxWindow.state == RobloxWindowState.notRunning
            ? '—'
            : widget.robloxWindow.isForeground
                ? 'Yes'
                : 'No';
    final positionText =
        widget.robloxWindow.state == RobloxWindowState.notRunning
            ? '—'
            : 'X: ${widget.robloxWindow.x}, Y: ${widget.robloxWindow.y}';
    final sizeText =
        widget.robloxWindow.state == RobloxWindowState.notRunning
            ? '—'
            : '${widget.robloxWindow.width} × ${widget.robloxWindow.height}';
    final detailColor = isDark ? Colors.grey[400]! : Colors.grey[700]!;

    final workspaceStatus = widget.workspaceManager.currentStatus;
    final workspaceStatusStr =
        WorkspaceStateInfo.statusToString(workspaceStatus);
    final workspaceStatusColor = _statusColor(workspaceStatus, isDark);
    final monitorText = layout?.windowBounds.isValid ?? false
        ? '${layout?.windowBounds.width} × ${layout?.windowBounds.height}'
        : '—';

    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : const Color(0xFF2A2A2A),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Session',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : Colors.black87,
              ),
            ),
            const SizedBox(height: 24),

            TelemetryRow(
              label: 'Application Status',
              value: 'Running',
              icon: Icons.circle,
              color: appStatusColor,
            ),
            TelemetryRow(
              label: 'Version',
              value: appState.version,
              icon: Icons.info_outline,
              color: isDark ? Colors.blue[300]! : Colors.blue,
            ),

            Container(
              width: double.infinity,
              height: 1,
              color: isDark
                  ? const Color(0xFF2D2D2D)
                  : const Color(0xFFE0E0E0),
              margin: const EdgeInsets.symmetric(vertical: 12),
            ),

            Text(
              'Workspace',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : Colors.black87,
              ),
            ),
            const SizedBox(height: 12),

            TelemetryRow(
              label: 'Workspace Status',
              value: workspaceStatusStr,
              icon: Icons.circle,
              color: workspaceStatusColor,
            ),
            TelemetryRow(
              label: 'Current Monitor',
              value: monitorText,
              icon: Icons.monitor_outlined,
              color: detailColor,
            ),
            TelemetryRow(
              label: 'Roblox Resolution',
              value: widget.robloxWindow.state == RobloxWindowState.notRunning
                  ? '—'
                  : '${widget.robloxWindow.width} × ${widget.robloxWindow.height}',
              icon: Icons.aspect_ratio_outlined,
              color: detailColor,
            ),
            TelemetryRow(
              label: 'Log Count',
              value: '$logCount',
              icon: Icons.list_outlined,
              color: detailColor,
            ),

            Container(
              width: double.infinity,
              height: 1,
              color: isDark
                  ? const Color(0xFF2D2D2D)
                  : const Color(0xFFE0E0E0),
              margin: const EdgeInsets.symmetric(vertical: 12),
            ),

            Text(
              'Roblox',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : Colors.black87,
              ),
            ),
            const SizedBox(height: 12),

            TelemetryRow(
              label: 'Roblox Status',
              value: robloxStatusValue,
              icon: Icons.circle,
              color: robloxStatusColor,
            ),
            TelemetryRow(
              label: 'Window Position',
              value: positionText,
              icon: Icons.crop_rotate_outlined,
              color: detailColor,
            ),
            TelemetryRow(
              label: 'Window Size',
              value: sizeText,
              icon: Icons.aspect_ratio_outlined,
              color: detailColor,
            ),
            TelemetryRow(
              label: 'Window State',
              value: windowStateStr,
              icon: Icons.visibility_outlined,
              color: detailColor,
            ),
            TelemetryRow(
              label: 'Foreground',
              value: foregroundStr,
              icon: Icons.star_outlined,
              color: detailColor,
            ),

            _buildRecenterButton(isDark),

            const Divider(height: 24, thickness: 1),
            TelemetryRow(
              label: 'Current Time',
              value: dateFormat.format(_currentTime),
              icon: Icons.schedule_outlined,
              color: detailColor,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecenterButton(bool isDark) {
    if (!_canRecenter) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(top: 24),
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: () {
          widget.workspaceManager.recenterRoblox();
        },
        icon: const Icon(Icons.center_focus_strong_outlined),
        label: const Text('Re-center Roblox'),
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 14),
          backgroundColor: isDark
              ? Colors.blue[800]!.withAlpha(180)
              : Colors.blue[50],
          foregroundColor:
              isDark ? Colors.blue[300]! : Colors.blue[700]!,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: BorderSide(
              color: isDark
                  ? Colors.blue[800]!
                  : Colors.blue[200]!,
              width: 1,
            ),
          ),
        ),
      ),
    );
  }
}