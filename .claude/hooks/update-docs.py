#!/usr/bin/env python3
"""
AI-Enhanced Documentation Hook

Automatically updates DOCUMENTATION.md with AI-generated summaries
of code changes after each Edit/Write operation.
"""
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path

# File extensions to skip (non-code files)
SKIP_EXTENSIONS = {
    '.md', '.txt', '.rst',  # Documentation
    '.json', '.yaml', '.yml', '.toml',  # Config
    '.lock', '.sum',  # Lock files
    '.env',  # Environment
    '.gitignore', '.dockerignore',  # Ignore files
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',  # Images
    '.woff', '.woff2', '.ttf', '.eot',  # Fonts
}

# Paths to skip
SKIP_PATHS = {
    'node_modules/',
    'venv/',
    '__pycache__/',
    '.git/',
    'dist/',
    'build/',
    '.claude/plans/',
}

DOCS_FILE = 'DOCUMENTATION.md'
PROJECT_ROOT = Path(__file__).parent.parent.parent


def should_skip_file(file_path: str) -> bool:
    """Check if file should be skipped for documentation."""
    path = Path(file_path)

    # Skip by extension
    if path.suffix.lower() in SKIP_EXTENSIONS:
        return True

    # Skip by path patterns
    for skip_path in SKIP_PATHS:
        if skip_path in file_path:
            return True

    return False


def get_relative_path(file_path: str) -> str:
    """Get path relative to project root."""
    try:
        return str(Path(file_path).relative_to(PROJECT_ROOT))
    except ValueError:
        return file_path


def call_claude_api(file_path: str, old_string: str, new_string: str) -> str | None:
    """Call Claude API to analyze the change."""
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        return None

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=api_key)

        # Truncate large diffs to avoid token limits
        max_chars = 2000
        if len(old_string) > max_chars:
            old_string = old_string[:max_chars] + '\n... (truncated)'
        if len(new_string) > max_chars:
            new_string = new_string[:max_chars] + '\n... (truncated)'

        prompt = f"""Analyze this code change and provide a brief documentation entry.

File: {file_path}

OLD CODE:
```
{old_string}
```

NEW CODE:
```
{new_string}
```

Provide a concise 1-2 sentence description of:
1. What changed
2. Why this change was likely made (infer from context)

Format your response as a single line starting with a dash, like:
- Brief description of the change and its purpose

Be specific and technical but concise."""

        message = client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}]
        )

        response = message.content[0].text.strip()
        # Ensure it starts with a dash
        if not response.startswith('-'):
            response = f"- {response}"
        return response

    except ImportError:
        return None
    except Exception as e:
        # Log error but don't fail the hook
        print(f"Claude API error: {e}", file=sys.stderr)
        return None


def update_documentation(file_path: str, change_description: str):
    """Update DOCUMENTATION.md with the new change entry."""
    docs_path = PROJECT_ROOT / DOCS_FILE
    rel_path = get_relative_path(file_path)
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')

    # Create docs file if it doesn't exist
    if not docs_path.exists():
        docs_path.write_text(f"""# Project Documentation

> AI-generated documentation built incrementally from code changes.
> Last updated: {timestamp}

## Architecture Overview

<!-- Add manual architecture documentation here -->

---

## Component Registry

""")

    content = docs_path.read_text()

    # Update the "Last updated" timestamp
    content = re.sub(
        r'> Last updated:.*',
        f'> Last updated: {timestamp}',
        content
    )

    # Check if this file already has a section
    section_header = f'### {rel_path}'

    if section_header in content:
        # Append to existing section's change history
        # Find the section and add the new entry
        lines = content.split('\n')
        new_lines = []
        in_section = False
        entry_added = False

        for i, line in enumerate(lines):
            new_lines.append(line)
            if line.strip() == section_header:
                in_section = True
            elif in_section and not entry_added:
                # Look for existing entries or add after header
                if line.startswith('- ['):
                    # Insert before existing entries
                    new_lines.insert(-1, f"- [{timestamp}] {change_description.lstrip('- ')}")
                    entry_added = True
                    in_section = False
                elif line.startswith('###') or line.strip() == '---':
                    # New section started, add entry before
                    new_lines.insert(-1, f"- [{timestamp}] {change_description.lstrip('- ')}")
                    new_lines.insert(-1, '')
                    entry_added = True
                    in_section = False

        if in_section and not entry_added:
            # Section was at end of file
            new_lines.append(f"- [{timestamp}] {change_description.lstrip('- ')}")

        content = '\n'.join(new_lines)
    else:
        # Add new section at the end
        new_section = f"""
{section_header}
- [{timestamp}] {change_description.lstrip('- ')}
"""
        content = content.rstrip() + '\n' + new_section

    docs_path.write_text(content)


def main():
    try:
        data = json.load(sys.stdin)

        tool_input = data.get('tool_input', {})
        file_path = tool_input.get('file_path', '')

        if not file_path:
            sys.exit(0)

        # Check if we should skip this file
        if should_skip_file(file_path):
            sys.exit(0)

        # Get change details
        old_string = tool_input.get('old_string', '')
        new_string = tool_input.get('new_string', '')
        content = tool_input.get('content', '')  # For Write tool

        # For Write tool, we don't have old_string
        if content and not new_string:
            new_string = content[:500]  # Just use beginning for context
            old_string = '(new file or full rewrite)'

        # Try to get AI-enhanced description
        ai_description = call_claude_api(file_path, old_string, new_string)

        if ai_description:
            change_description = ai_description
        else:
            # Fallback to simple logging
            rel_path = get_relative_path(file_path)
            change_description = f"- Updated {rel_path}"

        # Update the documentation
        update_documentation(file_path, change_description)

    except json.JSONDecodeError:
        pass
    except Exception as e:
        # Don't fail the hook, just log the error
        print(f"Documentation hook error: {e}", file=sys.stderr)

    sys.exit(0)


if __name__ == '__main__':
    main()
