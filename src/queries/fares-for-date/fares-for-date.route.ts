import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { PostgresDb } from '@fastify/postgres';
import { faresForTheDateQuery } from './fares-for-date.persistence';
import { isDateString } from '../../codecs';
import { Entity, Scheduled } from '../../definitions';

export type FareForDateRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: {
    date: string;
  };
}>;

// eslint-disable-next-line @typescript-eslint/require-await
export const faresForDateQuery = async (server: FastifyInstance, _dependencies: { database: PostgresDb }): Promise<void> => {
  server.route({
    method: 'GET',
    url: '/fares-for-date/:date',
    handler: async (req: FareForDateRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        isDateString.decode(req.params.date),
        faresForTheDateQuery(server.pg /*dependencies.database*/),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<Entity<Scheduled>[]>)
      )();
    }
  });
};
