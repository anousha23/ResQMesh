const request = require('supertest');
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.DB_FILE = path.join(__dirname, 'test_resqmesh_user.db');

const app = require('../server');
const { db } = require('../src/config/db');

describe('ResQMesh User Backend Integration Tests', () => {
  let createdUserId = null;
  let createdSosId = null;

  afterAll((done) => {
    db.close(() => {
      done();
    });
  });

  test('1. Health Check Endpoint GET /api/v1/health', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.service).toContain('ResQMesh User Backend');
  });

  test('2. Onboarding Step 1 — Personal Information POST /api/v1/user/onboarding/step1', async () => {
    const res = await request(app)
      .post('/api/v1/user/onboarding/step1')
      .field('full_name', 'Rajesh Kumar')
      .field('age', '34')
      .field('blood_group', 'O+');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.full_name).toBe('Rajesh Kumar');
    expect(res.body.data.user_id).toBeDefined();

    createdUserId = res.body.data.user_id;
  });

  test('3. Onboarding Step 2 — Medical Details POST /api/v1/user/onboarding/step2', async () => {
    const res = await request(app)
      .post('/api/v1/user/onboarding/step2')
      .send({
        user_id: createdUserId,
        allergies: 'Penicillin',
        medical_conditions: 'Asthma',
        medications: 'Albuterol Inhaler'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.allergies).toBe('Penicillin');
  });

  test('4. Onboarding Step 3 — Emergency Contact & Preferred Language POST /api/v1/user/onboarding/step3', async () => {
    const res = await request(app)
      .post('/api/v1/user/onboarding/step3')
      .send({
        user_id: createdUserId,
        contact_name: 'Priya Kumar',
        relationship: 'Spouse',
        phone_number: '+919876543210',
        preferred_language: 'hi-IN'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.onboarding_completed).toBe(1);
    expect(res.body.data.ui_dictionary.app_title).toBe('ResQMesh नागरिक सुरक्षा');
  });

  test('5. Get User Profile GET /api/v1/user/profile', async () => {
    const res = await request(app)
      .get(`/api/v1/user/profile?user_id=${createdUserId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.onboarding_completed).toBe(true);
    expect(res.body.user.full_name).toBe('Rajesh Kumar');
  });

  test('6. Sarvam AI Multilingual UI Dictionary GET /api/v1/sarvam/dictionary', async () => {
    const res = await request(app)
      .get('/api/v1/sarvam/dictionary?lang=ta-IN');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.language).toBe('ta-IN');
    expect(res.body.ui_dictionary.app_title).toBe('ResQMesh குடிமக்கள் பாதுகாப்பு');
  });

  test('7. Sarvam AI Translation POST /api/v1/sarvam/translate', async () => {
    const res = await request(app)
      .post('/api/v1/sarvam/translate')
      .send({
        text: 'इमारत में आग लग गई है',
        source_lang: 'hi-IN',
        target_lang: 'en-IN'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.original_text).toBe('इमारत में आग लग गई है');
  });

  test('8. Citizen SOS Trigger POST /api/v1/sos', async () => {
    const res = await request(app)
      .post('/api/v1/sos')
      .send({
        user_id: createdUserId,
        emergency_type: 'TRAPPED',
        description: 'Building collapsed, trapped inside',
        latitude: 28.6139,
        longitude: 77.2090
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.sos_id).toBeDefined();
    expect(res.body.status).toBeDefined();

    createdSosId = res.body.sos_id;
  });

  test('9. Active SOS Status Lifecycle GET /api/v1/sos/status', async () => {
    const res = await request(app)
      .get(`/api/v1/sos/status?sos_id=${createdSosId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.has_active_sos).toBe(true);
    expect(res.body.status_lifecycle.stages).toContain('CREATED');
  });

  test('10. Cancel / Resolve Active SOS POST /api/v1/sos/:id/cancel', async () => {
    const res = await request(app)
      .post(`/api/v1/sos/${createdSosId}/cancel`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('RESOLVED');
  });

  test('11. Log Out & Start Again (Reset Session) POST /api/v1/user/reset', async () => {
    const res = await request(app)
      .post('/api/v1/user/reset')
      .send({ user_id: createdUserId });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const checkRes = await request(app).get(`/api/v1/user/profile?user_id=${createdUserId}`);
    expect(checkRes.body.user).toBeNull();
  });
});
