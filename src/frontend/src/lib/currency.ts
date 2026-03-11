/**
 * Format a number as Indian Rupees with Indian numbering system
 * (e.g. 1,00,000 instead of 100,000)
 */
export function formatINR(amount: number, fractionDigits = 2): string {
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
  return `\u20B9${formatted}`;
}
