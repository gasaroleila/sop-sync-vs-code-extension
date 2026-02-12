# SopSync

SopSync turns AI-generated instructions into structured, reusable workflows directly inside VS Code.  
It allows you to save refined Claude outputs as standardized Markdown documents and automatically sync project workflow files into your active Claude context.

---

## Features

### 1. Structured Workflow Generator
SopSync converts simple user instructions into fully structured workflow documents using a standardized template.

Generated documents include:

- **Metadata** (title, category, versioning, timestamps)  
- **Purpose**  
- **When to Use**  
- **Required Input**  
- **Step-by-Step Instructions**  
- **Output Format**  
- **Notes**  

This transforms one-off Claude prompts into reusable operational knowledge.

---

### 2. Auto-Sync Workflow Folder into Claude Context
SopSync automatically reads Markdown files inside your project’s `/sops` (or configurable) folder and syncs them into a central `claude.md` file.

This means:

- Your structured workflows are always available to Claude  
- You don’t need to manually paste instructions  
- Claude operates with persistent project memory  

SopSync bridges structured documentation and AI execution.

---

### 3. AI-Refined Template Filling (Phase 2 Feature)
Instead of manually filling template sections, SopSync sends the basic instruction to Claude and:

- Expands the idea  
- Fills in all structured sections  
- Returns a complete, refined Markdown workflow  

This ensures consistency and higher-quality SOP documentation.

---

## Requirements
- VS Code (latest stable recommended)  
- Claude Code extension installed  
- A project workspace folder open  

**Optional:**  
- A `/sops` folder in your workspace to enable auto-sync  

---

## Extension Settings

SopSync contributes the following settings:

- `sopsync.saveInstructionEnabled`  
  Create structured instructions from simple user requests as Markdown workflow files.

- `sopsync.loadSOPsIntoClaudeEnabled`  
  Automatically load SOP files from the `/sopsync/workflows` folder into the `CLAUDE.md` context file.


Access via Command Palette:  

- **Mac:** `Cmd + Shift + P`  
- **Windows/Linux:** `Ctrl + Shift + P`  

---

## Known Issues
- Requires Claude extension to be active for AI refinement feature  
- Large SOP folders may slightly increase Claude context size
- Relies on Claude's response time to generate the structured workflow files, which can cause a delay.
  
---

## Release Notes

### 1.0.0
- Initial release  
- Structured workflow template generator  
- Manual SOP folder sync  

### 1.1.0
- Added automatic SOP folder reading  
- Added Claude-powered template refinement  

---

## Why SopSync?
AI chats are powerful, but valuable instructions often get buried in history and forgotten.  
SopSync transforms AI conversations into structured, reusable, and shareable knowledge.  
