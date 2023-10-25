import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { Entity, Regular, CommandsResult } from '../../definitions';
import { persistEditedRegular } from './edit-regular.persistence';
import { $regularToEditValidation, editedRegularValidation } from './edit-regular.validation';
import { editRegular } from './edit-regular';

export type EditRegularRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: Entity & Regular;
}>;

export type RegularToEdit = {
  toEdit: Regular;
  regularToEdit: Entity & Regular;
};

export type RegularToEditPersist = {
  regularToEdit: Entity & Regular;
};

export const editRegularCommand = async (
  server: FastifyInstance
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<void> => {
  server.route({
    method: 'POST',
    url: '/regular/edit',
    handler: async (req: EditRegularRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.body,
        $regularToEditValidation(server.pg),
        editRegular,
        taskEitherChain(persistEditedRegular(server.pg)),
        taskEitherChain(editedRegularValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<CommandsResult<'edit-regular'>>)
      )();
    }
  });
};
