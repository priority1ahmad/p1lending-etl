#!/usr/bin/env python3
"""Block edits to sensitive files."""
import json
import sys

PROTECTED_PATTERNS = [
    '.env',
    'secrets/',
    '.pem',
    '.key',
    '.p8',
    'credentials.json',
    'private_key',
]

try:
    data = json.load(sys.stdin)
    file_path = data.get('tool_input', {}).get('file_path', '')

    for pattern in PROTECTED_PATTERNS:
        if pattern in file_path:
            print(f"BLOCKED: Cannot edit protected file: {file_path}", file=sys.stderr)
            sys.exit(2)  # Exit code 2 blocks the tool

except Exception:
    pass

sys.exit(0)
