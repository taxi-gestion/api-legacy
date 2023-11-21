import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { persistDeleteFares } from './delete-fare.persistence';
import { $fareToDeleteValidation, deletedValidation } from './delete-fare.validation';
import { CommandsResult, Entity } from '../../definitions';

export type FareToDeleteRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: {
    id: string;
  };
}>;

export type FaresToDelete = {
  scheduledToDelete: Entity | undefined;
  pendingToDelete: Entity | undefined;
  unassignedToDelete: Entity | undefined;
  recurringToDelete: Entity | undefined;
};

export const deleteFareCommand = async (
  server: FastifyInstance
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<void> => {
  server.route({
    method: 'DELETE',
    url: '/fare/delete/:id',
    handler: async (req: FareToDeleteRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.params.id,
        $fareToDeleteValidation(server.pg),
        taskEitherChain(persistDeleteFares(server.pg)),
        taskEitherChain(deletedValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<CommandsResult<'delete-fare'>>)
      )();
    }
  });
};
