const millions = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Beträge in Mio. US-Dollar mit deutschem Komma, z. B. „33,1 Mio. $“. */
export function formatMoney(usd: number): string {
  return `${millions.format(usd / 1_000_000)} Mio. $`;
}
