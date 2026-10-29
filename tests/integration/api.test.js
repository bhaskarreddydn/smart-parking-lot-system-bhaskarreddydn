const { describe, it } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

const app = require('../../src/app');

describe('REST API Integration Test Suite', () => {
  let createdTicketId = null;

  it('GET / should return service info and endpoint documentation', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.service, 'Smart Parking Lot Backend API');
    assert.ok(res.body.endpoints);
  });

  it('GET /api/v1/parking/status should return parking lot system status', async () => {
    const res = await request(app).get('/api/v1/parking/status');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.masterDisplay);
    assert.ok(Array.isArray(res.body.data.floors));
  });

  it('GET /api/v1/parking/spots should list spots with filter support', async () => {
    const res = await request(app).get('/api/v1/parking/spots?floor=1&type=MEDIUM');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    res.body.data.forEach(spot => {
      assert.strictEqual(spot.floorNumber, 1);
      assert.strictEqual(spot.spotType, 'MEDIUM');
    });
  });

  it('POST /api/v1/parking/entry should check-in a vehicle and return ticket', async () => {
    const payload = {
      licensePlate: 'API-TEST-99',
      vehicleType: 'CAR',
      gateId: 'GATE-IN-1'
    };

    const res = await request(app).post('/api/v1/parking/entry').send(payload);
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.licensePlate, 'API-TEST-99');
    assert.ok(res.body.data.spotId);
    assert.ok(res.body.data.ticketId);

    createdTicketId = res.body.data.ticketId;
  });

  it('POST /api/v1/parking/entry should prevent duplicate entry for same vehicle', async () => {
    const payload = {
      licensePlate: 'API-TEST-99',
      vehicleType: 'CAR'
    };

    const res = await request(app).post('/api/v1/parking/entry').send(payload);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.includes('already parked'));
  });

  it('GET /api/v1/parking/tickets/:ticketId should retrieve ticket details', async () => {
    assert.ok(createdTicketId, 'Created ticket ID must exist');

    const res = await request(app).get(`/api/v1/parking/tickets/${createdTicketId}`);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.ticketId, createdTicketId);
    assert.strictEqual(res.body.data.status, 'ACTIVE');
  });

  it('POST /api/v1/parking/exit should checkout vehicle, compute fee and vacate spot', async () => {
    assert.ok(createdTicketId);

    // Simulate exit 2 hours later
    const simulatedExitTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const payload = {
      ticketId: createdTicketId,
      paymentMethod: 'UPI',
      gateId: 'GATE-OUT-1',
      exitTime: simulatedExitTime
    };

    const res = await request(app).post('/api/v1/parking/exit').send(payload);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.ticket.status, 'COMPLETED');
    assert.strictEqual(res.body.data.payment.paymentMethod, 'UPI');
    assert.strictEqual(res.body.data.payment.status, 'SUCCESS');
    assert.ok(res.body.data.ticket.fee > 0);
  });

  it('POST /api/v1/parking/simulate/concurrency should run live concurrency test via API', async () => {
    const res = await request(app)
      .post('/api/v1/parking/simulate/concurrency')
      .send({ count: 5, vehicleType: 'CAR' });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.isConcurrencySafe, true);
    assert.strictEqual(res.body.hasDuplicateAllocation, false);
  });
});
