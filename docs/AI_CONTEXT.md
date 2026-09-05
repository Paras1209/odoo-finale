# AI Project Context

> This file contains the current high-level state of the project.
> Keep it concise and update it when important project facts change.

---

# 1. Project

## Name

[PROJECT NAME]

## Purpose

[ONE OR TWO PARAGRAPHS DESCRIBING WHAT THE APPLICATION DOES]

## Target Users

[WHO USES IT]

## Current Goal

[WHAT WE ARE TRYING TO COMPLETE FOR THE HACKATHON]

---

# 2. Technology Stack

## Frontend

- Framework:
- Language:
- Styling:
- State management:
- Build tool:

## Backend

- Runtime:
- Framework:
- Language:

## Database

- Database:
- ORM/query library:

## Authentication

[JWT / sessions / OAuth / none]

## Deployment

[VERCEL / RENDER / AWS / LOCAL / ETC.]

---

# 3. Architecture

Describe the application in a few lines.

Example:

Browser
    ↓
React frontend
    ↓
REST API
    ↓
Express backend
    ↓
Service layer
    ↓
Prisma
    ↓
PostgreSQL

---

# 4. Important Project Structure

Only list directories/files that AI frequently needs.

Example:

frontend/
    src/
        components/
        pages/
        services/

backend/
    src/
        routes/
        controllers/
        services/
        middleware/

---

# 5. Important APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |

Add only important APIs.

---

# 6. Authentication

Describe the actual current implementation.

Example:

Access token:
- [WHERE IT IS STORED]
- [HOW IT IS SENT]

Refresh token:
- [WHERE IT IS STORED]
- [HOW IT IS USED]

Authentication middleware:
- [FILE]

Important:
- [ANY SECURITY CONSTRAINT]

---

# 7. Database

List only important tables/models.

Example:

User
- id
- email
- passwordHash
- createdAt

Project
- id
- name
- ownerId

Important relationships:

User → Projects
Project → Submissions

---

# 8. Current Status

## Completed

- [FEATURE]
- [FEATURE]

## In Progress

- [FEATURE]

## Not Started

- [FEATURE]

---

# 9. Known Issues

- [KNOWN ISSUE]
- [KNOWN ISSUE]

If none:

None currently known.

---

# 10. Important Constraints

- Do not add unnecessary dependencies.
- Preserve existing API contracts.
- Do not change database schema without approval.
- Follow existing project patterns.
- Keep changes minimal.

Add project-specific constraints below.

---

# 11. Current Focus

Current task:

[CURRENT TASK]

Relevant files:

- [FILE]
- [FILE]

Current problem:

[PROBLEM]

Expected behavior:

[EXPECTED]

Actual behavior:

[ACTUAL]

---

# 12. Last Verified State

Last verified:

[DATE/TIME]

Command/check:

[COMMAND]

Result:

[RESULT]

Last known-good Git commit:

[COMMIT HASH / COMMIT MESSAGE]