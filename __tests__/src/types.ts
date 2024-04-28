import { ServiceLocals } from '@openapi-typescript-infra/service';

export interface FakeServLocals extends ServiceLocals {
  services: {
    fakeServ: {
      get_something(): Promise<{ things: string[] }>;
    }
  }
}
