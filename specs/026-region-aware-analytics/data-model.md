# Data Model

## Analytics Preference

- States: `undecided`, `accepted`, `declined`
- Fresh state: `undecided`, analytics storage denied, prompt visible
- `accepted`: storage granted
- `declined`: storage denied
- Explicit choice persists in browser and remains reversible

## Measurement Mode

- `stored`: accepted preference
- `cookieless`: undecided or declined preference
- Same normalized event catalog applies to both modes

No server data or migration.
