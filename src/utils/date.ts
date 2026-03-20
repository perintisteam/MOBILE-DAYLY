const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * Menghasilkan tanggal ISO berbasis waktu lokal: YYYY-MM-DD
 * (menghindari pergeseran timezone dari `toISOString()`).
 */
export function getLocalISODate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function formatDayHuman(dayIso: string): string {
  const [yStr, mStr, dStr] = dayIso.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);

  const dt = new Date(y, m - 1, d);
  // toLocaleDateString ada di RN, output akan mengikuti bahasa device.
  return dt.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function parseLocalISODate(dayIso: string): Date {
  const [yStr, mStr, dStr] = dayIso.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  return new Date(y, m - 1, d);
}

export function formatDayShort(dayIso: string): string {
  const dt = parseLocalISODate(dayIso);
  return dt.toLocaleDateString(undefined, { weekday: 'short' });
}

export function formatTime(createdAt: number): string {
  const dt = new Date(createdAt);
  return `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
}
