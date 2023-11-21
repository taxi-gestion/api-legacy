import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { CommandsResult, ToUnassigned, Unassigned } from '../../definitions';
import { unassignedAllocatedValidation, unassignedToAllocateValidation } from './allocate-unassigned.validation';
import { allocateUnassigned } from './allocate-unassigned';
import { persistUnassignedFP } from './allocate-unassigned.persistence';

type UnassignedToAllocateRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: ToUnassigned;
}>;

export type UnassignedPersist = {
  unassignedToCreate: Unassigned;
};

// eslint-disable-next-line @typescript-eslint/require-await
export const allocateUnassignedCommand = async (server: FastifyInstance): Promise<void> => {
  server.route({
    method: 'POST',
    url: '/fare/allocate-unassigned',
    handler: async (req: UnassignedToAllocateRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.body,
        unassignedToAllocateValidation,
        allocateUnassigned,
        persistUnassignedFP(server.pg),
        taskEitherChain(unassignedAllocatedValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<CommandsResult<'allocate-unassigned'>>)
      )();
    }
  });
};
