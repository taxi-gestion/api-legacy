import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { Entity, Scheduled } from '../../definitions';
import { scheduledFaresForTheDatePersistenceQuery } from './scheduled-fares-for-date.persistence';
import { scheduledFaresForDateValidation } from './scheduled-fares-for-date.validation';
import { isYYYYMMDDDate } from '../../codecs';

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
    url: '/scheduled/:date',
    handler: async (req: FareForDateRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        isYYYYMMDDDate.decode(req.params.date),
        scheduledFaresForTheDatePersistenceQuery(server.pg),
        taskEitherChain(scheduledFaresForDateValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<(Entity & Scheduled)[]>)
      )();
    }
  });
};
