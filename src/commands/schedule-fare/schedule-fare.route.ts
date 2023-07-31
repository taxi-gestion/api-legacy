import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { PostgresDb } from '@fastify/postgres';
import { QueryResult } from 'pg';
import { scheduleFareValidation } from './schedule-fare.validation';
import { scheduleFares } from './schedule-fares';
import { persistFares, toFaresPersistence } from './schedule-fare.persistence';
import { FareToScheduleTransfer } from './schedule-fare.codec';

type FareToScheduleRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: FareToScheduleTransfer;
}>;

// eslint-disable-next-line @typescript-eslint/require-await
export const scheduleFareCommand = async (server: FastifyInstance, _dependencies: { database: PostgresDb }): Promise<void> => {
  server.route({
    method: 'POST',
    url: '/schedule-fare',
    handler: async (req: FareToScheduleRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.body,
        scheduleFareValidation,
        scheduleFares,
        toFaresPersistence,
        persistFares(server.pg /*dependencies.database*/),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<QueryResult[]>)
      )();
    }
  });
};
