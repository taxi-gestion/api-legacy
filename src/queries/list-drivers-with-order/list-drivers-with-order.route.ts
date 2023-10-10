import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { ApplicativePar, chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { listDriversFromIdentityProvider, ListDriversAdapter, mergeProperties } from './list-drivers-with-order';
import { DriverWithOrder } from '../../definitions';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { listDriversPersistenceQuery } from './list-drivers-with-order.persistence';
import { listDriversWithOrderValidation } from './list-drivers-with-order.validation';
import { sequenceT } from 'fp-ts/Apply';

/* eslint-disable @typescript-eslint/require-await */
export const listDriversWithDisplayOrderQuery = async (
  server: FastifyInstance,
  dependencies: { adapter: ListDriversAdapter }
): Promise<void> => {
  server.route({
    method: 'GET',
    url: '/driver/list-with-display-order',
    handler: async (_req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        sequenceT(ApplicativePar)(
          listDriversFromIdentityProvider(dependencies.adapter),
          pipe(listDriversPersistenceQuery(server.pg)(), taskEitherChain(listDriversWithOrderValidation))
        ),
        taskEitherChain(mergeProperties),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<DriverWithOrder[]>)
      )();
    }
  });
};
/* eslint-enable @typescript-eslint/require-await */
