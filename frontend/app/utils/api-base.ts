type BackendBaseUrlOptions = {
  backendUrl?: string
  server?: boolean
}

export function backendBaseUrl(options: BackendBaseUrlOptions = {}) {
  const server = options.server ?? import.meta.server
  if (!server) {
    return undefined
  }

  return options.backendUrl ?? useRuntimeConfig().backendUrl
}
