import path from 'path';
import assert from 'assert';

import _ from 'lodash';
import readPackageUp from 'read-pkg-up';
import { shutdownApp, startApp } from '@openapi-typescript-infra/service';
import type { JestConfigWithTsJest } from 'ts-jest';
import type {
  Service,
  RequestLocals,
  ServiceFactory,
  ServiceExpress,
  ServiceLocals,
  ServiceStartOptions,
} from '@openapi-typescript-infra/service';

let app: ServiceExpress | undefined;
let appService: ServiceFactory<ServiceLocals, RequestLocals> | undefined;

async function getRootDirectory(cwd: string, root?: string) {
  if (root) {
    return root;
  }
  const pkg = await readPackageUp({ cwd });
  if (!pkg) {
    throw new Error('Could not locate package directory');
  }
  return path.dirname(pkg.path);
}

async function readOptions<
  SLocals extends ServiceLocals = ServiceLocals,
  RLocals extends RequestLocals = RequestLocals,
>(
  cwd: string,
  options: Partial<ServiceStartOptions<SLocals, RLocals>> | ServiceFactory<SLocals, RLocals> = {},
): Promise<ServiceStartOptions<SLocals, RLocals>> {
  const isServiceFn = typeof options === 'function';
  let factory = isServiceFn ? options : options.service;
  const rootDirectory = await getRootDirectory(
    cwd,
    isServiceFn ? undefined : options?.rootDirectory,
  );
  let name = isServiceFn ? undefined : options?.name;
  const finalOptions = {
    codepath: 'src',
    rootDirectory,
    ...(isServiceFn ? {} : options),
  } as const;
  if (!factory || !name) {
    const pkg = await readPackageUp({ cwd: finalOptions.rootDirectory });
    assert(pkg, 'Could not find package.json');
    let main: string = pkg.packageJson.main || 'src/index.ts';
    if (finalOptions.codepath === 'src') {
      main = main.replace(/^(\.?\/?)(build|dist)\//, '$1src/').replace(/\.js$/, '.ts');
    }
    if (!factory) {
      const finalPath = path.resolve(rootDirectory, main);
      // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
      const module = require(finalPath);
      factory = (module.default || module.service) as () => Service<SLocals, RLocals>;
      if (!factory) {
        throw new Error(`Could not find the service method in ${finalPath}`);
      }
    }
    if (!name) {
      const nameInfo = pkg.packageJson.name.split('/');
      name = nameInfo[nameInfo.length - 1];
    }
  }
  return {
    name,
    ...finalOptions,
    service: factory,
  };
}

export function getExistingApp<SLocals extends ServiceLocals = ServiceLocals>() {
  if (!app) {
    throw new Error('getExistingApp requires a running app, and there is not one available.');
  }
  return app as ServiceExpress<SLocals>;
}

export async function getReusableApp<
  SLocals extends ServiceLocals = ServiceLocals,
  RLocals extends RequestLocals = RequestLocals,
>(
  initialOptions?:
  | Partial<ServiceStartOptions<SLocals, RLocals>>
  | ServiceFactory<SLocals, RLocals>,
  cwd?: string,
): Promise<ServiceExpress<SLocals>> {
  const logFn = (error: Error) => {
    // eslint-disable-next-line no-console
    console.error('Could not start app', error);
    throw error;
  };
  let typedApp = app as ServiceExpress<SLocals>;

  try {
    const options = await readOptions(cwd || process.cwd(), initialOptions).catch(logFn);
    if (!app || appService !== options.service) {
      typedApp = await startApp(options).catch(logFn);
      appService = options.service as ServiceFactory<ServiceLocals, RequestLocals>;
      app = typedApp;
      return typedApp;
    }
    return typedApp;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Shared app startup failed', error);
    throw error;
  }
}

export async function clearReusableApp() {
  try {
    if (app) {
      await shutdownApp(app);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Shared app shutdown failed', error);
  }
  app = undefined;
  appService = undefined;
}

export async function getSimulatedContext(config?: Record<string, JSON>) {
  return {
    name: 'fake-serv',
    config: {
      get(key: string) {
        return _.get(config || {}, key.split(':'));
      },
    },
    logger: {
      level: 'debug',
      silent() {
        // Nothing to do here
      },
      // eslint-disable-next-line no-console
      fatal: (...args: Parameters<typeof console.error>) => console.error(...args),
      ...console,
    },
  };
}

export function mockServiceCall<
  TargetService extends object,
  M extends keyof jest.FunctionProperties<Required<TargetService>>,
>(service: TargetService, method: M) {
  const spy = jest.spyOn(service, method);
  // I feel like Typescript should've been able to figure this out,
  // but I couldn't get it to and neither could the Interwebs. So a slightly
  // unsafe cast it is.
  type ResponseType = Parameters<typeof spy['mockResolvedValue']>[0];
  return {
    mockResolvedValue: (sim: Partial<ResponseType>) => spy.mockResolvedValue({
      responseType: 'response',
      status: 200,
      ...sim,
      headers: new Headers(sim.headers || {}),
    } as ResponseType),
    mockResolvedValueOnce: (sim: Partial<ResponseType>) => spy.mockResolvedValueOnce({
      responseType: 'response',
      status: 200,
      ...sim,
      headers: new Headers(sim.headers || {}),
    } as ResponseType),
    mockRejectedValue: (sim: Partial<ResponseType>) => spy.mockResolvedValueOnce({
      responseType: 'error',
      status: 500,
      ...sim,
      headers: new Headers(sim.headers || {}),
    } as ResponseType),
    mockRejectedValueOnce: (sim: Partial<ResponseType>) => spy.mockResolvedValueOnce({
      responseType: 'error',
      ...sim,
      headers: new Headers(sim.headers || {}),
    } as ResponseType),
    spy,
  };
}

export const jestConfig: JestConfigWithTsJest = {
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '(\\.|/)(test|spec)\\.[jt]sx?$',
  setupFilesAfterEnv: [path.resolve(__dirname, '../build/afterAll.js')],
};

export { default as request } from 'supertest';
