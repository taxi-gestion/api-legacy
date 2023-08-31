import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { fold as taskEitherFold, chain as taskEitherChain } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { isDateString } from '../../codecs';
import { Entity, Subcontracted } from '../../definitions';
import { subcontractedFaresForTheDatePersistenceQuery } from './subcontracted-fares-for-date.persistence';
import { subcontractedFaresValidation } from './subcontracted-fares-for-date.validation';

export type FareForDateRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: {
    date: string;
  };
}>;

export const subcontractedFaresForTheDateQuery = async (
  server: FastifyInstance
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<void> => {
  server.route({
    method: 'GET',
    url: '/subcontracted-fares-for-date/:date',
    handler: async (req: FareForDateRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        isDateString.decode(req.params.date),
        subcontractedFaresForTheDatePersistenceQuery(server.pg),
        taskEitherChain(subcontractedFaresValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<(Entity & Subcontracted)[]>)
      )();
    }
  });
};
