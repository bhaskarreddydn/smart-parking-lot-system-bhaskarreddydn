/**
 * ParkingLotService (Singleton / Facade Pattern)
 * Core orchestrator for the smart parking lot backend system.
 */

import { randomUUID } from 'crypto';
import { Floor, FloorStatus } from '../models/Floor';
import { SpotType, ParkingSpot } from '../models/ParkingSpot';
import { Gate, EntryGate, ExitGate } from '../models/Gate';
import { Ticket } from '../models/Ticket';
import { Payment, PaymentMethod } from '../models/Payment';
import { DisplayBoard, DisplayStatus } from '../models/DisplayBoard';
import { SpotFactory } from '../factories/SpotFactory';
import { VehicleFactory } from '../factories/VehicleFactory';
import { VehicleType } from '../models/Vehicle';
import { AllocationService, NearestSpotStrategy, BestFitStrategy } from './AllocationService';
import { FeeCalculationService, DynamicPricingStrategy, HourlyPricingStrategy } from './FeeCalculationService';
import { ConcurrencyManager } from './ConcurrencyManager';
import { FeeCalculationResult } from '../strategies/pricing/PricingStrategy';

export interface ExitResult {
  ticket: Ticket;
  payment: Payment;
  feeDetails: FeeCalculationResult;
}

export interface SystemStatus {
  name: string;
  occupancyRatePercent: number;
  masterDisplay: DisplayStatus;
  activeVehiclesCount: number;
  totalCompletedTransactions: number;
  floors: FloorStatus[];
  gates: {
    entryGates: Array<{ id: string; name: string; type: string }>;
    exitGates: Array<{ id: string; name: string; type: string }>;
  };
}

export class ParkingLotService {
  public readonly name: string;
  public readonly floors: Floor[];
  public readonly entryGates: Map<string, EntryGate>;
  public readonly exitGates: Map<string, ExitGate>;
  public readonly activeTickets: Map<string, Ticket>;
  public readonly completedTickets: Map<string, Ticket>;
  public readonly vehicleTicketIndex: Map<string, string>;
  public readonly mainDisplayBoard: DisplayBoard;

  private readonly concurrencyManager: ConcurrencyManager;
  private readonly allocationService: AllocationService;
  private readonly feeCalculationService: FeeCalculationService;

  constructor(name: string = 'Metropolis Smart Parking', numFloors: number = 3, spotsPerFloor: number = 20) {
    this.name = name;
    this.floors = [];
    this.entryGates = new Map<string, EntryGate>();
    this.exitGates = new Map<string, ExitGate>();
    this.activeTickets = new Map<string, Ticket>();
    this.completedTickets = new Map<string, Ticket>();
    this.vehicleTicketIndex = new Map<string, string>();
    this.mainDisplayBoard = new DisplayBoard('DISPLAY-MAIN');

    this.concurrencyManager = new ConcurrencyManager();
    this.allocationService = new AllocationService(new NearestSpotStrategy());
    this.feeCalculationService = new FeeCalculationService(new DynamicPricingStrategy());

    this._initializeParkingLot(numFloors, spotsPerFloor);
  }

  private _initializeParkingLot(numFloors: number, spotsPerFloor: number): void {
    for (let f = 1; f <= numFloors; f++) {
      const floor = new Floor(f, `Level ${f}`);

      const smallCount = Math.max(1, Math.round(spotsPerFloor * 0.20));
      const mediumCount = Math.max(1, Math.round(spotsPerFloor * 0.55));
      const largeCount = Math.max(1, Math.round(spotsPerFloor * 0.15));
      const electricCount = spotsPerFloor - (smallCount + mediumCount + largeCount);

      let spotIndex = 1;

      for (let i = 0; i < smallCount; i++) {
        floor.addSpot(SpotFactory.createSpot(f, spotIndex++, SpotType.SMALL));
      }
      for (let i = 0; i < mediumCount; i++) {
        floor.addSpot(SpotFactory.createSpot(f, spotIndex++, SpotType.MEDIUM));
      }
      for (let i = 0; i < largeCount; i++) {
        floor.addSpot(SpotFactory.createSpot(f, spotIndex++, SpotType.LARGE));
      }
      for (let i = 0; i < electricCount; i++) {
        floor.addSpot(SpotFactory.createSpot(f, spotIndex++, SpotType.ELECTRIC));
      }

      this.floors.push(floor);
    }

    this.addEntryGate('GATE-IN-1', 'North Entrance Gate');
    this.addEntryGate('GATE-IN-2', 'South Entrance Gate');
    this.addExitGate('GATE-OUT-1', 'East Exit Gate');
    this.addExitGate('GATE-OUT-2', 'West Exit Gate');

    this._updateMainDisplay();
  }

  public addEntryGate(id: string, name: string): void {
    this.entryGates.set(id, new EntryGate(id, name));
  }

  public addExitGate(id: string, name: string): void {
    this.exitGates.set(id, new ExitGate(id, name));
  }

  private _updateMainDisplay(): void {
    const allSpots = this.floors.flatMap(f => f.getAllSpots());
    this.mainDisplayBoard.update(allSpots);
  }

  public getOccupancyRate(): number {
    const total = this.mainDisplayBoard.totalSpots;
    const occupied = this.mainDisplayBoard.occupiedSpots;
    if (total === 0) return 0;
    return Math.round((occupied / total) * 100);
  }

  public async processEntry(
    licensePlate: string,
    vehicleType: VehicleType | string,
    gateId: string = 'GATE-IN-1',
    entryTime: Date = new Date()
  ): Promise<Ticket> {
    return this.concurrencyManager.withAllocationLock(async () => {
      const normalizedPlate = (licensePlate || '').trim().toUpperCase();

      if (!normalizedPlate) {
        throw new Error('Vehicle license plate is required');
      }

      if (this.vehicleTicketIndex.has(normalizedPlate)) {
        const existingTicketId = this.vehicleTicketIndex.get(normalizedPlate);
        throw new Error(`Vehicle ${normalizedPlate} is already parked with active Ticket ID: ${existingTicketId}`);
      }

      const vehicle = VehicleFactory.createVehicle(normalizedPlate, vehicleType);
      const allocatedSpot = this.allocationService.allocateSpot(this.floors, vehicle);

      const ticketId = `TCK-${Date.now()}-${randomUUID().substring(0, 6).toUpperCase()}`;
      const ticket = new Ticket(ticketId, vehicle, allocatedSpot, gateId, entryTime);

      this.activeTickets.set(ticketId, ticket);
      this.vehicleTicketIndex.set(normalizedPlate, ticketId);

      this._updateMainDisplay();

      const gate = this.entryGates.get(gateId);
      if (gate) {
        gate.openBarrier();
        setTimeout(() => gate.closeBarrier(), 100);
      }

      return ticket;
    });
  }

  public async processExit(
    ticketId: string,
    paymentMethod: PaymentMethod = PaymentMethod.CARD,
    gateId: string = 'GATE-OUT-1',
    exitTimeOverride: Date | null = null
  ): Promise<ExitResult> {
    if (!ticketId || !this.activeTickets.has(ticketId)) {
      throw new Error(`Active ticket with ID '${ticketId}' was not found`);
    }

    const ticket = this.activeTickets.get(ticketId)!;
    const exitTime = exitTimeOverride ? new Date(exitTimeOverride) : new Date();

    const occupancyPercent = this.getOccupancyRate();
    const feeCalculation = this.feeCalculationService.calculate(ticket, exitTime, occupancyPercent);

    const paymentId = `PAY-${Date.now()}-${randomUUID().substring(0, 6).toUpperCase()}`;
    const payment = new Payment(paymentId, ticketId, feeCalculation.totalFee, paymentMethod, exitTime);

    await this.concurrencyManager.withSpotLock(ticket.spotId, async () => {
      this.allocationService.releaseSpot(this.floors, ticket.spotId);
    });

    ticket.attachPayment(payment);
    ticket.closeTicket(exitTime, feeCalculation.totalFee, gateId);

    this.activeTickets.delete(ticketId);
    this.vehicleTicketIndex.delete(ticket.licensePlate);
    this.completedTickets.set(ticketId, ticket);

    this._updateMainDisplay();

    const gate = this.exitGates.get(gateId);
    if (gate) {
      gate.openBarrier();
      setTimeout(() => gate.closeBarrier(), 100);
    }

    return {
      ticket,
      payment,
      feeDetails: feeCalculation
    };
  }

  public getSystemStatus(): SystemStatus {
    this._updateMainDisplay();
    return {
      name: this.name,
      occupancyRatePercent: this.getOccupancyRate(),
      masterDisplay: this.mainDisplayBoard.getDisplayStatus(),
      activeVehiclesCount: this.activeTickets.size,
      totalCompletedTransactions: this.completedTickets.size,
      floors: this.floors.map(floor => floor.getFloorStatus()),
      gates: {
        entryGates: Array.from(this.entryGates.values()).map(g => ({ id: g.id, name: g.name, type: g.type })),
        exitGates: Array.from(this.exitGates.values()).map(g => ({ id: g.id, name: g.name, type: g.type }))
      }
    };
  }

  public getAllSpots(): ReturnType<ParkingSpot['toJSON']>[] {
    return this.floors.flatMap(floor => floor.getAllSpots().map(s => s.toJSON()));
  }

  public getTicket(ticketId: string): Ticket | null {
    if (this.activeTickets.has(ticketId)) {
      return this.activeTickets.get(ticketId)!;
    }
    if (this.completedTickets.has(ticketId)) {
      return this.completedTickets.get(ticketId)!;
    }
    return null;
  }

  public setAllocationStrategy(strategyName: 'NEAREST' | 'BEST_FIT'): void {
    if (strategyName === 'BEST_FIT') {
      this.allocationService.setStrategy(new BestFitStrategy());
    } else {
      this.allocationService.setStrategy(new NearestSpotStrategy());
    }
  }

  public setPricingStrategy(strategyName: 'HOURLY' | 'DYNAMIC'): void {
    if (strategyName === 'HOURLY') {
      this.feeCalculationService.setStrategy(new HourlyPricingStrategy());
    } else {
      this.feeCalculationService.setStrategy(new DynamicPricingStrategy());
    }
  }
}

export const defaultParkingLot = new ParkingLotService();
