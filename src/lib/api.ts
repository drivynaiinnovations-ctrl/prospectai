import type { Settings } from '../types';

export async function callClaude(
  mode: string,
  payload: Record<string, string>,
  settings: Settings
): Promise<string> {
  const workerUrl = settings.workerUrl || import.meta.env.VITE_WORKER_URL;
  if (!workerUrl) throw new Error('Worker URL not configured. Go to Settings and add your Cloudflare Worker URL.');

  const res = await fetch(workerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, payload }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error((err as { error?: string }).error || `API error ${res.status}`);
  }

  const data = await res.json() as { result?: string };
  if (!data.result) throw new Error('Empty response from Claude');
  return data.result;
}
