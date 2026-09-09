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
        <section className="analytics-consent" role="dialog" aria-modal="false" aria-label="Cookie preferences">
          <p>We use cookies to improve your experience on our site, analyze site traffic, and personalize content. By clicking Accept you consent to our use of cookies.</p>
          <div className="analytics-consent-actions">
            <button type="button" className="primary-action" onClick={() => choose('accepted')}>Accept</button>
            <button type="button" onClick={() => choose('declined')}>Decline</button>
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
