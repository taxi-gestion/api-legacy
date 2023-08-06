import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { searchPlaceValidation } from './search-place.validation';
import { searchPlace, SearchPlaceAdapter } from './search-place';
import { Place } from '../../definitions';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';

export type SearchPlaceRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: {
    query: string;
  };
}>;

/* eslint-disable @typescript-eslint/require-await */
export const searchPlaceQuery = async (
  server: FastifyInstance,
  dependencies: { adapter: SearchPlaceAdapter }
): Promise<void> => {
  server.route({
    method: 'GET',
    url: '/search-place/:query',
    handler: async (req: SearchPlaceRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.params,
        searchPlaceValidation,
        taskEitherChain(searchPlace(dependencies.adapter)),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<Place[]>)
      )();
    }
  });
};
/* eslint-enable @typescript-eslint/require-await */
