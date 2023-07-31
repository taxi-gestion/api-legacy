import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold, map as taskEitherMap, TaskEither } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { PostgresDb } from '@fastify/postgres';
import { QueryResult } from 'pg';
import { $affectReturnValidation } from './affect-return.validation';
import { affectReturn } from './affect-return';
import {
  persistFareAndDeleteReturnToAffect,
  ScheduledReturnPersistence,
  toScheduledReturnPersistence
} from './affect-return.persistence';
import { Errors } from '../../reporter/HttpReporter';
import { ReturnToAffectTransfer } from './affect-return.codec';

export type ReturnToAffectRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: ReturnToAffectTransfer;
}>;

// eslint-disable-next-line @typescript-eslint/require-await
export const affectReturnCommand = async (server: FastifyInstance, _dependencies: { database: PostgresDb }): Promise<void> => {
  server.route({
    method: 'POST',
    url: '/affect-return',
    handler: async (req: ReturnToAffectRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.body,
        $affectReturnValidation(server.pg /*dependencies.database*/),
        affectReturn,
        taskEitherMap(toScheduledReturnPersistence),
        taskEitherChain(
          (fareToPersist: ScheduledReturnPersistence): TaskEither<Errors, QueryResult[]> =>
            persistFareAndDeleteReturnToAffect(server.pg /*dependencies.database*/)(fareToPersist, req.body.fareId)
        ),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<QueryResult[]>)
      )();
    }
  });
};
