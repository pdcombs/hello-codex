# Data Model: Event Short Links

## Event additions

- `shortId`: current displayed alias; defaults to `publicId`
- `shortIdNormalized`: lowercase canonical identity; globally unique

State transition: rename atomically replaces both values and `updatedAt`; old normalized value becomes available.

## Reserved aliases

Code-owned immutable set covering all current and protected common root paths. Not persisted.
