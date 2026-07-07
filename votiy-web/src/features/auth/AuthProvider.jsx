import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loadViewer } from './account.graphql.js'

const AuthContext = createContext(null)

export function AuthProvider({ children, initialViewer = null, viewerLoader = loadViewer }) {
  const [viewer, setViewer] = useState(initialViewer)
  useEffect(() => {
    if (initialViewer) return
    let active = true
    viewerLoader()
      .then(({ session }) => {
        if (active) setViewer(session.account)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [initialViewer, viewerLoader])
  const value = useMemo(() => ({ viewer, setViewer }), [viewer])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components -- Context hooks intentionally share their provider module.
export function useAuth() {
  return useContext(AuthContext) ?? { viewer: null, setViewer: noop }
}

const noop = () => {}
