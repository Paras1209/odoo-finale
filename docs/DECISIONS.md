# Architecture & Technical Decisions

> Record important decisions that future AI sessions must understand.
>
> Do not record trivial implementation details.

---

# Decision Format

For every important decision:

## Decision: [TITLE]

Date:
[DATE]

Status:
Accepted / Superseded / Rejected

### Context

What problem were we solving?

### Decision

What did we choose?

### Why

Why did we choose it?

### Alternatives Considered

What alternatives were considered?

### Consequences

What does this decision affect?

---

# Decisions

## Decision: [Example — REST API]

Date:
[DATE]

Status:
Accepted

### Context

The frontend needs to communicate with the backend.

### Decision

Use REST APIs with JSON responses.

### Why

The application is small enough that GraphQL is unnecessary.

### Alternatives Considered

- GraphQL
- WebSockets

### Consequences

Frontend services communicate with `/api/...` endpoints.

---

## Decision: [Example — Authentication]

Date:
[DATE]

Status:
Accepted

### Context

Users need authenticated access to protected resources.

### Decision

Use JWT-based authentication.

### Why

It fits the existing backend architecture and can be implemented quickly.

### Alternatives Considered

- Server-side sessions
- OAuth

### Consequences

Authentication middleware must validate tokens before protected routes.

---

# Current Architectural Constraints

- Do not introduce a new framework without explicit approval.
- Do not replace the database technology during the hackathon.
- Do not replace authentication architecture without explicit approval.
- Preserve existing API contracts unless a breaking change is intentional.