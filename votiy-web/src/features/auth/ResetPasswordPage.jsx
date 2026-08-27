import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FormField, FormSurface } from '../../components/Form.jsx'
import { inspectPasswordReset, resetPassword } from './password-reset.graphql.js'

export default function ResetPasswordPage({ inspector = inspectPasswordReset, resetter = resetPassword }) {
  const [params] = useSearchParams(); const token = params.get('token') ?? ''; const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, submitting: false, inspection: null, error: null, fields: {} })
  useEffect(() => { let active = true; inspector({ token }).then((inspection) => active && setState((s) => ({ ...s, loading: false, inspection })))
    .catch((error) => active && setState((s) => ({ ...s, loading: false, error }))); return () => { active = false } }, [token, inspector])
  async function submit(event) {
    event.preventDefault(); const form = new FormData(event.currentTarget)
    const input = { token, password: form.get('password'), passwordConfirmation: form.get('passwordConfirmation') }
    if (input.password !== input.passwordConfirmation) {
      setState((s) => ({ ...s, fields: { passwordConfirmation: 'Passwords must match.' } })); return
    }
    setState((s) => ({ ...s, submitting: true, error: null, fields: {} }))
    try { await resetter(input); navigate('/sign-in', { replace: true, state: { passwordReset: true } }) }
    catch (error) { setState((s) => ({ ...s, submitting: false, error,
      fields: Object.fromEntries((error.fieldErrors ?? []).map(({ field, message }) => [field, message])) })) }
  }
  if (state.loading) return <main id="main-content" className="page-shell"><p role="status">Checking reset link…</p></main>
  if (state.error && !state.inspection) return <main id="main-content" className="page-shell auth-page">
    <h1 data-page-title="true">Reset link unavailable</h1><p role="alert">This reset link is invalid or expired.</p>
    <Link to="/forgot-password">Request another reset</Link></main>
  return <main id="main-content" className="page-shell auth-page" tabIndex="-1">
    <h1 data-page-title="true">Choose a new password</h1>
    <p>Account: <strong>{state.inspection.email}</strong></p>
    <FormSurface onSubmit={submit}>
      <FormField label="New password" htmlFor="new-password" error={state.fields.password}>
        <input id="new-password" name="password" type="password" autoComplete="new-password" minLength="12" maxLength="128" required />
      </FormField>
      <p className="form-help">Use 12–128 characters.</p>
      <FormField label="Confirm new password" htmlFor="confirm-new-password" error={state.fields.passwordConfirmation}>
        <input id="confirm-new-password" name="passwordConfirmation" type="password" autoComplete="new-password" minLength="12" maxLength="128" required />
      </FormField>
      <button disabled={state.submitting}>{state.submitting ? 'Resetting…' : 'Reset password'}</button>
    </FormSurface>
    {state.error && <p role="alert">{state.error.message}</p>}
  </main>
}
