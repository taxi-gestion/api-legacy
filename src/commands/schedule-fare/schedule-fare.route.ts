import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { fareToScheduleValidation, scheduledFaresValidation } from './schedule-fare.validation';
import { scheduleFare } from './schedule-fare';
import { FaresScheduled, Pending, Scheduled, ToSchedule } from '../../definitions';
import { persistScheduledFares } from './schedule-fare.persistence';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';

type FareToScheduleRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: ToSchedule;
}>;

export type FareToSchedule = {
  toSchedule: ToSchedule;
};

export type FaresToSchedulePersist = {
  scheduledToCreate: Scheduled;
  pendingToCreate?: Pending;
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
        persistScheduledFares(server.pg),
        taskEitherChain(scheduledFaresValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<FaresScheduled>)
      )();
    }
  });
};
