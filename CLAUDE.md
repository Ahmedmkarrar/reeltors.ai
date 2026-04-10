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