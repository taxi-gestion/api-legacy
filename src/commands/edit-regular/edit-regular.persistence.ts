import { map as taskEitherMap, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import type { PostgresDb } from '@fastify/postgres';
import { Errors } from '../../codecs';
import { Entity, RegularPersistence } from '../../definitions';
import { pipe } from 'fp-ts/lib/function';
import { RegularToEditPersist } from './edit-regular.route';
import { fromDBtoRegularCandidate } from '../../mappers';
import { onDatabaseError } from '../../errors';

type RegularToEditPersistReady = {
  regularToEdit: Entity & RegularPersistence;
};

export const persistEditedRegular =
  (database: PostgresDb) =>
  (regular: RegularToEditPersist): TaskEither<Errors, unknown> =>
    pipe(
      taskEitherTryCatch(pipe(regular, toPersistence, applyQueries(database)), onDatabaseError(`persistEditedRegular`)),
      taskEitherMap(toTransfer)
    );

const applyQueries =
  (database: PostgresDb) =>
  ({ regularToEdit }: RegularToEditPersistReady) =>
  async (): Promise<QueryResult[]> =>
    database.transact(
      async (client: PoolClient): Promise<QueryResult[]> => Promise.all([updateRegularQuery(client)(regularToEdit)])
    );

const updateRegularQuery =
  (client: PoolClient) =>
  async (regularPg: Entity & RegularPersistence): Promise<QueryResult> =>
    client.query(updateRegularQueryString, [
      regularPg.id,
      regularPg.civility,
      regularPg.firstname,
      regularPg.lastname,
      regularPg.phones,
      regularPg.waypoints,
      regularPg.comment,
      regularPg.subcontracted_client
    ]);

const updateRegularQueryString: string = `
      UPDATE regulars
      SET 
        civility = $2, 
        firstname = $3, 
        lastname = $4, 
        phones = $5::jsonb[], 
        waypoints = $6::jsonb[], 
        comment = $7, 
        subcontracted_client = $8       
      WHERE id = $1
      RETURNING *
    `;

const toPersistence = ({ regularToEdit }: RegularToEditPersist): RegularToEditPersistReady => ({
  regularToEdit: {
    ...regularToEdit,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    subcontracted_client: regularToEdit.subcontractedClient
  }
});

const toTransfer = (queriesResults: QueryResult[]): unknown => ({
  regularEdited: [queriesResults[0]?.rows[0]].map(fromDBtoRegularCandidate)[0]
});
