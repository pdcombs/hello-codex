# Data Model: Cast Event Ballot

## Ballot Submission (schema version 2)

- `_id`: immutable ballot identity
- `eventId`: owning event
- `accountId`: submitting account when present, otherwise null
- `accessCodeId`: code associated through access grant when present, otherwise null
- `browserMarkerDigest`: private browser identity digest when present, otherwise null
- `rulesVersion`: rules accepted against
- `votingStateVersion`: manual voting state accepted against
- `accessPolicy`: unrestricted, account, or code
- `categoryBallots`: one or more participating category snapshots
- `requestDigest`: canonical submitted payload digest
- `submittedAt`, `createdAt`: immutable timestamps
- `schemaVersion`: 2

### Category Ballot Snapshot

- `categoryId`, `categoryTitle`, `categoryOrder`, `method`
- `entries`: ordered selected-entry snapshots

### Entry Snapshot

- `entryId`, `entryTitle`, `selectionOrder`

### Validation

- At least one category snapshot.
- Category IDs unique and active under accepted event.
- Entry IDs unique within category and active under accepted event.
- Single: exactly one entry when category participates.
- Multiple: participating count within configured min/max; empty means category omitted.
- Ranking: every active category entry exactly once or category omitted.
- Rules and voting-state versions equal transaction-time event versions.
- Accepted record never updates or deletes.

## Ballot View

- Event and ballot identities, accepted versions, submission time
- Ordered category and entry snapshots exactly as accepted
- `mayCastAnother`: current rules/access evaluation, separate from ballot immutability

Authorization requires matching account ID or retained browser marker digest/access grant. Host ownership alone grants no ballot-choice read.

## Submission Attempt

- Event/voter scope, operation name, client attempt key, canonical request digest, ballot result, existing expiry
- Same key and digest returns original result. Same key with different digest conflicts.

## State Transitions

```text
editable -> confirming -> canceled -> editable
                       -> submitting -> accepted -> read-only
                                     -> failure -> editable with error
```

Repeat-eligible voter may start new local ballot. Prior submitted ballot stays immutable.

## Migration and Compatibility

- Existing version-1 ballots remain readable using current labels when snapshots are absent.
- New submissions write version 2; validator accepts both versions.
- No existing ballot is rewritten or deleted.
