export default function SubmittedBallotReview({ ballot, index = 0 }) {
  const titleId = `submitted-ballot-${ballot.id}-title`
  return <article className="submitted-ballot" aria-labelledby={titleId}>
    <header className="submitted-ballot-head">
      <h2 id={titleId}>Vote submission {index + 1}</h2>
      <p>Submitted <time dateTime={ballot.submittedAt}>{formatDate(ballot.submittedAt)}</time></p>
    </header>
    <div className="submitted-ballot-categories">{ballot.categoryBallots.map((category) =>
      <section className="submitted-ballot-category" key={category.categoryId}>
        <h3>{category.categoryTitle ?? 'Category'}</h3>
        {!category.entries.length && <p className="submitted-ballot-empty">No selection</p>}
        {!!category.entries.length && category.method === 'RANKING' && <ol>
          {[...category.entries].sort(bySelectionOrder).map((entry) => <li key={entry.entryId}>{entry.entryTitle ?? 'Entry'}</li>)}
        </ol>}
        {!!category.entries.length && category.method !== 'RANKING' && <ul>
          {[...category.entries].sort(bySelectionOrder).map((entry) => <li key={entry.entryId}>{entry.entryTitle ?? 'Entry'}</li>)}
        </ul>}
      </section>)}</div>
  </article>
}

function bySelectionOrder(left, right) { return left.selectionOrder - right.selectionOrder }
function formatDate(value) {
  if (!value) return 'Unknown date'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
