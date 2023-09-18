import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { ApplicativePar, chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { listDrivers, ListDriversAdapter, mergeProperties } from './list-drivers';
import { Driver, Entity } from '../../definitions';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { listDriversPersistenceQuery } from './list-drivers.persistence';
import { listDriversValidation } from './list-drivers.validation';
import { sequenceT } from 'fp-ts/Apply';

/* eslint-disable @typescript-eslint/require-await */
export const listDriversQuery = async (
  server: FastifyInstance,
  dependencies: { adapter: ListDriversAdapter }
): Promise<void> => {
  server.route({
    method: 'GET',
    url: '/driver/list',
    handler: async (_req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        sequenceT(ApplicativePar)(
          listDrivers(dependencies.adapter),
          pipe(listDriversPersistenceQuery(server.pg)(), taskEitherChain(listDriversValidation))
        ),
        taskEitherChain(mergeProperties),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<(Driver & Entity)[]>)
      )();
    }
  });
};
/* eslint-enable @typescript-eslint/require-await */
