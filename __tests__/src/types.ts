import type { ServiceLocals } from '@openapi-typescript-infra/service';

export interface FakeServLocals extends ServiceLocals {
  services: {
    fakeServ: {
      get_something(): Promise<{ body: { things: string[] } }>;
    }
  }
}
