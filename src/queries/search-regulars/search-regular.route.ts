import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { fold as taskEitherFold, chain as taskEitherChain } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { Entity, RegularDetails } from '../../definitions';
import { searchRegularsDatabaseQuery } from './search-regular.persistence';
import { regularsValidation, searchRegularValidation } from './search-regular.validation';

export type SearchRegularRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: {
    query: string;
  };
}>;

/* eslint-disable @typescript-eslint/require-await */
export const searchRegularQuery = async (server: FastifyInstance): Promise<void> => {
  server.route({
    method: 'GET',
    url: '/regular/search/:query',
    handler: async (req: SearchRegularRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.params.query,
        searchRegularValidation,
        taskEitherChain(searchRegularsDatabaseQuery(server.pg)),
        taskEitherChain(regularsValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<(Entity & RegularDetails)[]>)
      )();
    }
  });
};
/* eslint-enable @typescript-eslint/require-await */
