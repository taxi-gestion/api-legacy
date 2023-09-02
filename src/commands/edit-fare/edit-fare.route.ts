import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { Entity, FaresEdited, Pending, Scheduled, ToEdit } from '../../definitions';
import { persistEditedFares } from './edit-fare.persistence';
import { $faresToEditValidation, editedFaresValidation } from './edit-fare.validation';
import { editFare } from './edit-fare';

export type EditFareRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: Entity & ToEdit;
}>;

export type FaresToEdit = {
  toEdit: ToEdit;
  scheduledToEdit: Entity & Scheduled;
  pendingToDelete?: Entity;
};

export type EditedToPersist = {
  scheduledToEdit: Entity & Scheduled;
  pendingToCreate?: Pending;
  pendingToDelete?: Entity;
};

export const editFareCommand = async (
  server: FastifyInstance
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<void> => {
  server.route({
    method: 'POST',
    url: '/fare/edit',
    handler: async (req: EditFareRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.body,
        $faresToEditValidation(server.pg),
        editFare,
        taskEitherChain(persistEditedFares(server.pg)),
        taskEitherChain(editedFaresValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<FaresEdited>)
      )();
    }
  });
};
