# Event Photo HTTP Contract

All mutation responses use JSON and include `X-Correlation-ID`. Mutation requests require the existing
session cookie, exact allowed Origin, and `X-Requested-With: votiy-web`.

## Upload or replace

`PUT /api/events/{eventId}/photo`

### Request

- Body: raw raster bytes, maximum 10 MiB.
- `Content-Type`: `image/jpeg`, `image/png`, or `image/webp`.
- `Content-Length`: required; positive and no greater than 10 MiB.
- `X-Idempotency-Key`: required opaque identifier.
- `Origin`: required same application origin.
- `X-Requested-With: votiy-web`.
- Session cookie: required.

### Success

Status `200` for replacement or `201` for initial upload.

```json
{
  "photo": {
    "url": "/event-media/example/photo",
    "revision": 2,
    "width": 640,
    "height": 640,
    "updatedAt": "2026-07-25T12:00:00.000Z"
  },
  "correlationId": "opaque"
}
```

### Errors

| Status | Code | Meaning |
|--------|------|---------|
| 400 | `INVALID_IMAGE` | Decode, pixel, dimension, or output validation failed |
| 401 | `AUTHENTICATION_REQUIRED` | No valid session |
| 403 | `FORBIDDEN` | Origin/header invalid or viewer is not event owner |
| 404 | `NOT_FOUND` | Event does not exist |
| 409 | `CONFLICT` | Idempotency key reused for different input |
| 413 | `IMAGE_TOO_LARGE` | Declared or streamed input exceeds 10 MiB |
| 415 | `UNSUPPORTED_IMAGE_TYPE` | Declared or decoded format not allowed |
| 422 | `IMAGE_PROCESSING_FAILED` | Safe processing could not produce bounded output |
| 429 | `RATE_LIMITED` | Per-account/event upload limit exceeded |
| 503 | `SERVICE_UNAVAILABLE` | Persistence unavailable |

Errors expose safe code, message, correlation ID, and optional field errors; never decoder internals,
filename, bytes, metadata, or checksum.

## Read current photo

`GET /event-media/{publicId}/photo`

`HEAD` has identical status/headers and no body.

### Success

- Status `200`
- `Content-Type: image/webp`
- `Content-Length`: processed byte count
- `ETag`: strong current validator
- `Cache-Control: public, max-age=0, must-revalidate`
- `X-Content-Type-Options: nosniff`
- Body: processed WebP bytes for GET

With matching `If-None-Match`, status is `304` with no body.

### Errors

- `404` when event or current photo is absent.
- `405` for unsupported methods.
- No storage identifiers or authorization details are exposed.

## Delete

`DELETE /api/events/{eventId}/photo`

### Request

- `X-Idempotency-Key`, `Origin`, `X-Requested-With`, and valid owner session required.
- Empty body.

### Success

Status `200`.

```json
{
  "deleted": true,
  "deletedRevision": 2,
  "correlationId": "opaque"
}
```

Repeating the same idempotency key returns the same success. A new delete against an already-absent photo
returns `404 NOT_FOUND`.

### Errors

Same authentication, authorization, conflict, rate-limit, and service errors as upload.

## Security and processing invariants

- Declared content type and decoded format must agree.
- Decoder enforces at most 40 megapixels.
- Processing strips metadata and animation.
- Processing uses the fixed WebP quality ladder 80, 70, then 60; output that still exceeds the bound at
  quality 60 is rejected without replacing the current photo.
- Persisted output must be WebP, at most 640×640 and 350 KiB.
- Persistence occurs only after all checks and processing succeed.
- Replace is atomic; failed processing retains current photo.
- Mutations create identifier-only audits.
