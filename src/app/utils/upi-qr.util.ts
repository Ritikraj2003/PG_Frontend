import * as QRCode from 'qrcode';

export interface UpiPaymentDetails {
  upiId: string;
  payeeName?: string;
  amount?: number;
  transactionNote?: string;
  currency?: string;
}

/**
 * Builds standard NPCI UPI Deep Link URI.
 * Example: upi://pay?pa=owner@upi&pn=StayPulse&am=1999.00&cu=INR&tn=BranchSubscription
 */
export function buildUpiUri(details: UpiPaymentDetails): string {
  const upiId = (details.upiId || '').trim();
  if (!upiId) return '';
  const payee = encodeURIComponent(details.payeeName || 'StayPulse');
  const currency = details.currency || 'INR';
  let uri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${payee}&cu=${currency}`;
  if (details.amount !== undefined && details.amount > 0) {
    uri += `&am=${Number(details.amount).toFixed(2)}`;
  }
  if (details.transactionNote) {
    uri += `&tn=${encodeURIComponent(details.transactionNote)}`;
  }
  return uri;
}

/**
 * Generates an offline Base64 Data URL using client-side QRCode library in <1ms.
 */
export async function generateUpiQrDataUrl(details: UpiPaymentDetails): Promise<string> {
  const upiUri = buildUpiUri(details);
  if (!upiUri) return '';
  try {
    return await QRCode.toDataURL(upiUri, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 280,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Failed to generate offline QR, falling back to instant API:', err);
    return getInstantUpiQrUrl(details);
  }
}

/**
 * Instant synchronous URL fallback using standard QR API.
 */
export function getInstantUpiQrUrl(details: UpiPaymentDetails): string {
  const upiUri = buildUpiUri(details);
  if (!upiUri) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;
}
