import sharp from 'sharp'

export async function eventPhotoFixtures() {
  const image = sharp({ create: { width: 900, height: 600, channels: 3, background: '#168bdc' } })
  return {
    jpeg: await image.clone().jpeg().toBuffer(),
    png: await image.clone().png().toBuffer(),
    webp: await image.clone().webp().toBuffer(),
    corrupt: Buffer.from('not-an-image'),
    oversized: Buffer.alloc(10 * 1024 * 1024 + 1),
    highPixelMetadata: { width: 8_000, height: 8_000 },
  }
}
