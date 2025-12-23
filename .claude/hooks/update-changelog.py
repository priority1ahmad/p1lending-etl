#!/usr/bin/env python3
"""
Changelog Maintenance Hook

Automatically updates CHANGELOG.md in Keep a Changelog format
before git commit operations.
"""
import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path

CHANGELOG_FILE = 'CHANGELOG.md'
PROJECT_ROOT = Path(__file__).parent.parent.parent


def get_staged_changes() -> dict[str, list[str]]:
    """Get staged files categorized by change type."""
    try:
        result = subprocess.run(
            ['git', 'diff', '--cached', '--name-status'],
            capture_output=True,
            text=True,
            cwd=PROJECT_ROOT
        )

        if result.returncode != 0:
            return {}

        changes = {
            'added': [],
            'changed': [],
            'removed': [],
        }

        for line in result.stdout.strip().split('\n'):
            if not line:
                continue

            parts = line.split('\t')
            if len(parts) < 2:
                continue

            status, file_path = parts[0], parts[-1]

            # Skip changelog and documentation files
            if file_path in (CHANGELOG_FILE, 'DOCUMENTATION.md'):
                continue

            if status.startswith('A'):
                changes['added'].append(file_path)
            elif status.startswith('D'):
                changes['removed'].append(file_path)
            elif status.startswith('M') or status.startswith('R'):
                changes['changed'].append(file_path)

        return changes

    except Exception:
        return {}


def extract_commit_message(command: str) -> str | None:
    """Extract commit message from git commit command."""
    # Match -m "message" or -m 'message'
    match = re.search(r'-m\s+["\'](.+?)["\']', command)
    if match:
        return match.group(1)

    # Match heredoc style: -m "$(cat <<'EOF'\nmessage\nEOF\n)"
    heredoc_match = re.search(r"cat <<['\"]?EOF['\"]?\n(.+?)\nEOF", command, re.DOTALL)
    if heredoc_match:
        return heredoc_match.group(1).strip().split('\n')[0]

    return None


def categorize_by_message(message: str) -> str | None:
    """Determine changelog category from commit message."""
    message_lower = message.lower()

    if any(word in message_lower for word in ['fix', 'bug', 'patch', 'repair', 'resolve']):
        return 'fixed'
    elif any(word in message_lower for word in ['add', 'new', 'create', 'implement', 'introduce']):
        return 'added'
    elif any(word in message_lower for word in ['remove', 'delete', 'drop', 'deprecate']):
        return 'removed'
    elif any(word in message_lower for word in ['update', 'change', 'modify', 'refactor', 'improve', 'enhance']):
        return 'changed'

    return None


def summarize_changes(files: list[str]) -> str:
    """Create a summary description from file list."""
    if not files:
        return ''

    # Group by directory
    dirs = {}
    for f in files:
        parts = f.split('/')
        if len(parts) > 1:
            key = parts[0] if parts[0] != '.' else parts[1]
        else:
            key = 'root'
        dirs.setdefault(key, []).append(f)

    # Create summary
    summaries = []
    for dir_name, dir_files in dirs.items():
        if len(dir_files) == 1:
            summaries.append(dir_files[0])
        else:
            summaries.append(f"{dir_name}/ ({len(dir_files)} files)")

    return ', '.join(summaries[:3])


def update_changelog(commit_message: str, changes: dict[str, list[str]]):
    """Update CHANGELOG.md with new entries."""
    changelog_path = PROJECT_ROOT / CHANGELOG_FILE
    today = datetime.now().strftime('%Y-%m-%d')

    # Create changelog if it doesn't exist
    if not changelog_path.exists():
        changelog_path.write_text(f"""# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Fixed

### Removed

""")

    content = changelog_path.read_text()

    # Determine entry category from commit message
    msg_category = categorize_by_message(commit_message)

    # Build entries based on staged changes and message
    entries_to_add = {'added': [], 'changed': [], 'fixed': [], 'removed': []}

    # Use commit message as the primary entry
    if msg_category:
        # Clean up commit message (remove conventional commit prefixes)
        clean_msg = re.sub(r'^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?:\s*', '', commit_message)
        entries_to_add[msg_category].append(clean_msg)
    else:
        # Fall back to file-based entries
        if changes['added']:
            summary = summarize_changes(changes['added'])
            entries_to_add['added'].append(f"New files: {summary}")
        if changes['changed']:
            summary = summarize_changes(changes['changed'])
            entries_to_add['changed'].append(f"Updated: {summary}")
        if changes['removed']:
            summary = summarize_changes(changes['removed'])
            entries_to_add['removed'].append(f"Removed: {summary}")

    # Insert entries into the [Unreleased] section
    lines = content.split('\n')
    new_lines = []
    in_unreleased = False
    current_section = None

    for i, line in enumerate(lines):
        new_lines.append(line)

        if line.strip() == '## [Unreleased]':
            in_unreleased = True
            continue

        if in_unreleased:
            # Check for section headers
            if line.strip() == '### Added':
                current_section = 'added'
            elif line.strip() == '### Changed':
                current_section = 'changed'
            elif line.strip() == '### Fixed':
                current_section = 'fixed'
            elif line.strip() == '### Removed':
                current_section = 'removed'
            elif line.startswith('## ['):
                # End of unreleased section
                in_unreleased = False
                current_section = None
            elif current_section and entries_to_add.get(current_section):
                # Check if next line is empty or another entry
                next_line = lines[i + 1] if i + 1 < len(lines) else ''
                if not next_line.strip() or next_line.startswith('###') or next_line.startswith('## ['):
                    # Add entries here
                    for entry in entries_to_add[current_section]:
                        new_lines.append(f"- {entry}")
                    entries_to_add[current_section] = []

    content = '\n'.join(new_lines)
    changelog_path.write_text(content)

    # Stage the updated changelog
    try:
        subprocess.run(
            ['git', 'add', CHANGELOG_FILE],
            capture_output=True,
            cwd=PROJECT_ROOT
        )
    except Exception:
        pass


def main():
    try:
        data = json.load(sys.stdin)

        tool_input = data.get('tool_input', {})
        command = tool_input.get('command', '')

        # Only process git commit commands
        if 'git commit' not in command:
            sys.exit(0)

        # Get staged changes
        changes = get_staged_changes()

        # Skip if no meaningful changes
        if not any(changes.values()):
            sys.exit(0)

        # Extract commit message
        commit_message = extract_commit_message(command)
        if not commit_message:
            commit_message = "Code changes"

        # Update changelog
        update_changelog(commit_message, changes)

    except json.JSONDecodeError:
        pass
    except Exception as e:
        # Don't fail the hook, just log the error
        print(f"Changelog hook error: {e}", file=sys.stderr)

    # Always allow the commit to proceed
    sys.exit(0)


if __name__ == '__main__':
    main()
