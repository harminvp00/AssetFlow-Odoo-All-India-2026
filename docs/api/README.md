# AssetFlow - API Guidelines

All backend endpoints are versioned and follow consistent REST conventions.

## Route Registration

Endpoints are separated into versions:

- Base path: `/api/v1`
- Modular routes are registered in `server/src/routes/v1.js`

## Response Formatting

All API endpoints must return a unified JSON payload structure.

### Success Payload Structure (HTTP 200/201)

```json
{
  "success": true,
  "message": "Resource operation completed successfully.",
  "data": {
    "id": "uuid-here",
    "name": "Asset name"
  }
}
```

### Error Payload Structure (HTTP 400/401/403/404/500)

```json
{
  "success": false,
  "message": "Descriptive error message.",
  "errors": [
    {
      "field": "body.name",
      "message": "Name is required"
    }
  ],
  "stack": "Stack trace (Only visible in Development mode)"
}
```

## Route Middlewares Stack

Route handlers must compose middleware chains in the following order:

1. **Authentication**: `authMiddleware` (JWT Validation)
2. **Authorization**: `roleMiddleware('ADMIN', 'MANAGER')` (Access Control)
3. **Payload Validation**: `validationMiddleware(schema)` (Zod Request Parsing)
4. **Audit Logger**: `auditMiddleware('CREATE_ASSET')` (System Ledger Trail)
5. **Controller Handler**: Actual router business logic
