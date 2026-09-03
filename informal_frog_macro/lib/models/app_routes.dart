import 'package:flutter/material.dart';

class AppRoutes {
  static const String dashboard = '/';
  static const String logs = '/logs';
  static const String settings = '/settings';
  static const String about = '/about';
  static const String workspacePreview = '/_dev_workspace';
}

class SidebarItem {
  final IconData icon;
  final String label;
  final String route;

  SidebarItem({
    required this.icon,
    required this.label,
    required this.route,
  });
}

class AppSidebar {
  static List<SidebarItem> items = [
    SidebarItem(icon: Icons.dashboard_outlined, label: 'Dashboard', route: AppRoutes.dashboard),
    SidebarItem(icon: Icons.list_alt_outlined, label: 'Logs', route: AppRoutes.logs),
    SidebarItem(icon: Icons.settings_outlined, label: 'Settings', route: AppRoutes.settings),
    SidebarItem(icon: Icons.info_outline, label: 'About', route: AppRoutes.about),
  ];
}
