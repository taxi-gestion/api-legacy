import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { Entity, Scheduled } from '../../definitions';

import { driverAgendaForDateValidation, driverAgendaValidation } from './driver-agenda-for-date.validation';
import { driverScheduledFareForTheDatePersistenceQuery } from './driver-agenda-for-date.persistence';

export type DriverAgendaForDateRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: DriverIdAndDate;
}>;

export type DriverIdAndDate = {
  driverId: string;
  date: string;
};

export const scheduledFaresForTheDateQuery = async (
  server: FastifyInstance
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<void> => {
  server.route({
    method: 'GET',
    url: '/driver-agenda/:driverId/:date',
    handler: async (req: DriverAgendaForDateRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.params,
        driverAgendaValidation,
        driverScheduledFareForTheDatePersistenceQuery(server.pg),
        taskEitherChain(driverAgendaForDateValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<(Entity & Scheduled)[]>)
      )();
    }
  });
};
