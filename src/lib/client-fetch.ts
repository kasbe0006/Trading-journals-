export type JsonRecord = Record<string, unknown>;

export async function parseResponseJson(response: Response): Promise<JsonRecord | null> {
  const raw = await response.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as JsonRecord;
  } catch {
    return null;
  }
}

export async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const data = await parseResponseJson(response);
  return { response, data };
}