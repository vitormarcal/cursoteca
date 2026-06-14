import type { ApiErrorResponse } from '~/types/api-error'

type ErrorWithData = {
  data?: unknown
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  const apiError = apiErrorResponse(error)
  if (!apiError) {
    return fallback
  }

  const detailMessages = Object.values(apiError.details ?? {}).filter(Boolean)
  if (!detailMessages.length) {
    return apiError.description || fallback
  }

  return `${apiError.description || fallback} ${detailMessages.join(' ')}`
}

function apiErrorResponse(error: unknown): ApiErrorResponse | null {
  const data = (error as ErrorWithData | null)?.data
  if (!data || typeof data !== 'object') {
    return null
  }

  const candidate = data as Partial<ApiErrorResponse>
  if (typeof candidate.status !== 'number' || typeof candidate.code !== 'number') {
    return null
  }

  return {
    status: candidate.status,
    code: candidate.code,
    description: typeof candidate.description === 'string' ? candidate.description : '',
    details: isStringMap(candidate.details) ? candidate.details : {}
  }
}

function isStringMap(value: unknown): value is Record<string, string> {
  return Boolean(value)
    && typeof value === 'object'
    && Object.values(value).every((item) => typeof item === 'string')
}
