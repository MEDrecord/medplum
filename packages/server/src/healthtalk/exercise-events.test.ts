// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import express from 'express';
import { createHmac, randomUUID } from 'node:crypto';
import request from 'supertest';
import { initApp, shutdownApp } from '../app';
import { loadTestConfig } from '../config/loader';
import { createTestProject } from '../test.setup';

const GATEWAY_API_KEY = 'test_exercise_events_gateway_key';
const GATEWAY_SECRET = 'test_exercise_events_gateway_secret';
const PATH = '/healthtalk/exercise-events/';

function gatewayHeaders(method: string): Record<string, string> {
  const timestamp = Date.now().toString();
  const requestId = randomUUID();
  const signature = createHmac('sha256', GATEWAY_SECRET)
    .update(`${method}:${PATH}:${timestamp}:${requestId}`)
    .digest('hex');
  return {
    'x-gateway-key': GATEWAY_API_KEY,
    'x-gateway-timestamp': timestamp,
    'x-request-id': requestId,
    'x-gateway-signature': signature,
    'x-signed-path': PATH,
  };
}

describe('Exercise Events Routes', () => {
  const app = express();

  const event = {
    id: 411622,
    start_dt: '2023-09-11T10:00:00Z',
    end_dt: '2023-09-11T10:45:00Z',
    type_label: 'Warm Up',
  };

  const athlete = {
    id: 23474,
    email: 'lelia.wisozk@example.com',
    first_name: 'Lelia',
    last_name: 'Wisozk',
    number: 19,
    type: 'GK',
  };

  const statistic = {
    id: 8121304,
    event_id: 411622,
    participant_id: 23474,
    exercise_id: null,
    hr_avg: 3.0031472162723283,
    speed_max: 43.75178338430127,
    distance: 48.236379789397645,
  };

  beforeAll(async () => {
    const config = await loadTestConfig();
    const testProject = await createTestProject();
    config.gatewayApiKey = GATEWAY_API_KEY;
    config.gatewayServiceSecretKey = GATEWAY_SECRET;
    config.defaultProjectId = testProject.project.id as string;
    await initApp(app, config);
  });

  afterAll(async () => {
    await shutdownApp();
  });

  test('rejects requests without Gateway headers', async () => {
    const res = await request(app).post(PATH).send({ event, athlete, statistic });
    expect(res.status).toBe(400);
  });

  test('rejects an invalid Gateway signature', async () => {
    const res = await request(app)
      .post(PATH)
      .set({ ...gatewayHeaders('POST'), 'x-gateway-signature': 'deadbeef' })
      .send({ event, athlete, statistic });
    expect(res.status).toBe(400);
  });

  test('rejects payload missing event.id', async () => {
    const res = await request(app).post(PATH).set(gatewayHeaders('POST')).send({ event: {}, athlete, statistic });
    expect(res.status).toBe(400);
  });

  test('stores Patient, Encounter, and Observation for a valid payload', async () => {
    const res = await request(app).post(PATH).set(gatewayHeaders('POST')).send({ event, athlete, statistic });

    expect(res.status).toBe(200);
    expect(res.body.patient.id).toBeDefined();
    expect(res.body.encounter.id).toBeDefined();
    expect(res.body.observation.id).toBeDefined();
  });

  test('re-sending the same payload upserts instead of duplicating', async () => {
    const res1 = await request(app).post(PATH).set(gatewayHeaders('POST')).send({ event, athlete, statistic });
    const res2 = await request(app).post(PATH).set(gatewayHeaders('POST')).send({ event, athlete, statistic });

    expect(res1.body.patient.id).toBe(res2.body.patient.id);
    expect(res1.body.encounter.id).toBe(res2.body.encounter.id);
    expect(res1.body.observation.id).toBe(res2.body.observation.id);
  });
});
