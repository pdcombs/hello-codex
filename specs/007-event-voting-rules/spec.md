# Feature Specification: Event Voting Rules

**Feature Branch**: `main`

**Created**: 2026-07-19

**Status**: Ready for task generation

**Input**: Host-configured voting windows, category ballot methods, public/account/code voter restrictions, and server-authoritative enforcement.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Event Voting Rules (Priority: P1)

Event host views default voting rules attached to every event and edits voting window, category voting method, and voter restrictions. Saved rules immediately become authoritative for future voting actions.

**Why this priority**: No safe voting flow exists without explicit, host-controlled rules and server enforcement.

**Independent Test**: Host creates event, reviews defaults, changes every rule family, reloads event, and sees same active rules while non-host cannot change them.

**Acceptance Scenarios**:

1. **Given** newly created event, **When** host opens voting rules, **Then** complete default rule set exists without extra setup.
2. **Given** host-owned event, **When** host changes valid rules, **Then** saved rules appear on subsequent reads.
3. **Given** non-host or anonymous visitor, **When** they attempt rule changes through any client, **Then** change is denied and recorded.
4. **Given** voting already opened, **When** host changes rules, **Then** new rules govern later actions and prior accepted votes remain historical records.
5. **Given** multiple-selection category, **When** host configures minimum and maximum selections, **Then** values are saved only when valid for current active entries.

---

### User Story 2 - Enforce Voting Window and Category Method (Priority: P1)

Voter can vote only during configured opening and closing window. Each category uses one host-selected method: single selection, multiple selection, or complete ranking from favorite to least favorite.

**Why this priority**: Window and ballot method define whether submitted votes are valid.

**Independent Test**: Try equivalent voting actions before, during, and after window for all three methods; only rule-compliant actions during window succeed.

**Acceptance Scenarios**:

1. **Given** current time before opening or at/after closing, **When** voter submits vote, **Then** submission is rejected with safe reason.
2. **Given** single-select category, **When** voter selects more than one entry, **Then** submission is rejected.
3. **Given** multiple-select category, **When** voter submits allowed selections, **Then** submission is accepted.
4. **Given** ranking category, **When** voter omits, duplicates, or repeats a rank, **Then** submission is rejected.
5. **Given** direct API caller, **When** payload violates active rules, **Then** same restriction applies regardless of UI behavior.

---

### User Story 3 - Choose Voter Access Policy (Priority: P2)

Host chooses unrestricted public voting, account-restricted voting, or one-time-code voting. Host can require accounts in code mode and configure allowed voting use where applicable.

**Why this priority**: Hosts need different trust levels for public and controlled events.

**Independent Test**: Configure each policy and prove eligible voters succeed while ineligible, reused, or forged credentials fail.

**Acceptance Scenarios**:

1. **Given** unrestricted event with link, **When** anonymous visitor votes during window, **Then** account or registration is not required and repeat behavior follows host-selected unlimited or browser-limited mode.
2. **Given** account restriction, **When** anonymous visitor votes, **Then** account registration is required; email and phone are collected.
3. **Given** code restriction, **When** host requests a quantity, **Then** that many unique unused six-character lowercase alphanumeric codes become available.
4. **Given** valid unused code, **When** voter submits a successful ballot with it, **Then** code becomes unavailable to other voters.
5. **Given** account-required code mode, **When** account successfully submits its first ballot with a code, **Then** account-event voter access persists without creating participant or entry ownership.
6. **Given** code mode without completed-account requirement, **When** voter supplies email and submits a valid ballot with unused code, **Then** system creates or links an unverified provisional account, records event voter access, and marks code used.
7. **Given** lost unused code, **When** host supplies another code, **Then** voter may use the replacement normally; old code remains usable until revoked or consumed by a successful ballot.

---

### User Story 4 - Manage Voting Codes (Priority: P3)

Host generates code batches, views code inventory and used/unused status, and can identify which account consumed a code when accounts are required.

**Why this priority**: Controlled in-person voting needs practical admission operations.

**Independent Test**: Generate batch, use codes in both account modes, reload inventory, and confirm accurate status without exposing private data publicly.

**Acceptance Scenarios**:

1. **Given** host requests supported batch size, **When** generation completes, **Then** exact count of unique codes appears.
2. **Given** code inventory, **When** non-host requests it, **Then** access is denied.
3. **Given** consumed code, **When** host views inventory, **Then** status shows used and claimant context allowed by account mode.
4. **Given** already consumed code, **When** another voter tries it, **Then** request is rejected without revealing claimant identity.

### Edge Cases

- Opening must be earlier than closing; timestamps use explicit timezone/instant semantics.
- Boundary behavior: opening instant is inclusive; closing instant is exclusive.
- Rule update racing with vote submission uses rules current at authoritative submission evaluation.
- Category added after rules exist receives event default category method until host changes it.
- Removed categories and entries cannot receive votes even if stale client still displays them.
- Empty category cannot accept ballot selections or rankings.
- Ranking category requires each active entry exactly once unless future rules explicitly allow partial ranking.
- Code generation handles collisions without reducing requested count.
- Used codes cannot be deleted or reassigned; status history remains auditable.
- In code mode without completed-account requirement, email is mandatory; phone remains optional.
- Code remains unused after failed validation or abandoned flow and becomes used only after successful ballot submission.
- Reusing email tied to an existing account links voter access to that account without changing verification or completion state.
- Browser-limited unrestricted voting is deterrence, not strong identity enforcement; clearing storage or changing browser can bypass it.
- Existing accepted votes remain immutable when host later changes rules; later interpretation/winner effects are outside this feature.

## Scope Boundaries *(mandatory)*

### In Scope

- Default voting rules for every new and existing event.
- Host-only rule editing.
- Voting window validation.
- Per-category single-select, multiple-select, or complete-ranking method.
- Unrestricted, account, and generated-code access policies.
- Configurable account requirement in code mode.
- Six-character lowercase alphanumeric code batches, inventory, claiming, status, and audit history.
- Server-authoritative authorization and rule validation for every protected action.
- Read-only rule projection used by voter UI.
- Migration of existing events to documented defaults.

### Out of Scope

- Email/phone ownership verification.
- Vote counting, winner calculation, tie breaking, and result publication.
- Participant eligibility as voter policy.
- Restoring, reassigning, or hard-deleting used codes.
- Sending codes by email/SMS or automating in-person distribution.
- Retroactively deleting or rewriting accepted votes after rule changes.
- Detailed voting UI beyond behavior needed to consume authoritative rules.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every event MUST have exactly one active voting-rules object, including migrated events.
- **FR-002**: New events MUST receive complete safe defaults without host action.
- **FR-003**: Only event host MUST be able to change rules or manage codes.
- **FR-004**: System MUST return active rules with event voting context so clients can render allowed actions.
- **FR-005**: Every vote/access operation MUST independently enforce active rules at authoritative boundary; client enforcement MUST never be trusted as authorization.
- **FR-006**: Rules MUST contain opening and closing instants with opening earlier than closing.
- **FR-007**: System MUST accept voting at opening instant and reject it at closing instant.
- **FR-008**: Each active category MUST resolve to one method: `single selection`, `multiple selection`, or `complete ranking`.
- **FR-009**: Single selection MUST accept exactly one active entry per category.
- **FR-010**: Multiple selection MUST support host-configurable minimum and maximum selections per category.
- **FR-010A**: Multiple-selection minimum MUST be zero or greater, maximum MUST be one or greater, minimum MUST NOT exceed maximum, and maximum MUST NOT exceed active entry count when voting begins.
- **FR-011**: Complete ranking MUST contain every active category entry exactly once in unique order.
- **FR-012**: Voter access policy MUST be exactly one of unrestricted, account restricted, or code restricted.
- **FR-013**: Unrestricted policy MUST allow anonymous public access through event link without voter registration.
- **FR-014**: Unrestricted policy MUST let host choose unlimited submissions or one ballot per browser.
- **FR-014A**: Unlimited mode MUST accept repeated rule-valid submissions without account identity limits.
- **FR-014B**: Browser-limited mode MUST reject another submission when same browser already recorded successful ballot while clearly disclosing that this is not identity-grade enforcement.
- **FR-015**: Account-restricted policy MUST require signed-in account containing both email and phone.
- **FR-016**: Account-restricted policy MUST define allowed ballot submissions per account.
- **FR-017**: Code-restricted policy MUST let host require or not require account.
- **FR-018**: Generated codes MUST be unique within event, lowercase alphanumeric, exactly six characters, and cryptographically unpredictable.
- **FR-019**: Host MUST be able to request a code quantity within documented safe batch limit and receive exact count.
- **FR-020**: Host MUST see code value, created time, used/unused state, used time, and claimant account only when applicable.
- **FR-021**: Claiming code MUST be atomic; one code cannot be claimed by two voters under concurrency.
- **FR-022**: Account-required code claim MUST persist account-event voter relationship separate from participation and entry ownership.
- **FR-023**: Claimed account-code relationship MUST allow later access without code re-entry.
- **FR-023A**: Code mode without completed-account requirement MUST require email and allow optional phone before ballot submission.
- **FR-023B**: System MUST create or reuse an unverified provisional account for supplied normalized email and associate that account with event voter access, without making account a participant or entry owner.
- **FR-023C**: Code MUST transition from unused to used atomically with successful ballot submission; rejected or interrupted submissions MUST leave code unused.
- **FR-023D**: Host code inventory MUST show provisional claimant association after successful use, subject to host-only access and privacy controls.
- **FR-024**: Code and rule state changes MUST never be hard deleted and MUST retain host/action/time audit history.
- **FR-025**: Rule changes MUST be concurrency-safe and reject stale updates without overwriting newer rules.
- **FR-026**: Rule changes MUST affect future authorization decisions immediately after success.
- **FR-027**: Previously accepted vote records MUST retain submission-time rule/version reference.
- **FR-028**: Denials MUST return safe actionable reasons without exposing claimant identity, code inventory, or private account data.
- **FR-029**: Logs and audits MUST exclude raw access codes, email, phone, and ballot contents unless strictly required in protected persistence.
- **FR-030**: Existing category, entry, participant, and host flows MUST remain compatible.

### Key Entities

- **Event Voting Rules**: Event-owned active configuration; window, access policy, account requirement, submission limit, default category method, version, effective time, audit lifecycle.
- **Category Voting Rule**: Category-specific ballot method and optional method limits; belongs to event rules and active category.
- **Voting Access Code**: Event-owned six-character credential; unused/used state, creation and consumption timestamps, claimant relationship when applicable, immutable history.
- **Event Voter Access**: Relationship granting completed or provisional account permission to vote in event; separate from participant and entry ownership; may reference claimed code.
- **Anonymous Browser Ballot Marker**: Browser-local indication of successful unrestricted ballot used only when host selects browser-limited mode; not treated as verified identity.
- **Vote Submission Context**: Rule/version and eligibility decision captured when future vote is accepted.

### Ownership and Access

- Event owns rules, category rules, codes, and event voter-access relationships.
- Host may read/update rules and create/read code inventory.
- Voters may read public rule projection needed to vote, but never code inventory or other voters' access records.
- Account holder may read own event access status.
- Server alone decides eligibility, code claim, timing, and ballot validity.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Host can review and save complete rule configuration in under three minutes.
- **SC-002**: 100% of direct-client attempts violating time, access, category method, or submission limits are rejected.
- **SC-003**: Two concurrent ballot submissions using same code produce exactly one successful ballot and claimant in every test run.
- **SC-004**: Rules and eligibility appear within two seconds for 95% of event loads under expected launch traffic.
- **SC-005**: Code generation produces requested unique count for batches up to planned safe limit, with zero duplicates across 100 validation runs.
- **SC-006**: Rule changes and code claims retain complete audit history in 100% of success and denial tests.
- **SC-007**: Existing event setup and participant critical flows continue passing without user-visible regression.

### Critical User Flows *(mandatory)*

- **CUF-001**: Host opens event rules, changes window/method/access policy, saves, and reloads authoritative state.
- **CUF-002**: Anonymous voter accesses unrestricted event and submits rule-valid ballot during window.
- **CUF-003**: Account-restricted voter is admitted only with required account fields and within submission limit.
- **CUF-004**: Host generates codes, voter submits with one, and reuse by another voter is denied.
- **CUF-005**: Account successfully submits with an event code once, returns later, and retains voter access without becoming participant.
- **CUF-006**: Direct API caller attempts every UI-hidden forbidden action and receives same denial.

## Assumptions

- Host may change rules any time; successful changes apply prospectively and never rewrite prior accepted votes.
- Initial defaults: future unset window requiring host confirmation before voting, unrestricted access, and single selection per category.
- Complete ranking means all active entries, not partial ranking.
- Account-restricted mode collects email and phone but defers ownership verification.
- Code mode always collects email. When completed account is not required, email creates or reuses unverified provisional account; phone is optional.
- Host explicitly chooses unrestricted repeat behavior: unlimited or one successful ballot per browser.
- Codes use characters `a-z` and `0-9`; visually ambiguous characters remain allowed unless planning establishes usability reason to exclude them.
- Safe code batch maximum and code retention duration will be selected during planning from operational capacity; codes and claim history have no hard-delete path.
- Voting code holder who does not require account remains distinct from event participant.
