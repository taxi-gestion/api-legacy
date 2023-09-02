import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { estimateJourneyValidation } from './estimate-journey.validation';
import { estimateJourney, EstimateJourneyAdapter } from './estimate-journey';
import { JourneyEstimate } from '../../definitions';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { JourneyTransfer } from './estimate-journey.codec';

export type EstimateJourneyRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: JourneyTransfer;
}>;

/* eslint-disable @typescript-eslint/require-await */
export const estimateJourneyQuery = async (
  server: FastifyInstance,
  dependencies: { adapter: EstimateJourneyAdapter }
): Promise<void> => {
  server.route({
    method: 'POST',
    url: '/journey/estimate',
    handler: async (req: EstimateJourneyRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.body,
        estimateJourneyValidation,
        taskEitherChain(estimateJourney(dependencies.adapter)),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<JourneyEstimate>)
      )();
    }
  });
};
/* eslint-enable @typescript-eslint/require-await */
