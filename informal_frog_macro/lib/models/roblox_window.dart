enum RobloxWindowState {
  notRunning,
  running,
  visible,
  hidden,
  minimized,
  foreground,
  background,
}

enum RobloxEventType {
  started,
  closed,
  windowFound,
  windowLost,
  windowMoved,
  windowResized,
  windowMinimized,
  windowRestored,
  foregroundChanged,
}

class RobloxWindow {
  final int? handle;
  final String title;
  final int x;
  final int y;
  final int width;
  final int height;
  final RobloxWindowState state;
  final bool isForeground;
  final int processId;

  const RobloxWindow({
    required this.handle,
    required this.title,
    required this.x,
    required this.y,
    required this.width,
    required this.height,
    required this.state,
    required this.isForeground,
    required this.processId,
  });

  static const RobloxWindow notFound = RobloxWindow(
    handle: null,
    title: '',
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    state: RobloxWindowState.notRunning,
    isForeground: false,
    processId: 0,
  );

  RobloxWindow copyWith({
    int? handle,
    String? title,
    int? x,
    int? y,
    int? width,
    int? height,
    RobloxWindowState? state,
    bool? isForeground,
    int? processId,
  }) {
    return RobloxWindow(
      handle: handle ?? this.handle,
      title: title ?? this.title,
      x: x ?? this.x,
      y: y ?? this.y,
      width: width ?? this.width,
      height: height ?? this.height,
      state: state ?? this.state,
      isForeground: isForeground ?? this.isForeground,
      processId: processId ?? this.processId,
    );
  }

  RobloxWindow copy() {
    return RobloxWindow(
      handle: handle,
      title: title,
      x: x,
      y: y,
      width: width,
      height: height,
      state: state,
      isForeground: isForeground,
      processId: processId,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! RobloxWindow) return false;
    return handle == other.handle &&
        title == other.title &&
        x == other.x &&
        y == other.y &&
        width == other.width &&
        height == other.height &&
        state == other.state &&
        isForeground == other.isForeground &&
        processId == other.processId;
  }

  @override
  int get hashCode => Object.hash(
      handle, title, x, y, width, height, state, isForeground, processId);
}
