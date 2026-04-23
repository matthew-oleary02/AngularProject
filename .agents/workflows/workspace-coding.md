---
description: Antigravity Workspace Coding Workflow
---

# Antigravity Workspace Coding Workflow

This document defines a **workspace-level coding assistance workflow** for accelerating feature development in the AngularProject repository. It introduces slash-style commands (`/`) that help **model new code after existing, working implementations**, reducing duplication, mistakes, and mental overhead.

Unlike the Automation and Console workflows, this workflow focuses on **code similarity, behavior replication, and implementation consistency**.

---

## 1. Coding Workflow Philosophy

Coding commands exist to:

- **Reuse proven patterns** instead of re‑inventing them
- **Model behavior**, not just structure
- **Reduce cognitive load** during repetitive feature work
- **Encourage consistency across domains**

> If two components behave the same, they should be written the same.

---

## 2. Command Model

Coding commands follow this intent‑driven flow:

```
/command
→ reference component
→ target component
→ behavior + structure inferred
→ code scaffold generated
```

Commands do **not** blindly copy files. They:
- Adapt names
- Preserve intent
- Leave TODO markers where manual decisions are required

---

## 3. `/mirror` — Component Behavior Modeling

### Purpose

Generate a new component whose **logic and structure mirror an existing, completed component**, with all names, selectors, and references adjusted for the new domain.

This is ideal when two components are functionally equivalent (e.g. `customer-rates` and `vendor-rates`).

---

### Invocation

```
/mirror
```

---

### Required Inputs

- **Source component name** (existing, completed)
- **Target component name** (new or empty)
- **Target path** (relative to `src/app`)

Example:

```
source: customer-rates
target: vendor-rates
path: features/vendor-rates
```

---

### Modeled Files

For a standard component, the following are processed:

```
*.component.ts
*.component.html
(optional) *.component.scss
```

---

### What `/mirror` Does

✅ Copies component logic structure
✅ Renames:
- Class names
- Selectors
- Template bindings
- Service injections
✅ Updates comments to match the new entity
✅ Preserves lifecycle hooks and method signatures

---

### What `/mirror` Does NOT Do

❌ Does not change business logic semantics
❌ Does not rewrite API endpoints automatically
❌ Does not assume routing or navigation changes

Any domain‑specific logic is flagged using TODO comments.

---

## 4. `/clone-crud` — Full CRUD Behavior Duplication

### Purpose

Duplicate **an entire CRUD implementation** (components + service + model) from one feature to another while renaming and re‑scoping everything.

This is the fastest way to create a new domain that behaves identically to an existing one.

---

### Invocation

```
/clone-crud
```

---

### Required Inputs

```
source: customer
target: vendor
sourcePath: features/customers
targetPath: features/vendors
```

---

### Files Processed

- Model (`*.model.ts`)
- Service (`*.service.ts`)
- Form component
- View component
- List component

---

### Automatic Adjustments

✅ Class and file names
✅ Import paths
✅ Injectable tokens
✅ Component selectors
✅ Comments and intent blocks

---

### Manual Follow‑ups (Expected)

- Update API endpoint URLs
- Adjust displayed labels
- Validate domain‑specific rules

These are clearly marked in generated code.

---

## 5. `/align` — Bring Component In Line

### Purpose

Align an existing component to match the behavior and structure of a reference component **without recreating it**.

Useful for refactors or partial rewrites.

---

### Invocation

```
/align
```

---

### Inputs

```
reference: customer-rates
target: vendor-rates
```

---

### Actions

- Compare lifecycle hooks
- Compare injected services
- Compare public method names
- Highlight missing or extra logic

Result: a checklist of changes rather than generated files.

---

## 6. Safety Rules

All coding commands:

- ❌ Never overwrite working files silently
- ❌ Never guess business rules
- ✅ Prefer TODOs over assumptions
- ✅ Optimize for review, not automation

---

## 7. When to Use This Workflow

Use when:
- Two domains should behave the same
- You are copying patterns repeatedly
- You want consistency across features

Avoid when:
- Behavior is intentionally different
- Performance optimizations are involved
- Domain logic diverges significantly

---

## 8. Relationship to Other Workflows

- **Automation Workflow** → Generates structure
- **Console Workflow** → Runs the system
- **Coding Workflow** → Applies behavior
- **Debug Workflow** → Fixes behavior

Together, they form a complete development loop.

---

> **Good code is rarely written from scratch. It is adapted with intent.**

_This workflow should evolve as shared patterns mature._
