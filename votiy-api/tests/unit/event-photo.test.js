import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { ErrorCode } from '../../src/domain/errors.js'
import { EVENT_PHOTO_LIMITS, processEventPhoto } from '../../src/domain/event-photo.js'

describe('event photo processing', () => {
  it('normalizes supported input to bounded metadata-free WebP', async () => {
    const input = await sharp({
      create: { width: 900, height: 600, channels: 3, background: '#58bdf0' },
    }).jpeg().withMetadata({ orientation: 6 }).toBuffer()
    const result = await processEventPhoto(input, 'image/jpeg')
    expect(result.contentType).toBe('image/webp')
    expect(result.width).toBe(600)
    expect(result.height).toBe(600)
    expect(result.byteLength).toBeLessThanOrEqual(EVENT_PHOTO_LIMITS.outputBytes)
    expect([80, 70, 60]).toContain(result.quality)
    expect((await sharp(result.data).metadata()).orientation).toBeUndefined()
  })

  it.each([
    [Buffer.from('broken'), 'image/jpeg', ErrorCode.INVALID_IMAGE],
    [Buffer.from('broken'), 'image/gif', ErrorCode.UNSUPPORTED_IMAGE_TYPE],
    [Buffer.alloc(EVENT_PHOTO_LIMITS.inputBytes + 1), 'image/png', ErrorCode.IMAGE_TOO_LARGE],
  ])('rejects unsafe input', async (bytes, type, code) => {
    await expect(processEventPhoto(bytes, type)).rejects.toMatchObject({ code })
  })
})
