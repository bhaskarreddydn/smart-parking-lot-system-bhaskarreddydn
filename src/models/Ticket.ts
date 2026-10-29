/**
 * Ticket Domain Model
 * Represents a parking session created upon entry and settled upon exit.
 */

import { Vehicle, VehicleType } from './Vehicle';
import { ParkingSpot, SpotType } from './ParkingSpot';
import { Payment } from './Payment';

export enum TicketStatus {
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  COMPLETED = 'COMPLETED'
}

export class Ticket {
  public readonly ticketId: string;
  public readonly licensePlate: string;
  public readonly vehicleType: VehicleType;
  public readonly spotId: string;
  public readonly floorNumber: number;
  public readonly spotNumber: number;
  public readonly spotType: SpotType;
  public readonly entryGateId: string;
  public readonly entryTime: Date;
  public exitTime: Date | null;
  public exitGateId: string | null;
  public durationMinutes: number;
  public fee: number;
  public status: TicketStatus;
  public payment: Payment | null;

  constructor(
    ticketId: string,
    vehicle: Vehicle,
    spot: ParkingSpot,
    entryGateId: string = 'ENTRY-GATE-1',
    entryTime: Date = new Date()
  ) {
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

  public closeTicket(exitTime: Date, fee: number, exitGateId: string = 'EXIT-GATE-1'): void {
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

  public attachPayment(payment: Payment): void {
    this.payment = payment;
    if (this.status !== TicketStatus.COMPLETED) {
      this.status = TicketStatus.PAID;
    }
  }

  public toJSON() {
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
