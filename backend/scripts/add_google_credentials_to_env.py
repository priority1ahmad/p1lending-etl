#!/usr/bin/env python3
"""
Script to add Google credentials JSON to .env file

Usage:
    python backend/scripts/add_google_credentials_to_env.py [path_to_google_credentials.json] [path_to_env_file]
"""

import json
import sys
import os
from pathlib import Path


def add_credentials_to_env(credentials_path: str, env_path: str = None):
    """Add Google credentials JSON to .env file"""
    
    # Read credentials file
    try:
        with open(credentials_path, 'r', encoding='utf-8') as f:
            credentials = json.load(f)
    except FileNotFoundError:
        print(f"Error: File not found: {credentials_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON file: {e}")
        sys.exit(1)
    
    # Convert to single-line JSON
    json_string = json.dumps(credentials, separators=(',', ':'))
    
    # Determine .env file path
    if env_path is None:
        # Try to find .env in common locations
        script_dir = Path(__file__).parent.parent.parent
        possible_env_paths = [
            script_dir / ".env",
            script_dir.parent / ".env",
            Path.cwd() / ".env",
        ]
        
        env_path = None
        for path in possible_env_paths:
            if path.exists():
                env_path = path
                break
        
        if env_path is None:
            # Create .env from env.example if it exists
            env_example = script_dir.parent / "env.example"
            if env_example.exists():
                env_path = script_dir.parent / ".env"
                print(f"Creating .env from env.example...")
                import shutil
                shutil.copy(env_example, env_path)
            else:
                env_path = script_dir.parent / ".env"
                print(f"📝 Creating new .env file...")
    
    env_path = Path(env_path)
    
    # Read existing .env file
    env_content = ""
    if env_path.exists():
        with open(env_path, 'r', encoding='utf-8') as f:
            env_content = f.read()
    else:
        # Create from env.example if it exists
        env_example = env_path.parent / "env.example"
        if env_example.exists():
            with open(env_example, 'r', encoding='utf-8') as f:
                env_content = f.read()
            print(f"Created .env from env.example")
        else:
            env_content = "# Environment Configuration\n"
    
    # Update or add GOOGLE_CREDENTIALS_JSON
    lines = env_content.split('\n')
    updated = False
    new_lines = []
    
    for line in lines:
        if line.strip().startswith('GOOGLE_CREDENTIALS_JSON='):
            # Update existing line
            new_lines.append(f'GOOGLE_CREDENTIALS_JSON={json_string}')
            updated = True
        else:
            new_lines.append(line)
    
    if not updated:
        # Add new line after GOOGLE_SHEET_ID or in GOOGLE SHEETS section
        insert_index = len(new_lines)
        for i, line in enumerate(new_lines):
            if 'GOOGLE_SHEET_ID=' in line:
                insert_index = i + 1
                break
            elif '# GOOGLE SHEETS' in line.upper():
                # Find the next empty line or GOOGLE_CREDENTIALS_JSON line
                for j in range(i + 1, len(new_lines)):
                    if new_lines[j].strip().startswith('GOOGLE_CREDENTIALS_JSON='):
                        insert_index = j
                        break
                    elif new_lines[j].strip() == '' or new_lines[j].strip().startswith('#'):
                        insert_index = j
                        break
                break
        
        new_lines.insert(insert_index, f'GOOGLE_CREDENTIALS_JSON={json_string}')
    
    # Write back to .env
    with open(env_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))
    
    print(f"Successfully added Google credentials to: {env_path}")
    print(f"\nThe credentials are now stored in your .env file.")
    print(f"The backend will automatically use these credentials from the environment variable.")
    print(f"\nRemember: .env files should NEVER be committed to version control!")


def main():
    if len(sys.argv) < 2:
        print("Usage: python add_google_credentials_to_env.py <path_to_google_credentials.json> [path_to_env_file]")
        print("\nExample:")
        print("  python backend/scripts/add_google_credentials_to_env.py old_app/google_credentials.json")
        sys.exit(1)
    
    credentials_path = sys.argv[1]
    env_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    add_credentials_to_env(credentials_path, env_path)


if __name__ == "__main__":
    main()

