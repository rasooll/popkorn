import { describe, it, expect } from 'vitest'
import { djb2 } from '../lib/fingerprint'

describe('djb2', () => {
  it('returns the same hash for the same input', () => {
    expect(djb2('movie.mp410485761716000000')).toBe(djb2('movie.mp410485761716000000'))
  })

  it('returns different hashes for different inputs', () => {
    expect(djb2('file-a.mp410000001716000000')).not.toBe(djb2('file-b.mp410000001716000000'))
  })

  it('is sensitive to filename changes', () => {
    expect(djb2('movie.mp41048576000')).not.toBe(djb2('Movie.mp41048576000'))
  })

  it('is sensitive to filesize changes', () => {
    expect(djb2('movie.mp41048576000')).not.toBe(djb2('movie.mp42097152000'))
  })

  it('is sensitive to lastModified changes', () => {
    expect(djb2('movie.mp410485761716000000')).not.toBe(djb2('movie.mp410485761717000000'))
  })

  it('returns an unsigned 32-bit integer', () => {
    const hash = djb2('any string value here')
    expect(hash).toBeGreaterThanOrEqual(0)
    expect(hash).toBeLessThanOrEqual(0xFFFFFFFF)
    expect(Number.isInteger(hash)).toBe(true)
  })

  it('handles empty string without throwing', () => {
    expect(() => djb2('')).not.toThrow()
  })
})
