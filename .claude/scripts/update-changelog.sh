#!/bin/bash
# Update CHANGELOG.md with new version

VERSION="$1"
DATE=$(date +%Y-%m-%d)

if [[ -z "$VERSION" ]]; then
    echo "Usage: update-changelog.sh <version>"
    exit 1
fi

# Get commits since last tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [[ -n "$LAST_TAG" ]]; then
    COMMITS=$(git log "$LAST_TAG"..HEAD --pretty=format:"%s" 2>/dev/null)
else
    COMMITS=$(git log --pretty=format:"%s" 2>/dev/null)
fi

# Categorize commits
FEATURES=$(echo "$COMMITS" | grep "^feat" | sed 's/^feat[:(]//' | sed 's/):/:/')
FIXES=$(echo "$COMMITS" | grep "^fix" | sed 's/^fix[:(]//' | sed 's/):/:/')
DOCS=$(echo "$COMMITS" | grep "^docs" | sed 's/^docs[:(]//' | sed 's/):/:/')

# Generate new section
NEW_SECTION="## [$VERSION] - $DATE

### Added
$FEATURES

### Fixed
$FIXES

### Changed
$DOCS
"

# Insert after [Unreleased] section
# This is a simplified version - may need adjustment
echo "Generated changelog section:"
echo "$NEW_SECTION"
echo ""
echo "Please manually update CHANGELOG.md with this content"
