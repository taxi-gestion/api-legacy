import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { QueryResult } from 'pg';
import { registerRegularValidation } from './register-regular.validation';
import { Regular } from '../../definitions';
import { persistRegular } from './register-regular.persistence';

type RegularRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: Regular;
}>;

export const registerRegularCommand = async (
  server: FastifyInstance
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<void> => {
  server.route({
    method: 'POST',
    url: '/register-regular',
    handler: async (req: RegularRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.body,
        registerRegularValidation,
        persistRegular(server.pg),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<QueryResult[]>)
      )();
    }
  });
};
