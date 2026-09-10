import { Component } from 'react'
import { analytics } from '../analytics/analytics.js'
import { ANALYTICS_EVENTS } from '../analytics/analytics-events.js'

export default class AppErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, details) {
    analytics.send(ANALYTICS_EVENTS.ERROR_UNEXPECTED_APPLICATION, { pathname: globalThis.location?.pathname, errorName: 'Unexpected application error' })
    this.props.onError?.(error, details)
  }

  render() {
    if (this.state.error) {
      return (
        <main className="page-shell" role="alert" data-analytics-error="Unexpected application error">
          <p className="eyebrow">Something went wrong</p>
          <h1>Votiy hit an unexpected snag.</h1>
          <p>Refresh the page to try again. If this continues, contact support.</p>
          <button type="button" onClick={() => globalThis.location.reload()}>Refresh page</button>
        </main>
      )
    }
    return this.props.children
  }
}
