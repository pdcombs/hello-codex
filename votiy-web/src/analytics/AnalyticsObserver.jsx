import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { analytics, classifyAlert, safeButtonAction } from './analytics.js'
import { ANALYTICS_EVENTS, buttonEventName, errorEventName } from './analytics-events.js'

export default function AnalyticsObserver() {
  const location = useLocation()
  const lastPath = useRef(null)

  useEffect(() => {
    if (lastPath.current === location.pathname) return
    lastPath.current = location.pathname
    analytics.send(ANALYTICS_EVENTS.PAGE_VIEW, { pathname: location.pathname })
  }, [location.pathname])

  useEffect(() => {
    const recordAlert = (node) => {
      if (!(node instanceof Element)) return
      const alerts = node.matches('[role="alert"]') ? [node] : node.querySelectorAll('[role="alert"]')
      alerts.forEach((alert) => {
        const errorName = classifyAlert(alert)
        analytics.send(errorEventName(errorName), { pathname: globalThis.location.pathname, errorName })
      })
    }
    const onClick = (event) => {
      const button = event.target?.closest?.('button')
      if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') return
      const actionName = safeButtonAction(button)
      analytics.send(buttonEventName(actionName), { pathname: globalThis.location.pathname, actionName })
    }
    const onUnexpected = () => analytics.send(ANALYTICS_EVENTS.ERROR_UNEXPECTED_APPLICATION, { pathname: globalThis.location.pathname, errorName: 'Unexpected application error' })
    document.addEventListener('click', onClick)
    const observer = new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach(recordAlert)))
    observer.observe(document.body, { childList: true, subtree: true })
    document.querySelectorAll('[role="alert"]').forEach(recordAlert)
    window.addEventListener('error', onUnexpected)
    window.addEventListener('unhandledrejection', onUnexpected)
    return () => {
      document.removeEventListener('click', onClick)
      observer.disconnect()
      window.removeEventListener('error', onUnexpected)
      window.removeEventListener('unhandledrejection', onUnexpected)
    }
  }, [])

  return null
}
