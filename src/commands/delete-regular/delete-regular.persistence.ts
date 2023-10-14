import { map as taskEitherMap, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import type { PostgresDb } from '@fastify/postgres';
import { Errors } from '../../reporter';
import { Entity } from '../../definitions';
import { RegularToDelete } from './delete-regular.route';
import { onDatabaseError } from '../../errors';
import { pipe } from 'fp-ts/lib/function';
import { fromDBtoRegularCandidate } from '../../mappers';

export const persistDeleteRegular =
  (database: PostgresDb) =>
  (regular: RegularToDelete): TaskEither<Errors, unknown> =>
    pipe(taskEitherTryCatch(applyQueries(database)(regular), onDatabaseError('deleteRegular')), taskEitherMap(toTransfer));

const applyQueries =
  (database: PostgresDb) =>
  ({ regularToDelete }: RegularToDelete) =>
  async (): Promise<QueryResult[]> =>
    database.transact(
      async (client: PoolClient): Promise<QueryResult[]> => Promise.all([deleteRegularQuery(client)(regularToDelete)])
    );

const deleteRegularQuery =
  (client: PoolClient) =>
  async (regularPg: Entity): Promise<QueryResult> =>
    client.query(deleteScheduledRegularQueryString, [regularPg.id]);

const deleteScheduledRegularQueryString: string = `
      DELETE FROM regulars WHERE id = $1 RETURNING *
      `;

const toTransfer = (queriesResults: QueryResult[]): unknown => ({
  regularDeleted: [queriesResults[0]?.rows[0]].map(fromDBtoRegularCandidate)[0]
});
