import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { fold as taskEitherFold } from 'fp-ts/TaskEither';
import { listDrivers, ListDriversAdapter } from './list-drivers';
import { Driver } from '../../definitions';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';

export type ListDriversRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: {
    query: string;
  };
}>;

/* eslint-disable @typescript-eslint/require-await */
export const listDriversQuery = async (
  server: FastifyInstance,
  dependencies: { adapter: ListDriversAdapter }
): Promise<void> => {
  server.route({
    method: 'GET',
    url: '/list-drivers',
    handler: async (_req: ListDriversRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        listDrivers(dependencies.adapter),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<Driver[]>)
      )();
    }
  });
};
/* eslint-enable @typescript-eslint/require-await */
