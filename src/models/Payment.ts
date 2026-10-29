/**
 * Payment Domain Model
 * Tracks fee transactions during vehicle checkout.
 */

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  UPI = 'UPI'
}

export enum PaymentStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING'
}

export class Payment {
  public readonly paymentId: string;
  public readonly ticketId: string;
  public readonly amount: number;
  public readonly paymentMethod: PaymentMethod;
  public readonly timestamp: Date;
  public readonly status: PaymentStatus;
  public readonly transactionRef: string;

  constructor(
    paymentId: string,
    ticketId: string,
    amount: number,
    paymentMethod: PaymentMethod = PaymentMethod.CARD,
    timestamp: Date = new Date()
  ) {
    if (!paymentId) throw new Error('Payment ID is required');
    if (!ticketId) throw new Error('Ticket ID is required');
    if (amount < 0) throw new Error('Amount cannot be negative');

    this.paymentId = paymentId;
    this.ticketId = ticketId;
    this.amount = amount;
    this.paymentMethod = paymentMethod;
    this.timestamp = timestamp;
    this.status = PaymentStatus.SUCCESS;
    this.transactionRef = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  public toJSON() {
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
