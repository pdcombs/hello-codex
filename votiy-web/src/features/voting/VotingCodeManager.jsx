import { useEffect, useState } from 'react'
import { FormField, FormSurface } from '../../components/Form.jsx'
import { generateVotingCodes, loadVotingCodeExport, loadVotingCodes } from './voting.graphql.js'
import { downloadVotingCodes } from './voting-code-csv.js'

export default function VotingCodeManager({ eventId, eventTitle = 'event', generator = generateVotingCodes,
  loader = loadVotingCodes, exportLoader = loadVotingCodeExport, downloader = downloadVotingCodes }) {
  const [quantity, setQuantity] = useState(10)
  const [state, setState] = useState({ status: 'loading', codes: [], nextCursor: null, summary: null, error: null })
  async function load(after = null) {
    try { const result = await loader(eventId, 50, after)
      setState((current) => ({ status: 'success', codes: after ? [...current.codes, ...result.nodes] : result.nodes,
        nextCursor: result.nextCursor, summary: result.summary, error: null })) }
    catch (error) { setState((current) => ({ ...current, status: 'error', error })) }
  }
  useEffect(() => { load() }, [eventId]) // eslint-disable-line react-hooks/exhaustive-deps
  async function generate(event) {
    event.preventDefault(); setState((current) => ({ ...current, status: 'generating', error: null }))
    try { await generator({ eventId, quantity: Number(quantity), idempotencyKey: crypto.randomUUID() }); await load() }
    catch (error) { setState((current) => ({ ...current, status: 'error', error })) }
  }
  async function exportCodes() {
    setState((current) => ({ ...current, status: 'exporting', error: null }))
    try { downloader(await exportLoader(eventId), eventTitle)
      setState((current) => ({ ...current, status: 'success' })) }
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
    {state.summary && <div className="voting-code-summary" aria-label="Voting code totals">
      <div><strong>{state.summary.usedCount}</strong><span>Used</span></div>
      <div><strong>{state.summary.availableCount}</strong><span>Available</span></div>
    </div>}
    {state.status !== 'loading' && state.codes.length === 0 && <p>No voting codes generated yet.</p>}
    {state.codes.length > 0 && <><div className="voting-code-toolbar"><button className="secondary-action" type="button"
      disabled={state.status === 'exporting'} onClick={exportCodes}>
      {state.status === 'exporting' ? 'Exporting…' : 'Export codes CSV'}</button></div>
    <div className="voting-code-table-wrap"><table className="voting-code-table">
      <thead><tr><th>Code</th><th>Status</th><th>Used at</th><th>Claimant</th></tr></thead>
      <tbody>{state.codes.map((code) => <tr key={code.id}>
        <td><code>{code.code}</code></td><td><span className={`code-status code-status-${code.status.toLowerCase()}`}>
          {code.status === 'USED' ? 'Used' : code.status === 'REVOKED' ? 'Revoked' : 'Unused'}</span></td>
        <td>{code.usedAt ? new Date(code.usedAt).toLocaleString() : '—'}</td>
        <td>{code.claimantDisplayName || code.claimantEmail ? <>{code.claimantDisplayName && <span>{code.claimantDisplayName}</span>}
          {code.claimantEmail && <small>{code.claimantEmail}</small>}</> : '—'}</td>
      </tr>)}</tbody>
    </table></div></>}
    {state.nextCursor && <button className="secondary-action" onClick={() => load(state.nextCursor)}>Load more</button>}
  </section>
}
