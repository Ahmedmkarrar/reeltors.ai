# Agent Notes

## 1. General Philosophy

No Conversational Comments: Never leave comments like '// Here is the function', '// Step 1'. Code must be self-documenting.

"Why" not "What": Only comment complex logic to explain why a decision was made (e.g., '// optimizing for large arrays').

Functional over Imperative: Prefer map, filter, reduce over for loops.

Early Returns: Avoid deep nesting. Use guard clauses (e.g., if (!user) return;) at the top of functions.

## 2. Naming Conventions

Variables: camelCase. Must be descriptive (e.g., isUserLoggedIn instead of flag, userProfile instead of data).

Components: PascalCase (e.g., UserProfile.tsx).

Constants: UPPER_SNAKE_CASE (e.g., MAX_RETRY_COUNT = 3).

Booleans: Must start with is, has, or should (e.g., isLoading, hasError).

## 3. React & TypeScript Best Practices

Structure:

Imports (Grouped: External -> Internal -> Styles)

Interfaces/Types

Component Definition

Hooks (grouped at top)

Helper Functions (inside or outside component based on dependency)

Exports

Typing: No any. Always define an interface (e.g., interface UserProps { ... }).

Props: Destructure props immediately in the function arguments.

## 4. Scalability & Performance

DRY Principle: If logic is repeated twice, extract it to a custom hook or utility function in src/utils.

Imports: Remove unused imports automatically.

Async/Await: Always use async/await with try/catch blocks for API calls.

## 5. File Management

Never create .md explanation files unless explicitly asked.

Always clean up temporary files after a refactor.
