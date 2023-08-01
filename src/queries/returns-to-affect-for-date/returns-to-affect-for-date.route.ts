import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { returnsToAffectForTheDateQuery } from './returns-to-affect-for-date.persistence';
import { PostgresDb } from '@fastify/postgres';
import { Entity, ReturnToAffect } from '../../definitions';
import { isDateISO8601String } from '../../codecs';

export type ReturnsToAffectForDateRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: {
    date: string;
  };
}>;

/* eslint-disable @typescript-eslint/require-await */
export const returnsToAffectForDateQuery = async (
  server: FastifyInstance,
  _dependencies: { database: PostgresDb }
): Promise<void> => {
  server.route({
    method: 'GET',
    url: '/returns-to-affect-for-date/:date',
    handler: async (req: ReturnsToAffectForDateRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        isDateISO8601String.decode(req.params.date),
        returnsToAffectForTheDateQuery(server.pg /*dependencies.database*/),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<Entity<ReturnToAffect>[]>)
      )();
    }
  });
};
/* eslint-enable @typescript-eslint/require-await */
