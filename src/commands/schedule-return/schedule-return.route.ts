import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { QueryResult } from 'pg';
import { Entity, ReturnToSchedule } from '../../definitions';
import { persistFareAndDeleteReturnToSchedule } from './schedule-return.persistence';
import { $scheduleReturnValidation } from './schedule-return.validation';
import { scheduleReturn } from './schedule-return';

export type ReturnToScheduleRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: Entity & ReturnToSchedule;
}>;

export const scheduleReturnCommand = async (
  server: FastifyInstance
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<void> => {
  server.route({
    method: 'POST',
    url: '/schedule-return',
    handler: async (req: ReturnToScheduleRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.body,
        $scheduleReturnValidation(server.pg),
        scheduleReturn,
        taskEitherChain(persistFareAndDeleteReturnToSchedule(server.pg)),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<QueryResult[]>)
      )();
    }
  });
};
