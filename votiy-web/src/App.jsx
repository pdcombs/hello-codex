import { useState } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('Hello, World!')
  const [isLoading, setIsLoading] = useState(false)

  async function getMessage() {
    setIsLoading(true)

    try {
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'votiy-web',
        },
        body: JSON.stringify({ query: '{ message }' }),
      })
      const result = await response.json()

      if (!response.ok || result.errors) throw new Error('API request failed')
      setMessage(result.data.message)
    } catch {
      setMessage('Connection offline')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="glass-nav">
        <a className="brand" href="#top" aria-label="Votiy home">
          <span className="brand-mark">V</span>
          <span>VOTIY</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#machine">Machine</a>
          <a href="#collection">Collection</a>
          <a href="#signal">Signal</a>
        </nav>
        <div className="system-status"><span /> Online</div>
      </header>

      <main id="top">
        <section className="hero" id="machine">
          <img
            className="hero-image"
            src="/black-911-hero.jpg"
            alt="Black classic sports car in a dark industrial warehouse"
          />
          <div className="hero-shade" />
          <div className="hero-copy">
            <p className="eyebrow">The black collection / 001</p>
            <h1>Midnight<br />is a color.</h1>
            <p>Form, history, and machinery—revealed by the smallest amount of light.</p>
          </div>
          <div className="hero-glass glass-panel">
            <div className="glass-row">
              <span>Profile</span>
              <strong>Air-cooled</strong>
            </div>
            <div className="glass-row">
              <span>Finish</span>
              <strong>Onyx black</strong>
            </div>
            <div className="glass-row">
              <span>Environment</span>
              <strong>Low light</strong>
            </div>
          </div>
          <a className="scroll-cue" href="#collection">
            <span>Explore</span><span aria-hidden="true">↓</span>
          </a>
        </section>

        <section className="collection-section" id="collection">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Private collection</p>
              <h2>Icons live forever.</h2>
            </div>
            <p>One silhouette. Decades of evolution. A room dedicated to the details that refuse to age.</p>
          </div>

          <div className="gallery-frame">
            <img
              src="/black-911-gallery.jpg"
              alt="Collection of black classic sports cars in a dark modern garage"
            />
            <div className="gallery-card glass-panel">
              <span className="card-index">02</span>
              <div>
                <p className="card-kicker">The archive</p>
                <h3>Timeless by design.</h3>
                <p>Every curve is familiar. Every reflection tells a different story.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="signal-section" id="signal">
          <div className="signal-intro">
            <p className="eyebrow">Connected experience</p>
            <h2>A signal from<br />the machine.</h2>
          </div>
          <div className="signal-console glass-panel">
            <div className="console-topline">
              <span><i /> Database live</span>
              <span>GraphQL / 01</span>
            </div>
            <p className="signal-word" aria-live="polite">{message}</p>
            <div className="console-actions">
              <p>Generate a new transmission from the connected word collection.</p>
              <button type="button" onClick={getMessage} disabled={isLoading}>
                <span>{isLoading ? 'Transmitting…' : 'Generate signal'}</span>
                <span className="button-arrow" aria-hidden="true">↗</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <span>Votiy</span>
        <span>React / GraphQL / MongoDB</span>
      </footer>
    </div>
  )
}

export default App
