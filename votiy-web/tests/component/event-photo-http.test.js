import { afterEach, describe, expect, it, vi } from 'vitest'
import { deleteEventPhoto, uploadEventPhoto } from '../../src/features/events/event-photo.http.js'

describe('event photo HTTP client', () => {
  afterEach(() => vi.restoreAllMocks())

  it('uploads raw file and deletes with same-origin credentials', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ photo: { revision: 1 } }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ deleted: true }), { status: 200 }))
    const file = new File(['jpeg'], 'photo.jpg', { type: 'image/jpeg' })
    await expect(uploadEventPhoto('event-1', file)).resolves.toMatchObject({ photo: { revision: 1 } })
    await expect(deleteEventPhoto('event-1')).resolves.toMatchObject({ deleted: true })
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'PUT', credentials: 'same-origin', body: file })
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'DELETE', credentials: 'same-origin' })
  })

  it('surfaces safe server errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ code: 'INVALID_IMAGE', message: 'Choose another image.' }), { status: 400 }),
    )
    await expect(uploadEventPhoto('event-1', new File(['bad'], 'bad.jpg', { type: 'image/jpeg' })))
      .rejects.toMatchObject({ message: 'Choose another image.', code: 'INVALID_IMAGE' })
  })
})
