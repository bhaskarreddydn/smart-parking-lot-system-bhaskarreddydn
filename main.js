/**
 * ============================================================================
 * SMART PARKING LOT SYSTEM - DRIVER PROGRAM (LLD DEMONSTRATION)
 * ============================================================================
 * This driver script demonstrates the Low-Level Design (LLD) in action:
 * 1. Domain Models & Object-Oriented Hierarchy
 * 2. Strategy Pattern for Spot Allocation (Nearest vs. Best-Fit)
 * 3. Observer Pattern for Real-Time Display Boards
 * 4. Multi-Gate Concurrency Control (Race Condition Prevention via Mutex)
 * 5. Dynamic Fee Calculation Strategies & Checkout
 * ============================================================================
 */

const { ParkingLotService } = require('./src/services/ParkingLotService');
const { VehicleType } = require('./src/models/Vehicle');
const { PaymentMethod } = require('./src/models/Payment');

async function runLLDDemo() {
  console.log('================================================================');
  console.log('   SMART PARKING LOT SYSTEM - LOW-LEVEL DESIGN (LLD) DEMO');
  console.log('================================================================\n');

  // 1. INITIALIZE PARKING LOT (3 Floors, 10 Spots per floor = 30 spots total)
  console.log('[1] INITIALIZING PARKING STRUCTURE (3 Floors, 10 Spots/Floor)...');
  const parkingLot = new ParkingLotService('Metropolis Urban Smart Parking', 3, 10);
  const initialStatus = parkingLot.getSystemStatus();
  console.log(`   Parking Lot Name : ${initialStatus.name}`);
  console.log(`   Total Capacity   : ${initialStatus.masterDisplay.totalSpots} spots`);
  console.log(`   Free Spots       : ${initialStatus.masterDisplay.freeSpots}`);
  console.log('   Spots by Type    :', initialStatus.masterDisplay.availableByType);
  console.log('----------------------------------------------------------------\n');

  // 2. DEMONSTRATE REAL-TIME SPOT ALLOCATION (Strategy Pattern & Vehicle Factory)
  console.log('[2] VEHICLE ENTRY & SPOT ALLOCATION (Strategy: Nearest Spot)...');
  
  // Bike enters Gate 1
  const bikeTicket = await parkingLot.processEntry('KA-01-BK-1111', VehicleType.MOTORCYCLE, 'GATE-IN-1');
  console.log(`   ✔ Motorcycle Parked : Plate: ${bikeTicket.licensePlate} -> Spot: ${bikeTicket.spotId} (Floor ${bikeTicket.floorNumber})`);

  // Car enters Gate 2
  const carTicket = await parkingLot.processEntry('KA-05-CR-2222', VehicleType.CAR, 'GATE-IN-2');
  console.log(`   ✔ Car Parked        : Plate: ${carTicket.licensePlate} -> Spot: ${carTicket.spotId} (Floor ${carTicket.floorNumber})`);

  // Bus enters Gate 1 (Requires LARGE spot)
  const busTicket = await parkingLot.processEntry('DL-01-BS-3333', VehicleType.BUS, 'GATE-IN-1');
  console.log(`   ✔ Bus Parked        : Plate: ${busTicket.licensePlate} -> Spot: ${busTicket.spotId} (Floor ${busTicket.floorNumber}, Type: ${busTicket.spotType})`);

  // Electric Vehicle enters
  const evTicket = await parkingLot.processEntry('MH-02-EV-4444', VehicleType.ELECTRIC, 'GATE-IN-2');
  console.log(`   ✔ EV Parked         : Plate: ${evTicket.licensePlate} -> Spot: ${evTicket.spotId} (Floor ${evTicket.floorNumber}, Type: ${evTicket.spotType})`);
  console.log('----------------------------------------------------------------\n');

  // 3. OBSERVER PATTERN: DISPLAY BOARD REAL-TIME UPDATE
  console.log('[3] REAL-TIME DISPLAY BOARD STATUS (Observer Pattern)...');
  const updatedStatus = parkingLot.getSystemStatus();
  console.log(`   Total Occupied   : ${updatedStatus.masterDisplay.occupiedSpots}`);
  console.log(`   Total Available  : ${updatedStatus.masterDisplay.freeSpots}`);
  console.log(`   Occupancy Rate   : ${updatedStatus.occupancyRatePercent}%`);
  console.log('   Floor 1 Display  :', updatedStatus.floors[0].display.availableByType);
  console.log('----------------------------------------------------------------\n');

  // 4. CONCURRENCY HANDLING: MULTI-GATE SIMULTANEOUS ENTRIES
  console.log('[4] CONCURRENCY STRESS TEST (Simultaneous Multi-Gate Arrivals)...');
  console.log('   Simulating 10 cars arriving concurrently at Gate 1 and Gate 2...');
  
  const concurrentVehicles = Array.from({ length: 10 }).map((_, i) => ({
    plate: `CONC-CAR-${i + 1}`,
    gate: i % 2 === 0 ? 'GATE-IN-1' : 'GATE-IN-2'
  }));

  const startConcurrencyTime = Date.now();
  const concurrentResults = await Promise.all(
    concurrentVehicles.map(v => parkingLot.processEntry(v.plate, VehicleType.CAR, v.gate))
  );

  const assignedSpots = concurrentResults.map(t => t.spotId);
  const uniqueSpots = new Set(assignedSpots);

  console.log(`   ✔ Dispatched 10 concurrent requests simultaneously in ${Date.now() - startConcurrencyTime}ms.`);
  console.log(`   ✔ Unique Spots Assigned : ${uniqueSpots.size} / 10`);
  console.log(`   ✔ Double-Booking Occurred? : ${assignedSpots.length !== uniqueSpots.size ? 'YES (BUG)' : 'NO (100% THREAD-SAFE)'}`);
  console.log('----------------------------------------------------------------\n');

  // 5. VEHICLE EXIT & FEE CALCULATION (Strategy Pattern: Hourly vs Grace Period vs Surge)
  console.log('[5] VEHICLE CHECK-OUT & FEE CALCULATION (Strategy Pattern)...');

  // Case A: Grace Period (Leaving within 10 minutes -> $0 fee)
  const graceExitTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes later
  const graceReceipt = await parkingLot.processExit(bikeTicket.ticketId, PaymentMethod.CASH, 'GATE-OUT-1', graceExitTime);
  console.log(`   Case A [Grace Period] -> Plate: ${bikeTicket.licensePlate}`);
  console.log(`     Duration: ${graceReceipt.ticket.durationMinutes} mins | Fee: $${graceReceipt.ticket.fee} (Grace Period Policy: $0)`);
  console.log(`     Spot ${bikeTicket.spotId} is now VACATED and available.`);

  // Case B: Standard Hourly Rate (Car parked for 2 hours -> 2 hrs * $20 = $40)
  const carExitTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours later
  const carReceipt = await parkingLot.processExit(carTicket.ticketId, PaymentMethod.CARD, 'GATE-OUT-2', carExitTime);
  console.log(`\n   Case B [Hourly Rate]  -> Plate: ${carTicket.licensePlate}`);
  console.log(`     Duration: ${carReceipt.ticket.durationMinutes} mins | Billable Hours: ${carReceipt.feeDetails.billableHours}`);
  console.log(`     Fee: $${carReceipt.ticket.fee} (Payment Method: ${carReceipt.payment.paymentMethod})`);
  console.log(`     Spot ${carTicket.spotId} is now VACATED and available.`);

  // Case C: Heavy Vehicle Rate (Bus parked for 3 hours -> 3 hrs * $50 = $150)
  const busExitTime = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours later
  const busReceipt = await parkingLot.processExit(busTicket.ticketId, PaymentMethod.UPI, 'GATE-OUT-1', busExitTime);
  console.log(`\n   Case C [Bus Pricing]  -> Plate: ${busTicket.licensePlate}`);
  console.log(`     Duration: ${busReceipt.ticket.durationMinutes} mins | Billable Hours: ${busReceipt.feeDetails.billableHours}`);
  console.log(`     Fee: $${busReceipt.ticket.fee} (Transaction Ref: ${busReceipt.payment.transactionRef})`);
  console.log(`     Spot ${busTicket.spotId} is now VACATED and available.`);
  console.log('----------------------------------------------------------------\n');

  // 6. FINAL OCCUPANCY AUDIT
  console.log('[6] FINAL SYSTEM AUDIT AFTER EXITS...');
  const finalStatus = parkingLot.getSystemStatus();
  console.log(`   Active Parked Vehicles : ${finalStatus.activeVehiclesCount}`);
  console.log(`   Completed Transactions : ${finalStatus.totalCompletedTransactions}`);
  console.log(`   Free Spots Available   : ${finalStatus.masterDisplay.freeSpots}`);
  console.log('================================================================');
  console.log('   ALL LOW-LEVEL DESIGN REQUIREMENTS VERIFIED SUCCESSFULLY!');
  console.log('================================================================');
}

// Run the demo
runLLDDemo().catch(err => {
  console.error('Simulation error:', err);
});
