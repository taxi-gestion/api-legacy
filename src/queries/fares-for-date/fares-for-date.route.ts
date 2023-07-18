import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { isDateISO8601String } from '../../rules/DateISO8601.rule';
import { Scheduled } from '../../definitions/fares.definitions';
import { Entity } from '../../definitions/entity.definition';
import { PostgresDb } from '@fastify/postgres';
import { faresForTheDateQuery } from './fares-for-date.persistence';

export type FareForDateRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: {
    date: string;
  };
}>;

// eslint-disable-next-line @typescript-eslint/require-await
export const faresForDateQuery = async (server: FastifyInstance, dependencies: { database: PostgresDb }): Promise<void> => {
  server.route({
    method: 'GET',
    url: '/fares-for-date/:date',
    handler: async (req: FareForDateRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        isDateISO8601String.decode(req.params.date),
        faresForTheDateQuery(dependencies.database),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<Entity<Scheduled>[]>)
      )();
    }
  });
};
