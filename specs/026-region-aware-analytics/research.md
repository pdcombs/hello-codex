# Research

## Decision: Keep advanced consent measurement

Google Advanced Consent Mode loads tag with analytics storage denied and sends measurements without cookies. Existing page, button, and unhappy-path events can therefore remain enabled before choice and after Decline.

**Rationale**: Meets traffic visibility goal without overriding storage choice.

**Alternatives**: Basic consent mode sends nothing after decline; rejected. Custom visitor identifiers violate scope; rejected.

## Decision: Prompt everyone

No country detection, IP lookup, language/timezone inference, or regional auto-grant.

**Rationale**: User selected safe fallback; removes new privacy-sensitive dependency and unreliable classification.

## Decision: Treat cookie-free visitor/session totals as approximate

Event counts remain useful. Unique visitors and sessions may be modeled or less precise without analytics identifiers.
