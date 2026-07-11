import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FormField, FormSurface } from '../../components/Form.jsx'
import { useAuth } from './AuthProvider.jsx'
import { signInAccount } from './session.graphql.js'

export default function SignInPage({ signIn = signInAccount }) {
  const [state, setState] = useState({ loading: false, error: null })
  const { setViewer } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  async function submit(event) {
    event.preventDefault()
    setState({ loading: true, error: null })
    const form = new FormData(event.currentTarget)
    try {
      const result = await signIn({ email: form.get('email'), password: form.get('password') })
      setViewer(result.session.account)
      const target = location.state?.from?.pathname?.startsWith('/') ? location.state.from.pathname : '/'
      navigate(target, { replace: true })
    } catch (error) {
      setState({ loading: false, error })
    }
  }
  return (
    <main className="page-shell">
      <h1>Sign in</h1>
      <FormSurface onSubmit={submit}>
        <FormField label="Email" htmlFor="signin-email">
          <input id="signin-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        </FormField>
        <FormField label="Password" htmlFor="signin-password">
          <input id="signin-password" name="password" type="password" autoComplete="current-password" placeholder="Password" required />
        </FormField>
        <button disabled={state.loading}>{state.loading ? 'Signing in…' : 'Sign in'}</button>
      </FormSurface>
      {state.loading && (
        <p className="form-status" role="status">
          Signing in…
        </p>
      )}
      {state.error && (
        <p className="form-error" role="alert">
          {state.error.message}
        </p>
      )}
    </main>
  )
}
