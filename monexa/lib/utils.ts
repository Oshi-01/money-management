import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currencyCode: string = "USD") {
  const currencyStyles: Record<string, { locale: string; style: string; currency: string }> = {
    USD: { locale: "en-US", style: "currency", currency: "USD" },
    GBP: { locale: "en-GB", style: "currency", currency: "GBP" },
    BDT: { locale: "en-US", style: "currency", currency: "BDT" },
  };

  const config = currencyStyles[currencyCode] || currencyStyles["USD"];

  let formatted = new Intl.NumberFormat(config.locale, {
    style: config.style as "currency",
    currency: config.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  // Fallback replace BDT because some browsers format it weirdly
  if (currencyCode === "BDT") {
    formatted = formatted.replace("BDT", "৳");
  }

  return formatted;
}

export function getCurrencySymbol(currencyCode: string = "USD") {
  if (currencyCode === "BDT") return "৳";
  if (currencyCode === "GBP") return "£";
  if (currencyCode === "EUR") return "€";
  
  // Use Intl as fallback
  try {
    const parts = new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode }).formatToParts(0);
    const symbolPart = parts.find(p => p.type === "currency");
    return symbolPart ? symbolPart.value : "$";
  } catch (e) {
    return "$";
  }
}
