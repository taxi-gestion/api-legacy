import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { Entity, Regular, CommandsResult, RegularPatchableProperties } from '../../definitions';
import { persistPatchedRegular } from './patch-regular.persistence';
import { $regularToPatchValidation, patchedRegularValidation } from './patch-regular.validation';
import { patchRegular } from './patch-regular';

export type PatchRegularRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: Entity & RegularPatchableProperties;
}>;

export type RegularToPatch = {
  toPatch: Entity & RegularPatchableProperties;
  regularToPatch: Entity & Regular;
};

export type RegularToPatchPersist = {
  toPatch: Entity & RegularPatchableProperties;
};

export const patchRegularCommand = async (
  server: FastifyInstance
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<void> => {
  server.route({
    method: 'PATCH',
    url: '/regular/patch',
    handler: async (req: PatchRegularRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.body,
        $regularToPatchValidation(server.pg),
        patchRegular,
        taskEitherChain(persistPatchedRegular(server.pg)),
        taskEitherChain(patchedRegularValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<CommandsResult<'patch-regular'>>)
      )();
    }
  });
};
