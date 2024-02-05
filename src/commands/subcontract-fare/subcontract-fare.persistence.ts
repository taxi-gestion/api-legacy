import { map as taskEitherMap, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import type { PostgresDb } from '@fastify/postgres';
import { Errors } from '../../codecs';
import { SubcontractedPersistence } from '../../definitions';
import { pipe } from 'fp-ts/lib/function';
import { SubcontractedToPersist } from './subcontract-fare.route';
import {
  fromDBtoPendingCandidate,
  fromDBtoScheduledCandidate,
  fromDBtoSubcontractedCandidate,
  fromDBtoUnassignedCandidate,
  toSubcontractedPersistence
} from '../../mappers';
import { onDatabaseError } from '../../errors';
import { deleteFareEntityQueryOrUndefined } from '../_common/delete-fare-entity.persistence';
import { pendingReturnQueryOrUndefined } from '../_common/insert-pending-return.persistence';

export const persistSubcontractedFares =
  (database: PostgresDb) =>
  (fares: SubcontractedToPersist): TaskEither<Errors, unknown> =>
    pipe(
      taskEitherTryCatch(applyQueries(database)(fares), onDatabaseError(`persistSubcontractedFares`)),
      taskEitherMap(toTransfer)
    );

const applyQueries =
  (database: PostgresDb) =>
  ({
    subcontractedToPersist,
    scheduledToDelete,
    pendingToDelete,
    pendingToCreate,
    unassignedToDelete
  }: SubcontractedToPersist) =>
  async (): Promise<(QueryResult | undefined)[]> =>
    database.transact(async (client: PoolClient): Promise<(QueryResult | undefined)[]> => {
      const subcontractedQueryResult: QueryResult = await insertSubcontractedQuery(client)(
        toSubcontractedPersistence(subcontractedToPersist)
      );
      const promises: Promise<QueryResult | undefined>[] = [
        pendingReturnQueryOrUndefined(client)(pendingToCreate, subcontractedQueryResult.rows[0].id as string),
        deleteFareEntityQueryOrUndefined(client, 'scheduled_fares')(scheduledToDelete),
        deleteFareEntityQueryOrUndefined(client, 'pending_returns')(pendingToDelete),
        deleteFareEntityQueryOrUndefined(client, 'unassigned_fares')(unassignedToDelete)
      ];
      return [subcontractedQueryResult, ...(await Promise.all(promises))];
    });

const insertSubcontractedQuery =
  (client: PoolClient) =>
  async (farePg: SubcontractedPersistence): Promise<QueryResult> =>
    client.query(insertSubcontractedFareQueryString, [
      farePg.subcontractor,
      farePg.passenger,
      farePg.datetime,
      farePg.departure,
      farePg.arrival,
      farePg.kind,
      farePg.nature
    ]);

const insertSubcontractedFareQueryString: string = `
      INSERT INTO subcontracted_fares (
          subcontractor,
          passenger,
          datetime,
          departure,
          arrival,
          kind,
          nature
      ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
      ) 
      RETURNING *
    `;

const toTransfer = (queriesResults: (QueryResult | undefined)[]): unknown => ({
  subcontracted: [queriesResults[0]?.rows[0]].map(fromDBtoSubcontractedCandidate)[0],
  pendingCreated: queriesResults[1] === undefined ? undefined : [queriesResults[1].rows[0]].map(fromDBtoPendingCandidate)[0],
  scheduledDeleted:
    queriesResults[2] === undefined ? undefined : [queriesResults[2].rows[0]].map(fromDBtoScheduledCandidate)[0],
  pendingDeleted: queriesResults[3] === undefined ? undefined : [queriesResults[3].rows[0]].map(fromDBtoPendingCandidate)[0],
  unassignedDeleted:
    queriesResults[4] === undefined ? undefined : [queriesResults[4].rows[0]].map(fromDBtoUnassignedCandidate)[0]
});
