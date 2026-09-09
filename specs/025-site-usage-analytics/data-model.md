# Data Model: Site Usage Analytics and Privacy

No server persistence is added.

## Analytics Preference

- `status`: `undecided | accepted | declined`
- Browser key: `votiy.analytics-consent`
- Invalid/unavailable storage resolves to `undecided`
- Choice is immediate, reversible, and independent of authentication

## Normalized Route

- Approved pattern and plain-English title
- Never contains query, fragment, alias, token, or identifier

## Analytics Event

- `event_name`: `page_view | button_click | unhappy_path`
- `page_route`: normalized route
- Optional catalog fields only; unknown fields are discarded
