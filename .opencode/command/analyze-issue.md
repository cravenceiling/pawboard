---
description: Analyze a GitHub issue and plan work before implementation
---

You are tasked with analyzing a GitHub issue for the Pawboard project to understand the requirements, gather context, and create a work plan. This command is the first step before implementing any changes - DO NOT fix the issue directly.

## User's Input

$ARGUMENTS

## Instructions

### 1. Fetch the GitHub Issue

Parse the user's input to extract the issue number or URL:
- If a number is provided (e.g., "42"), fetch issue #42
- If a URL is provided, extract the issue number from it
- Use the GitHub CLI to fetch the issue:

```bash
gh issue view <issue-number> --json number,title,body,labels,author,createdAt,updatedAt,comments
```

### 2. Analyze the Issue Content Critically

Read and analyze with a critical eye:
- **Title and description**: Understand what the issue is requesting
- **Issue type**: Determine if it's a bug, feature, performance issue, or sync issue based on labels
- **Labels**: Check for relevant labels (bug, enhancement, realtime, performance, UI, database, etc.)
- **Comments**: Review any discussion or clarifications in the comments
- **Context**: Identify which parts of the codebase are likely affected

**CRITICAL ANALYSIS - Do not assume the issue is always correct or well-intentioned:**

For **Bug Reports**:
- Is this actually a bug or expected behavior?
- Is the issue reproducible with the provided steps?
- Could this be a user error or misunderstanding of the feature?
- Is the reported behavior actually by design?

For **Feature Requests**:
- Does this feature align with the project's core purpose (real-time collaborative ideation board)?
- Is this solving a real problem or adding unnecessary complexity?
- Does it conflict with existing features or the project's design philosophy?
- Is the scope reasonable or too broad/vague?
- Would this feature benefit most users or just the requester?
- Are there simpler alternatives that achieve the same goal?
- Does it introduce significant maintenance burden or technical debt?

For **Performance Issues**:
- Is the performance issue verified or just perceived?
- Is the scale/usage pattern realistic?
- Are there legitimate reasons for the current performance characteristics?

For **All Issues**:
- Is the issue author being reasonable in their expectations?
- Are there hidden implications or edge cases not mentioned?
- Does the issue request violate any project principles or constraints?

### 3. Search the Codebase for Context

Based on the issue analysis, search the codebase to understand:
- **Relevant files**: Find files that need to be modified
- **Related components**: Identify React components, hooks, or utilities involved
- **Database schema**: Check if database changes are needed
- **Existing patterns**: Look for similar implementations in the codebase

Use the Task tool with the explore agent for thorough codebase exploration.

### 4. Identify Unknowns and Ask Critical Questions

Create a list of questions to ask the user about:
- **Unclear requirements**: Any ambiguous or missing details in the issue
- **Design decisions**: UI/UX choices, behavior preferences, edge cases
- **Scope clarification**: What should be included or excluded
- **Implementation approach**: If multiple approaches are possible, which one to take
- **Additional context**: Any background information that would help
- **Critical evaluation**: Whether this issue should be implemented at all, and if so, with what modifications
- **Alternative solutions**: Are there simpler or better approaches than what was requested?

Present these questions to the user using clear, numbered format.

**Important**: If you have concerns about the validity, scope, or appropriateness of the issue, clearly communicate them to the user. It's acceptable to recommend:
- Closing the issue as "won't fix" or "not planned"
- Significantly modifying the scope or approach
- Implementing an alternative solution
- Requesting more justification before proceeding

### 5. Present Analysis and Ask for User Input

Present your findings and questions to the user:

```
## Issue Analysis: [Issue Title]

### Summary
[Brief summary of what the issue is requesting]

### Issue Type
[Bug / Feature Request / Performance / Sync Issue]

### Critical Assessment

**Validity**: [Is this a legitimate issue/request?]
**Alignment**: [Does it align with project goals?]
**Concerns**: [Any red flags or concerns about this issue?]
**Recommendation**: [Proceed / Modify scope / Close / Need more info]

### Affected Areas
- Component/file 1
- Component/file 2
- Database schema (if applicable)
- API routes (if applicable)

### Questions & Clarifications Needed

1. [Question about requirement 1]
2. [Question about design decision]
3. [Question about scope]
4. [Critical question about necessity/approach]

### Alternative Approaches (if applicable)
[If you see a better way to solve the underlying problem]

### Additional Context from Comments
[Summary of any relevant discussion in issue comments]

---

**My Assessment**: [Your honest opinion on whether and how this should be implemented]

Please provide your input on the questions above and whether you want to proceed with this issue.
```

### 6. Wait for User Response

DO NOT proceed with implementation planning until the user has answered the questions and provided clarifications.

### 7. Create Implementation Plan (Only If Approved)

Only create an implementation plan if:
- The user agrees the issue should be implemented
- Any concerns have been addressed
- The scope and approach are agreed upon

Once the user has provided answers and approval, create a detailed work plan:

```
## Implementation Plan: [Issue Title]

### Approach
[Describe the chosen approach based on user input]

### Files to Modify
1. `path/to/file1.ts` - [what changes]
2. `path/to/file2.tsx` - [what changes]

### Files to Create (if any)
1. `path/to/new-file.ts` - [purpose]

### Steps
1. [Step 1 description]
2. [Step 2 description]
3. [Step 3 description]

### Testing Considerations
- [Test case 1]
- [Test case 2]

### Potential Risks
- [Risk 1 and mitigation]
- [Risk 2 and mitigation]

### Database Changes (if applicable)
- [Schema changes needed]
- [Migration steps]

Ready to proceed with implementation? (yes/no)
```

## Important Notes

- **DO NOT implement the fix** - this command is for analysis and planning only
- **Be critically minded** - Not all issues are valid, well-intentioned, or align with project goals
- **Challenge assumptions** - Question whether the issue should be implemented as stated
- **Protect project scope** - Feature creep is real; push back on unnecessary complexity
- **Be thorough** in understanding the issue before asking questions
- **Ask specific questions** - avoid generic "what do you think?" questions
- **Reference the codebase** - show that you've explored relevant files
- **Consider the tech stack** - Align questions with Next.js 16, React 19, Supabase, Drizzle patterns
- **Review AGENTS.md** - Follow project conventions in your analysis and plan
- **Check for related issues** - Use `gh issue list --label <relevant-label>` to find similar issues
- **Look at project structure** - Understand where new files should be created based on existing patterns
- **Provide honest assessment** - It's better to close an issue than implement something harmful
- **Suggest alternatives** - If the issue has merit but wrong approach, propose better solutions

### Red Flags to Watch For

- Feature requests that fundamentally change the project's purpose
- Overly complex solutions to simple problems
- Features that benefit only one specific use case
- Requests that ignore existing functionality
- Vague or poorly thought-out proposals
- Features that would require significant ongoing maintenance
- Anything that compromises performance, security, or user experience
- Requests that violate the project's design principles or cat theme

## Example Workflows

### Workflow A: Valid Issue
1. User: `/analyze-issue 42`
2. You: Fetch issue #42, critically analyze content, search codebase
3. You: Present summary, critical assessment (looks good), ask 3-5 specific questions
4. User: Answers questions and confirms they want to proceed
5. You: Create detailed implementation plan
6. User: Approves plan
7. User can then start implementation (separate task)

### Workflow B: Problematic Feature Request
1. User: `/analyze-issue 87`
2. You: Fetch issue #87, critically analyze
3. You: Present summary with critical assessment highlighting concerns:
   - Feature adds significant complexity for minimal benefit
   - Conflicts with project's core purpose
   - Better alternatives exist
   - **Recommendation**: Close as "won't fix" or implement alternative X instead
4. User: Reviews your assessment
5. User: Either agrees to close it, agrees to alternative, or provides justification to proceed anyway
6. Only create implementation plan if user confirms they want to proceed

### Workflow C: Bug That Isn't a Bug
1. User: `/analyze-issue 23`
2. You: Fetch issue #23, analyze
3. You: Present summary with assessment:
   - Reported behavior is actually by design
   - User misunderstood how feature works
   - **Recommendation**: Close with explanation, possibly improve documentation
4. User: Agrees and closes the issue

## Error Handling

- If issue number is invalid, ask user to provide a valid issue number or URL
- If GitHub CLI is not authenticated, provide instructions to run `gh auth login`
- If issue is closed, note this and ask if user still wants to analyze it
