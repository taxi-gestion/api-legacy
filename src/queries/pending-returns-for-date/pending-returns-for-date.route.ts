import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { Entity, Pending } from '../../definitions';
import { pendingReturnsForTheDateDatabaseQuery } from './pending-returns-for-date.persistence';
import { pendingReturnsValidation } from './pending-returns-for-date.validation';
import { isDateString } from '../../rules';

export type PendingReturnsForDateRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: {
    date: string;
  };
}>;

/* eslint-disable @typescript-eslint/require-await */
export const pendingReturnsForTheDateQuery = async (server: FastifyInstance): Promise<void> => {
  server.route({
    method: 'GET',
    url: '/pending/:date',
    handler: async (req: PendingReturnsForDateRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        isDateString.decode(req.params.date),
        pendingReturnsForTheDateDatabaseQuery(server.pg),
        taskEitherChain(pendingReturnsValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<(Entity & Pending)[]>)
      )();
    }
  });
};
/* eslint-enable @typescript-eslint/require-await */
