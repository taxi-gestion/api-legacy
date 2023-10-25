import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { historyValidation, regularHistoryValidation } from './regular-history.validation';
import { regularHistoryPersistenceQuery } from './regular-history.persistence';
import { QueriesResult } from '../../definitions';

export type RegularHistoryRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: {
    id: string;
  };
}>;
export const regularHistoryQuery = async (
  server: FastifyInstance
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<void> => {
  server.route({
    method: 'GET',
    url: '/regular/history/:id',
    handler: async (req: RegularHistoryRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.params.id,
        regularHistoryValidation,
        regularHistoryPersistenceQuery(server.pg),
        taskEitherChain(historyValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<QueriesResult<'regular-history'>>)
      )();
    }
  });
};
