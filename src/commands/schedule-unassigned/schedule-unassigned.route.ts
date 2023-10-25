import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { Entity, Scheduled, CommandsResult, ToScheduled, Pending } from '../../definitions';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { $scheduleUnassignedValidation, scheduledUnassignedValidation } from './schedule-unassigned.validation';
import { scheduleUnassigned } from './schedule-unassigned';
import { persistUnassignedScheduled } from './schedule-unassigned.persistence';

export type UnassignedToScheduleRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: Entity & ToScheduled;
}>;

export type UnassignedToSchedule = {
  toSchedule: ToScheduled;
  unassignedToDelete: Entity;
};

export type UnassignedToSchedulePersist = {
  scheduledToCreate: Scheduled;
  unassignedToDelete: Entity;
  pendingToCreate: Pending | undefined;
};

export const scheduleUnassignedCommand = async (
  server: FastifyInstance
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<void> => {
  server.route({
    method: 'POST',
    url: '/unassigned/schedule',
    handler: async (req: UnassignedToScheduleRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.body,
        $scheduleUnassignedValidation(server.pg),
        scheduleUnassigned,
        taskEitherChain(persistUnassignedScheduled(server.pg)),
        taskEitherChain(scheduledUnassignedValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<CommandsResult<'schedule-unassigned'>>)
      )();
    }
  });
};
