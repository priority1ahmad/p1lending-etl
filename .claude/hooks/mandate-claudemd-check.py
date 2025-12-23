#!/usr/bin/env python3
"""
PreImplementation Hook: Mandatory CLAUDE.md Reference & Tool Evaluation

Blocks Edit/Write/Task operations unless Claude demonstrates:
1. Reference to relevant CLAUDE.md section
2. Evaluation of available commands/agents
3. Justification for chosen implementation approach

Exit codes:
  0 - Validation passed, allow operation
  2 - Validation failed, block operation
"""

import sys
import os
import re
from pathlib import Path
from datetime import datetime

# Configuration
CLAUDE_DIR = Path(__file__).parent.parent
CLAUDE_MD = CLAUDE_DIR.parent / "CLAUDE.md"
COMMANDS_DIR = CLAUDE_DIR / "commands"
AGENTS_DIR = CLAUDE_DIR / "agents"
FEEDBACK_LOG = CLAUDE_DIR / "feedback.log"

# Operations that trigger validation
TRIGGER_OPERATIONS = [
    "Edit", "Write", "Task",
    "Bash(.*create.*)", "Bash(.*update.*)", "Bash(.*delete.*)"
]

# Exempted operations (always allowed)
EXEMPT_OPERATIONS = [
    "Read", "Glob", "Grep",
    "Bash(git status)", "Bash(git diff)", "Bash(git log)",
    "Bash(ls)", "Bash(tree)", "Bash(cat)"
]


def log_violation(operation: str, reason: str):
    """Log validation failure to feedback.log"""
    timestamp = datetime.now().isoformat()
    with open(FEEDBACK_LOG, "a") as f:
        f.write(f"{timestamp} | HOOK_VIOLATION | {operation} | {reason}\n")


def is_operation_exempt(operation: str) -> bool:
    """Check if operation is exempt from validation"""
    for exempt in EXEMPT_OPERATIONS:
        if re.match(exempt, operation):
            return True
    return False


def should_trigger_validation(operation: str) -> bool:
    """Check if operation requires CLAUDE.md validation"""
    if is_operation_exempt(operation):
        return False

    for trigger in TRIGGER_OPERATIONS:
        if re.match(trigger, operation):
            return True
    return False


def validate_claudemd_reference(conversation_history: str) -> tuple[bool, str]:
    """
    Validate that Claude referenced a specific CLAUDE.md section

    Returns:
        (is_valid, section_name or error_message)
    """
    # Pattern: Look for explicit CLAUDE.md section references
    patterns = [
        r"(?:referenc(?:ing|ed?)|consult(?:ing|ed?)|check(?:ing|ed?))\s+(?:the\s+)?CLAUDE\.md\s+(?:section\s+)?['\"]?([A-Za-z0-9\s\-&]+)['\"]?",
        r"(?:according to|as per|from)\s+CLAUDE\.md\s+(?:section\s+)?['\"]?([A-Za-z0-9\s\-&]+)['\"]?",
        r"CLAUDE\.md\s+(?:section\s+)?['\"]?([A-Za-z0-9\s\-&]+)['\"]?\s+(?:states|says|specifies|requires)"
    ]

    for pattern in patterns:
        match = re.search(pattern, conversation_history, re.IGNORECASE)
        if match:
            section_name = match.group(1).strip()
            return True, section_name

    return False, "No explicit CLAUDE.md section reference found"


def validate_tool_evaluation(conversation_history: str) -> tuple[bool, str]:
    """
    Validate that Claude evaluated available commands/agents

    Returns:
        (is_valid, tools_considered or error_message)
    """
    # Pattern: Look for mentions of checking commands/agents/rules
    patterns = [
        r"(?:checked|reviewed|evaluated|considered)\s+(?:available\s+)?(?:commands?|slash\s+commands?|\/.+)",
        r"(?:checked|reviewed|evaluated|considered)\s+(?:available\s+)?agents?",
        r"(?:no applicable|no relevant|no suitable)\s+(?:command|agent|slash\s+command)",
        r"(?:using|invoking|running)\s+\/[\w\-]+",  # Actual command invocation
        r"(?:using|launching)\s+(?:the\s+)?(?:Explore|Plan|API\s+Architect|ETL\s+Specialist)\s+agent"
    ]

    for pattern in patterns:
        match = re.search(pattern, conversation_history, re.IGNORECASE)
        if match:
            return True, match.group(0)

    return False, "No evidence of tool evaluation (commands/agents/rules)"


def validate_implementation_decision(conversation_history: str) -> tuple[bool, str]:
    """
    Validate that Claude justified their implementation approach

    Returns:
        (is_valid, justification or error_message)
    """
    # Pattern: Look for explicit decision-making
    patterns = [
        r"(?:I(?:'ll| will| am))\s+(?:use|invoke|run|execute)\s+(?:the\s+)?\/[\w\-]+",  # Command usage
        r"(?:I(?:'ll| will| am))\s+(?:use|launch|run)\s+(?:the\s+)?(?:Explore|Plan)\s+agent",  # Agent usage
        r"(?:no applicable command|directly implement|manual implementation)",  # Direct implementation
        r"(?:instead of|rather than)\s+(?:using a command|invoking)",  # Explicit choice
    ]

    for pattern in patterns:
        match = re.search(pattern, conversation_history, re.IGNORECASE)
        if match:
            return True, match.group(0)

    return False, "No justification for implementation approach found"


def main():
    """
    Main validation logic

    Environment variables available:
      - TOOL_NAME: Tool being called (Edit, Write, Task, Bash, etc.)
      - TOOL_ARGS: Tool arguments (JSON string)
      - CONVERSATION: Recent conversation history
    """
    operation = os.getenv("TOOL_NAME", "Unknown")
    conversation = os.getenv("CONVERSATION", "")

    # Check if operation should trigger validation
    if not should_trigger_validation(operation):
        sys.exit(0)  # Allow operation

    # Perform validation checks
    claudemd_valid, claudemd_result = validate_claudemd_reference(conversation)
    tool_eval_valid, tool_eval_result = validate_tool_evaluation(conversation)
    decision_valid, decision_result = validate_implementation_decision(conversation)

    # Determine validation result
    if claudemd_valid and tool_eval_valid and decision_valid:
        # All checks passed
        sys.exit(0)

    # Build error message
    errors = []
    if not claudemd_valid:
        errors.append(f"❌ CLAUDE.md Reference: {claudemd_result}")
    if not tool_eval_valid:
        errors.append(f"❌ Tool Evaluation: {tool_eval_result}")
    if not decision_valid:
        errors.append(f"❌ Implementation Decision: {decision_result}")

    error_msg = "\n".join(errors)

    # Log violation
    log_violation(operation, error_msg)

    # Block operation
    print("\n" + "="*70)
    print("🚫 CLAUDE CODE ENFORCEMENT HOOK: Operation Blocked")
    print("="*70)
    print("\nBefore implementing, you MUST:")
    print("1. Reference a specific CLAUDE.md section relevant to this task")
    print("2. Evaluate available commands in .claude/commands/")
    print("3. Evaluate available agents in .claude/agents/")
    print("4. Justify your chosen implementation approach")
    print("\nValidation Failures:")
    print(error_msg)
    print("\nPlease revise your approach and try again.")
    print("="*70 + "\n")

    sys.exit(2)  # Block operation


if __name__ == "__main__":
    main()
