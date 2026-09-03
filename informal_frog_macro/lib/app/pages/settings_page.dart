import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/app_state.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final appState = Provider.of<AppState>(context);

    return Scaffold(
      body: Container(
        color: Theme.of(context).scaffoldBackgroundColor,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Settings',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
              const SizedBox(height: 32),
              _buildSettingCard(
                context,
                isDark,
                'Theme',
                'Application appearance theme',
                _buildThemeSelector(context, isDark, appState),
              ),
              const SizedBox(height: 16),
              _buildSettingCard(
                context,
                isDark,
                'Debug Mode',
                'Enable debug logging and additional diagnostics',
                Switch(
                  value: appState.debugEnabled,
                  activeThumbColor: isDark ? Colors.blue[300] : Colors.blue,
                  onChanged: (value) {
                    appState.updateDebugEnabled(value);
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSettingCard(
    BuildContext context,
    bool isDark,
    String title,
    String description,
    Widget control,
  ) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        border: Border.all(
          color: isDark ? const Color(0xFF3A3A3A) : Colors.grey.shade300,
          width: 1,
        ),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: isDark ? Colors.white : Colors.black87,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.grey[500] : Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          control,
        ],
      ),
    );
  }

  Widget _buildThemeSelector(BuildContext context, bool isDark, AppState appState) {
    final themes = ['dark', 'light'];
    final current = appState.theme;

    return SizedBox(
      width: 120,
      child: DropdownButtonFormField<String>(
        initialValue: themes.contains(current) ? current : 'dark',
        decoration: InputDecoration(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(4),
            borderSide: BorderSide(
              color: isDark ? const Color(0xFF3A3A3A) : Colors.grey.shade300,
            ),
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          isDense: true,
        ),
        style: TextStyle(
          color: isDark ? Colors.grey[300] : Colors.grey[800],
          fontSize: 13,
        ),
        dropdownColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        items: themes.map((theme) {
          return DropdownMenuItem(
            value: theme,
            child: Text(
              theme.toUpperCase(),
              style: TextStyle(
                color: isDark ? Colors.grey[300] : Colors.grey[800],
                fontSize: 12,
              ),
            ),
          );
        }).toList(),
        onChanged: (value) {
          if (value != null) {
            appState.updateTheme(value);
          }
        },
      ),
    );
  }
}
