import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { PostgresDb } from '@fastify/postgres';
import { QueryResult } from 'pg';
import { scheduleFareValidation } from './schedule-fare.validation';
import { scheduleFare } from './schedule-fare';
import { persistFares, toFaresPersistence } from './schedule-fare.persistence';
import { FareToSchedule } from '../../definitions';

type FareToScheduleRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: FareToSchedule;
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
        scheduleFare,
        toFaresPersistence,
        persistFares(server.pg),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<QueryResult[]>)
      )();
    }
  });
};
