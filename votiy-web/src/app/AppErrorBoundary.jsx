import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, details) {
    this.props.onError?.(error, details)
  }

  render() {
    if (this.state.error) {
      return (
        <main className="page-shell" role="alert">
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
