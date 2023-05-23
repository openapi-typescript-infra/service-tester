import { ServiceRouter } from '@openapi-typescript-infra/service';

import { FakeServLocals } from '../types';

export function route(router: ServiceRouter<FakeServLocals>) {
  router.get('/', (req, res) => {
    res.json({});
  });

  router.post('/', async (req, res) => {
    const { body } = await req.app.locals.services.fakeServ.get_something();
    res.json(body);
  });
}
