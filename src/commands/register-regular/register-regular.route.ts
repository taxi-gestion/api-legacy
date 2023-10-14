import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { registeredRegularValidation, registerRegularValidation } from './register-regular.validation';
import { Regular, RegularRegistered } from '../../definitions';
import { persistRegisterRegular } from './register-regular.persistence';
import { registerRegular } from './register-regular';

type RegularRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: Regular;
}>;

export type RegularToRegister = {
  toRegister: Regular;
};

export type RegularToRegisterPersist = {
  regularToCreate: Regular;
};

export const registerRegularCommand = async (
  server: FastifyInstance
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<void> => {
  server.route({
    method: 'POST',
    url: '/regular/register',
    handler: async (req: RegularRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        req.body,
        registerRegularValidation,
        registerRegular,
        persistRegisterRegular(server.pg),
        taskEitherChain(registeredRegularValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<RegularRegistered>)
      )();
    }
  });
};
