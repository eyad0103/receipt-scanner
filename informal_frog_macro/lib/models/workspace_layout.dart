import 'workspace_state.dart';

enum WorkspaceLayoutMode { compact, wide, developer }

class Rectangle {
  final int x;
  final int y;
  final int width;
  final int height;

  const Rectangle({
    required this.x,
    required this.y,
    required this.width,
    required this.height,
  });

  bool get isValid => width > 0 && height > 0;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! Rectangle) return false;
    return x == other.x &&
        y == other.y &&
        width == other.width &&
        height == other.height;
  }

  @override
  int get hashCode => Object.hash(x, y, width, height);
}

class WorkspaceLayout {
  final Rectangle leftPanel;
  final Rectangle robloxArea;
  final Rectangle rightPanel;
  final Rectangle windowBounds;
  final WorkspaceLayoutMode mode;
  final WorkspaceStatus status;
  final bool isAnchored;
  final bool isAligned;

  const WorkspaceLayout({
    required this.leftPanel,
    required this.robloxArea,
    required this.rightPanel,
    required this.windowBounds,
    required this.mode,
    this.status = WorkspaceStatus.waiting,
    this.isAnchored = false,
    this.isAligned = false,
  });

  bool get hasRoblox => robloxArea.width > 0 && robloxArea.height > 0;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! WorkspaceLayout) return false;
    return leftPanel == other.leftPanel &&
        rightPanel == other.rightPanel &&
        robloxArea == other.robloxArea &&
        windowBounds == other.windowBounds &&
        mode == other.mode &&
        status == other.status &&
        isAnchored == other.isAnchored &&
        isAligned == other.isAligned;
  }

  @override
  int get hashCode => Object.hash(leftPanel, rightPanel, robloxArea,
      windowBounds, mode, status, isAnchored, isAligned);

  WorkspaceLayout copyWith({
    Rectangle? leftPanel,
    Rectangle? robloxArea,
    Rectangle? rightPanel,
    Rectangle? windowBounds,
    WorkspaceLayoutMode? mode,
    WorkspaceStatus? status,
    bool? isAnchored,
    bool? isAligned,
  }) {
    return WorkspaceLayout(
      leftPanel: leftPanel ?? this.leftPanel,
      robloxArea: robloxArea ?? this.robloxArea,
      rightPanel: rightPanel ?? this.rightPanel,
      windowBounds: windowBounds ?? this.windowBounds,
      mode: mode ?? this.mode,
      status: status ?? this.status,
      isAnchored: isAnchored ?? this.isAnchored,
      isAligned: isAligned ?? this.isAligned,
    );
  }
}

class DesktopInfo {
  final Rectangle primaryDisplay;
  final List<Rectangle> displays;
  final int totalWidth;
  final int totalHeight;
  final String currentMonitorDescription;

  const DesktopInfo({
    required this.primaryDisplay,
    required this.displays,
    required this.totalWidth,
    required this.totalHeight,
    this.currentMonitorDescription = 'Primary Display',
  });

  bool containsPoint(int x, int y) {
    for (final display in displays) {
      if (x >= display.x &&
          x < display.x + display.width &&
          y >= display.y &&
          y < display.y + display.height) {
        return true;
      }
    }
    return false;
  }

  Rectangle? findDisplayForRect(Rectangle rect) {
    for (final display in displays) {
      final overlapX =
          (rect.x < display.x + display.width &&
              rect.x + rect.width > display.x);
      final overlapY =
          (rect.y < display.y + display.height &&
              rect.y + rect.height > display.y);
      if (overlapX && overlapY) return display;
    }
    return primaryDisplay;
  }
}
