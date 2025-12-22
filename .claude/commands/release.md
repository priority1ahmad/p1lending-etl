# Create Release

Create a new version release with changelog.

## Input
$ARGUMENTS = Version number (e.g., 1.2.0)

## Process

### Step 1: Verify Clean State
```bash
git status  # Should be clean
git checkout main
git pull origin main
```

### Step 2: Update Version
```bash
npm version $ARGUMENTS --no-git-tag-version
```

### Step 3: Generate Changelog
Run changelog update script:
```bash
.claude/scripts/update-changelog.sh $ARGUMENTS
```

### Step 4: Review Changes
- Check CHANGELOG.md looks correct
- Verify version in package.json

### Step 5: Commit Release
```bash
git add -A
git commit -m "chore(release): $ARGUMENTS"
git tag -a v$ARGUMENTS -m "Release $ARGUMENTS"
```

### Step 6: Push
```bash
git push origin main
git push origin v$ARGUMENTS
```

### Step 7: Create GitHub Release
Use GitHub MCP to create release:
- Tag: v$ARGUMENTS
- Title: Release $ARGUMENTS
- Body: Copy from CHANGELOG.md
