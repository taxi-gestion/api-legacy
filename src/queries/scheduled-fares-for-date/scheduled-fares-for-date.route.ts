import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { fold as taskEitherFold, chain as taskEitherChain } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { isDateString } from '../../codecs';
import { Entity, Scheduled } from '../../definitions';
import { scheduledFaresForTheDatePersistenceQuery } from './scheduled-fares-for-date.persistence';
import { scheduledFaresForDateValidation } from './scheduled-fares-for-date.validation';

export type FareForDateRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: {
    date: string;
  };
}>;

export const scheduledFaresForTheDateQuery = async (
  server: FastifyInstance
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<void> => {
  server.route({
    method: 'GET',
    url: '/scheduled-fares-for-date/:date',
    handler: async (req: FareForDateRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        isDateString.decode(req.params.date),
        scheduledFaresForTheDatePersistenceQuery(server.pg),
        taskEitherChain(scheduledFaresForDateValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<(Entity & Scheduled)[]>)
      )();
    }
  });
};
