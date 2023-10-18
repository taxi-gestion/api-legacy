import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { Entity, Unassigned } from '../../definitions';
import { unassignedFaresForTheDatePersistenceQuery } from './unassigned-fares-for-date.persistence';
import { unassignedFaresForDateValidation } from './unassigned-fares-for-date.validation';
import { isDateString } from '../../rules';

type FareForDateRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: {
    date: string;
  };
}>;

export const unassignedFaresForTheDateQuery = async (
  server: FastifyInstance
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<void> => {
  server.route({
    method: 'GET',
    url: '/unassigned/:date',
    handler: async (req: FareForDateRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        isDateString.decode(req.params.date),
        unassignedFaresForTheDatePersistenceQuery(server.pg),
        taskEitherChain(unassignedFaresForDateValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<(Entity & Unassigned)[]>)
      )();
    }
  });
};
