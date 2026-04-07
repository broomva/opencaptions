---
title: "[API Name]"
type: api-contract
domain: # specify domain
status: draft
tags:
  - domain/{area}
  - status/draft
  - type/api-contract
---

# [API Name]

> [!context]
> Brief description of this API.

## Base URL

<!-- Protocol, host, port, base path -->

## Authentication

<!-- How are requests authenticated? -->

## Endpoints

### [METHOD] /path

**Description**: What this endpoint does.

**Request Body**:

```typescript
interface RequestBody {
  field: string;
}
```

**Response**: `200 OK`

```typescript
interface Response {
  field: string;
}
```

## Related

- [[architecture/overview]]
