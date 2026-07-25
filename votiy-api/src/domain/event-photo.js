import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { ApplicationError, ErrorCode } from './errors.js'

export const EVENT_PHOTO_LIMITS = Object.freeze({
  inputBytes: 10 * 1024 * 1024,
  outputBytes: 350 * 1024,
  pixels: 40_000_000,
  dimension: 640,
  contentTypes: Object.freeze(['image/jpeg', 'image/png', 'image/webp']),
  qualities: Object.freeze([80, 70, 60]),
})

const formatForType = Object.freeze({ 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' })

export async function processEventPhoto(input, declaredContentType) {
  if (!EVENT_PHOTO_LIMITS.contentTypes.includes(declaredContentType)) {
    throw new ApplicationError(ErrorCode.UNSUPPORTED_IMAGE_TYPE)
  }
  if (!Buffer.isBuffer(input) || input.length === 0 || input.length > EVENT_PHOTO_LIMITS.inputBytes) {
    throw new ApplicationError(ErrorCode.IMAGE_TOO_LARGE)
  }
  let image
  let metadata
  try {
    image = sharp(input, { limitInputPixels: EVENT_PHOTO_LIMITS.pixels, animated: false, failOn: 'warning' })
    metadata = await image.metadata()
  } catch (cause) {
    throw new ApplicationError(ErrorCode.INVALID_IMAGE, { cause })
  }
  if (metadata.format !== formatForType[declaredContentType] || !metadata.width || !metadata.height) {
    throw new ApplicationError(ErrorCode.INVALID_IMAGE)
  }
  const size = Math.min(EVENT_PHOTO_LIMITS.dimension, metadata.width, metadata.height)
  const pipeline = () => sharp(input, { limitInputPixels: EVENT_PHOTO_LIMITS.pixels, animated: false })
    .rotate().resize(size, size, { fit: 'cover', position: 'centre', withoutEnlargement: true })

  for (const quality of EVENT_PHOTO_LIMITS.qualities) {
    try {
      const data = await pipeline().webp({ quality }).toBuffer()
      if (data.length <= EVENT_PHOTO_LIMITS.outputBytes) {
        return Object.freeze({
          data,
          contentType: 'image/webp',
          width: size,
          height: size,
          byteLength: data.length,
          etag: `"${createHash('sha256').update(data).digest('base64url')}"`,
          quality,
        })
      }
    } catch (cause) {
      throw new ApplicationError(ErrorCode.IMAGE_PROCESSING_FAILED, { cause })
    }
  }
  throw new ApplicationError(ErrorCode.IMAGE_PROCESSING_FAILED)
}
