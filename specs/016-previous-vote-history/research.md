# Research: Previous Vote History

## Decision: Dedicated history query and route

**Rationale**: Open ballot view rejects closed events and returns latest only. History needs separate lifecycle, pagination, and authorization.

**Alternatives considered**: Expanding ballot view would couple review with submission state and risk compatibility.

## Decision: Exclusive identity precedence

**Rationale**: Signed-in requests filter only account ballots. Signed-out requests filter only retained browser marker. Never merge both or grant host access.

**Alternatives considered**: Union leaks shared-browser ballots to later signed-in users. Host ownership violates private choices.

## Decision: Stable compound cursor

**Rationale**: Newest-first pagination uses submission time plus ballot identity as tie-breaker, preventing duplicates/gaps under equal timestamps.

**Alternatives considered**: Identity-only or timestamp-only cursors are unstable. Offset paging shifts when ballots arrive.

## Decision: Server-provided history availability

**Rationale**: Code modal action appears only when current identity has history. Client cannot infer safely from consumed grant or host status.

**Alternatives considered**: Always showing action creates false affordance. Grant presence is not ballot history.

## Decision: Semantic snapshot review

**Rationale**: Read-only headings/lists better expose saved selections than disabled form controls. Stored snapshots preserve exact accepted labels/order.

**Alternatives considered**: Reusing disabled ballot inputs weakens accessibility and can incorrectly reflect live event edits.

## Decision: Review allowed while closed

**Rationale**: Closure blocks new ballots, not voter access to accepted submissions.

**Alternatives considered**: Open-only review recreates inaccessible-history defect.

## Decision: Additive indexes and privacy-safe signals

**Rationale**: Account/browser compound indexes meet page budget without altering records. Operational signals include count, hasMore, duration, outcome only.

**Alternatives considered**: Full scans scale poorly. Logging IDs/cursors/choices adds unnecessary privacy risk.
