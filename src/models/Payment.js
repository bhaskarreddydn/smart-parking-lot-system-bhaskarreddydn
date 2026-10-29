/**
 * Payment Domain Model
 * Tracks fee transactions during vehicle checkout.
 */

const PaymentMethod = Object.freeze({
  CASH: 'CASH',
  CARD: 'CARD',
  UPI: 'UPI'
});

const PaymentStatus = Object.freeze({
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  PENDING: 'PENDING'
});

class Payment {
  /**
   * @param {string} paymentId
   * @param {string} ticketId
   * @param {number} amount
   * @param {string} paymentMethod
   * @param {Date} timestamp
   */
  constructor(paymentId, ticketId, amount, paymentMethod = PaymentMethod.CARD, timestamp = new Date()) {
    if (!paymentId) throw new Error('Payment ID is required');
    if (!ticketId) throw new Error('Ticket ID is required');
    if (amount < 0) throw new Error('Amount cannot be negative');

    this.paymentId = paymentId;
    this.ticketId = ticketId;
    this.amount = amount;
    this.paymentMethod = Object.values(PaymentMethod).includes(paymentMethod)
      ? paymentMethod
      : PaymentMethod.CARD;
    this.timestamp = timestamp;
    this.status = PaymentStatus.SUCCESS; // Default to successful transaction simulation
    this.transactionRef = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  toJSON() {
    return {
      paymentId: this.paymentId,
      ticketId: this.ticketId,
      amount: this.amount,
      paymentMethod: this.paymentMethod,
      timestamp: this.timestamp,
      status: this.status,
      transactionRef: this.transactionRef
    };
  }
}

module.exports = {
  PaymentMethod,
  PaymentStatus,
  Payment
};
