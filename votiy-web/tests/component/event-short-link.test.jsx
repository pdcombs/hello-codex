import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import EventShortLinkEditor from '../../src/features/events/EventShortLinkEditor.jsx'
import EventShortLinkRedirect from '../../src/features/events/EventShortLinkRedirect.jsx'

vi.mock('qrcode.react', async () => {
  const { forwardRef } = await vi.importActual('react')
  return { QRCodeCanvas: forwardRef(function MockQrCode({ value, ...props }, ref) {
    return <canvas ref={ref} data-qr-value={value} {...props} />
  }) }
})

const event = { id: 'event-1', publicId: 'Public_1', shortId: 'Public_1', updatedAt: '2030-01-01T00:00:00Z',
  lifecycleStatus: 'ACTIVE' }

afterEach(() => {
  delete navigator.canShare
  delete navigator.share
})

describe('event short link UI', () => {
  it('lowercases and saves host alias', async () => {
    const saver = vi.fn().mockResolvedValue({ event: { ...event, shortId: 'my-event' } })
    render(<EventShortLinkEditor event={event} saver={saver} onSaved={vi.fn()} />)
    const input = screen.getByLabelText(/Event Short Url:/)
    await userEvent.clear(input); await userEvent.type(input, 'My-Event')
    expect(input).toHaveValue('my-event')
    await userEvent.click(screen.getByRole('button', { name: 'Save short URL' }))
    expect(saver).toHaveBeenCalledWith({ eventId: 'event-1', shortId: 'my-event', expectedUpdatedAt: event.updatedAt })
  })

  it('redirects resolved alias to canonical event route', async () => {
    render(<MemoryRouter initialEntries={['/my-event']}><Routes>
      <Route path="/:shortId" element={<EventShortLinkRedirect loader={vi.fn().mockResolvedValue({ publicId: 'Public_1' })} />} />
      <Route path="/events/:publicId" element={<h1>Canonical event</h1>} />
    </Routes></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Canonical event' })).toBeVisible()
  })

  it('shows taken message', async () => {
    const error = Object.assign(new Error('Conflict'), { code: 'SHORT_LINK_TAKEN' })
    render(<EventShortLinkEditor event={event} saver={vi.fn().mockRejectedValue(error)} onSaved={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save short URL' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('already taken')
  })

  it('renders and shares saved short URL as named PNG on supported mobile browsers', async () => {
    const toDataURL = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL')
      .mockReturnValue('data:image/png;base64,cXI=')
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: vi.fn(() => true) })
    Object.defineProperty(navigator, 'share', { configurable: true, value: share })

    render(<EventShortLinkEditor event={{ ...event, shortId: 'my-event' }} saver={vi.fn()} onSaved={vi.fn()} />)

    expect(screen.getByTitle('QR code for https://www.votiy.com/my-event'))
      .toHaveAttribute('data-qr-value', 'https://www.votiy.com/my-event')
    expect(screen.getByText('https://www.votiy.com/my-event')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Download QR Code' }))

    expect(toDataURL).toHaveBeenCalledWith('image/png')
    expect(share).toHaveBeenCalledOnce()
    const sharedFile = share.mock.calls[0][0].files[0]
    expect(sharedFile).toBeInstanceOf(File)
    expect(sharedFile.name).toBe('votiy-my-event-qr.png')
    expect(sharedFile.type).toBe('image/png')
  })

  it('treats closing the native share sheet as cancellation, not failure', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,cXI=')
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: vi.fn(() => true) })
    Object.defineProperty(navigator, 'share', { configurable: true,
      value: vi.fn().mockRejectedValue(new DOMException('Cancelled', 'AbortError')) })
    render(<EventShortLinkEditor event={{ ...event, shortId: 'my-event' }} saver={vi.fn()} onSaved={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Download QR Code' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('keeps QR bound to saved alias until new alias is saved', async () => {
    const { rerender } = render(<EventShortLinkEditor event={{ ...event, shortId: 'saved-event' }}
      saver={vi.fn()} onSaved={vi.fn()} />)
    const input = screen.getByLabelText(/Event Short Url:/)

    await userEvent.clear(input); await userEvent.type(input, 'new-event')

    expect(screen.getByText(/Save short URL before downloading a QR code for the new address/)).toBeVisible()
    expect(screen.getByTitle('QR code for https://www.votiy.com/saved-event'))
      .toHaveAttribute('data-qr-value', 'https://www.votiy.com/saved-event')

    rerender(<EventShortLinkEditor event={{ ...event, shortId: 'new-event' }} saver={vi.fn()} onSaved={vi.fn()} />)
    expect(screen.getByTitle('QR code for https://www.votiy.com/new-event'))
      .toHaveAttribute('data-qr-value', 'https://www.votiy.com/new-event')
  })

  it('shows an actionable error when PNG generation fails', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(() => {
      throw new Error('Canvas unavailable')
    })
    render(<EventShortLinkEditor event={{ ...event, shortId: 'my-event' }} saver={vi.fn()} onSaved={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Download QR Code' }))

    expect(screen.getByRole('alert')).toHaveTextContent('QR code could not be downloaded. Please try again.')
  })
})
