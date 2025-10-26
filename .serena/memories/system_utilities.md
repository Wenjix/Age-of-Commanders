# Age of Commanders - System Utilities (Darwin/macOS)

## Operating System

This project is developed on **Darwin** (macOS).

## Standard Unix Commands

All standard Unix utilities work without modification on Darwin:

### File Operations
- `ls` - List directory contents
- `cd` - Change directory
- `cat` - Display file contents
- `cp` - Copy files
- `mv` - Move/rename files
- `rm` - Remove files
- `mkdir` - Create directories
- `touch` - Create empty files

### Search & Text Processing
- `grep` - Search text patterns
- `find` - Find files
- `sed` - Stream editor
- `awk` - Text processing
- `cut` - Column extraction
- `sort` - Sort lines
- `uniq` - Remove duplicates

### File Inspection
- `head` - Show beginning of file
- `tail` - Show end of file
- `less` / `more` - Page through files
- `wc` - Word/line count

### Process Management
- `ps` - Process status
- `kill` - Terminate processes
- `top` / `htop` - Process monitoring

### Network
- `curl` - Transfer data from URLs
- `ping` - Test network connectivity
- `netstat` - Network statistics

## Git Commands

Standard git commands work identically on Darwin:

```bash
git status
git add <file>
git commit -m "message"
git push
git pull
git checkout <branch>
git branch
git log
git diff
```

## Package Manager (pnpm)

Node.js package manager used for this project:

```bash
pnpm install        # Install dependencies
pnpm add <package>  # Add new package
pnpm remove <pkg>   # Remove package
pnpm update         # Update packages
```

## Node.js/NPM

Node.js runtime and npm are available:

```bash
node --version      # Check Node version
npm --version       # Check npm version
pnpm --version      # Check pnpm version
```

## Darwin-Specific Notes

### Case Sensitivity
- By default, macOS filesystems are case-insensitive
- This can differ from Linux servers (case-sensitive)
- Be consistent with file naming

### Line Endings
- Darwin uses Unix line endings (LF: `\n`)
- Windows uses CRLF (`\r\n`)
- Git should be configured to handle this automatically

### Clipboard
- `pbcopy` - Copy to clipboard
- `pbpaste` - Paste from clipboard

Example:
```bash
cat file.txt | pbcopy   # Copy file contents to clipboard
pbpaste > file.txt      # Paste clipboard to file
```

### Open Files/URLs
```bash
open file.txt           # Open in default editor
open -a "VSCode" .      # Open current dir in VS Code
open https://google.com # Open URL in browser
```

## Shell Environment

Default shell on modern macOS is **zsh**.

Common environment variables:
- `$HOME` - User home directory
- `$PATH` - Executable search path
- `$PWD` - Current working directory

## Development Tools

### Homebrew (if installed)
macOS package manager for development tools:

```bash
brew install <package>
brew update
brew upgrade
```

### Terminal
- Terminal.app - Default terminal
- iTerm2 - Popular alternative
- VS Code integrated terminal

## File Paths

- Home directory: `/Users/<username>`
- Applications: `/Applications`
- Temp files: `/tmp`
- Project workspace: `/Users/wenjiefu/Documents/GitHub/Age-of-Commanders`

## No Special Adaptations Needed

For this project, standard Unix commands work identically to Linux. No Darwin-specific workarounds are required.
