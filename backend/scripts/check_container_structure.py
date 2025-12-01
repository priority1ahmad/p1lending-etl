"""
Diagnostic script to check container file structure
Run this to see where files are located in the container
"""

import os
import sys
from pathlib import Path

print("=" * 70)
print("  CONTAINER STRUCTURE DIAGNOSTIC")
print("=" * 70)
print()

print(f"Current working directory: {os.getcwd()}")
print(f"Python path: {sys.executable}")
print(f"PYTHONPATH: {os.environ.get('PYTHONPATH', 'Not set')}")
print()

# Check common script locations
possible_script_paths = [
    "/app/scripts",
    "/app/backend/scripts",
    "./scripts",
    "scripts",
    os.path.join(os.getcwd(), "scripts"),
]

print("Checking for scripts directory:")
for path in possible_script_paths:
    full_path = Path(path)
    exists = full_path.exists()
    is_dir = full_path.is_dir() if exists else False
    status = "✅ EXISTS" if exists else "❌ NOT FOUND"
    print(f"  {path:40} {status}")
    if exists and is_dir:
        try:
            files = list(full_path.glob("*.py"))
            print(f"    Found {len(files)} Python files")
            for f in files[:5]:  # Show first 5
                print(f"      - {f.name}")
            if len(files) > 5:
                print(f"      ... and {len(files) - 5} more")
        except Exception as e:
            print(f"    Error listing files: {e}")
print()

# Check for specific test scripts
test_scripts = [
    "test_litigator_list.py",
    "test_dnc_list.py",
    "test_both_lists.py",
    "migrate_sql_scripts.py",
    "create_initial_user.py",
]

print("Looking for specific scripts:")
for script_name in test_scripts:
    found_paths = []
    for base_path in possible_script_paths:
        test_path = Path(base_path) / script_name
        if test_path.exists():
            found_paths.append(str(test_path))
    
    if found_paths:
        print(f"  ✅ {script_name}")
        for path in found_paths:
            print(f"     Found at: {path}")
    else:
        print(f"  ❌ {script_name} - NOT FOUND")
print()

# List /app directory structure
print("Contents of /app directory:")
if Path("/app").exists():
    try:
        items = list(Path("/app").iterdir())
        for item in sorted(items):
            item_type = "DIR" if item.is_dir() else "FILE"
            print(f"  {item_type:4} {item.name}")
    except Exception as e:
        print(f"  Error listing /app: {e}")
else:
    print("  /app does not exist")
print()

print("=" * 70)
print("  DIAGNOSTIC COMPLETE")
print("=" * 70)

