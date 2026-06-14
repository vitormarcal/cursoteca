import { describe, expect, it } from 'vitest'
import { backendBaseUrl } from '../../app/utils/api-base'

describe('backendBaseUrl', () => {
  it('uses the backend URL for server-side requests', () => {
    expect(backendBaseUrl({
      server: true,
      backendUrl: 'http://backend:8080'
    })).toBe('http://backend:8080')
  })

  it('keeps browser requests relative so they go through the Nuxt proxy', () => {
    expect(backendBaseUrl({
      server: false,
      backendUrl: 'http://backend:8080'
    })).toBeUndefined()
  })
})
