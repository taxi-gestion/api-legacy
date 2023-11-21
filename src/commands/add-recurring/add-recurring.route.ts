import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { CommandsResult, ToRecurring, Recurring } from '../../definitions';
import { recurringAddedValidation, recurringToAddValidation } from './add-recurring.validation';
import { addRecurring } from './add-recurring';
import { persistRecurring } from './add-recurring.persistence';

type RecurringToAddRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: ToRecurring;
}>;

export type RecurringToAddPersist = {
  recurringToCreate: Recurring;
};

// eslint-disable-next-line @typescript-eslint/require-await
export const addRecurringCommand = async (server: FastifyInstance): Promise<void> => {
  server.route({
    method: 'POST',
    url: '/fare/recurring/add',
    handler: async (req: RecurringToAddRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.body,
        recurringToAddValidation,
        addRecurring,
        persistRecurring(server.pg),
        taskEitherChain(recurringAddedValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<CommandsResult<'add-recurring'>>)
      )();
    }
  });
};
