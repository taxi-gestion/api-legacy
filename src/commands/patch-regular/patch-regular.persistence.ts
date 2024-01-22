import { map as taskEitherMap, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import type { PostgresDb } from '@fastify/postgres';
import { Errors } from '../../codecs';
import { Entity, RegularPatchableProperties } from '../../definitions';
import { pipe } from 'fp-ts/lib/function';
import { RegularToPatchPersist } from './patch-regular.route';
import { fromDBtoRegularCandidate } from '../../mappers';
import { onDatabaseError } from '../../errors';

export const persistPatchedRegular =
  (database: PostgresDb) =>
  (toPatch: RegularToPatchPersist): TaskEither<Errors, unknown> =>
    pipe(
      taskEitherTryCatch(pipe(toPatch, applyQueries(database)), onDatabaseError(`persistPatchedRegular`)),
      taskEitherMap(toTransfer)
    );

const applyQueries =
  (database: PostgresDb) =>
  ({ toPatch }: RegularToPatchPersist) =>
  async (): Promise<QueryResult[]> =>
    database.transact(async (client: PoolClient): Promise<QueryResult[]> => Promise.all([updateRegularQuery(client)(toPatch)]));

const updateRegularQuery =
  (client: PoolClient) =>
  async (regularPg: Entity & RegularPatchableProperties): Promise<QueryResult> => {
    const { queryString, values }: { queryString: string; values: unknown[] } = updateRegularQueryString(regularPg);
    return client.query(queryString, values);
  };

const updateRegularQueryString = (
  fieldsToUpdate: Entity & RegularPatchableProperties
): { queryString: string; values: unknown[] } => {
  const fieldMappings: Record<'phones' | 'waypoints', string> = {
    phones: 'phones = $2::jsonb[]',
    waypoints: 'waypoints = $2::jsonb[]'
  };

  // Construct setClause based on present fields
  const setClause: string = [
    ...('phones' in fieldsToUpdate ? [fieldMappings.phones] : []),
    ...('waypoints' in fieldsToUpdate ? [fieldMappings.waypoints] : [])
  ].join('');

  // Construct values array
  const values: unknown[] = [
    fieldsToUpdate.id,
    ...('phones' in fieldsToUpdate ? [fieldsToUpdate.phones] : []),
    ...('waypoints' in fieldsToUpdate ? [fieldsToUpdate.waypoints] : [])
  ];

  const queryString: string = `
    UPDATE regulars
    SET ${setClause}
    WHERE id = $1
    RETURNING *;
  `;

  return { queryString, values };
};

const toTransfer = (queriesResults: QueryResult[]): unknown => ({
  regularPatched: [queriesResults[0]?.rows[0]].map(fromDBtoRegularCandidate)[0]
});
