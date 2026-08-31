# Data Model: Review Voting Results

## Event Results

- Event view
- Votes received: accepted ballot count
- Calculated time
- Ordered category results

## Category Result

- Category identity and display title
- Original category order
- Voting method: single, multiple, or ranking
- Contributing ballot count
- Ordered entry results

## Entry Result

- Entry identity and display title
- Original entry order
- Total: selection count or rank score
- Winner flag

## Calculation Rules

- Each accepted ballot increments event votes once.
- Single/multiple selected entry increments by one.
- Ranking position `P` among `N` category entries earns `N-P`.
- Sort total descending, then original entry order, then stable title.
- Positive maximum entries are co-winners.
- No contribution means no winner; one-entry ranked category with contribution is winner at zero.
- Ballot snapshots supply historical labels; current event data supplies zero-result entries.
