# Age of Commanders - Task Completion Checklist

## When a Task is Completed

Follow these steps to ensure code quality before marking a task as done:

### 1. Linting
```bash
pnpm lint
```
- Ensure no ESLint errors
- Fix any warnings if reasonable
- TypeScript errors must be resolved

### 2. Type Checking
```bash
pnpm build
```
- The build command runs `tsc -b` before building
- This catches TypeScript errors
- Ensure build completes successfully

### 3. Manual Testing
- Run the development server: `pnpm dev`
- Test the feature in the browser
- Verify no console errors
- Check that UI behaves as expected
- Test edge cases if applicable

### 4. Code Review Checklist

**React Components**:
- [ ] useEffect cleanup functions present for side effects
- [ ] Dependencies arrays are complete (no ESLint warnings)
- [ ] No unnecessary re-renders

**PixiJS Code**:
- [ ] All graphics added to `camera` Container, not `app.stage`
- [ ] Resources destroyed in cleanup
- [ ] Event listeners removed on unmount

**State Management**:
- [ ] Zustand actions update state immutably
- [ ] Selectors used to avoid unnecessary re-renders
- [ ] No direct state mutations

**LLM Integration**:
- [ ] API calls have error handling
- [ ] Fallback responses provided
- [ ] Concurrency limits respected (max 3 calls)
- [ ] Caching implemented where appropriate

**Styling**:
- [ ] Tailwind classes used appropriately
- [ ] No conflicting styles
- [ ] Responsive design considered

### 5. Git Workflow

If changes are ready to commit:
```bash
git status
git add .
git commit -m "Descriptive commit message"
```

## Testing Notes

**Important**: This project currently has no automated test suite.

Manual testing in the browser is the primary verification method.

## Performance Considerations

- [ ] No memory leaks (check DevTools)
- [ ] PixiJS rendering performant on 26x26 grid
- [ ] LLM calls only during teach phase, not execution
- [ ] Cached interpretations reduce redundant API calls

## Documentation

- [ ] CLAUDE.md updated if architecture changes
- [ ] Comments added for complex logic
- [ ] README.md updated if user-facing changes

## Pre-Demo Checklist

For hackathon demo preparation:
- [ ] All LLM responses cached (works offline)
- [ ] No crashes during typical gameplay flow
- [ ] Comedy moments are prominent
- [ ] API key modal handles gracefully if key missing
