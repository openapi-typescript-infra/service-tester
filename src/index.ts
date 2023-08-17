import path from 'path';
import assert from 'assert';

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
    console.log('FINAL OPTIONS', options);
    if (!app || appService !== options.service) {
      console.log('RUN IT');
      typedApp = await startApp(options).catch(logFn);
      console.log('RAN IT');
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

export { default as request } from 'supertest';
