const EUR = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const EUR_PRECISE = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NUMBER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

export function formatEuro(value: number, precise = false): string {
  if (!Number.isFinite(value)) return '—';
  return precise ? EUR_PRECISE.format(value) : EUR.format(value);
}

/** Format compact pour les grands montants (1,2 M€). */
export function formatEuroCompact(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${NUMBER.format(value / 1_000_000_000)} Md€`;
  if (abs >= 1_000_000) return `${NUMBER.format(value / 1_000_000)} M€`;
  if (abs >= 10_000) return `${NUMBER.format(Math.round(value / 1000))} k€`;
  return EUR.format(value);
}

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits }).format(value);
}

export function formatPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—';
  return `${new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)} %`;
}

export function formatSignedPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatPercent(value, digits)}`;
}

export function formatSignedEuro(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatEuro(value)}`;
}

export function formatDate(value: string | Date, style: 'short' | 'long' | 'day' = 'short'): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  if (style === 'long') {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(date);
  }
  if (style === 'day') {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(date);
  }
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(date);
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

export function formatTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', { timeStyle: 'short' }).format(date);
}

/** Libellé relatif court : « il y a 3 jours », « dans 2 mois ». */
export function formatRelative(value: string | Date, now = new Date()): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = date.getTime() - now.getTime();
  const rtf = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 365 * 24 * 3600_000],
    ['month', 30 * 24 * 3600_000],
    ['day', 24 * 3600_000],
    ['hour', 3600_000],
    ['minute', 60_000],
  ];
  for (const [unit, ms] of units) {
    if (Math.abs(diffMs) >= ms) return rtf.format(Math.round(diffMs / ms), unit);
  }
  return "à l'instant";
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function fullName(person: { firstName: string; lastName: string }): string {
  return `${person.firstName} ${person.lastName}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${formatNumber(bytes / 1024, 0)} Ko`;
  return `${formatNumber(bytes / (1024 * 1024), 1)} Mo`;
}

export function ageFromBirthDate(birthDate: string, now = new Date()): number {
  const birth = new Date(birthDate);
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}
