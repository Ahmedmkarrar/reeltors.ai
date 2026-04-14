# Coding Instructions

## General Philosophy

- Never leave conversational comments like `// Here is the function` or `// Step 1`. Code must be self-documenting.
- Only comment complex logic to explain *why* a decision was made (e.g., `// optimizing for large arrays`).
- Prefer `map`, `filter`, `reduce` over `for` loops.
- Avoid deep nesting. Use guard clauses (e.g., `if (!user) return;`) at the top of functions.

## Naming Conventions

- Variables: `camelCase`, must be descriptive (e.g., `isUserLoggedIn` not `flag`, `userProfile` not `data`).
- Components: `PascalCase` (e.g., `UserProfile.tsx`).
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_COUNT = 3`).
- Booleans: must start with `is`, `has`, or `should` (e.g., `isLoading`, `hasError`).

## React & TypeScript

- File structure order: Imports → Interfaces/Types → Component Definition → Hooks → Helper Functions → Exports.
- Group imports: External → Internal → Styles.
- No `any`. Always define an interface (e.g., `interface UserProps { ... }`).
- Destructure props immediately in the function arguments.

## Scalability & Performance

- DRY: if logic is repeated twice, extract it to a custom hook or utility in `src/utils`.
- Remove unused imports.
- Always use `async/await` with `try/catch` for API calls.

## File Management

- Never create `.md` explanation files unless explicitly asked.
- Always clean up temporary files after a refactor.

# very imp

- don't ever try to yourself beside how dare you put your beside as if you coded all stuff there should be no co-auther with claude ever ok???? you get that never

# Deployment & Git Workflow (Non-negotiable)

## Single Source of Truth
GitHub `main` is the only source of truth. If a change is not in GitHub, it does not exist.
There must be zero differences between GitHub main, local main, and Vercel production.

## Before Any Work
Always start from a clean, updated main:
- `git checkout main`
- `git pull origin main`
- Confirm `git status` is clean and `git log` shows no divergence.
If the branch is diverged, merging, or inconsistent — stop and fix the state before continuing.

## Branch Workflow
Every change gets its own branch:
- `git checkout -b <fix-or-feature-name>`
- Make changes only inside this branch.
- `git add <specific files>` → `git commit -m "<clear message>"`
- `git push origin <branch-name>`
- Open a pull request. Merge via GitHub.
After merge: switch back to main, pull, delete the branch locally and remotely.

## Deployment Rules
- All production deployments must originate from a GitHub push to `main`.
- Never run `vercel deploy --prod` for normal work — it bypasses version control.
- Vercel CLI is for debugging or preview only, never the primary deploy path.
- If Vercel shows a state not reflected in GitHub, assume broken workflow and investigate.

## Handling Broken State
If code was deployed directly via Vercel CLI:
- That state is invalid. Recover by resetting local to `origin/main`, re-applying changes cleanly on a branch, committing, and pushing through GitHub.

## Before Any Push
- Confirm correct branch.
- Confirm diff contains only intended changes.
- Confirm no unintended file changes are staged.