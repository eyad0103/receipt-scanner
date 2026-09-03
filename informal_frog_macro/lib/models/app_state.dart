import 'package:flutter/foundation.dart';

import '../models/log_entry.dart';
import '../services/log_service.dart';
import '../services/config_service.dart';

class AppState extends ChangeNotifier {
  final ConfigService _configService;
  final LogService _logService;

  AppState(this._configService, this._logService);

  String get theme => _configService.theme;
  bool get debugEnabled => _configService.debugEnabled;
  String get version => _configService.version;
  bool get firstLaunch => _configService.firstLaunch;

  bool get isConfigLoaded => _configService.isLoaded;
  List<LogEntry> get logEntries => _logService.entries;
  Stream<List<LogEntry>> get logStream => _logService.logStream;

  void updateTheme(String value) {
    _configService.setTheme(value).then((_) {
      notifyListeners();
    });
  }

  void updateDebugEnabled(bool value) {
    _configService.setDebugEnabled(value).then((_) {
      _logService.setLogLevel(value ? 'debug' : 'info');
      notifyListeners();
    });
  }

  List<LogEntry> searchLogs(String query) {
    return _logService.search(query);
  }
}
