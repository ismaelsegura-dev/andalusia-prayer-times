import { useStore } from '../store';

export async function fetchServerMonths(): Promise<Record<string, string> | null> {
  try {
    const res = await fetch('/api/months', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.months ?? null;
  } catch {
    return null;
  }
}

export async function pushValidatedMonth(
  key: string,
  gregorianStart: string,
  password: string
): Promise<void> {
  const res = await fetch('/api/months', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': password,
    },
    body: JSON.stringify({ key, gregorianStart }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Error ${res.status}`);
  }
}

// Trae los decretos del servidor y los impone sobre el estado local.
// Se llama al arrancar la app; el servidor siempre gana sobre localStorage.
export async function syncMonthsFromServer(): Promise<void> {
  const months = await fetchServerMonths();
  if (months) useStore.getState().hydrateFromServer(months);
}
