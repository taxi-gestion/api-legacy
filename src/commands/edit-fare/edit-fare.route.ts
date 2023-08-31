import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { Entity, FareToEdit, Pending, Scheduled } from '../../definitions';
import { persistFareAndPending } from './edit-fare.persistence';
import { $editFareValidation, editedFaresValidation } from './edit-fare.validation';
import { editFare } from './edit-fare';

export type EditFareRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: Entity & FareToEdit;
}>;

export const editFareCommand = async (
  server: FastifyInstance
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<void> => {
  server.route({
    method: 'POST',
    url: '/edit-fare',
    handler: async (req: EditFareRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.body,
        $editFareValidation(server.pg),
        editFare,
        taskEitherChain(persistFareAndPending(server.pg)),
        taskEitherChain(editedFaresValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<[Entity & Scheduled, (Entity & Pending)?]>)
      )();
    }
  });
};
