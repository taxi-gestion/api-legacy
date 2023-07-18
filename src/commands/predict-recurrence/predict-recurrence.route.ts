import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { PredictRecurrenceTransfer } from './predict-recurrence.codec';
import { predictRecurrenceValidation } from './predict-recurrence.validation';
import { predictRecurrence } from './predict-recurrence';
import { PredictedRecurrence, PredictRecurrenceAdapter } from '../../definitions/recurrence.definition';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';

export type PredictRecurrenceRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: PredictRecurrenceTransfer;
}>;

/* eslint-disable @typescript-eslint/require-await */
export const predictRecurrenceCommand = async (
  server: FastifyInstance,
  dependencies: { adapter: PredictRecurrenceAdapter }
): Promise<void> => {
  server.route({
    method: 'POST',
    url: '/predict-recurrence',
    handler: async (req: PredictRecurrenceRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.body,
        predictRecurrenceValidation,
        taskEitherChain(predictRecurrence(dependencies.adapter)),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<PredictedRecurrence>)
      )();
    }
  });
};
/* eslint-enable @typescript-eslint/require-await */
