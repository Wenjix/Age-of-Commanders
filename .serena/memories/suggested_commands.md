# Age of Commanders - Suggested Commands

## Package Management

This project uses **pnpm** as the package manager.

## Development Commands

### Setup
```bash
pnpm install
```

### Development Server
```bash
pnpm dev
```
Starts the Vite development server with hot module replacement.

### Production Build
```bash
pnpm build
```
Runs TypeScript compiler (`tsc -b`) followed by Vite production build.

### Linting
```bash
pnpm lint
```
Runs ESLint on the codebase.

### Preview Production Build
```bash
pnpm preview
```
Preview the production build locally.

## Testing

**Note**: Currently no test framework is configured in this project.

## Git Commands

Standard git commands work as expected on macOS (Darwin).

```bash
git status
git add .
git commit -m "message"
git push
```

## System-Specific Notes (Darwin/macOS)

All standard Unix utilities work on Darwin:
- `ls`, `cd`, `grep`, `find`, `cat`, etc.
- No special adaptations needed for macOS
