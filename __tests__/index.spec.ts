import request from 'supertest';
import { describe, expect, test, vi } from 'vitest';
import type { Service, ServiceStartOptions } from '@openapi-typescript-infra/service';

import { getReusableApp, clearReusableApp, getExistingApp } from '../src';

import { FakeServLocals } from './src/types';

function getFakeServiceFn(flags: {
  started: number;
  stopped: number;
}): () => Service<FakeServLocals> {
  return () => ({
    start(app) {
      app.locals.services = {
        fakeServ: {
          async get_something() {
            throw new Error('Should not be called.');
          },
        },
      };
      flags.started += 1;
    },
    async stop() {
      flags.stopped += 1;
    },
  });
}

describe('Start and stop shared app', () => {
  const flags = { started: 0, stopped: 0 };
  const options: ServiceStartOptions<FakeServLocals> = {
    service: getFakeServiceFn(flags),
    rootDirectory: __dirname,
    codepath: 'src',
    name: 'fake-serv',
  };

  test('Start reusable app', async () => {
    const app = await getReusableApp(options);
    expect(app).toBeTruthy();
    const secondApp = await getReusableApp(options);
    expect(secondApp).toEqual(app);
    expect(flags.started).toEqual(1);
    expect(flags.stopped).toEqual(0);
  });
  /*
  test('Should reuse app', async () => {
    const app = await getExistingApp();
    expect(app).toBeTruthy();
    expect(flags.started).toEqual(1);
    expect(flags.stopped).toEqual(0);
  });

  test('Should make requests', async () => {
    const app = await getExistingApp<FakeServLocals>();
    await request(app).get('/').expect(200);
    await request(app).get('/foobar').expect(404);
    await request(app).post('/').expect(500);
    vi.spyOn(app.locals.services.fakeServ, 'get_something').mockResolvedValue({
      responseType: 'response',
      status: 200,
      body: { things: ['a', 'b', 'c'] },
    });
    const { body } = await request(app).post('/').expect(200);
    expect(body.things).toBeTruthy();
    expect(body.things.length).toEqual(3);
  });

  test('Should shut down app', async () => {
    const exapp = getExistingApp();
    await clearReusableApp();
    expect(flags.started).toEqual(1);
    expect(flags.stopped).toEqual(1);
    expect(Promise.resolve().then(getExistingApp)).rejects.toThrow('requires a running app');
    const app = await getReusableApp(options);
    expect(flags.started).toEqual(2);
    expect(flags.stopped).toEqual(1);
    expect(app).not.toEqual(exapp);
    await clearReusableApp();
    expect(flags.started).toEqual(2);
    expect(flags.stopped).toEqual(2);
  });

  test('Should load app with defaults', async () => {
    await getReusableApp({
      rootDirectory: __dirname,
    });
  });
  */
  test('Should pass', async () => {});
});
