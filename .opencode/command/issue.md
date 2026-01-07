---
description: Create a GitHub issue from a raw user message
---

You are tasked with creating a GitHub issue for the Pawboard project. The user has provided a raw issue message that needs to be converted into a properly formatted GitHub issue following our templates.

## User's Raw Issue Message

$ARGUMENTS

## Instructions

1. **Analyze the user's message** to determine which issue template is most appropriate:
   - **Bug Report** (`bug`): For bugs, errors, broken functionality, unexpected behavior
   - **Feature Request** (`feature`): For new features, enhancements, improvements
   - **Real-time Sync Issue** (`sync`): For issues with real-time collaboration, cursors not showing, cards not syncing between users
   - **Performance Issue** (`perf`): For slowness, lag, high CPU/memory usage, stuttering

2. **Read the appropriate template** from `.github/ISSUE_TEMPLATE/` to understand the required fields:
   - `bug_report.yml` for bugs
   - `feature_request.yml` for features
   - `realtime_sync_issue.yml` for sync issues
   - `performance_issue.yml` for performance

3. **Extract information** from the user's raw message and map it to the template fields. For any required fields not provided by the user, make reasonable inferences or use sensible defaults.

4. **Create the issue** using the GitHub CLI with the following format:

```bash
gh issue create \
  --title "[Type]: Descriptive title" \
  --label "label1,label2" \
  --body "$(cat <<'EOF'
## Field Name
Value

## Another Field
Value
EOF
)"
```

### Label Mapping
- Bug Report: `bug,triage` + relevant area label if obvious
- Feature Request: `enhancement,triage`
- Real-time Sync: `bug,realtime,triage`
- Performance: `bug,performance,triage`

### Title Prefixes
- Bug: `[Bug]: `
- Feature: `[Feature]: `
- Sync: `[Sync]: `
- Performance: `[Performance]: `

5. **After creating the issue**, report the issue URL back to the user.

## Important Notes

- Be thorough in extracting details from the user's message
- If the user's message is vague, still create the issue but note which fields need more information
- Use "Not specified" or "Unknown" for optional fields that weren't mentioned
- Keep the issue body well-formatted with markdown
- Do NOT ask the user for more information - create the best issue you can with what's provided
