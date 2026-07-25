import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EventPhoto from '../../src/features/events/EventPhoto.jsx'
import EventPhotoDialog from '../../src/features/events/EventPhotoDialog.jsx'
import { deleteEventPhoto, uploadEventPhoto } from '../../src/features/events/event-photo.http.js'

vi.mock('../../src/features/events/event-photo.http.js', () => ({
  uploadEventPhoto: vi.fn(),
  deleteEventPhoto: vi.fn(),
}))

const event = { id: 'event-1', title: 'Showcase', photo: {
  url: '/event-media/showcase/photo', revision: 1, width: 640, height: 640,
} }

describe('event photo UI', () => {
  beforeEach(() => vi.clearAllMocks())

  it('opens public preview without management and closes with Escape', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><EventPhoto event={event} /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: 'View Showcase photo' }))
    expect(screen.getByRole('dialog')).toBeVisible()
    expect(screen.queryByText('Replace')).not.toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('uploads owner fallback and refreshes', async () => {
    uploadEventPhoto.mockResolvedValue({ photo: event.photo })
    const onChanged = vi.fn()
    const user = userEvent.setup()
    const { container } = render(<MemoryRouter><EventPhoto event={{ ...event, photo: null }}
      owner onChanged={onChanged} /></MemoryRouter>)
    const file = new File(['jpeg'], 'photo.jpg', { type: 'image/jpeg' })
    await user.upload(container.querySelector('input[type=file]'), file)
    expect(uploadEventPhoto).toHaveBeenCalledWith('event-1', file)
    expect(onChanged).toHaveBeenCalled()
  })

  it('replaces and confirms deletion in owner dialog', async () => {
    uploadEventPhoto.mockResolvedValue({ photo: event.photo })
    deleteEventPhoto.mockResolvedValue({ deleted: true })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const onChanged = vi.fn()
    const user = userEvent.setup()
    render(<MemoryRouter><EventPhoto event={event} owner onChanged={onChanged} /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: 'View Showcase photo' }))
    await user.click(screen.getByRole('button', { name: 'Delete photo' }))
    expect(deleteEventPhoto).toHaveBeenCalledWith('event-1')
    vi.restoreAllMocks()
  })

  it('renders explicit dialog owner actions', () => {
    render(<EventPhotoDialog event={event} owner onClose={vi.fn()} onReplace={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Replace')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Delete photo' })).toBeVisible()
  })
})
