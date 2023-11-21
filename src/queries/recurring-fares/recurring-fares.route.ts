import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { fold as taskEitherFold, chain as taskEitherChain } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { QueriesResult } from '../../definitions';
import { allRecurringFares } from '../../_common/all-recurring-fares.persistence';
import { recurringFaresValidation } from '../../_common/recurring-fares.validation';

/* eslint-disable @typescript-eslint/require-await */
export const recurringFaresQuery = async (server: FastifyInstance): Promise<void> => {
  server.route({
    method: 'GET',
    url: '/recurring',
    handler: async (_req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        allRecurringFares(server.pg),
        taskEitherChain(recurringFaresValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<QueriesResult<'recurring-fares'>>)
      )();
    }
  });
};
/* eslint-enable @typescript-eslint/require-await */
