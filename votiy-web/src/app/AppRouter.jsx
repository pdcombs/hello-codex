import { useEffect } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from '../features/auth/AuthProvider.jsx'
import RegisterPage from '../features/auth/RegisterPage.jsx'
import SignInPage from '../features/auth/SignInPage.jsx'
import SignOutButton from '../features/auth/SignOutButton.jsx'
import VerifyEmailPage from '../features/auth/VerifyEmailPage.jsx'
import CreateEventPage from '../features/events/CreateEventPage.jsx'
import EventDashboardPage from '../features/events/EventDashboardPage.jsx'
import EventPage from '../features/events/EventPage.jsx'
import OwnerEventPage from '../features/events/OwnerEventPage.jsx'
import AppErrorBoundary from './AppErrorBoundary.jsx'

function SiteHeader({ viewer }) {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="glass-nav">
        <Link className="brand" to="/" aria-label="Votiy home">
          <span className="brand-mark">V</span>
          <span>VOTIY</span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link to="/">{viewer ? 'My events' : 'Home'}</Link>
          {viewer && <Link to="/events/new">Create event</Link>}
          {!viewer && <Link to="/sign-in">Sign in</Link>}
          {viewer && <SignOutButton />}
        </nav>
        <span className="system-status">Voting, together</span>
      </header>
    </>
  )
}

export function PublicHomePage() {
  return (
    <main id="main-content" className="page-shell" tabIndex="-1">
      <p className="eyebrow">Make every voice count</p>
      <h1 data-page-title="true">Voting events without the spreadsheet chaos.</h1>
      <p>Create an event, register participants, and keep every decision in one clear place.</p>
      <div className="page-actions">
        <Link to="/register">Create your account</Link>
        <Link to="/sign-in">Sign in</Link>
      </div>
    </main>
  )
}

export function HostedEventsDashboard({ viewer }) {
  return <EventDashboardPage viewer={viewer} />
}

export function EventDetailShell({ viewer }) {
  return viewer ? <OwnerEventPage viewer={viewer} /> : <EventPage viewer={viewer} />
}

function PlaceholderPage({ title }) {
  return (
    <main className="page-shell">
      <h1>{title}</h1>
      <p>This flow is coming in the next implementation stage.</p>
    </main>
  )
}

function Protected({ viewer, children }) {
  const location = useLocation()
  return viewer ? children : <Navigate to="/sign-in" replace state={{ from: location }} />
}

export function AppRoutes({ viewer = null, onVerified }) {
  return (
    <div className="app-shell">
      <SiteHeader viewer={viewer} />
      <Routes>
        <Route path="/" element={viewer ? <HostedEventsDashboard viewer={viewer} /> : <PublicHomePage />} />
        <Route path="/events/:publicId" element={<EventDetailShell viewer={viewer} />} />
        <Route
          path="/events/new"
          element={
            <Protected viewer={viewer}>
              <CreateEventPage />
            </Protected>
          }
        />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage onVerified={onVerified} />} />
        <Route path="/sign-in" element={viewer ? <Navigate to="/" replace /> : <SignInPage />} />
        <Route path="*" element={<PlaceholderPage title="Page not found" />} />
      </Routes>
    </div>
  )
}

function AuthenticatedRoutes() {
  const { viewer, setViewer } = useAuth()
  useRouteFocus()
  return <AppRoutes viewer={viewer} onVerified={setViewer} />
}

function useRouteFocus() {
  const location = useLocation()
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const target = document.querySelector('[data-page-title="true"]') ?? document.getElementById('main-content')
      target?.focus?.()
    })
    return () => cancelAnimationFrame(frame)
  }, [location.pathname, location.search])
}

export default function AppRouter({ viewer = null }) {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AuthProvider initialViewer={viewer}>
          <AuthenticatedRoutes />
        </AuthProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  )
}
