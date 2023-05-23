import { ServiceLocals } from '@openapi-typescript-infra/service';
import { RestApiErrorResponse, RestApiSuccessResponse } from 'rest-api-support';

export interface FakeServLocals extends ServiceLocals {
  services: {
    fakeServ: {
      get_something(): Promise<RestApiSuccessResponse<{ things: string[] }> | RestApiErrorResponse>;
    }
  }
}
