import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/app_state.dart';
import '../../models/log_entry.dart';

class LogsPage extends StatefulWidget {
  const LogsPage({super.key});

  @override
  State<LogsPage> createState() => _LogsPageState();
}

class _LogsPageState extends State<LogsPage> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();
  bool _autoScroll = true;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scrollController.hasClients) {
      final maxScroll = _scrollController.position.maxScrollExtent;
      final currentScroll = _scrollController.position.pixels;
      final shouldAutoScroll = currentScroll >= maxScroll - 50;
      if (shouldAutoScroll != _autoScroll) {
        setState(() {
          _autoScroll = shouldAutoScroll;
        });
      }
    }
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    setState(() {
      _searchQuery = query;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final appState = Provider.of<AppState>(context);

    return Scaffold(
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
            child: Text(
              'Logs',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : Colors.black87,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    onChanged: _onSearchChanged,
                    style: TextStyle(
                      color: isDark ? Colors.white : Colors.black87,
                      fontSize: 13,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Search logs...',
                      hintStyle: TextStyle(
                        color: isDark ? Colors.grey[600] : Colors.grey[500],
                        fontSize: 13,
                      ),
                      prefixIcon: Icon(
                        Icons.search_outlined,
                        color: isDark ? Colors.grey[500] : Colors.grey[400],
                        size: 18,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(4),
                        borderSide: BorderSide(
                          color: isDark
                              ? const Color(0xFF3A3A3A)
                              : Colors.grey.shade300,
                        ),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(4),
                        borderSide: BorderSide(
                          color: isDark
                              ? const Color(0xFF3A3A3A)
                              : Colors.grey.shade300,
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(4),
                        borderSide: BorderSide(
                          color: isDark ? Colors.blue[300]! : Colors.blue,
                        ),
                      ),
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                IconButton(
                  icon: Icon(
                    Icons.file_download_outlined,
                    color: isDark ? Colors.grey[500] : Colors.grey[400],
                  ),
                  iconSize: 18,
                  onPressed: null,
                  tooltip: 'Export (Disabled)',
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: Icon(
                    Icons.clear_all_outlined,
                    color: isDark ? Colors.grey[500] : Colors.grey[400],
                  ),
                  iconSize: 18,
                  onPressed: null,
                  tooltip: 'Clear (Disabled)',
                ),
              ],
            ),
          ),
          Expanded(
            child: StreamBuilder<List<LogEntry>>(
              stream: appState.logStream,
              initialData: appState.logEntries,
              builder: (context, snapshot) {
                final entries = _searchQuery.isEmpty
                    ? (snapshot.data ?? [])
                    : appState.searchLogs(_searchQuery);

                if (entries.isEmpty) {
                  return Center(
                    child: Text(
                      _searchQuery.isEmpty
                          ? 'No logs available'
                          : 'No matching log entries',
                      style: TextStyle(
                        color: isDark ? Colors.grey[600] : Colors.grey[500],
                        fontSize: 14,
                      ),
                    ),
                  );
                }

                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (_autoScroll && _scrollController.hasClients) {
                    _scrollController.animateTo(
                      _scrollController.position.maxScrollExtent,
                      duration: const Duration(milliseconds: 200),
                      curve: Curves.easeOut,
                    );
                  }
                });

                return ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                  itemCount: entries.length,
                  itemBuilder: (context, index) {
                    final entry = entries[index];
                    return _buildLogEntry(context, isDark, entry);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLogEntry(BuildContext context, bool isDark, LogEntry entry) {
    Color levelColor = Colors.grey;
    switch (entry.level) {
      case 'debug':
        levelColor = Colors.blue;
        break;
      case 'info':
        levelColor = isDark ? Colors.green[300]! : Colors.green[700]!;
        break;
      case 'warning':
        levelColor = Colors.orange;
        break;
      case 'error':
        levelColor = Colors.red;
        break;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 2),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.transparent,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            entry.timestamp,
            style: TextStyle(
              fontSize: 11,
              color: isDark ? Colors.grey[600] : Colors.grey[500],
            ),
          ),
          const SizedBox(width: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
            decoration: BoxDecoration(
              color: levelColor.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(2),
            ),
            child: Text(
              entry.level.toUpperCase(),
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: levelColor,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              entry.message,
              style: TextStyle(
                fontSize: 12,
                color: isDark ? Colors.grey[300] : Colors.grey[800],
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
