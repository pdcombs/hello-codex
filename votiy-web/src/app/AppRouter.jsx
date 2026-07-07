import { BrowserRouter, Link, Route, Routes, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from '../features/auth/AuthProvider.jsx'
import RegisterPage from '../features/auth/RegisterPage.jsx'
import VerifyEmailPage from '../features/auth/VerifyEmailPage.jsx'
import EventDashboardPage from '../features/events/EventDashboardPage.jsx'
import AppErrorBoundary from './AppErrorBoundary.jsx'

function SiteHeader({ viewer }) {
  return (
    <header className="glass-nav">
      <Link className="brand" to="/" aria-label="Votiy home">
        <span className="brand-mark">V</span>
        <span>VOTIY</span>
      </Link>
      <nav aria-label="Primary navigation">
        <Link to="/">{viewer ? 'My events' : 'Home'}</Link>
        {!viewer && <Link to="/sign-in">Sign in</Link>}
      </nav>
      <span className="system-status">Voting, together</span>
    </header>
  )
}

export function PublicHomePage() {
  return (
    <main className="page-shell">
      <p className="eyebrow">Make every voice count</p>
      <h1>Voting events without the spreadsheet chaos.</h1>
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

export function EventDetailShell() {
  const { publicId } = useParams()
  return (
    <main className="page-shell">
      <Link to="/">← Back to events</Link>
      <p className="eyebrow">Voting event</p>
      <h1>Event details</h1>
      <p>Event reference: {publicId}</p>
      <section aria-labelledby="event-actions">
        <h2 id="event-actions">Event actions</h2>
        <p>Registration and participant actions will live here.</p>
      </section>
    </main>
  )
}

function PlaceholderPage({ title }) {
  return (
    <main className="page-shell">
      <h1>{title}</h1>
      <p>This flow is coming in the next implementation stage.</p>
    </main>
  )
}

export function AppRoutes({ viewer = null, onVerified }) {
  return (
    <div className="app-shell">
      <SiteHeader viewer={viewer} />
      <Routes>
        <Route path="/" element={viewer ? <HostedEventsDashboard viewer={viewer} /> : <PublicHomePage />} />
        <Route path="/events/:publicId" element={<EventDetailShell />} />
        <Route path="/events/new" element={<PlaceholderPage title="Create an event" />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage onVerified={onVerified} />} />
        <Route path="/sign-in" element={<PlaceholderPage title="Sign in" />} />
        <Route path="*" element={<PlaceholderPage title="Page not found" />} />
      </Routes>
    </div>
  )
}

function AuthenticatedRoutes() {
  const { viewer, setViewer } = useAuth()
  return <AppRoutes viewer={viewer} onVerified={setViewer} />
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
