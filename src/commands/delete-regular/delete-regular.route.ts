import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { persistDeleteRegular } from './delete-regular.persistence';
import { $regularToDeleteValidation, deletedValidation } from './delete-regular.validation';
import { Entity, RegularDeleted } from '../../definitions';

export type RegularToDeleteRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: {
    id: string;
  };
}>;

export type RegularToDelete = {
  regularToDelete: Entity;
};

export const deleteRegularCommand = async (
  server: FastifyInstance
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<void> => {
  server.route({
    method: 'DELETE',
    url: '/regular/delete/:id',
    handler: async (req: RegularToDeleteRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.params.id,
        $regularToDeleteValidation(server.pg),
        taskEitherChain(persistDeleteRegular(server.pg)),
        taskEitherChain(deletedValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<RegularDeleted>)
      )();
    }
  });
};
