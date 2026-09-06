import { useEffect, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { updateEventShortId } from './events.graphql.js'

const QR_URL_PREFIX = 'https://www.votiy.com/'

export default function EventShortLinkEditor({ event, saver = updateEventShortId, onSaved }) {
  const [shortId, setShortId] = useState(event.shortId ?? event.publicId)
  const [state, setState] = useState({ saving: false, error: null, saved: false })
  const [downloadError, setDownloadError] = useState(null)
  const qrCanvasRef = useRef(null)
  useEffect(() => setShortId(event.shortId ?? event.publicId), [event.shortId, event.publicId])
  const host = globalThis.location?.host || 'Votiy.com'
  const savedShortId = event.shortId ?? event.publicId
  const qrUrl = `${QR_URL_PREFIX}${savedShortId}`
  const hasUnsavedChanges = shortId.trim().toLowerCase() !== savedShortId.trim().toLowerCase()
  async function submit(submitEvent) {
    submitEvent.preventDefault(); setState({ saving: true, error: null, saved: false })
    try {
      const result = await saver({ eventId: event.id, shortId: shortId.trim().toLowerCase(),
        expectedUpdatedAt: event.updatedAt })
      setState({ saving: false, error: null, saved: true }); await onSaved(result.event)
    } catch (error) { setState({ saving: false, error, saved: false }) }
  }
  const message = state.error?.code === 'SHORT_LINK_TAKEN' ? 'This short URL is already taken.'
    : state.error?.code === 'SHORT_LINK_RESERVED' ? 'This short URL is protected and cannot be used.'
      : state.error?.fieldErrors?.find(({ field }) => field === 'shortId')?.message ?? state.error?.message
  async function downloadQrCode() {
    setDownloadError(null)
    try {
      if (!qrCanvasRef.current) throw new Error('QR canvas unavailable')
      const filename = `votiy-${savedShortId.replaceAll(/[^a-zA-Z0-9_-]/g, '-')}-qr.png`
      const dataUrl = qrCanvasRef.current.toDataURL('image/png')
      const encodedPng = dataUrl.split(',')[1]
      if (!encodedPng) throw new Error('QR PNG unavailable')
      const bytes = Uint8Array.from(atob(encodedPng), (character) => character.charCodeAt(0))
      const file = new File([bytes], filename, { type: 'image/png' })
      const shareData = { files: [file], title: `${event.title ?? 'Event'} QR code` }
      if (navigator.share && navigator.canShare?.(shareData)) {
        try { await navigator.share(shareData) }
        catch (error) { if (error.name !== 'AbortError') throw error }
        return
      }
      const objectUrl = URL.createObjectURL(file)
      const link = document.createElement('a')
      link.download = filename
      link.href = objectUrl
      document.body.append(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
    } catch {
      setDownloadError('QR code could not be downloaded. Please try again.')
    }
  }
  return <section className="section-card event-short-link-settings" aria-labelledby="event-short-link-title">
    <h2 id="event-short-link-title">Event short URL</h2>
    <form className="app-form" onSubmit={submit}>
      <label className="short-link-field" htmlFor="event-short-id"><span>Event Short Url: {host}/</span>
        <input id="event-short-id" value={shortId} maxLength="50" autoCapitalize="none" autoCorrect="off"
          spellCheck={false} disabled={event.lifecycleStatus === 'ARCHIVED' || state.saving}
          onChange={(inputEvent) => setShortId(inputEvent.target.value.toLowerCase())} /></label>
      {message && <p role="alert">{message}</p>}
      {state.saved && <p role="status">Short URL saved.</p>}
      {downloadError && <p role="alert">{downloadError}</p>}
      {hasUnsavedChanges && <p className="short-link-qr-notice">Save short URL before downloading a QR code for the new address.</p>}
      <div className="short-link-actions">
        {event.lifecycleStatus !== 'ARCHIVED' && <button className="primary-action" disabled={state.saving}>
          {state.saving ? 'Saving…' : 'Save short URL'}</button>}
        <button type="button" className="secondary-action" onClick={downloadQrCode}>Download QR Code</button>
      </div>
    </form>
    <div className="short-link-qr-preview">
      <QRCodeCanvas ref={qrCanvasRef} value={qrUrl} size={196} level="M" marginSize={2}
        title={`QR code for ${qrUrl}`} />
      <p>QR destination</p>
      <code>{qrUrl}</code>
    </div>
  </section>
}
