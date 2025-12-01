#!/usr/bin/env python3
"""
Helper script to convert Google credentials JSON file to .env format

Usage:
    python scripts/convert_google_credentials.py [path_to_google_credentials.json]

This script reads a Google service account credentials JSON file and outputs
a single-line JSON string that can be added to your .env file as GOOGLE_CREDENTIALS_JSON.
"""

import json
import sys
import os
from pathlib import Path


def convert_credentials_to_env_format(credentials_path: str) -> str:
    """Convert Google credentials JSON file to a single-line string for .env"""
    try:
        # Read the JSON file
        with open(credentials_path, 'r', encoding='utf-8') as f:
            credentials = json.load(f)
        
        # Convert to compact JSON string (single line)
        json_string = json.dumps(credentials, separators=(',', ':'))
        
        return json_string
    
    except FileNotFoundError:
        print(f"❌ Error: File not found: {credentials_path}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON file: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


def main():
    # Determine credentials file path
    if len(sys.argv) > 1:
        credentials_path = sys.argv[1]
    else:
        # Try common locations
        script_dir = Path(__file__).parent.parent
        possible_paths = [
            script_dir / "google_credentials.json",
            script_dir / "secrets" / "google_credentials.json",
            Path.cwd() / "google_credentials.json",
            Path.cwd() / "backend" / "google_credentials.json",
        ]
        
        credentials_path = None
        for path in possible_paths:
            if path.exists():
                credentials_path = str(path)
                break
        
        if not credentials_path:
            print("❌ Error: Google credentials file not found.", file=sys.stderr)
            print("\nUsage:", file=sys.stderr)
            print(f"  python {sys.argv[0]} <path_to_google_credentials.json>", file=sys.stderr)
            print("\nOr place google_credentials.json in one of these locations:", file=sys.stderr)
            for path in possible_paths:
                print(f"  - {path}", file=sys.stderr)
            sys.exit(1)
    
    # Convert and output
    json_string = convert_credentials_to_env_format(credentials_path)
    
    print("✅ Successfully converted Google credentials to .env format")
    print("\nAdd this line to your .env file:")
    print("-" * 80)
    print(f"GOOGLE_CREDENTIALS_JSON='{json_string}'")
    print("-" * 80)
    print("\nOr if your shell doesn't require quotes:")
    print(f"GOOGLE_CREDENTIALS_JSON={json_string}")
    print("\n⚠️  Note: Make sure to wrap the value in single quotes if it contains special characters")


if __name__ == "__main__":
    main()

