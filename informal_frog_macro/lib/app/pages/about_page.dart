import 'dart:io';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class AboutPage extends StatelessWidget {
  const AboutPage({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final dateFmt = DateFormat('yyyy-MM-dd');

    final String appName = 'Informal Frog Macro';
    const String version = '1.0.0';
    final String buildDate = dateFmt.format(DateTime.now());
    const String framework = 'Flutter';
    final String os = '${Platform.operatingSystem} ${Platform.localHostname}';

    return Scaffold(
      body: Container(
        color: Theme.of(context).scaffoldBackgroundColor,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'About',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
              const SizedBox(height: 32),
              _buildInfoRow(context, isDark, 'Application Name', appName),
              _buildInfoRow(context, isDark, 'Version', version),
              _buildInfoRow(context, isDark, 'Build Date', buildDate),
              _buildInfoRow(context, isDark, 'Framework', framework),
              _buildInfoRow(context, isDark, 'Operating System', os),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(
    BuildContext context,
    bool isDark,
    String label,
    String value,
  ) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 20),
      margin: const EdgeInsets.only(bottom: 1),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        border: Border(
          bottom: BorderSide(
            color: isDark ? const Color(0xFF3A3A3A) : Colors.grey.shade300,
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 160,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                color: isDark ? Colors.grey[500] : Colors.grey[600],
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: isDark ? Colors.white : Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
