import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resendAccountVerification, verifyAccountEmail } from './account.graphql.js'

const noop = () => {}

export default function VerifyEmailPage({
  token: suppliedToken,
  verifyEmail = verifyAccountEmail,
  resendVerification = resendAccountVerification,
  onVerified = noop,
}) {
  const [parameters] = useSearchParams()
  const token = suppliedToken ?? parameters.get('token') ?? ''
  const [state, setState] = useState({ status: 'loading', error: null })
  const [resendStatus, setResendStatus] = useState('idle')
  const automaticallyVerifiedToken = useRef(null)

  const verify = useCallback(async () => {
    setState({ status: 'loading', error: null })
    try {
      const result = await verifyEmail({ token })
      onVerified(result.session.account)
      setState({ status: 'success', error: null })
    } catch (error) {
      setState({ status: 'error', error })
    }
  }, [onVerified, token, verifyEmail])

  useEffect(() => {
    if (automaticallyVerifiedToken.current === token) return
    automaticallyVerifiedToken.current = token
    verify()
  }, [token, verify])

  async function resend() {
    setResendStatus('loading')
    try {
      await resendVerification()
      setResendStatus('success')
    } catch {
      setResendStatus('error')
    }
  }

  if (state.status === 'loading')
    return (
      <main className="page-shell">
        <p role="status">Verifying your email…</p>
      </main>
    )
  if (state.status === 'success')
    return (
      <main className="page-shell">
        <h1>Email verified</h1>
        <p>Your account is ready.</p>
        <Link to="/">View your events</Link>
      </main>
    )
  const invalid = state.error?.code === 'INVALID_OR_EXPIRED_TOKEN'
  return (
    <main className="page-shell">
      <h1>We could not verify that link</h1>
      <p role="alert">{state.error?.message ?? 'The verification request could not be completed.'}</p>
      {invalid ? (
        <button type="button" onClick={resend} disabled={resendStatus === 'loading'}>
          Send a new verification email
        </button>
      ) : (
        <button type="button" onClick={verify}>
          Try verification again
        </button>
      )}
      {resendStatus === 'success' && <p role="status">A new verification email is on its way.</p>}
      {resendStatus === 'error' && <p role="alert">We could not send a new email. Please try again.</p>}
    </main>
  )
}
