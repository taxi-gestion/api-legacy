import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { fold as taskEitherFold, chain as taskEitherChain } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { Entity, Regular } from '../../definitions';
import { regularByIdDatabaseQuery } from './regular-by-id.persistence';
import { regularByIdValidation, regularValidation } from './regular-by-id.validation';

export type RegularByIdRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: {
    id: string;
  };
}>;

/* eslint-disable @typescript-eslint/require-await */
export const regularByIdQuery = async (server: FastifyInstance): Promise<void> => {
  server.route({
    method: 'GET',
    url: '/regular/id/:id',
    handler: async (req: RegularByIdRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.params.id,
        regularByIdValidation,
        taskEitherChain(regularByIdDatabaseQuery(server.pg)),
        taskEitherChain(regularValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<Entity & Regular>)
      )();
    }
  });
};
/* eslint-enable @typescript-eslint/require-await */
