import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { fareToScheduleValidation, scheduledFaresValidation } from './schedule-fare.validation';
import { scheduleFare } from './schedule-fare';
import { CommandsResult, Pending, Scheduled, ToScheduled } from '../../definitions';
import { persistScheduledFaresFP } from './schedule-fare.persistence';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';

type FareToScheduleRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: ToScheduled;
}>;

export type FareToSchedule = {
  toSchedule: ToScheduled;
};

//export type ScheduledAndOptionalPendingPersist = ScheduledAndPendingPersist & ScheduledPersist

export type ScheduledAndPendingPersist = {
  scheduledToCreate: Scheduled;
  pendingToCreate: Pending;
};

export type ScheduledPersist = {
  scheduledToCreate: Scheduled;
  pendingToCreate: undefined;
};

// eslint-disable-next-line @typescript-eslint/require-await
export const scheduleFareCommand = async (server: FastifyInstance): Promise<void> => {
  server.route({
    method: 'POST',
    url: '/fare/schedule',
    handler: async (req: FareToScheduleRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.body,
        fareToScheduleValidation,
        scheduleFare,
        persistScheduledFaresFP(server.pg),
        taskEitherChain(scheduledFaresValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<CommandsResult<'schedule-scheduled'>>)
      )();
    }
  });
};
