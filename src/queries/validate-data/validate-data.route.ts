import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { chain as taskEitherChain, fold as taskEitherFold } from 'fp-ts/TaskEither';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { allowedTableValidation, tableValidation } from './validate-data.validation';
import { tablePersistenceQuery } from './validate-data.persistence';

export type ValidableTables = 'pending_returns' | 'regulars' | 'scheduled_fares' | 'subcontracted_fares' | 'unassigned_fares';

export type ValidateDataRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: {
    table: ValidableTables;
  };
}>;

export const validateTableQuery = async (
  server: FastifyInstance
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<void> => {
  server.route({
    method: 'GET',
    url: '/validate/:table',
    handler: async (req: ValidateDataRequest, reply: FastifyReply): Promise<void> => {
      await pipe(
        allowedTableValidation(req.params.table),
        tablePersistenceQuery(server.pg, req.params.table),
        taskEitherChain(tableValidation(req.params.table)),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<string[] | true>)
      )();
    }
  });
};
