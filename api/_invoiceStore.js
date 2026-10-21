/**
 * Shared In-Memory Store for Active ABA Invoices
 * Preserves the exact checkStatus closures, device IDs, and session tokens
 */

if (!globalThis.__khqrInvoiceStore) {
  globalThis.__khqrInvoiceStore = new Map();
}

export const invoiceStore = globalThis.__khqrInvoiceStore;
