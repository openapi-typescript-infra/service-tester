# [6.0.0](https://github.com/openapi-typescript-infra/service-tester/compare/v5.1.0...v6.0.0) (2024-10-18)


### Features

* Move to ESM ([84b50eb](https://github.com/openapi-typescript-infra/service-tester/commit/84b50ebafd28baa454b2ba2d6bdf37b48f9e15d0))


### BREAKING CHANGES

* Move to ESM

# [5.1.0](https://github.com/openapi-typescript-infra/service-tester/compare/v5.0.0...v5.1.0) (2024-04-29)


### Features

* **app:** listen on a port for the app to make openapi testing work properly ([76c0888](https://github.com/openapi-typescript-infra/service-tester/commit/76c0888a08aa3f84dbd503e601c71e1aa26632e1))

# [5.0.0](https://github.com/openapi-typescript-infra/service-tester/compare/v4.0.3...v5.0.0) (2024-04-28)


### Bug Fixes

* **ci:** update workflow actions ([876a534](https://github.com/openapi-typescript-infra/service-tester/commit/876a53494256aec421c74ab4cc5a33b0519738f8))
* **fetch:** remove supertest fetch as it is unnecessary ([e49f3bb](https://github.com/openapi-typescript-infra/service-tester/commit/e49f3bba2fc51f8b14c05d1f016eb23e5a22081c))
* **yarn:** bump yarn version ([30da748](https://github.com/openapi-typescript-infra/service-tester/commit/30da748fac232fd69eee2abcf4f5807a5c68bb10))


### BREAKING CHANGES

* **fetch:** no more supertest fetch

## [4.0.3](https://github.com/openapi-typescript-infra/service-tester/compare/v4.0.2...v4.0.3) (2023-11-06)


### Bug Fixes

* **deps:** get latest deps ([ef9ed22](https://github.com/openapi-typescript-infra/service-tester/commit/ef9ed22807100cae9f092f32c099103db116a570))

## [4.0.2](https://github.com/openapi-typescript-infra/service-tester/compare/v4.0.1...v4.0.2) (2023-10-24)


### Bug Fixes

* **shutdown:** handle simultaneous shutdown ([f8d68a1](https://github.com/openapi-typescript-infra/service-tester/commit/f8d68a1c7ca83b32d270309f57b9a3131db13bcf))

## [4.0.1](https://github.com/openapi-typescript-infra/service-tester/compare/v4.0.0...v4.0.1) (2023-10-18)


### Bug Fixes

* **version:** add version info to app startup flow ([cfd427f](https://github.com/openapi-typescript-infra/service-tester/commit/cfd427fc41d54ce70051a43d9688782b49b233a9))

# [4.0.0](https://github.com/openapi-typescript-infra/service-tester/compare/v3.0.2...v4.0.0) (2023-10-18)


### Features

* **config:** expose raw config ([0e4351c](https://github.com/openapi-typescript-infra/service-tester/commit/0e4351ca6473debe8ed0bfbfbea77be856cef1f9))


### BREAKING CHANGES

* **config:** minor change to getSimulatedContext to take and give
a typed config object instead of a getter method.

## [3.0.2](https://github.com/openapi-typescript-infra/service-tester/compare/v3.0.1...v3.0.2) (2023-10-18)


### Bug Fixes

* **types:** clean up some app types ([a009003](https://github.com/openapi-typescript-infra/service-tester/commit/a0090037de4918da167fc9e631889588c9c888a0))

## [3.0.1](https://github.com/openapi-typescript-infra/service-tester/compare/v3.0.0...v3.0.1) (2023-10-18)


### Bug Fixes

* **deps:** get latest service module for better types ([6fa6ca4](https://github.com/openapi-typescript-infra/service-tester/commit/6fa6ca44b366fe55cfaebdd46256c0125591a5f4))

# [3.0.0](https://github.com/openapi-typescript-infra/service-tester/compare/v2.1.1...v3.0.0) (2023-10-17)


### Features

* **deps:** upgrade to new service module ([d759082](https://github.com/openapi-typescript-infra/service-tester/commit/d75908246598f53550788daf26a39ec8949a0717))


### BREAKING CHANGES

* **deps:** config is now typed

## [2.1.1](https://github.com/openapi-typescript-infra/service-tester/compare/v2.1.0...v2.1.1) (2023-09-17)


### Bug Fixes

* **types:** cleanup testing helper types ([27f6501](https://github.com/openapi-typescript-infra/service-tester/commit/27f6501b8d2e402937948f779cd876c93f4623d4))

# [2.1.0](https://github.com/openapi-typescript-infra/service-tester/compare/v2.0.1...v2.1.0) (2023-09-16)


### Features

* **fetch:** make it easier to generate typed clients for testing ([541fcfc](https://github.com/openapi-typescript-infra/service-tester/commit/541fcfc2391751fe7b9b86895b87005110f5250c))

## [2.0.1](https://github.com/openapi-typescript-infra/service-tester/compare/v2.0.0...v2.0.1) (2023-08-26)


### Bug Fixes

* **paths:** register tsconfig-paths to get proper module resolution ([0641402](https://github.com/openapi-typescript-infra/service-tester/commit/0641402754c3d7d7a754b74fb22001c4f30df48a))

# [2.0.0](https://github.com/openapi-typescript-infra/service-tester/compare/v1.0.6...v2.0.0) (2023-08-17)


### Bug Fixes

* **vitest:** move to vitest as jest causes problems with NextJS ([#1](https://github.com/openapi-typescript-infra/service-tester/issues/1)) ([e1ef2b5](https://github.com/openapi-typescript-infra/service-tester/commit/e1ef2b535ea3ef06db587a9b0d47fd7d48ceae34))


### BREAKING CHANGES

* **vitest:** vitest not jest
