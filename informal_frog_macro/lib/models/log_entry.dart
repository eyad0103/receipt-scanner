class LogEntry {
  final String timestamp;
  final String level;
  final String subsystem;
  final String message;

  LogEntry({
    required this.timestamp,
    required this.level,
    required this.subsystem,
    required this.message,
  });

  String get formattedLine =>
      '[$timestamp] [${level.toUpperCase()}] [$subsystem] $message';
}
