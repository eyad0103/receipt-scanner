import 'dart:io';
import 'package:flutter/material.dart';
import 'package:window_manager/window_manager.dart';
import 'package:path_provider/path_provider.dart';

import 'app/app.dart';
import 'services/log_service.dart';
import 'services/config_service.dart';
import 'services/roblox_detection_service.dart';
import 'services/workspace_manager.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await windowManager.ensureInitialized();

  final logService = LogService();
  final configService = ConfigService(logService);

  await logService.initialize();
  logService.log('Application Starting');

  logService.log('Loading Configuration');
  await configService.initialize();
  logService.setLogLevel(configService.logLevel);

  logService.log('Creating Directories');
  await _ensureDirectories(logService);
  await _ensureCapturesDirectory(logService);

  logService.log('Loading Assets');
  await _loadAssets(logService);

  logService.log('Loading Fonts');

  logService.log('Initializing Services');
  final robloxService = RobloxDetectionService(logService);
  robloxService.start();

  final workspaceManager = WorkspaceManager(
    logService: logService,
    configService: configService,
    robloxService: robloxService,
  );
  await workspaceManager.initialize();

  _applyWindowSettings(configService, logService);
  logService.log('Opening Main Window');

  windowManager.waitUntilReadyToShow().then((_) async {
    await windowManager.show();
    await windowManager.setResizable(true);
  });

  logService.log('Application Ready');

  runApp(Application(
    logService: logService,
    configService: configService,
    robloxService: robloxService,
    workspaceManager: workspaceManager,
  ));
}

Future<void> _ensureDirectories(LogService logService) async {
  final appDir = await getApplicationSupportDirectory();
  final parent = appDir.parent;

  final dirs = ['config', 'logs', 'cache', 'profiles', 'assets/images', 'assets/icons', 'assets/templates', 'assets/fonts'];
  for (final d in dirs) {
    final dir = Directory('${parent.path}/$d');
    if (!await dir.exists()) {
      await dir.create(recursive: true);
      logService.logDebug('Created directory: $d');
    }
  }
}

Future<void> _ensureCapturesDirectory(LogService logService) async {
  final appDir = await getApplicationSupportDirectory();
  final capturesDir = Directory('${appDir.parent.path}/captures');
  if (!await capturesDir.exists()) {
    await capturesDir.create(recursive: true);
    logService.logDebug('Created captures directory');
  }
}

Future<void> _loadAssets(LogService logService) async {
  final appDir = await getApplicationSupportDirectory();
  final assetsDir = Directory('${appDir.parent.path}/assets');
  if (!await assetsDir.exists()) {
    await assetsDir.create(recursive: true);
  }
  logService.logDebug('Assets directory ready');
}

void _applyWindowSettings(ConfigService configService, LogService logService) {
  final width = configService.windowWidth.toDouble();
  final height = configService.windowHeight.toDouble();
  final x = configService.windowX.toDouble();
  final y = configService.windowY.toDouble();

  final windowOptions = WindowOptions(
    size: Size(width, height),
    minimumSize: const Size(1000, 700),
    backgroundColor: Colors.black,
    title: 'Informal Frog Macro',
    fullScreen: false,
  );

  windowManager.waitUntilReadyToShow(windowOptions, () async {
    await windowManager.show();
    await windowManager.setResizable(true);
    await windowManager.setPosition(Offset(x, y));
    await windowManager.setSize(Size(width, height));
  });
}
