import { useEffect, useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/PageStatus.jsx'
import EventWorkspaceLayout from './EventWorkspaceLayout.jsx'
import { loadEventVotingResults } from '../voting/voting.graphql.js'

export default function OwnerEventResultsPage({ loader = loadEventVotingResults, workspace = false }) {
  const { publicId } = useParams()
  const outlet = useOutletContext()
  const [state, setState] = useState({ status: 'loading', results: null, error: null })
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setState((current) => ({ status: 'loading', results: current.results, error: null }))
    loader(publicId, { signal: controller.signal })
      .then((results) => setState({ status: 'success', results, error: null }))
      .catch((error) => { if (error.name !== 'AbortError') setState({ status: 'error', results: null, error }) })
    return () => controller.abort()
  }, [loader, publicId, revision])
  async function reloadEvent() {
    setRevision((value) => value + 1)
  }
  if (state.status === 'loading') return workspace ? <LoadingState message="Loading results…" />
    : <main id="main-content" className="page-shell"><LoadingState message="Loading event…" /></main>
  if (state.status === 'error') {
    const content = <>
    <ErrorState title="Results unavailable" message={state.error.message} />
    <button className="secondary-action results-retry" type="button" onClick={reloadEvent}>Try again</button>
    </>
    return workspace ? content : <main id="main-content" className="page-shell">{content}</main>
  }
  const results = state.results
  const content =
      <section className="voting-results" aria-labelledby="results-title">
        <header className="voting-results-header">
          <div><p className="eyebrow">Review results</p><h2 id="results-title">Voting results</h2></div>
          <div className="votes-received" aria-label={`${results.votesReceived} votes received`}>
            <strong>{results.votesReceived}</strong><span>Votes received</span>
          </div>
        </header>
        {results.votesReceived === 0 && <p className="results-empty" role="status">No votes received yet.</p>}
        <div className="voting-result-categories">
          {results.categories.map((category) => <section className="voting-result-category" key={category.categoryId}
            aria-labelledby={`result-category-${category.categoryId}`}>
            <div className="voting-result-category-head">
              <h3 id={`result-category-${category.categoryId}`}>{category.categoryTitle}</h3>
              <span>{category.method === 'RANKING' ? 'Rank points' : 'Selections'}</span>
            </div>
            {category.entries.length === 0 ? <p className="results-empty">No entries in this category.</p>
              : <ol className="voting-result-entries">
                {category.entries.map((entry) => <li key={entry.entryId} className={entry.winner ? 'winner' : undefined}>
                  <span className="result-entry-title">{entry.winner && <span aria-label="Winner">★</span>} {entry.entryTitle}</span>
                  <strong aria-label={`${entry.total} ${category.method === 'RANKING' ? 'points' : 'selections'}`}>{entry.total}</strong>
                </li>)}
              </ol>}
          </section>)}
        </div>
      </section>
  if (workspace) return content
  return <main id="main-content" className="page-shell">
    <EventWorkspaceLayout event={results.event ?? outlet?.event} onChanged={reloadEvent}>{content}</EventWorkspaceLayout>
  </main>
}
