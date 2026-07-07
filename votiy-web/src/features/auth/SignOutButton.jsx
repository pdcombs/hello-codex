import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthProvider.jsx'
import { signOutAccount } from './session.graphql.js'

export default function SignOutButton({ signOut = signOutAccount }) {
  const [loading, setLoading] = useState(false)
  const { setViewer } = useAuth()
  const navigate = useNavigate()
  async function leave() {
    setLoading(true)
    try {
      await signOut()
    } finally {
      setViewer(null)
      navigate('/', { replace: true })
    }
  }
  return (
    <button type="button" disabled={loading} onClick={leave}>
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
