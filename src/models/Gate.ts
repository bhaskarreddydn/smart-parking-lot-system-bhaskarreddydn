/**
 * Gate Domain Models
 * Represents entry and exit terminals / barriers in the parking facility.
 */

export enum GateType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT'
}

export abstract class Gate {
  public readonly id: string;
  public readonly type: GateType;
  public readonly name: string;
  public isOpen: boolean;

  constructor(id: string, type: GateType, name?: string) {
    this.id = id;
    this.type = type;
    this.name = name || id;
    this.isOpen = false;
  }

  public openBarrier(): void {
    this.isOpen = true;
  }

  public closeBarrier(): void {
    this.isOpen = false;
  }

  /**
   * Abstract method: Each concrete gate specifies its primary operational role
   */
  public abstract getGateRoleDescription(): string;
}

export class EntryGate extends Gate {
  constructor(id: string, name: string = 'Main Entry') {
    super(id, GateType.ENTRY, name);
  }

  public getGateRoleDescription(): string {
    return 'Allocates spot, issues parking ticket, and opens entry barrier';
  }
}

export class ExitGate extends Gate {
  constructor(id: string, name: string = 'Main Exit') {
    super(id, GateType.EXIT, name);
  }

  public getGateRoleDescription(): string {
    return 'Validates ticket, verifies fee payment, vacates spot, and opens exit barrier';
  }
}
