/**
 * Gate Domain Models
 * Represents entry and exit terminals / barriers in the parking facility.
 */

const GateType = Object.freeze({
  ENTRY: 'ENTRY',
  EXIT: 'EXIT'
});

class Gate {
  /**
   * @param {string} id - e.g. "GATE-E1"
   * @param {string} type - GateType
   * @param {string} name - e.g. "North Entrance"
   */
  constructor(id, type, name) {
    this.id = id;
    this.type = type;
    this.name = name || id;
    this.isOpen = false;
  }

  openBarrier() {
    this.isOpen = true;
  }

  closeBarrier() {
    this.isOpen = false;
  }
}

class EntryGate extends Gate {
  constructor(id, name = 'Main Entry') {
    super(id, GateType.ENTRY, name);
  }
}

class ExitGate extends Gate {
  constructor(id, name = 'Main Exit') {
    super(id, GateType.EXIT, name);
  }
}

module.exports = {
  GateType,
  Gate,
  EntryGate,
  ExitGate
};
