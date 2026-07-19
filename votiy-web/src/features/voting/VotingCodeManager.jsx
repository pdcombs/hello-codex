import { useEffect, useState } from 'react'
import { FormField, FormSurface } from '../../components/Form.jsx'
import { generateVotingCodes, loadVotingCodes } from './voting.graphql.js'

export default function VotingCodeManager({ eventId, generator = generateVotingCodes, loader = loadVotingCodes }) {
  const [quantity, setQuantity] = useState(10)
  const [state, setState] = useState({ status: 'loading', codes: [], nextCursor: null, error: null })
  async function load(after = null) {
    try { const result = await loader(eventId, 50, after)
      setState((current) => ({ status: 'success', codes: after ? [...current.codes, ...result.nodes] : result.nodes,
        nextCursor: result.nextCursor, error: null })) }
    catch (error) { setState((current) => ({ ...current, status: 'error', error })) }
  }
  useEffect(() => { load() }, [eventId]) // eslint-disable-line react-hooks/exhaustive-deps
  async function generate(event) {
    event.preventDefault(); setState((current) => ({ ...current, status: 'generating', error: null }))
    try { await generator({ eventId, quantity: Number(quantity), idempotencyKey: crypto.randomUUID() }); await load() }
    catch (error) { setState((current) => ({ ...current, status: 'error', error })) }
  }
  return <section className="voting-code-manager" aria-labelledby="voting-codes-title">
    <h2 id="voting-codes-title">Voting codes</h2>
    <FormSurface onSubmit={generate}>
      <FormField label="Number of codes" htmlFor="voting-code-quantity"><input id="voting-code-quantity" type="number"
        min="1" max="1000" required value={quantity} onChange={(e) => setQuantity(e.target.value)} /></FormField>
      <button className="primary-action" disabled={state.status === 'generating'}>
        {state.status === 'generating' ? 'Generating…' : 'Generate codes'}</button>
    </FormSurface>
    {state.error && <p role="alert">{state.error.message}</p>}
    {state.status === 'loading' && <p>Loading codes…</p>}
    {state.status !== 'loading' && state.codes.length === 0 && <p>No voting codes generated yet.</p>}
    {state.codes.length > 0 && <ul className="voting-code-list">{state.codes.map((code) => <li key={code.id}>
      <code>{code.code}</code><span>{code.status === 'USED' ? 'Used' : 'Unused'}</span>
      {code.claimantDisplayName && <span>{code.claimantDisplayName}</span>}
      {code.claimantEmail && <span>{code.claimantEmail}</span>}
    </li>)}</ul>}
    {state.nextCursor && <button className="secondary-action" onClick={() => load(state.nextCursor)}>Load more</button>}
  </section>
}
