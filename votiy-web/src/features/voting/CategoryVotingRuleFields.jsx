import { FormField } from '../../components/Form.jsx'

export default function CategoryVotingRuleFields({ prefix, value, onChange }) {
  const multiple = value.method === 'MULTIPLE'
  return <div className="voting-method-fields">
    <FormField label="Voting method" htmlFor={`${prefix}-method`}>
      <select id={`${prefix}-method`} value={value.method}
        onChange={(event) => onChange({ ...value, method: event.target.value,
          minimumSelections: event.target.value === 'MULTIPLE' ? (value.minimumSelections ?? 1) : null,
          maximumSelections: event.target.value === 'MULTIPLE' ? (value.maximumSelections ?? 1) : null })}>
        <option value="SINGLE">Choose one</option>
        <option value="MULTIPLE">Choose multiple</option>
        <option value="RANKING">Rank all entries</option>
      </select>
    </FormField>
    {multiple && <div className="voting-bounds">
      <FormField label="Minimum selections" htmlFor={`${prefix}-minimum`}>
        <input id={`${prefix}-minimum`} type="number" min="0" value={value.minimumSelections}
          onChange={(event) => onChange({ ...value, minimumSelections: Number(event.target.value) })} />
      </FormField>
      <FormField label="Maximum selections" htmlFor={`${prefix}-maximum`}>
        <input id={`${prefix}-maximum`} type="number" min="1" value={value.maximumSelections}
          onChange={(event) => onChange({ ...value, maximumSelections: Number(event.target.value) })} />
      </FormField>
    </div>}
  </div>
}
