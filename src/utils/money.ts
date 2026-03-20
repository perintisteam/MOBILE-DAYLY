export function formatIdr(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(safe);
  } catch {
    // Fallback for environments without Intl currency support
    const n = Math.round(safe).toString();
    return `Rp ${n}`;
  }
}
