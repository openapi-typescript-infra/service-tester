import path from 'path';
import assert from 'assert';

import request from 'supertest';
import { makeFetch } from 'supertest-fetch';
// We are going to test Typescript files, so use the ts-node
// register hook to allow require to resolve these modules
import { register } from 'ts-node';
import _ from 'lodash';
import readPackageUp from 'read-pkg-up';
import { shutdownApp, startApp } from '@openapi-typescript-infra/service';
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

register();
require('tsconfig-paths/register');

async function loadModule(path: string): Promise<Record<string, unknown>> {
  try {
    return require(path);
  } catch (error) {
    if ((error as Error).message.includes('Cannot use import statement outside a module')) {
      return import(path);
    }
    throw error;
  }
}

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
      const module = await loadModule(finalPath);
      factory = module
        ? ((module.default || module.service) as () => Service<SLocals, RLocals>)
        : undefined;
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

class RequestTestingHelpers {
  _fetch: ReturnType<typeof makeFetch>;

  constructor(private app: ServiceExpress) {
    this._fetch = makeFetch(app as unknown as Parameters<typeof makeFetch>[0]);
  }

  get request() {
    return request(this.app);
  }

  get fetch() {
    return this._fetch as unknown as typeof fetch;
  }
}

export async function getReusableApp<
  SLocals extends ServiceLocals = ServiceLocals,
  RLocals extends RequestLocals = RequestLocals,
>(
  initialOptions?:
    | Partial<ServiceStartOptions<SLocals, RLocals>>
    | ServiceFactory<SLocals, RLocals>,
  cwd?: string,
): Promise<ServiceExpress<SLocals> & { test: RequestTestingHelpers }> {
  const logFn = (error: Error) => {
    // eslint-disable-next-line no-console
    console.error('Could not start app', error);
    throw error;
  };
  let typedApp = app as ServiceExpress<SLocals> & { test: RequestTestingHelpers };

  try {
    const options = await readOptions(cwd || process.cwd(), initialOptions).catch(logFn);
    if (!app || appService !== options.service) {
      const untypedApp = await startApp(options).catch(logFn);
      typedApp = Object.assign(untypedApp, {
        test: new RequestTestingHelpers(untypedApp),
      });
      appService = options.service as ServiceFactory<ServiceLocals, RequestLocals>;
      app = typedApp;
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

export { default as request } from 'supertest';
