import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { Entity, Scheduled } from '../../definitions';
import { scheduledFaresForThePeriodPersistenceQuery } from './scheduled-fares-for-period.persistence';
import { scheduledFaresForPeriodValidation } from './scheduled-fares-for-period.validation';
import { periodRules } from '../../codecs/domain-rules/period.rules';

export type Period = {
  from: string;
  to: string;
};

export type FareForPeriodRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: Period;
}>;

export const scheduledFaresForThePeriodQuery = async (
  server: FastifyInstance
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<void> => {
  server.route({
    method: 'GET',
    url: '/scheduled-period/:from/:to',
    handler: async (req: FareForPeriodRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        periodRules.decode(req.params),
        scheduledFaresForThePeriodPersistenceQuery(server.pg),
        taskEitherChain(scheduledFaresForPeriodValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<(Entity & Scheduled)[]>)
      )();
    }
  });
};
