/**
 * Emergency Communication Utilities
 * Handles reliable telephone dialing and WhatsApp redirection on mobile devices and within iframes.
 */

export function triggerPhoneCall(phoneNumber: string) {
  const clean = phoneNumber.replace(/[^0-9+]/g, "").trim();
  if (!clean) return;

  // 1. Direct location change triggers native phone dialer on iOS Safari and Android Chrome
  try {
    window.location.href = `tel:${clean}`;
  } catch (err) {
    console.warn("Direct tel trigger failed, attempting fallback:", err);
    try {
      if (window.top) {
        window.top.location.href = `tel:${clean}`;
      }
    } catch {
      // Ignore cross-origin error
    }
  }
}

export function formatPhoneForWhatsApp(phone: string, countryCode?: string): string {
  let clean = phone.replace(/[^0-9]/g, "").trim();
  if (!clean) return "";

  // If phone already starts with common international code, keep it
  // Otherwise if it's a 10-digit standard local number, prefix according to detected country
  if (clean.length === 10) {
    const code = (countryCode || "IN").toUpperCase();
    if (code === "IN") {
      clean = `91${clean}`;
    } else if (code === "US" || code === "CA") {
      clean = `1${clean}`;
    } else if (code === "GB" || code === "UK") {
      clean = `44${clean}`;
    } else if (code === "AU") {
      clean = `61${clean}`;
    } else if (code === "SG") {
      clean = `65${clean}`;
    } else if (code === "AE") {
      clean = `971${clean}`;
    }
  }

  return clean;
}

export function getWhatsAppNeighbourUrl(phone: string, countryCode: string | undefined, message: string): string {
  const cleanPhone = formatPhoneForWhatsApp(phone, countryCode);
  const encoded = encodeURIComponent(message);
  // Universal link supported by both WhatsApp mobile app (iOS & Android) and WhatsApp Web
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
}

export function getWhatsAppBroadcastUrl(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?text=${encoded}`;
}

export function getWhatsAppNativeAppUrl(message: string, phone?: string): string {
  const encoded = encodeURIComponent(message);
  if (phone) {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    return `whatsapp://send?phone=${cleanPhone}&text=${encoded}`;
  }
  return `whatsapp://send?text=${encoded}`;
}

export function openWhatsAppSafely(url: string) {
  // Mobile browsers (especially in iframes) can block window.open.
  // We attempt window.open with fallback to window.location.href.
  try {
    const newWin = window.open(url, "_blank", "noopener,noreferrer");
    if (!newWin || newWin.closed || typeof newWin.closed === "undefined") {
      window.location.href = url;
    }
  } catch {
    window.location.href = url;
  }
}
