export interface FetchParsedOptions {
  signal?: AbortSignal
  fetchFn?: typeof fetch
}

// Never throws: a network error, a bad status, invalid JSON and a rejected payload all come back as `null`.
export async function fetchParsed<T>(
  url: string,
  parse: (json: unknown) => T | null,
  { signal, fetchFn = (input, init) => fetch(input, init) }: FetchParsedOptions = {},
): Promise<T | null> {
  try {
    const response = await fetchFn(url, { signal })
    if (!response.ok) return null
    return parse(await response.json())
  } catch {
    return null
  }
}
