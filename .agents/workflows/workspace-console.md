---
description: Antigravity Workspace Console Workflow (PowerShell)
---

This document defines a **workspace console automation workflow** for running common PowerShell commands in the AngularProject environment. It introduces a small set of slash-style commands (`/`) that act as **shortcuts for multi-step terminal tasks**, reducing context switching and startup time.

This workflow is intended for **local development only** and complements:
- **Antigravity Workspace Automation Workflow** (structure creation)
- **Antigravity Debug Workflow** (issue isolation)

---

## 1. Console Command Philosophy

Console commands follow these principles:

- **One Intent, Many Steps** – A single command may execute multiple shell commands
- **Explicit Paths** – No reliance on implicit working directories
- **Parallel by Design** – Long-running processes open in separate terminals
- **Safe by Default** – No destructive commands (delete, reset, overwrite)

> **Type once. Run everything.**

---

## 2. Command Execution Model

All slash commands represent **PowerShell execution recipes**, not aliases.

Mental model:

```
/command-name
→ PowerShell commands executed
→ correct directories ensured
→ long-running processes started
```

These commands assume:
- Node.js is installed
- npm dependencies are already installed
- Commands are run from a project-root PowerShell session

---

## 3. `/start` — Full Application Startup

### Purpose

Start the **entire local application stack** with a single command:
- SQL‑connected Node.js backend (`server.js`)
- Angular frontend (`npm start`)

This command replaces manually starting each service in separate terminals.

---

### Invocation

```
/start
```

---

### Executed PowerShell Steps (Conceptual)

**Backend (Database + API)**

```
cd customer-crud-app
cd backend
node server.js
```

**Frontend (Angular UI)**

```
cd customer-crud-app
cd src
cd app
npm start
```

---

### Expected Result

- Backend API runs continuously
- SQL Server connection is established via `.env`
- Angular development server starts successfully
- Two active processes run in parallel terminals

---

### Failure Signals

- Backend crashes → check `.env` and SQL Server
- Frontend fails → check Node/npm versions and dependencies
- Port conflicts → ensure no existing services are running

---

## 4. `/backend` — Backend Only Startup

### Purpose

Run only the Node.js backend for API‑only or Postman testing.

---

### Invocation

```
/backend
```

---

### Executed Steps

```
cd customer-crud-app
cd backend
node server.js
```

---

## 5. `/frontend` — Frontend Only Startup

### Purpose

Run only the Angular frontend when the backend is already running or mocked.

---

### Invocation

```
/frontend
```

---

### Executed Steps

```
cd customer-crud-app
cd src
cd app
npm start
```

---

## 6. `/stop` — Stop Running Services

### Purpose

Gracefully stop all running development servers.

---

### Invocation

```
/stop
```

---

### Action

- Send `Ctrl + C` to active Node/npm processes
- Close associated terminals if necessary

_No forced process termination is performed._

---

## 7. `/restart` — Full Restart

### Purpose

Restart both backend and frontend cleanly.

---

### Invocation

```
/restart
```

---

### Execution Flow

1. `/stop`
2. `/start`

---

## 8. Guardrails & Assumptions

These commands **do not**:
- Install dependencies
- Build production bundles
- Modify files
- Reset databases

They **assume**:
- `npm install` has already been executed
- `.env` is correctly configured
- Required ports are available

---

## 9. When to Use This Workflow

Use these commands when:
- Starting a development session
- Switching tasks quickly
- Avoiding repeated directory navigation

Avoid these commands when:
- Running production builds
- Executing migrations
- Performing destructive operations

---

## 10. Future Command Ideas

- `/install` – run npm install backend + frontend
- `/clean` – remove node_modules safely
- `/logs` – tail backend output
- `/ps` – list running Node processes

---

> **Automate the terminal. Save your attention for code.**

_This workflow should evolve alongside project structure and scripts._
