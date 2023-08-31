import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { Entity, FareToSubcontract, Pending, Scheduled, Subcontracted } from '../../definitions';
import { persistSubcontractAndDeleteScheduledAndPending } from './subcontract-fare.persistence';
import { $subcontractFareValidation, subcontractedValidation } from './subcontract-fare.validation';
import { subcontractFare } from './subcontract-fare';

export type SubcontractFareRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: Entity & FareToSubcontract;
}>;

export type ToSubcontractValidation = {
  toSubcontract: FareToSubcontract;
  scheduledToCopyAndDelete: Entity & Scheduled;
  pendingToDelete?: Entity;
};

export type SubcontractedActions = {
  subcontractedToPersist: Subcontracted;
  scheduledToDelete: Entity;
  pendingToDelete?: Entity;
};

export type SubcontractedValidated = {
  subcontracted: Entity & Subcontracted;
  scheduledDeleted: Entity & Scheduled;
  pendingDeleted?: Entity & Pending;
};

export const subcontractFareCommand = async (
  server: FastifyInstance
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<void> => {
  server.route({
    method: 'POST',
    url: '/subcontract-fare',
    handler: async (req: SubcontractFareRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.body,
        $subcontractFareValidation(server.pg),
        subcontractFare,
        taskEitherChain(persistSubcontractAndDeleteScheduledAndPending(server.pg)),
        taskEitherChain(subcontractedValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<SubcontractedValidated>)
      )();
    }
  });
};
