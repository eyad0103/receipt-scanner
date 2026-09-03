import 'package:win32/win32.dart';

import '../models/roblox_window.dart';
import '../models/workspace_layout.dart';
import 'log_service.dart';

class DockingManager {
  static const int minRobloxWidth = 800;
  static const int minRobloxHeight = 600;
  static const int positionTolerance = 5;
  static const int sizeTolerance = 10;

  final LogService logService;
  final Function(WorkspaceLayout layout) onLayoutUpdate;

  bool _hasEmittedDocked = false;
  bool _hasEmittedWaiting = false;

  DockingManager(this.logService, this.onLayoutUpdate);

  void handleRobloxWindowChange(RobloxWindow window) {
    if (window.state == RobloxWindowState.notRunning) {
      if (_hasEmittedDocked && !_hasEmittedWaiting) {
        _hasEmittedDocked = false;
        _hasEmittedWaiting = true;
        logService.logInfo('Workspace Waiting', subsystem: 'workspace');
      }
    }
  }

  bool get hasEmittedWaiting => _hasEmittedWaiting;

  void setWindowRegion(WorkspaceLayout layout) {}

  void setWindowPositionAndSize(WorkspaceLayout layout) {
    anchorRoblox(layout, null);
  }

  void anchorRoblox(WorkspaceLayout layout, RobloxWindow? window) {
    final hwnd = window?.handle;
    if (hwnd == null || hwnd == 0) {
      logService.logWarning(
          'Cannot anchor: Roblox window handle is null',
          subsystem: 'workspace');
      return;
    }

    final area = layout.robloxArea;
    if (!area.isValid) {
      logService.logWarning(
          'Cannot anchor: invalid workspace area',
          subsystem: 'workspace');
      return;
    }

    final width = area.width.clamp(minRobloxWidth, double.infinity).toInt();
    final height = area.height.clamp(minRobloxHeight, double.infinity).toInt();
    final x = area.x;
    final y = area.y;

    logService.logInfo(
        'Anchoring Roblox at ($x, $y) $width x $height',
        subsystem: 'workspace');

    final result = SetWindowPos(
      hwnd,
      0,
      x,
      y,
      width,
      height,
      SWP_NOZORDER | SWP_SHOWWINDOW | SWP_FRAMECHANGED,
    );

    if (result != 0) {
      if (window != null) {
        logDocked(window);
      }
      logService.logInfo('Roblox Anchored', subsystem: 'workspace');
    } else {
      final err = GetLastError();
      logService.logError(
          'SetWindowPos failed. Error code: $err',
          subsystem: 'workspace');
    }
  }

  bool isWindowAligned(RobloxWindow window, WorkspaceLayout layout) {
    if (window.handle == null || window.handle == 0) return false;

    final area = layout.robloxArea;
    if (!area.isValid) return false;

    final xMatch = (window.x - area.x).abs() <= positionTolerance;
    final yMatch = (window.y - area.y).abs() <= positionTolerance;
    final widthMatch = (window.width - area.width).abs() <= sizeTolerance;
    final heightMatch = (window.height - area.height).abs() <= sizeTolerance;

    return xMatch && yMatch && widthMatch && heightMatch;
  }

  void logDocked(RobloxWindow window) {
    if (!_hasEmittedDocked) {
      _hasEmittedDocked = true;
      _hasEmittedWaiting = false;
      logService.logInfo('Roblox Docked', subsystem: 'workspace');
    }
  }

  void logWorkspaceCreated() {
    logService.logInfo('Workspace Initialized', subsystem: 'workspace');
  }

  void logWorkspaceUpdated() {
    logService.logInfo('Workspace Recalculated', subsystem: 'workspace');
  }

  void logWindowRelocated() {
    logService.logInfo('Workspace Out of Alignment', subsystem: 'workspace');
  }

  void logLayoutChanged() {
    logService.logInfo('Layout Changed', subsystem: 'workspace');
  }

  void logMonitorChanged(int monitorCount) {
    logService.logInfo(
        'Monitor Changed: $monitorCount display(s)',
        subsystem: 'workspace');
  }

  void logWorkspaceRestored() {
    logService.logInfo('Workspace Restored', subsystem: 'workspace');
  }

  void logRecenterRequested() {
    logService.logInfo('Re-center Requested', subsystem: 'workspace');
  }

  void logWorkspaceError(String message) {
    logService.logError('Workspace Error: $message', subsystem: 'workspace');
  }
}
