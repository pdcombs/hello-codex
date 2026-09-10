# Data Model

## Event Catalog Entry

- Semantic key: stable code reference
- Provider name: unique lowercase value, maximum 40 characters
- Category: page, button, or failure
- Safe display/context value where required

## Mappings

- Normalized route maps to standard page event plus safe route/title parameters
- Approved button action maps to descriptive button event
- Approved failure category maps to descriptive failure event
- Unknown values map to explicit safe fallback entries

No persistence or migration.
