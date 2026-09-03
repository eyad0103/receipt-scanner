import 'dart:async';
import 'package:flutter/material.dart';
import '../models/roblox_window.dart';
import '../models/app_routes.dart';
import '../app/pages/dashboard_page.dart';
import '../app/pages/logs_page.dart';
import '../app/pages/settings_page.dart';
import '../app/pages/about_page.dart';
import 'right_panel.dart';
import '../services/workspace_manager.dart';
import '../services/roblox_detection_service.dart';
import '../services/log_service.dart';

class MainAppScaffold extends StatefulWidget {
  final RobloxWindow robloxWindow;
  final WorkspaceManager workspaceManager;
  final RobloxDetectionService robloxService;
  final LogService logService;

  const MainAppScaffold({
    super.key,
    this.robloxWindow = RobloxWindow.notFound,
    required this.workspaceManager,
    required this.robloxService,
    required this.logService,
  });

  @override
  State<MainAppScaffold> createState() => _MainAppScaffoldState();
}

class _MainAppScaffoldState extends State<MainAppScaffold> {
  int _selectedIndex = 0;
  late StreamSubscription _workspaceStatusSub;

  @override
  void initState() {
    super.initState();
    _workspaceStatusSub = widget.workspaceManager.statusStream.listen((_) {
      if (mounted) {
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _workspaceStatusSub.cancel();
    super.dispose();
  }

  void _onNavTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  Widget _buildPageContent() {
    switch (_selectedIndex) {
      case 0:
        return DashboardPage(robloxWindow: widget.robloxWindow);
      case 1:
        return const LogsPage();
      case 2:
        return const SettingsPage();
      case 3:
        return const AboutPage();
      default:
        return DashboardPage(robloxWindow: widget.robloxWindow);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: Container(
        color: isDark ? const Color(0xFF121212) : const Color(0xFFF0F0F0),
        child: Row(
          children: [
            Container(
              width: 80,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E1E1E) : const Color(0xFF2D2D2D),
                border: Border(
                  right: BorderSide(
                    color: isDark
                        ? const Color(0xFF3A3A3A)
                        : const Color(0xFF404040),
                    width: 1,
                  ),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    height: 56,
                    alignment: Alignment.center,
                    child: Icon(
                      Icons.emoji_nature_outlined,
                      color: isDark ? Colors.blue[300] : Colors.blue,
                      size: 24,
                    ),
                  ),
                  Expanded(
                    child: ListView(
                      padding: EdgeInsets.zero,
                      children:
                          List.generate(AppSidebar.items.length, (index) {
                        final item = AppSidebar.items[index];
                        final isSelected = _selectedIndex == index;
                        return Tooltip(
                          message: item.label,
                          child: ListTile(
                            leading: Icon(
                              item.icon,
                              color: isSelected
                                  ? (isDark
                                      ? Colors.blue[300]
                                      : Colors.blue)
                                  : (isDark
                                      ? Colors.grey[500]
                                      : Colors.grey[400]),
                              size: 20,
                            ),
                            title: Text(
                              item.label,
                              style: TextStyle(
                                fontSize: 13,
                                color: isSelected
                                    ? (isDark
                                        ? Colors.blue[300]
                                        : Colors.blue)
                                    : (isDark
                                        ? Colors.grey[400]
                                        : Colors.grey[600]),
                                fontWeight: isSelected
                                    ? FontWeight.w600
                                    : FontWeight.normal,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            selected: isSelected,
                            selectedTileColor: isDark
                                ? Colors.blue.withValues(alpha: 0.15)
                                : Colors.blue.withValues(alpha: 0.1),
                            onTap: () => _onNavTapped(index),
                            contentPadding:
                                const EdgeInsets.symmetric(horizontal: 16),
                            minLeadingWidth: 24,
                          ),
                        );
                      }),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: _buildPageContent(),
            ),
            Container(
              width: 300,
              constraints: const BoxConstraints(minWidth: 240, maxWidth: 360),
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF1A1A1A)
                    : const Color(0xFF2A2A2A),
                border: Border(
                  left: BorderSide(
                    color: isDark
                        ? const Color(0xFF3A3A3A)
                        : Colors.grey.shade300,
                    width: 1,
                  ),
                ),
              ),
              child: RightPanel(
                robloxWindow: widget.robloxWindow,
                logService: widget.logService,
                workspaceManager: widget.workspaceManager,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
