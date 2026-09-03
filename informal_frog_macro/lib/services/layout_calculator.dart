import '../models/roblox_window.dart';
import '../models/workspace_layout.dart';
import '../models/workspace_state.dart';
import '../services/log_service.dart';

class LayoutCalculator {
  static const int minPanelWidth = 240;
  static const int defaultPanelWidth = 280;
  static const int defaultPanelWidthWide = 320;
  static const int panelSpacing = 8;
  static const int windowBorder = 8;
  static const int minRobloxWidth = 800;
  static const int minRobloxHeight = 600;

  final LogService logService;

  LayoutCalculator(this.logService);

  WorkspaceLayout calculateLayout({
    required DesktopInfo desktop,
    required RobloxWindow robloxWindow,
    WorkspaceLayoutMode mode = WorkspaceLayoutMode.compact,
    bool shouldAnchor = false,
  }) {
    if (robloxWindow.state == RobloxWindowState.notRunning) {
      return _calculateNoRobloxLayout(desktop, mode);
    }

    final displayForRoblox = desktop.findDisplayForRect(Rectangle(
      x: robloxWindow.x,
      y: robloxWindow.y,
      width: robloxWindow.width,
      height: robloxWindow.height,
    ));

    if (displayForRoblox == null) {
      return _calculateNoDisplayLayout(desktop, robloxWindow, mode);
    }

    final panelWidth = _getPanelWidth(mode, desktop);

    if (shouldAnchor) {
      final robloxArea = _calculateOptimalRobloxRect(displayForRoblox, panelWidth);
      final leftPanel = _calculateLeftPanel(robloxArea, displayForRoblox, panelWidth);
      final rightPanel = _calculateRightPanel(robloxArea, displayForRoblox, panelWidth);
      final windowBounds = displayForRoblox;

      return WorkspaceLayout(
        leftPanel: leftPanel,
        robloxArea: robloxArea,
        rightPanel: rightPanel,
        windowBounds: windowBounds,
        mode: mode,
        status: WorkspaceStatus.anchoring,
        isAnchored: true,
        isAligned: false,
      );
    }

    final robloxRect = Rectangle(
      x: robloxWindow.x,
      y: robloxWindow.y,
      width: robloxWindow.width,
      height: robloxWindow.height,
    );

    final leftPanel = _calculateLeftPanel(
        robloxRect, displayForRoblox, panelWidth);
    final rightPanel = _calculateRightPanel(
        robloxRect, displayForRoblox, panelWidth);
    final windowBounds = displayForRoblox;

    return WorkspaceLayout(
      leftPanel: leftPanel,
      robloxArea: robloxRect,
      rightPanel: rightPanel,
      windowBounds: windowBounds,
      mode: mode,
      status: WorkspaceStatus.anchored,
      isAnchored: true,
      isAligned: false,
    );
  }

  Rectangle _calculateOptimalRobloxRect(Rectangle display, int panelWidth) {
    const aspectRatio = 16.0 / 9.0;

    final availableWidth = display.width - (panelWidth * 2) - (panelSpacing * 2);
    final availableHeight = display.height - (windowBorder * 2);

    if (availableWidth <= minRobloxWidth || availableHeight <= minRobloxHeight) {
      final width = display.width - panelWidth * 2 - panelSpacing * 2;
      final height = (width / aspectRatio).toInt();
      final x = display.x + panelWidth + panelSpacing;
      final y = display.y + ((display.height - height) / 2).toInt();

      return Rectangle(
        x: x,
        y: y,
        width: width.clamp(minRobloxWidth, double.infinity).toInt(),
        height: height.clamp(minRobloxHeight, double.infinity).toInt(),
      );
    }

    final width = (availableHeight * aspectRatio).toInt();
    int height = availableHeight;
    int finalWidth;

    if (width <= availableWidth) {
      finalWidth = width;
    } else {
      finalWidth = availableWidth;
      height = (finalWidth / aspectRatio).toInt();
    }

    finalWidth = finalWidth.clamp(minRobloxWidth, double.infinity).toInt();
    height = height.clamp(minRobloxHeight, double.infinity).toInt();

    final x = display.x + panelWidth + panelSpacing;
    final y = display.y + ((display.height - height) / 2).toInt();

    return Rectangle(
      x: x,
      y: y,
      width: finalWidth,
      height: height,
    );
  }

  int _getPanelWidth(WorkspaceLayoutMode mode, DesktopInfo desktop) {
    switch (mode) {
      case WorkspaceLayoutMode.compact:
        return minPanelWidth;
      case WorkspaceLayoutMode.wide:
        return defaultPanelWidthWide;
      case WorkspaceLayoutMode.developer:
        return (desktop.primaryDisplay.width * 0.3).toInt().clamp(
            minPanelWidth, desktop.primaryDisplay.width - 400);
    }
  }

  Rectangle _calculateLeftPanel(
      Rectangle robloxRect, Rectangle display, int panelWidth) {
    int leftX = display.x;
    int leftWidth = panelWidth;

    if (robloxRect.x > display.x) {
      final availableSpace = robloxRect.x - display.x;
      if (availableSpace >= minPanelWidth) {
        leftWidth = availableSpace - panelSpacing;
      } else {
        leftWidth = 0;
        leftX = robloxRect.x;
      }
    } else {
      leftWidth = 0;
      leftX = display.x;
    }

    return Rectangle(
      x: leftX,
      y: display.y,
      width: leftWidth,
      height: display.height,
    );
  }

  Rectangle _calculateRightPanel(
      Rectangle robloxRect, Rectangle display, int panelWidth) {
    int rightX = display.x + display.width - panelWidth;
    int rightWidth = panelWidth;

    final robloxRight = robloxRect.x + robloxRect.width;
    if (robloxRight < display.x + display.width) {
      final availableSpace =
          (display.x + display.width) - robloxRight;
      if (availableSpace >= minPanelWidth) {
        rightWidth = availableSpace - panelSpacing;
      } else {
        rightWidth = 0;
        rightX = robloxRight;
      }
    } else {
      rightWidth = 0;
      rightX = display.x + display.width;
    }

    return Rectangle(
      x: rightX,
      y: display.y,
      width: rightWidth,
      height: display.height,
    );
  }

  WorkspaceLayout _calculateNoRobloxLayout(
      DesktopInfo desktop, WorkspaceLayoutMode mode) {
    final panelWidth = _getPanelWidth(mode, desktop);
    return WorkspaceLayout(
      leftPanel: Rectangle(
        x: desktop.primaryDisplay.x,
        y: desktop.primaryDisplay.y,
        width: panelWidth,
        height: desktop.primaryDisplay.height,
      ),
      robloxArea: const Rectangle(x: 0, y: 0, width: 0, height: 0),
      rightPanel: Rectangle(
        x: desktop.primaryDisplay.x +
            desktop.primaryDisplay.width -
            panelWidth,
        y: desktop.primaryDisplay.y,
        width: panelWidth,
        height: desktop.primaryDisplay.height,
      ),
      windowBounds: desktop.primaryDisplay,
      mode: mode,
      status: WorkspaceStatus.waiting,
      isAnchored: false,
      isAligned: false,
    );
  }

  WorkspaceLayout _calculateNoDisplayLayout(
      DesktopInfo desktop, RobloxWindow robloxWindow, WorkspaceLayoutMode mode) {
    return _calculateNoRobloxLayout(desktop, mode);
  }
}
