const asinPattern = /^[A-Z0-9]{10}$/i;

export function deriveFriendlyMessage(raw: string): string {
  if (!raw) return "Something went wrong. Please try again.";

  const msg = raw.toLowerCase();

  if (msg.includes("asin is required") || msg.includes("invalid asin")) {
    return "Please enter a valid 10-character ASIN.";
  }

  if (msg.includes("404")) {
    return "ASIN not found on the selected marketplace. Try another ASIN.";
  }

  if (msg.includes("captcha") || msg.includes("blocked") || msg.includes("503")) {
    return "Amazon blocked the request. Please try a different ASIN or wait a moment.";
  }

  if (msg.includes("ai returned non-json") || msg.includes("unexpected format")) {
    return "AI formatting issue. Please retry.";
  }

  if (msg.includes("limit") || msg.includes("quota") || msg.includes("rate")) {
    return "Rate limited by provider. Please wait a bit before retrying.";
  }

  // Fallback with input hint if looks like malformed ASIN
  if (!asinPattern.test(raw) && raw.length > 0) {
    return "Please enter a valid 10-character ASIN.";
  }

  return raw;
}
