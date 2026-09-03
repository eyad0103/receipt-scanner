import 'dart:convert';
import 'dart:io';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import '../services/log_service.dart';

class ConfigService {
  static const String appVersion = '1.0.0';
  static const String logLevelDefault = 'info';

  late Directory _appDir;
  late File _configFile;
  final LogService _logService;

  ConfigService(this._logService);

  Map<String, dynamic> _config = {};

  Future<void> initialize() async {
    _appDir = await _getApplicationDirectory();
    _configFile = File(p.join(_appDir.parent.path, 'config', 'config.json'));
    await _ensureConfigDirectory();
    await _loadOrCreateConfig();
  }

  Future<Directory> _getApplicationDirectory() async {
    final dir = await getApplicationSupportDirectory();
    return dir;
  }

  Future<void> _ensureConfigDirectory() async {
    final configDir = Directory(p.join(_appDir.parent.path, 'config'));
    if (!await configDir.exists()) {
      await configDir.create(recursive: true);
    }
  }

  Future<void> _loadOrCreateConfig() async {
    if (await _configFile.exists()) {
      _logService.log('Loading Configuration');
      final contents = await _configFile.readAsString();
      _config = jsonDecode(contents) as Map<String, dynamic>;
    } else {
      _logService.log('Generating Default Configuration');
      _config = _defaultConfig();
      await _saveConfig();
    }
  }

  Map<String, dynamic> _defaultConfig() {
    return {
      'version': appVersion,
      'theme': 'dark',
      'debugEnabled': false,
      'logLevel': logLevelDefault,
      'windowWidth': 1280,
      'windowHeight': 720,
      'windowX': 100,
      'windowY': 100,
      'firstLaunch': true,
    };
  }

  Future<void> _saveConfig() async {
    final contents = jsonEncode(_config);
    await _configFile.writeAsString(contents);
  }

  T getValue<T>(String key, T defaultValue) {
    if (_config.containsKey(key)) {
      return _config[key] as T;
    }
    _config[key] = defaultValue;
    return defaultValue;
  }

  Future<void> setValue(String key, dynamic value) async {
    _config[key] = value;
    await _saveConfig();
  }

  String get version => _config['version'] as String? ?? appVersion;
  String get theme => _config['theme'] as String? ?? 'dark';
  bool get debugEnabled => _config['debugEnabled'] as bool? ?? false;
  String get logLevel => _config['logLevel'] as String? ?? logLevelDefault;
  int get windowWidth => _config['windowWidth'] as int? ?? 1280;
  int get windowHeight => _config['windowHeight'] as int? ?? 720;
  int get windowX => _config['windowX'] as int? ?? 100;
  int get windowY => _config['windowY'] as int? ?? 100;
  bool get firstLaunch => _config['firstLaunch'] as bool? ?? true;

  Future<void> setTheme(String value) => setValue('theme', value);
  Future<void> setDebugEnabled(bool value) => setValue('debugEnabled', value);

  Future<void> setWindowSize(int width, int height) async {
    _config['windowWidth'] = width;
    _config['windowHeight'] = height;
    await _saveConfig();
  }

  Future<void> setWindowPosition(int x, int y) async {
    _config['windowX'] = x;
    _config['windowY'] = y;
    await _saveConfig();
  }

  Future<void> markFirstLaunchComplete() async {
    _config['firstLaunch'] = false;
    await _saveConfig();
  }

  bool get isLoaded => _configFile.existsSync();
}
