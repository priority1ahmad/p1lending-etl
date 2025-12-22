#!/bin/bash
# Check if React components have corresponding Storybook stories

FILE="$1"

# Only check React component files
if [[ ! "$FILE" =~ \.(tsx|jsx)$ ]]; then
    exit 0
fi

# Skip if it's already a story file
if [[ "$FILE" =~ \.stories\.(tsx|jsx)$ ]]; then
    exit 0
fi

# Skip test files
if [[ "$FILE" =~ \.(test|spec)\.(tsx|jsx)$ ]]; then
    exit 0
fi

# Get the base name and directory
BASENAME=$(basename "$FILE" | sed 's/\.\(tsx\|jsx\)$//')
DIRNAME=$(dirname "$FILE")

# Check for corresponding story file
STORY_FILE_TSX="$DIRNAME/$BASENAME.stories.tsx"
STORY_FILE_JSX="$DIRNAME/$BASENAME.stories.jsx"
STORIES_DIR_TSX="stories/$BASENAME.stories.tsx"
STORIES_DIR_JSX="stories/$BASENAME.stories.jsx"

if [[ ! -f "$STORY_FILE_TSX" && ! -f "$STORY_FILE_JSX" && \
      ! -f "$STORIES_DIR_TSX" && ! -f "$STORIES_DIR_JSX" ]]; then
    echo "WARNING: Component '$BASENAME' has no Storybook story."
    echo "Please create: $STORY_FILE_TSX"
    echo "Remember: ALWAYS create stories BEFORE or WITH components."
fi

exit 0
