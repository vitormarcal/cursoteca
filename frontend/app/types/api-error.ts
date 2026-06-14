export type ApiErrorResponse = {
  status: number
  code: number
  description: string
  details?: Record<string, string>
}
