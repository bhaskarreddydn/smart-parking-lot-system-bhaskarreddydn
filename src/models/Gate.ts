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
}

export class EntryGate extends Gate {
  constructor(id: string, name: string = 'Main Entry') {
    super(id, GateType.ENTRY, name);
  }
}

export class ExitGate extends Gate {
  constructor(id: string, name: string = 'Main Exit') {
    super(id, GateType.EXIT, name);
  }
}
