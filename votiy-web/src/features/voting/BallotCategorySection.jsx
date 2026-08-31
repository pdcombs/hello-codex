export default function BallotCategorySection({ category, method, rule, entryIds, readOnly, onChange }) {
  const helpId = `ballot-${category.id}-help`
  return <fieldset className="ballot-category" aria-describedby={helpId} disabled={readOnly}>
    <legend>{category.title}</legend>
    {method === 'SINGLE' && <><p id={helpId} className="form-help">Choose one entry, or leave this category blank.</p>
      <div className="ballot-choice-list">{category.entries.map((entry) => <label className="ballot-choice" key={entry.id}>
        <input type="radio" name={`category-${category.id}`} value={entry.id} checked={entryIds.includes(entry.id)}
          onChange={() => onChange([entry.id])} /><span>{entry.title}</span></label>)}</div></>}
    {method === 'MULTIPLE' && <><p id={helpId} className="form-help">Choose {selectionText(rule)}, or leave this category blank.</p>
      <div className="ballot-choice-list">{category.entries.map((entry) => {
        const checked = entryIds.includes(entry.id)
        const atMaximum = rule.maximumSelections != null && entryIds.length >= rule.maximumSelections
        return <label className="ballot-choice" key={entry.id}><input type="checkbox" value={entry.id} checked={checked}
          disabled={readOnly || (!checked && atMaximum)} onChange={(event) => onChange(event.target.checked
            ? [...entryIds, entry.id] : entryIds.filter((id) => id !== entry.id))} /><span>{entry.title}</span></label>
      })}</div>
      {!!entryIds.length && rule.minimumSelections != null && entryIds.length < rule.minimumSelections &&
        <p className="ballot-category-error" role="alert">Choose at least {rule.minimumSelections} entries in this category, or clear all choices.</p>}</>}
    {method === 'RANKING' && <><p id={helpId} className="form-help">Rank every entry from best to worst, or leave this category blank.</p>
      {!entryIds.length && !readOnly && <button className="secondary-action" type="button"
        onClick={() => onChange(category.entries.map((entry) => entry.id))}>Rank this category</button>}
      {!!entryIds.length && <ol className="ballot-ranking-list">{entryIds.map((entryId, index) => {
        const entry = category.entries.find((candidate) => candidate.id === entryId)
        return <li key={entryId}><span className="ballot-rank-number" aria-hidden="true">{index + 1}</span>
          <span>{entry?.title ?? 'Unavailable entry'}</span>{!readOnly && <span className="ballot-rank-actions">
            <button type="button" className="secondary-action" disabled={index === 0} aria-label={`Move ${entry?.title} up`}
              onClick={() => onChange(move(entryIds, index, index - 1))}>Up</button>
            <button type="button" className="secondary-action" disabled={index === entryIds.length - 1}
              aria-label={`Move ${entry?.title} down`} onClick={() => onChange(move(entryIds, index, index + 1))}>Down</button>
          </span>}</li>
      })}</ol>}
      {!!entryIds.length && !readOnly && <button className="ballot-clear-ranking" type="button" onClick={() => onChange([])}>Clear ranking</button>}</>}
  </fieldset>
}

function move(items, from, to) { const result = [...items]; const [item] = result.splice(from, 1); result.splice(to, 0, item); return result }
function selectionText(rule) {
  if (rule.minimumSelections != null && rule.maximumSelections != null) return `${rule.minimumSelections}–${rule.maximumSelections} entries`
  if (rule.maximumSelections != null) return `up to ${rule.maximumSelections} entries`
  return 'one or more entries'
}
