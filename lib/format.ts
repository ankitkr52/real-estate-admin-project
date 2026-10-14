const inr = new Intl.NumberFormat("en-IN");

export function formatPriceINRShort(n: number): string {
  if (n >= 1_00_00_000) {
    const cr = n / 1_00_00_000;
    const fixed = cr >= 10 ? cr.toFixed(1) : cr.toFixed(2);
    return `Rs ${parseFloat(fixed)} Cr`;
  }
  if (n >= 1_00_000) {
    const l = n / 1_00_000;
    return `Rs ${l >= 10 ? Math.round(l) : parseFloat(l.toFixed(1))} L`;
  }
  return `Rs ${inr.format(n)}`;
}

export function formatPriceINRFull(n: number): string {
  return `Rs ${inr.format(n)}`;
}

export function buildWaLink(
  phone10: string,
  propertyUrl: string,
  propertyTitle: string,
): string {
  const text = `Hi, I'm interested in your property "${propertyTitle}" — ${propertyUrl}`;
  return `https://wa.me/91${phone10}?text=${encodeURIComponent(text)}`;
}
