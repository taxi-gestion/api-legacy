import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { faresCountForDateValidation } from './fares-count-for-date.validation';
import { faresCountForTheDatePersistenceQuery } from './fares-count-for-date.persistence';
import { FaresCount } from '../../definitions';
import { isYYYYMMDDDate } from '../../codecs';

export type FareForDateRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: {
    date: string;
  };
}>;

export const faresCountForTheDateQuery = async (
  server: FastifyInstance
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<void> => {
  server.route({
    method: 'GET',
    url: '/fare/count/:date',
    handler: async (req: FareForDateRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        isYYYYMMDDDate.decode(req.params.date),
        faresCountForTheDatePersistenceQuery(server.pg),
        taskEitherChain(faresCountForDateValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<FaresCount>)
      )();
    }
  });
};
