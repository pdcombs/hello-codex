import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/PageStatus.jsx'
import { loadEventShortLink } from './events.graphql.js'

export default function EventShortLinkRedirect({ loader = loadEventShortLink }) {
  const { shortId } = useParams(); const [state, setState] = useState({ loading: true, publicId: null, error: null })
  useEffect(() => { let active = true
    loader(shortId).then(({ publicId }) => active && setState({ loading: false, publicId, error: null }))
      .catch((error) => active && setState({ loading: false, publicId: null, error }))
    return () => { active = false }
  }, [loader, shortId])
  if (state.loading) return <main id="main-content" className="page-shell"><LoadingState message="Opening event…" /></main>
  if (state.error) return <main id="main-content" className="page-shell"><ErrorState title="Event not found"
    message="This event link is unavailable." /></main>
  return <Navigate to={`/events/${state.publicId}`} replace />
}
