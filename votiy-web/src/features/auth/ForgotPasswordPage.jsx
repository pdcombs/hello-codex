import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FormField, FormSurface } from '../../components/Form.jsx'
import { requestPasswordReset } from './password-reset.graphql.js'

export default function ForgotPasswordPage({ requester = requestPasswordReset }) {
  const [state, setState] = useState({ loading: false, error: null, accepted: false })
  const navigate = useNavigate()
  async function submit(event) {
    event.preventDefault(); setState({ loading: true, error: null, accepted: false })
    const email = new FormData(event.currentTarget).get('email')
    try {
      const result = await requester({ email })
      if (result.bypassToken) { navigate(`/reset-password?token=${encodeURIComponent(result.bypassToken)}`); return }
      setState({ loading: false, error: null, accepted: true })
    } catch (error) { setState({ loading: false, error, accepted: false }) }
  }
  return <main id="main-content" className="page-shell auth-page" tabIndex="-1">
    <h1 data-page-title="true">Reset your password</h1>
    <p>Enter your account email. If eligible, reset instructions will follow.</p>
    {!state.accepted && <FormSurface onSubmit={submit}>
      <FormField label="Email" htmlFor="reset-request-email" error={state.error?.fieldErrors?.find(({ field }) => field === 'email')?.message}>
        <input id="reset-request-email" name="email" type="email" autoComplete="email" required />
      </FormField>
      <button disabled={state.loading}>{state.loading ? 'Sending…' : 'Send reset instructions'}</button>
    </FormSurface>}
    {state.accepted && <p role="status">If this account is eligible, check its email for reset instructions.</p>}
    {state.error && !state.error.fieldErrors?.length && <p role="alert">{state.error.message}</p>}
    <Link to="/sign-in">Back to sign in</Link>
  </main>
}
