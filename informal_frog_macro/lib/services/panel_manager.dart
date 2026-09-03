import 'package:flutter/foundation.dart';
import 'log_service.dart';

class PanelManager extends ChangeNotifier {
  final LogService logService;

  int _leftPanelWidth = 240;
  int _rightPanelWidth = 240;
  bool _leftPanelVisible = true;
  bool _rightPanelVisible = true;

  int get leftPanelWidth => _leftPanelWidth;
  int get rightPanelWidth => _rightPanelWidth;
  bool get leftPanelVisible => _leftPanelVisible;
  bool get rightPanelVisible => _rightPanelVisible;

  PanelManager(this.logService);

  void setLeftPanelWidth(int width) {
    if (width != _leftPanelWidth) {
      _leftPanelWidth = width;
      logService.logInfo(
          'Left panel width set to $width',
          subsystem: 'workspace');
      notifyListeners();
    }
  }

  void setRightPanelWidth(int width) {
    if (width != _rightPanelWidth) {
      _rightPanelWidth = width;
      logService.logInfo(
          'Right panel width set to $width',
          subsystem: 'workspace');
      notifyListeners();
    }
  }

  void setLeftPanelVisible(bool visible) {
    if (visible != _leftPanelVisible) {
      _leftPanelVisible = visible;
      logService.logInfo(
          'Left panel ${visible ? 'shown' : 'hidden'}',
          subsystem: 'workspace');
      notifyListeners();
    }
  }

  void setRightPanelVisible(bool visible) {
    if (visible != _rightPanelVisible) {
      _rightPanelVisible = visible;
      logService.logInfo(
          'Right panel ${visible ? 'shown' : 'hidden'}',
          subsystem: 'workspace');
      notifyListeners();
    }
  }
}