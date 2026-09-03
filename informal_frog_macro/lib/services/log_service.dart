import 'dart:async';
import 'dart:io';
import 'package:path/path.dart' as p;
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';

import '../models/log_entry.dart';

class LogService {
  static const List<String> validLevels = ['debug', 'info', 'warning', 'error'];

  late Directory logDir;
  late File currentLogFile;
  late String currentDate;

  final StreamController<LogEntry> _entryController =
      StreamController<LogEntry>.broadcast();

  final List<LogEntry> _entries = [];
  final int _maxEntries = 5000;

  String minLogLevel = 'info';
  bool initialized = false;

  Stream<LogEntry> get entryStream => _entryController.stream;
  Stream<List<LogEntry>> get logStream =>
      _entryController.stream.map((_) => _entries);

  LogService._internal();

  static LogService? _instance;

  factory LogService() {
    return _instance ??= LogService._internal();
  }

  Future<void> initialize({String logLevel = 'info'}) async {
    minLogLevel = logLevel;
    final appDir = await getApplicationSupportDirectory();
    logDir = Directory(p.join(appDir.parent.path, 'logs'));

    if (!await logDir.exists()) {
      await logDir.create(recursive: true);
    }

    currentDate = DateFormat('yyyy-MM-dd').format(DateTime.now());
    currentLogFile = File(p.join(logDir.path, '$currentDate.log'));
    await currentLogFile.create(recursive: true);
    initialized = true;
  }

  int _levelToInt(String level) {
    switch (level) {
      case 'debug':
        return 0;
      case 'info':
        return 1;
      case 'warning':
        return 2;
      case 'error':
        return 3;
      default:
        return 1;
    }
  }

  bool _shouldLog(String level) {
    return _levelToInt(level) >= _levelToInt(minLogLevel);
  }

  void log(String message,
      {String level = 'info', String subsystem = 'app'}) {
    if (!initialized) return;
    if (!_shouldLog(level)) return;

    final now = DateTime.now();
    final timestamp = DateFormat('yyyy-MM-dd HH:mm:ss.SSS').format(now);

    final entry = LogEntry(
      timestamp: timestamp,
      level: level,
      subsystem: subsystem,
      message: message,
    );

    _entries.add(entry);

    if (_entries.length > _maxEntries) {
      _entries.removeAt(0);
    }

    _writeToFile(entry);
    _entryController.add(entry);
  }

  void logDebug(String message, {String subsystem = 'app'}) =>
      log(message, level: 'debug', subsystem: subsystem);
  void logInfo(String message, {String subsystem = 'app'}) =>
      log(message, level: 'info', subsystem: subsystem);
  void logWarning(String message, {String subsystem = 'app'}) =>
      log(message, level: 'warning', subsystem: subsystem);
  void logError(String message, {String subsystem = 'app'}) =>
      log(message, level: 'error', subsystem: subsystem);

  Future<void> _writeToFile(LogEntry entry) async {
    try {
      final dateStr = DateFormat('yyyy-MM-dd').format(DateTime.now());
      if (dateStr != currentDate) {
        currentDate = dateStr;
        currentLogFile = File(p.join(logDir.path, '$currentDate.log'));
        await currentLogFile.create(recursive: true);
      }

      final line =
          '[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.subsystem}] ${entry.message}\n';
      await currentLogFile.writeAsString(line, mode: FileMode.append);
    } catch (e) {
      // Silently fail to avoid crashes
    }
  }

  List<LogEntry> get entries => List.unmodifiable(_entries);

  List<LogEntry> search(String query) {
    if (query.isEmpty) return entries;
    return _entries
        .where((e) =>
            e.message.toLowerCase().contains(query.toLowerCase()) ||
            e.level.toLowerCase().contains(query.toLowerCase()) ||
            e.subsystem.toLowerCase().contains(query.toLowerCase()))
        .toList();
  }

  Future<void> dispose() async {
    await _entryController.close();
  }

  void setLogLevel(String level) {
    if (validLevels.contains(level)) {
      minLogLevel = level;
    }
  }
}
