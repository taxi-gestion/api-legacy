import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { PostgresDb } from '@fastify/postgres';
import { QueryResult } from 'pg';
import { deleteScheduledFareAndReturn } from './delete-fare.persistence';
import { $deleteFareValidation } from './delete-fare.validation';

export type ScheduledToDeleteRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: {
    id: string;
  };
}>;

export const deleteFareCommand = async (
  server: FastifyInstance,
  _dependencies: { database: PostgresDb }
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<void> => {
  server.route({
    method: 'DELETE',
    url: '/delete-fare/:id',
    handler: async (req: ScheduledToDeleteRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.params.id,
        $deleteFareValidation(server.pg),
        taskEitherChain(deleteScheduledFareAndReturn(server.pg)),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<QueryResult[]>)
      )();
    }
  });
};
