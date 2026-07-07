import { useRef, useState } from 'react'
import { registerAccount } from './account.graphql.js'

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
          <>
            <label htmlFor="verification-token">Verification token</label>
            <input id="verification-token" type="text" readOnly value={state.verificationToken} />
            <p>Use this token on the verify-email screen to complete the normal verification flow.</p>
          </>
        )}
      </main>
    )

  return (
    <main className="page-shell">
      <h1>Create your account</h1>
      <p>Start hosting clear, organized voting events.</p>
      <form onSubmit={onSubmit} noValidate>
        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          aria-describedby={state.fieldErrors.email ? 'register-email-error' : undefined}
          required
        />
        {state.fieldErrors.email && <p id="register-email-error">{state.fieldErrors.email}</p>}
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          aria-describedby={state.fieldErrors.password ? 'register-password-error' : undefined}
          required
        />
        {state.fieldErrors.password && <p id="register-password-error">{state.fieldErrors.password}</p>}
        <button type="submit" disabled={state.status === 'loading'}>
          {state.status === 'loading' ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      {state.status === 'loading' && <p role="status">Creating your account…</p>}
      {state.status === 'error' && Object.keys(state.fieldErrors).length === 0 && (
        <div role="alert">
          <p>{state.error.message}</p>
          <button type="button" onClick={() => submit(lastInput.current)}>
            Try again
          </button>
        </div>
      )}
    </main>
  )
}
