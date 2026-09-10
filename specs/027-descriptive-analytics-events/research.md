# Research

## Decision: Standard page event plus registered dimensions

Keep `page_view` once per navigation. Use `page_route` and `page_title` for normalized detail. Register custom `page_route` dimension in GA administration; `page_title` remains standard context.

**Rationale**: Preserves built-in page reporting per Q1 C without duplicate companion events.

## Decision: Descriptive custom action and failure names

Button examples use `click_open_voting_button`; failures use `error_service_unavailable`. Values are controlled catalog entries, never runtime-generated strings.

**Rationale**: Event list becomes readable while bounded taxonomy avoids PII and cardinality risk.

## Decision: Immutable source catalog and runtime allowlist

One module exports frozen event constants and mappings. Dispatcher validates membership before calling provider.

**Alternatives**: Inline strings rejected for drift; constructing names from DOM text rejected for privacy; TypeScript enum rejected because project uses JavaScript.
