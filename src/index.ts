import http from 'http';
import path from 'path';
import assert from 'assert';

import request from 'supertest';
import { readPackageUp } from 'read-package-up';
import { listen, startApp, startGlobalTelemetry } from '@openapi-typescript-infra/service';
import type {
  Service,
  RequestLocals,
  ServiceFactory,
  ServiceExpress,
  ServiceLocals,
  ServiceStartOptions,
  AnyServiceLocals,
  ConfigurationSchema,
} from '@openapi-typescript-infra/service';

let app: ServiceExpress | undefined;
let appService: ServiceFactory<ServiceLocals, RequestLocals> | undefined;
let listener: http.Server | undefined;

await import('tsx/esm');

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
  SLocals extends AnyServiceLocals = ServiceLocals<ConfigurationSchema>,
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
  let version = isServiceFn ? undefined : options?.version;
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
      const module = await import(finalPath);
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
    if (!version) {
      version = pkg.packageJson.version;
    }
  }
  return {
    name,
    version: version || '0.0.0',
    ...finalOptions,
    service: factory,
  };
}

class RequestTestingHelpers {
  constructor(private app: ServiceExpress) {
  }

  get request() {
    return request(this.app);
  }
}

export interface ServiceUnderTest<
  SLocals extends AnyServiceLocals = ServiceLocals<ConfigurationSchema>,
> extends ServiceExpress<SLocals> {
  test: RequestTestingHelpers;
}

export function getExistingApp<
  SLocals extends AnyServiceLocals = ServiceLocals<ConfigurationSchema>,
>() {
  if (!app) {
    throw new Error('getExistingApp requires a running app, and there is not one available.');
  }
  return app as ServiceUnderTest<SLocals>;
}

export async function enableTelemetry(name: string) {
  return startGlobalTelemetry(name);
}

export async function getReusableApp<
  SLocals extends AnyServiceLocals = ServiceLocals<ConfigurationSchema>,
  RLocals extends RequestLocals = RequestLocals,
>(
  initialOptions?:
    | Partial<ServiceStartOptions<SLocals, RLocals>>
    | ServiceFactory<SLocals, RLocals>,
  cwd?: string,
): Promise<ServiceUnderTest<SLocals>> {
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
      listener = await listen(typedApp);
    }
    return typedApp;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Shared app startup failed', error);
    throw error;
  }
}

export async function clearReusableApp() {
  const oldListener = listener;
  app = undefined;
  appService = undefined;
  try {
    if (oldListener) {
      return new Promise((resolve) => {
        oldListener?.close(resolve);
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Shared app shutdown failed', error);
  }
}

export async function getSimulatedContext<Config extends ConfigurationSchema = ConfigurationSchema>(
  config?: Config,
) {
  return {
    name: 'fake-serv',
    version: '1.0.0',
    config: config || ({} as Config),
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
