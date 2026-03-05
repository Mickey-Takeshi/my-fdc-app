# Claude MAX Multi-Account Setup Guide

Reference document for managing multiple Claude Code accounts on a single machine using shell aliases.

---

## Overview

When working with multiple Claude MAX subscriptions (e.g., personal and organizational accounts), you can use shell aliases to switch between them without logging out and back in.

## Setup

### 1. Create separate config directories

Each Claude Code account needs its own configuration directory:

```bash
mkdir -p ~/.config/claude-code/account1
mkdir -p ~/.config/claude-code/account2
```

### 2. Add aliases to shell profile

Add the following to your `~/.zshrc` (or `~/.bashrc`):

```bash
# Claude Code multi-account aliases
alias c1='CLAUDE_CONFIG_DIR=~/.config/claude-code/account1 claude'
alias c2='CLAUDE_CONFIG_DIR=~/.config/claude-code/account2 claude'
```

Reload your shell:

```bash
source ~/.zshrc
```

### 3. Authenticate each account

```bash
# Login with first account
c1
# Follow the login prompts, then exit

# Login with second account
c2
# Follow the login prompts, then exit
```

## Usage

```bash
# Use account 1
c1

# Use account 2
c2

# Use default (system) account
claude
```

## Tips

- Each alias maintains its own session, conversation history, and authentication state
- You can run both accounts simultaneously in separate terminal windows
- The `CLAUDE_CONFIG_DIR` environment variable controls which config directory Claude Code uses
- This approach works with any number of accounts (c1, c2, c3, etc.)

## Naming Convention

Choose alias names that make sense for your use case:

```bash
# By purpose
alias c-personal='CLAUDE_CONFIG_DIR=~/.config/claude-code/personal claude'
alias c-work='CLAUDE_CONFIG_DIR=~/.config/claude-code/work claude'

# By project
alias c-fdc='CLAUDE_CONFIG_DIR=~/.config/claude-code/fdc claude'
alias c-other='CLAUDE_CONFIG_DIR=~/.config/claude-code/other claude'
```

---

**Last Updated**: 2026-03-05
