---
description: Antigravity Workspace Automation Workflow
---

# Antigravity Workspace Automation Workflow

This document defines a **workspace-level productivity workflow** for the AngularProject repository. It introduces a small, consistent set of slash commands (`/`) designed to eliminate repetitive setup work and standardize structure across features and components.

This workflow complements the Antigravity Debug Workflow by focusing on **creation speed and consistency**, not debugging.

---

## 1. Command Philosophy

Workspace commands are:

- **Declarative** – You state *what* you want, not *how*
- **Predictable** – Identical inputs always produce the same structure
- **Non-destructive** – No overwrites without confirmation
- **Angular-aligned** – Matches Angular CLI and project conventions

> **Commands create structure. Logic comes later.**

---

## 2. Command Invocation Model

All workspace commands follow this mental model:

```
/command-name
→ required inputs
→ folders and files created
→ minimal placeholders only
```

Commands never:
- Add routing automatically
- Modify modules
- Inject business logic

---

## 3. `/component` — Standard CRUD Component Set

### Purpose

Generate a **standard form/view/list component trio** for a given domain entity. This replaces manually creating multiple Angular components and folders.

---

### Invocation

```
/component
```

---

### Required Inputs

- **Component name** (singular, kebab-case preferred)
- **Destination path** (relative to `src/app`)

Example:

```
name: customer
path: features/customers
```

---

### Generated Structure

```
src/app/features/customers/
├── customer-form/
│   ├── customer-form.ts
│   └── customer-form.html
├── customer-view/
│   ├── customer-view.ts
│   └── customer-view.html
└── customer-list/
    ├── customer-list.ts
    └── customer-list.html
```

**Guarantees**
- All three components are always generated
- Naming is consistent across files and selectors
- No routing or module changes are applied

---

### Component Responsibilities (Convention)

**Form Component**
- Create and edit logic
- Form validation

**View Component**
- Read-only entity display
- Route or `@Input()` driven

**List Component**
- Collection display
- Basic navigation actions

---

### Placeholder Rules

Each `.ts` file contains:
- Component decorator
- Empty `ngOnInit`
- Intent comment

Example:

```ts
// Handles create/edit logic for Customer
```

Each `.html` file contains:

```html
<!-- customer form view -->
```

Nothing more.

---

## 4. `/crud` — Full CRUD Scaffold (Component + Service + Model)

### Purpose

Generate a **complete CRUD foundation** for a domain entity by combining the standard **form/view/list component trio** with a **feature-scoped service** and a **typed domain model**.

This command is designed to take you from *no structure* to an *implementation-ready domain skeleton* in a single step.

---

### Invocation

```
/crud
```

---

### Required Inputs

- **Entity name** (singular, kebab-case preferred)
- **Destination path** (relative to `src/app`)

Example:

```
name: customer
path: features/customers
```

---

### Generated Structure

```
src/app/features/customers/
├── models/
│   └── customer.model.ts
├── services/
│   └── customer.service.ts
├── customer-form/
│   ├── customer-form.ts
│   └── customer-form.html
├── customer-view/
│   ├── customer-view.ts
│   └── customer-view.html
└── customer-list/
    ├── customer-list.ts
    └── customer-list.html
```

---

### Guarantees

- Form, view, and list components are always generated
- One model and one service are created per entity
- Naming is consistent across files and classes
- No routing, modules, or imports are modified
- Existing files are never overwritten automatically

---

### Generated Artifact Responsibilities

#### Model (`customer.model.ts`)

- Defines the typed shape of the domain entity
- Acts as the source of truth for UI and service usage

```ts
// Domain model for Customer entity
```

---

#### Service (`customer.service.ts`)

- Centralizes all backend communication for the entity
- Contains method placeholders for Create, Read, Update, Delete

```ts
// Handles CRUD operations for Customer API endpoints
```

No HTTP logic is implemented automatically.

---

#### Components

Component generation is identical to `/component` and follows the same responsibilities and placeholder rules.

---

## 5. `/feature` — Feature Shell Generator

### Purpose

Create a clean feature container suitable for multiple component and service generations.

---

### Invocation

```
/feature
```

---

### Inputs

```
name: customers
path: src/app/features
```

---

### Generated Structure

```
features/customers/
├── components/
├── services/
├── models/
└── pages/
```

No components are generated automatically; this command prepares structure only.

---

## 6. `/service` — Feature-Scoped Service

### Purpose

Generate a standardized Angular service scoped to a feature.

---

### Invocation

```
/service
```

---

### Inputs

```
name: customer
path: src/app/features/customers/services
```

---

### Output

```
customer.service.ts
```

Includes placeholders for:
- Base API URL
- CRUD method signatures
- Error handling section

---

## 7. Safety & Guardrails

All workspace commands enforce:

- ❌ No automatic overwrites
- ❌ No routing edits
- ❌ No module imports
- ✅ Structure only
- ✅ One responsibility per command

---

## 8. When to Use This Workflow

Use this workflow when:
- Bootstrapping new features
- Standardizing folder structure
- Expanding existing domains
- Reducing setup friction

Do **not** use this workflow for:
- Refactors
- Business logic changes
- Debugging (use Antigravity Debug Workflow)

---

## 9. Relationship to Antigravity Debug Workflow

- **Workspace Automation Workflow** → Creation speed
- **Antigravity Debug Workflow** → Debug safety

Structure first. Debug later.

---

> **Automate structure. Think about logic.**

_This workflow should evolve alongside project conventions._
