import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { fold as taskEitherFold, chain as taskEitherChain } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { Entity, Regular } from '../../definitions';
import { listRegularsDatabaseQuery } from './list-regulars.persistence';
import { regularsValidation } from './list-regulars.validation';

/* eslint-disable @typescript-eslint/require-await */
export const listRegularsQuery = async (server: FastifyInstance): Promise<void> => {
  server.route({
    method: 'GET',
    url: '/regular/list',
    handler: async (_req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        listRegularsDatabaseQuery(server.pg)(),
        taskEitherChain(regularsValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<(Entity & Regular)[]>)
      )();
    }
  });
};
/* eslint-enable @typescript-eslint/require-await */
