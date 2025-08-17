# JSON Structure Cleanup Scripts

This directory contains scripts for cleaning up and organizing JSON files, with a special focus on locale files.

## Scripts Overview

### 1. `cleanup-json-structure.js` - General JSON Cleanup
A comprehensive script for analyzing and cleaning any JSON files.

**Features:**
- Detects duplicate keys at all levels
- Analyzes structure and hierarchy
- Reorganizes keys by depth and alphabetically
- Generates detailed reports

### 2. `cleanup-locale-files.js` - Locale-Specific Cleanup
A specialized script designed specifically for locale JSON files.

**Features:**
- Automatically categorizes keys by function
- Maintains consistent structure across locales
- Removes duplicates while preserving data
- Organizes keys in logical groups

## Usage

### Basic Usage

```bash
# Process all locale files (default)
node cleanup-locale-files.js

# Process specific file
node cleanup-json-structure.js --file ./src/locales/en/en.json

# Process specific directory
node cleanup-json-structure.js --dir ./src/locales
```

### Options

| Option | Description |
|--------|-------------|
| `--backup` | Create backup before processing |
| `--dry-run` | Show what would be changed without making changes |
| `--verbose` | Show detailed information |
| `--help` | Show help message |

### Examples

```bash
# Dry run to see what would be changed
node cleanup-locale-files.js --dry-run --verbose

# Create backup and process all locales
node cleanup-locale-files.js --backup

# Analyze specific JSON file structure
node cleanup-json-structure.js --file ./config.json --verbose

# Process all JSON files in a directory with backup
node cleanup-json-structure.js --dir ./data --backup
```

## What the Scripts Do

### Structure Analysis
- Counts total keys and maximum nesting depth
- Identifies nested objects vs. leaf nodes
- Maps key hierarchy and relationships

### Duplicate Detection
- Finds duplicate keys at any level
- Counts occurrences of each duplicate
- Reports all duplicates found

### Key Organization
- Groups keys by logical categories
- Sorts keys by depth and alphabetically
- Maintains consistent structure across files

### Locale-Specific Features
- Automatically categorizes keys (auth, navigation, dashboard, etc.)
- Ensures consistent structure across all locale files
- Preserves translation data while cleaning structure

## Output

The scripts provide detailed reports including:

- **Structure Analysis**: Total keys, depth, nested objects
- **Duplicate Report**: List of all duplicates found
- **Category Breakdown**: Keys organized by function
- **Structure Issues**: Deep nesting warnings
- **Summary**: Total files processed and changes made

## Safety Features

- **Backup Creation**: Optional automatic backups before processing
- **Dry Run Mode**: Preview changes without modifying files
- **Error Handling**: Graceful handling of invalid JSON
- **Progress Tracking**: Real-time feedback on processing

## Best Practices

1. **Always use `--dry-run` first** to see what will be changed
2. **Use `--backup`** when processing important files
3. **Review the verbose output** to understand the structure
4. **Test on a copy** before processing production files

## Example Output

```
🌍 Locale Files Cleanup Script
==================================================
Found 5 locales: en, ar, fr, tr, zh-CN

📁 Processing: en (./src/locales/en/en.json)

📊 Analysis Report for en
----------------------------------------
📈 Structure:
   Total keys: 1250
   Maximum depth: 4
   Categories found: 18

✅ No duplicates found

📊 Categories:
   common: 45 keys
   auth: 23 keys
   navigation: 12 keys
   dashboard: 67 keys
   wallet: 89 keys
   mining: 34 keys
   staking: 28 keys
   referrals: 31 keys
   profile: 56 keys
   settings: 78 keys
   notifications: 45 keys
   mainNotifications: 25 keys
   admin: 156 keys
   errors: 34 keys
   validation: 23 keys
   success: 12 keys
   welcomeBonus: 4 keys
   notificationTemplates: 8 keys

🎯 Summary
==================================================
Files processed: 1
Duplicates removed: 0
Keys reorganized: 1250
Structure issues: 0
```

## Troubleshooting

### Common Issues

1. **"File not found"**: Check the file path is correct
2. **"Invalid JSON"**: The file contains syntax errors
3. **"Permission denied"**: Check file permissions
4. **"No JSON files found"**: Directory doesn't contain .json files

### Getting Help

```bash
# Show help for locale script
node cleanup-locale-files.js --help

# Show help for general script
node cleanup-json-structure.js --help
```

## Requirements

- Node.js 14+ 
- No external dependencies (uses only built-in modules)
- Read/write permissions for target files
