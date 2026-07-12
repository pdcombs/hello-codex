import { useRef, useState } from 'react'
import { FormField, FormSurface } from '../../components/Form.jsx'
import { registerAccount } from './account.graphql.js'
import { features } from '../../config/features.js'

export default function RegisterPage({ register = registerAccount }) {
  const [state, setState] = useState({
    status: 'idle',
    error: null,
    fieldErrors: {},
    account: null,
    verificationToken: null,
  })
  const lastInput = useRef(null)

  async function submit(input) {
    lastInput.current = input
    setState({ status: 'loading', error: null, fieldErrors: {}, account: null, verificationToken: null })
    try {
      const result = await register(input)
      setState({
        status: 'success',
        error: null,
        fieldErrors: {},
        account: result.account,
        verificationToken: result.verificationToken ?? null,
      })
    } catch (error) {
      const fieldErrors = Object.fromEntries((error.fieldErrors ?? []).map((item) => [item.field, item.message]))
      setState({ status: 'error', error, fieldErrors, account: null, verificationToken: null })
    }
  }

  function onSubmit(event) {
    event.preventDefault()
    if (state.status === 'loading') return
    const form = new FormData(event.currentTarget)
    submit({
      ...(features.eventSetup ? { displayName: form.get('displayName') } : {}),
      email: form.get('email'),
      password: form.get('password'),
      idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-0000-4000-8000-000000000000`,
    })
  }

  if (state.status === 'success')
    return (
      <main className="page-shell">
        <h1>{state.verificationToken ? 'Use your test verification token' : 'Check your email'}</h1>
        <p>
          {state.verificationToken
            ? `Verification delivery was bypassed for ${state.account.email}.`
            : `We sent a verification link to ${state.account.email}.`}
        </p>
        {state.verificationToken && (
          <FormSurface as="div">
            <FormField label="Verification token" htmlFor="verification-token">
              <input id="verification-token" type="text" readOnly value={state.verificationToken} />
            </FormField>
            <p>Use this token on the verify-email screen to complete the normal verification flow.</p>
          </FormSurface>
        )}
      </main>
    )

  return (
    <main className="page-shell">
      <h1>Create your account</h1>
      <p>Start hosting clear, organized voting events.</p>
      <FormSurface onSubmit={onSubmit} noValidate>
        {features.eventSetup && (
          <FormField label="Display name" htmlFor="register-display-name" error={state.fieldErrors.displayName}>
            <input id="register-display-name" name="displayName" type="text" autoComplete="name" required />
          </FormField>
        )}
        <FormField label="Email" htmlFor="register-email" error={state.fieldErrors.email}>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </FormField>
        <FormField label="Password" htmlFor="register-password" error={state.fieldErrors.password}>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Minimum 8 characters"
            required
          />
        </FormField>
        <button type="submit" disabled={state.status === 'loading'}>
          {state.status === 'loading' ? 'Creating account…' : 'Create account'}
        </button>
      </FormSurface>
      {state.status === 'loading' && (
        <p className="form-status" role="status">
          Creating your account…
        </p>
      )}
      {state.status === 'error' && Object.keys(state.fieldErrors).length === 0 && (
        <div className="form-alert" role="alert">
          <p>{state.error.message}</p>
          <button type="button" onClick={() => submit(lastInput.current)}>
            Try again
          </button>
        </div>
      )}
    </main>
  )
}
