import { createContext, useContext, useEffect, useState } from 'react'
import { analytics, CONSENT_KEY, readConsent } from './analytics.js'

const ConsentContext = createContext(null)

export function AnalyticsConsentProvider({ children }) {
  const [preference, setPreference] = useState(() => readConsent())
  const [open, setOpen] = useState(preference === 'undecided')

  useEffect(() => { analytics.initialize(preference) }, [preference])

  const choose = (status) => {
    try { localStorage.setItem(CONSENT_KEY, status) } catch { /* preference remains usable for this session */ }
    setPreference(status)
    analytics.updateConsent(status)
    setOpen(false)
  }

  return (
    <ConsentContext.Provider value={{ preference, openPreferences: () => setOpen(true) }}>
      {children}
      {open && (
        <section className="analytics-consent" role="dialog" aria-modal="false" aria-labelledby="analytics-consent-title">
          <h2 id="analytics-consent-title">Analytics preferences</h2>
          <p>Votiy uses Google Analytics to understand visits, page use, button actions, and general errors. We never send voting codes, ballots, form entries, account details, or event identifiers.</p>
          <p>Cookieless measurements may be sent before your choice. Accepting allows analytics storage; declining keeps it disabled.</p>
          <div className="analytics-consent-actions">
            <button type="button" onClick={() => choose('accepted')}>Accept analytics</button>
            <button type="button" onClick={() => choose('declined')}>Decline analytics</button>
          </div>
        </section>
      )}
    </ConsentContext.Provider>
  )
}

export function useAnalyticsConsent() {
  const value = useContext(ConsentContext)
  return value ?? { preference: 'undecided', openPreferences: () => {} }
}
