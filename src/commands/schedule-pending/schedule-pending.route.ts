import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { Entity, Pending, ReturnDrive, Scheduled } from '../../definitions';
import { $schedulePendingValidation, scheduledPendingValidation } from './schedule-pending.validation';
import { schedulePending } from './schedule-pending';
import { persistPendingScheduled } from './schedule-pending.persistence';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';

export type ReturnToScheduleRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: Entity & ReturnDrive;
}>;

export type PendingToSchedule = {
  driveToSchedule: ReturnDrive;
  pendingToDelete: Entity & Pending;
};

export type PendingToSchedulePersist = {
  scheduledToCreate: Scheduled;
  pendingToDelete: Entity;
};

export type PendingScheduled = {
  scheduledCreated: Entity & Scheduled;
  pendingDeleted: Entity & Pending;
};

export const schedulePendingCommand = async (
  server: FastifyInstance
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<void> => {
  server.route({
    method: 'POST',
    url: '/pending/schedule',
    handler: async (req: ReturnToScheduleRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.body,
        $schedulePendingValidation(server.pg),
        schedulePending,
        taskEitherChain(persistPendingScheduled(server.pg)),
        taskEitherChain(scheduledPendingValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<PendingScheduled>)
      )();
    }
  });
};
