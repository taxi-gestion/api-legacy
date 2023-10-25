import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { Entity, ToSubcontracted, Scheduled, Subcontracted, CommandsResult } from '../../definitions';
import { persistSubcontractedFares } from './subcontract-fare.persistence';
import { $subcontractFareValidation, subcontractedValidation } from './subcontract-fare.validation';
import { subcontractFare } from './subcontract-fare';

export type SubcontractFareRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: Entity & ToSubcontracted;
}>;

export type FaresToSubcontract = {
  toSubcontract: ToSubcontracted;
  scheduledToCopyAndDelete: Entity & Scheduled;
  pendingToDelete: Entity | undefined;
};

export type SubcontractedToPersist = {
  subcontractedToPersist: Subcontracted;
  scheduledToDelete: Entity;
  pendingToDelete: Entity | undefined;
};

export const subcontractFareCommand = async (
  server: FastifyInstance
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<void> => {
  server.route({
    method: 'POST',
    url: '/fare/subcontract',
    handler: async (req: SubcontractFareRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.body,
        $subcontractFareValidation(server.pg),
        subcontractFare,
        taskEitherChain(persistSubcontractedFares(server.pg)),
        taskEitherChain(subcontractedValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<CommandsResult<'subcontract-fare'>>)
      )();
    }
  });
};
