import { describe, expect, it } from 'vitest'
import { apiErrorMessage } from '../../app/utils/api-error'

describe('apiErrorMessage', () => {
  it('uses backend error description', () => {
    expect(apiErrorMessage({
      data: {
        status: 404,
        code: 2001,
        description: 'Course was not found.',
        details: {}
      }
    }, 'Fallback message')).toBe('Course was not found.')
  })

  it('appends backend detail messages', () => {
    expect(apiErrorMessage({
      data: {
        status: 400,
        code: 1002,
        description: 'Course section input is invalid.',
        details: {
          title: 'title is required'
        }
      }
    }, 'Fallback message')).toBe('Course section input is invalid. title is required')
  })

  it('uses fallback for unknown errors', () => {
    expect(apiErrorMessage(new Error('network failed'), 'Fallback message')).toBe('Fallback message')
  })
})
