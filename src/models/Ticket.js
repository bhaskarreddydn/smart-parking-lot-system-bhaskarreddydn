/**
 * Ticket Domain Model
 * Represents a parking session created upon entry and settled upon exit.
 */

const TicketStatus = Object.freeze({
  ACTIVE: 'ACTIVE',
  PAID: 'PAID',
  COMPLETED: 'COMPLETED'
});

class Ticket {
  /**
   * @param {string} ticketId - Unique Ticket identifier
   * @param {Vehicle} vehicle - Parked vehicle
   * @param {ParkingSpot} spot - Assigned parking spot
   * @param {string} entryGateId - Gate of entry
   * @param {Date} entryTime - Timestamp of entry
   */
  constructor(ticketId, vehicle, spot, entryGateId = 'ENTRY-GATE-1', entryTime = new Date()) {
    if (!ticketId) throw new Error('Ticket ID is required');
    if (!vehicle) throw new Error('Vehicle is required');
    if (!spot) throw new Error('Spot is required');

    this.ticketId = ticketId;
    this.licensePlate = vehicle.getLicensePlate();
    this.vehicleType = vehicle.getType();
    this.spotId = spot.id;
    this.floorNumber = spot.floorNumber;
    this.spotNumber = spot.spotNumber;
    this.spotType = spot.spotType;
    this.entryGateId = entryGateId;
    this.entryTime = entryTime;
    this.exitTime = null;
    this.exitGateId = null;
    this.durationMinutes = 0;
    this.fee = 0;
    this.status = TicketStatus.ACTIVE;
    this.payment = null;
  }

  /**
   * Completes ticket checkout
   * @param {Date} exitTime
   * @param {number} fee
   * @param {string} exitGateId
   */
  closeTicket(exitTime, fee, exitGateId = 'EXIT-GATE-1') {
    if (this.status === TicketStatus.COMPLETED) {
      throw new Error(`Ticket ${this.ticketId} is already completed`);
    }

    this.exitTime = exitTime;
    this.exitGateId = exitGateId;
    this.fee = fee;
    const diffMs = this.exitTime.getTime() - this.entryTime.getTime();
    this.durationMinutes = Math.max(1, Math.ceil(diffMs / (1000 * 60)));
    this.status = TicketStatus.COMPLETED;
  }

  attachPayment(payment) {
    this.payment = payment;
    if (this.status !== TicketStatus.COMPLETED) {
      this.status = TicketStatus.PAID;
    }
  }

  toJSON() {
    return {
      ticketId: this.ticketId,
      licensePlate: this.licensePlate,
      vehicleType: this.vehicleType,
      spotId: this.spotId,
      floorNumber: this.floorNumber,
      spotNumber: this.spotNumber,
      spotType: this.spotType,
      entryGateId: this.entryGateId,
      entryTime: this.entryTime,
      exitGateId: this.exitGateId,
      exitTime: this.exitTime,
      durationMinutes: this.durationMinutes,
      fee: this.fee,
      status: this.status,
      payment: this.payment ? this.payment.toJSON() : null
    };
  }
}

module.exports = {
  TicketStatus,
  Ticket
};
