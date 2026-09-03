import 'dart:async';

import '../models/roblox_window.dart';
import '../models/workspace_layout.dart';
import '../models/workspace_state.dart';
import 'log_service.dart';
import 'roblox_detection_service.dart';
import 'layout_calculator.dart';
import 'window_tracker.dart';
import 'panel_manager.dart';
import 'docking_manager.dart';
import 'config_service.dart';

class WorkspaceManager {
  final LogService logService;
  final ConfigService configService;
  final RobloxDetectionService robloxService;

  late final LayoutCalculator _layoutCalculator;
  late final WindowTracker _windowTracker;
  late final PanelManager _panelManager;
  late final DockingManager _dockingManager;

  WorkspaceLayout? _currentLayout;
  WorkspaceLayoutMode _currentMode = WorkspaceLayoutMode.compact;
  bool _isInitialized = false;
  bool _hasAnchored = false;
  bool _isAligning = false;
  WorkspaceStatus _currentStatus = WorkspaceStatus.waiting;
  StreamSubscription<RobloxWindow>? _robloxSub;
  Timer? _delayedLayoutTimer;
  bool _layoutPending = false;
  int _lastMonitorCount = 0;

  final StreamController<WorkspaceStatus> _statusController =
      StreamController<WorkspaceStatus>.broadcast();

  WorkspaceLayout? get currentLayout => _currentLayout;
  bool get isInitialized => _isInitialized;
  PanelManager get panelManager => _panelManager;
  WorkspaceLayoutMode get currentMode => _currentMode;
  WorkspaceStatus get currentStatus => _currentStatus;
  bool get hasAnchored => _hasAnchored;
  Stream<WorkspaceStatus> get statusStream => _statusController.stream;

  WorkspaceManager({
    required this.logService,
    required this.configService,
    required this.robloxService,
  });

  Future<void> initialize() async {
    _layoutCalculator = LayoutCalculator(logService);
    _windowTracker = WindowTracker(logService);
    _panelManager = PanelManager(logService);
    _dockingManager = DockingManager(logService, _onLayoutUpdate);

    _robloxSub = robloxService.windowStream.listen(_onRobloxWindowChanged);

    _dockingManager.logWorkspaceCreated();
    _isInitialized = true;
    _scheduleLayoutUpdate();
  }

  void _setStatus(WorkspaceStatus status) {
    if (_currentStatus != status) {
      _currentStatus = status;
      _statusController.add(status);
    }
  }

  void _onLayoutUpdate(WorkspaceLayout layout) {
    _dockingManager.setWindowRegion(layout);
  }

  void _onRobloxWindowChanged(RobloxWindow window) {
    _dockingManager.handleRobloxWindowChange(window);

    if (window.state == RobloxWindowState.notRunning) {
      if (_hasAnchored) {
        _setStatus(WorkspaceStatus.waiting);
        _hasAnchored = false;
      }
      _dockingManager.setWindowRegion(WorkspaceLayout(
        leftPanel: const Rectangle(x: 0, y: 0, width: 0, height: 0),
        robloxArea: const Rectangle(x: 0, y: 0, width: 0, height: 0),
        rightPanel: const Rectangle(x: 0, y: 0, width: 0, height: 0),
        windowBounds: const Rectangle(x: 0, y: 0, width: 0, height: 0),
        mode: _currentMode,
        status: WorkspaceStatus.waiting,
        isAnchored: false,
        isAligned: false,
      ));
      return;
    }

    if (window.state != RobloxWindowState.notRunning) {
      if (!_hasAnchored) {
        _dockingManager.logDocked(window);
        _scheduleLayoutUpdate(shouldAnchor: true);
      } else {
        if (_currentLayout != null && _currentLayout!.isAnchored) {
          final aligned = _dockingManager.isWindowAligned(window, _currentLayout!);
          if (!aligned) {
            _setStatus(WorkspaceStatus.outOfAlignment);
            _dockingManager.logWindowRelocated();
          }
        }
      }
    }
  }

  void _scheduleLayoutUpdate({bool shouldAnchor = false}) {
    _layoutPending = true;
    _isAligning = shouldAnchor;
    _delayedLayoutTimer?.cancel();
    _delayedLayoutTimer = Timer(const Duration(milliseconds: 50), _applyLayout);
  }

  void _applyLayout() {
    if (!_layoutPending) return;
    _layoutPending = false;
    _recalculateAndApply(shouldAnchor: _isAligning);
  }

  void _recalculateAndApply({bool shouldAnchor = false}) {
    final desktop = _windowTracker.refresh();
    final robloxWindow = robloxService.currentWindow;

    final monitorCount = desktop.displays.length;
    if (_lastMonitorCount != 0 && monitorCount != _lastMonitorCount) {
      _dockingManager.logMonitorChanged(monitorCount);
    }
    _lastMonitorCount = monitorCount;

    final newLayout = _layoutCalculator.calculateLayout(
      desktop: desktop,
      robloxWindow: robloxWindow,
      mode: _currentMode,
      shouldAnchor: shouldAnchor,
    );

    if (shouldAnchor && robloxWindow.state != RobloxWindowState.notRunning) {
      _setStatus(WorkspaceStatus.anchoring);
      _dockingManager.anchorRoblox(newLayout, robloxWindow);

      final aligned = _dockingManager.isWindowAligned(robloxWindow, newLayout);
      if (aligned) {
        _hasAnchored = true;
        _setStatus(WorkspaceStatus.anchored);
        _dockingManager.logWorkspaceRestored();
      } else {
        _setStatus(WorkspaceStatus.outOfAlignment);
      }

      _currentLayout = newLayout.copyWith(
        status: _currentStatus,
        isAnchored: _hasAnchored,
        isAligned: aligned,
      );
      _onLayoutUpdate(_currentLayout!);
      return;
    }

    if (_currentLayout != null && _currentLayout != newLayout) {
      _dockingManager.logWorkspaceUpdated();
      _dockingManager.logLayoutChanged();
    }

    if (_currentLayout == null ||
        (_currentLayout!.windowBounds.x != newLayout.windowBounds.x ||
            _currentLayout!.windowBounds.y != newLayout.windowBounds.y)) {
      _dockingManager.logWindowRelocated();
    }

    _currentLayout = newLayout.copyWith(
      status: _currentStatus,
      isAnchored: _hasAnchored,
      isAligned: _hasAnchored
          ? _dockingManager.isWindowAligned(robloxWindow, newLayout)
          : false,
    );
    _onLayoutUpdate(_currentLayout!);
  }

  void recenterRoblox() {
    _dockingManager.logRecenterRequested();
    _scheduleLayoutUpdate(shouldAnchor: true);
  }

  void setLayoutMode(WorkspaceLayoutMode mode) {
    if (_currentMode != mode) {
      _currentMode = mode;
      logService.logInfo('Layout mode changed to ${mode.name}',
          subsystem: 'workspace');
      _recalculateAndApply(shouldAnchor: _hasAnchored);
    }
  }

  void forceRecalculate() {
    _recalculateAndApply(shouldAnchor: _hasAnchored);
  }

  void dispose() {
    _delayedLayoutTimer?.cancel();
    _robloxSub?.cancel();
    _panelManager.dispose();
    _statusController.close();
  }
}
