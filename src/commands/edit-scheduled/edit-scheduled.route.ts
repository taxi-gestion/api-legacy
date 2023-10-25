import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { CommandsResult, Entity, Pending, Scheduled, ToScheduledEdited } from '../../definitions';
import { persistEditedFares } from './edit-scheduled.persistence';
import { $faresToEditValidation, editedFaresValidation } from './edit-scheduled.validation';
import { editScheduled } from './edit-scheduled';

export type EditScheduledRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: Entity & ToScheduledEdited;
}>;

export type FaresToEdit = {
  toEdit: ToScheduledEdited;
  scheduledToEdit: Entity & Scheduled;
  pendingToDelete: Entity | undefined;
};

export type EditedToPersist = {
  scheduledToEdit: Entity & Scheduled;
  pendingToCreate: Pending | undefined;
  pendingToDelete: Entity | undefined;
};

export const editScheduledCommand = async (
  server: FastifyInstance
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<void> => {
  server.route({
    method: 'POST',
    url: '/fare/edit',
    handler: async (req: EditScheduledRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.body,
        $faresToEditValidation(server.pg),
        editScheduled,
        taskEitherChain(persistEditedFares(server.pg)),
        taskEitherChain(editedFaresValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<CommandsResult<'edit-scheduled'>>)
      )();
    }
  });
};
