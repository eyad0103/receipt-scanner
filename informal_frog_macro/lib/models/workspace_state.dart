enum WorkspaceStatus {
  waiting,
  anchoring,
  anchored,
  outOfAlignment,
  error,
}

class WorkspaceStateInfo {
  final WorkspaceStatus status;
  final bool isAligned;
  final String? errorMessage;
  final String monitorDescription;

  const WorkspaceStateInfo({
    required this.status,
    required this.isAligned,
    required this.monitorDescription,
    this.errorMessage,
  });

  WorkspaceStateInfo copyWith({
    WorkspaceStatus? status,
    bool? isAligned,
    String? errorMessage,
    String? monitorDescription,
  }) {
    return WorkspaceStateInfo(
      status: status ?? this.status,
      isAligned: isAligned ?? this.isAligned,
      errorMessage: errorMessage ?? this.errorMessage,
      monitorDescription: monitorDescription ?? this.monitorDescription,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! WorkspaceStateInfo) return false;
    return status == other.status &&
        isAligned == other.isAligned &&
        errorMessage == other.errorMessage &&
        monitorDescription == other.monitorDescription;
  }

  @override
  int get hashCode => Object.hash(status, isAligned, errorMessage, monitorDescription);

  static String statusToString(WorkspaceStatus status) {
    switch (status) {
      case WorkspaceStatus.waiting:
        return 'Waiting for Roblox';
      case WorkspaceStatus.anchoring:
        return 'Anchoring';
      case WorkspaceStatus.anchored:
        return 'Anchored';
      case WorkspaceStatus.outOfAlignment:
        return 'Out of Alignment';
      case WorkspaceStatus.error:
        return 'Workspace Error';
    }
  }
}