# OpenCode Custom Commands

This directory contains custom commands for the Pawboard project.

## Available Commands

### `/analyze-issue`

**Purpose**: Analyze a GitHub issue and plan work before implementation.

**Description**: This command fetches a GitHub issue, analyzes its content, explores the codebase for context, asks clarifying questions, and creates a detailed implementation plan. It's designed to be the first step before starting work on any issue.

**Usage**:
```
/analyze-issue <issue-number>
/analyze-issue <github-issue-url>
/analyze-issue 42
/analyze-issue https://github.com/user/repo/issues/42
```

**Workflow**:
1. Fetches the issue from GitHub using `gh` CLI
2. Analyzes the issue content, labels, and comments
3. Searches the codebase for relevant files and patterns
4. Asks you clarifying questions about requirements and design decisions
5. Waits for your answers
6. Creates a detailed implementation plan with affected files and steps
7. Asks for your approval before you proceed with implementation

**Example**:
```
You: /analyze-issue 15

Agent: 
## Issue Analysis: Add drag-and-drop for idea cards

### Summary
User wants to reorder idea cards by dragging them around the board

### Affected Areas
- components/idea-card.tsx
- hooks/use-realtime-cards.ts
- Database schema (possibly add order field)

### Questions & Clarifications Needed

1. Should the card order persist in the database or only be visual?
2. Should card reordering sync in real-time to other users?
3. Do you want snap-to-grid behavior or free positioning?

Please provide your input on the questions above...

You: [Answer questions]

Agent: [Creates detailed implementation plan]
```

---

### `/create-issue`

**Purpose**: Create a GitHub issue from a raw user message.

**Description**: Converts a raw issue description into a properly formatted GitHub issue following project templates.

**Usage**:
```
/create-issue <raw issue description>
/create-issue The app crashes when I delete a card
```

**Workflow**:
1. Analyzes your message to determine issue type (bug, feature, sync, performance)
2. Reads the appropriate issue template from `.github/ISSUE_TEMPLATE/`
3. Extracts information and maps it to template fields
4. Creates the issue using `gh issue create`
5. Returns the issue URL

---

## Command Structure

Commands are Markdown files with:

1. **Front matter** (YAML):
   ```yaml
   ---
   description: Brief description of what the command does
   ---
   ```

2. **Instructions**: Detailed instructions for the AI agent
3. **User input placeholder**: `$ARGUMENTS` - replaced with user's input

## Creating New Commands

1. Create a new `.md` file in this directory
2. Add YAML front matter with description
3. Write instructions for the AI agent
4. Use `$ARGUMENTS` placeholder for user input
5. The command will be available as `/filename` (without .md extension)

## Requirements

- **GitHub CLI** (`gh`): Most commands require `gh` for GitHub operations
  - Install: `brew install gh` (macOS) or see https://cli.github.com
  - Authenticate: `gh auth login`
- Commands can use bash, read files, and call other tools
- Follow project conventions defined in `AGENTS.md`
