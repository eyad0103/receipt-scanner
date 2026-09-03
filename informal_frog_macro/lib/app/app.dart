import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:window_manager/window_manager.dart';

import '../models/app_state.dart';
import '../models/roblox_window.dart';
import '../services/config_service.dart';
import '../services/log_service.dart';
import '../services/roblox_detection_service.dart';
import '../services/workspace_manager.dart';
import '../services/capture_service.dart';
import '../services/capture_controller.dart';
import 'pages/developer_capture_page.dart';
import 'pages/workspace_preview_page.dart';
import '../ui/scaffold.dart';

class Application extends StatefulWidget {
  final LogService logService;
  final ConfigService configService;
  final RobloxDetectionService robloxService;
  final WorkspaceManager workspaceManager;

  const Application({
    super.key,
    required this.logService,
    required this.configService,
    required this.robloxService,
    required this.workspaceManager,
  });

  @override
  State<Application> createState() => _ApplicationState();
}

class _ApplicationState extends State<Application> with WindowListener {
  late AppState _appState;
  late CaptureService _captureService;
  late CaptureController _captureController;

  RobloxWindow _robloxWindow = RobloxWindow.notFound;
  StreamSubscription<RobloxWindow>? _robloxSubscription;

  @override
  void initState() {
    super.initState();
    _appState = AppState(widget.configService, widget.logService);
    _captureService = CaptureService(widget.logService, () => _robloxWindow);
    _captureController = CaptureController(_captureService, widget.logService);
    windowManager.addListener(this);

    _robloxSubscription = widget.robloxService.windowStream.listen((window) {
      setState(() {
        _robloxWindow = window;
      });
    });
  }

  @override
  void onWindowResize() async {
    final size = await windowManager.getSize();
    widget.configService.setWindowSize(size.width.toInt(), size.height.toInt());
  }

  @override
  void onWindowMove() async {
    final position = await windowManager.getPosition();
    widget.configService.setWindowPosition(
        position.dx.toInt(), position.dy.toInt());
  }

  @override
  void dispose() {
    windowManager.removeListener(this);
    _robloxSubscription?.cancel();
    _captureController.dispose();
    widget.robloxService.dispose();
    widget.logService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: _appState,
      child: Consumer<AppState>(
        builder: (context, state, child) {
          final themeMode =
              state.theme == 'dark' ? ThemeMode.dark : ThemeMode.light;

          return MaterialApp(
            title: 'Informal Frog Macro',
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              brightness: Brightness.light,
              colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
              useMaterial3: true,
            ),
            darkTheme: ThemeData(
              brightness: Brightness.dark,
              colorScheme: ColorScheme.fromSeed(
                seedColor: Colors.blue,
                brightness: Brightness.dark,
              ),
              useMaterial3: true,
            ),
            themeMode: themeMode,
            home: MainAppScaffold(
              robloxWindow: _robloxWindow,
              workspaceManager: widget.workspaceManager,
              robloxService: widget.robloxService,
              logService: widget.logService,
            ),
            onGenerateRoute: (settings) {
              if (settings.name == DeveloperCapturePage.route) {
                return MaterialPageRoute(
                  builder: (context) => DeveloperCapturePage(
                    captureController: _captureController,
                  ),
                );
              }
              if (settings.name == WorkspacePreviewPage.route) {
                return MaterialPageRoute(
                  builder: (context) => WorkspacePreviewPage(
                    workspaceManager: widget.workspaceManager,
                    robloxWindow: _robloxWindow,
                  ),
                );
              }
              return null;
            },
          );
        },
      ),
    );
  }
}