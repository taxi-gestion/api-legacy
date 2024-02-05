import { map as taskEitherMap, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import type { PostgresDb } from '@fastify/postgres';
import { Errors } from '../../codecs';
import { Entity, ScheduledPersistence } from '../../definitions';
import { pipe } from 'fp-ts/lib/function';
import { EditedToPersist } from './edit-scheduled.route';
import { fromDBtoPendingCandidate, fromDBtoScheduledCandidate, toScheduledEntityPersistence } from '../../mappers';
import { onDatabaseError } from '../../errors';
import { deleteFareEntityQueryOrUndefined } from '../_common/delete-fare-entity.persistence';
import { pendingReturnQueryOrUndefined } from '../_common/insert-pending-return.persistence';

export const persistEditedFares =
  (database: PostgresDb) =>
  (fares: EditedToPersist): TaskEither<Errors, unknown> =>
    pipe(taskEitherTryCatch(applyQueries(database)(fares), onDatabaseError(`persistEditedFares`)), taskEitherMap(toTransfer));

const applyQueries =
  (database: PostgresDb) =>
  ({ scheduledToEdit, pendingToCreate, pendingToDelete }: EditedToPersist) =>
  async (): Promise<(QueryResult | undefined)[]> =>
    database.transact(async (client: PoolClient): Promise<(QueryResult | undefined)[]> => {
      const promises: Promise<QueryResult | undefined>[] = [
        updateScheduledFareQuery(client)(toScheduledEntityPersistence(scheduledToEdit)),
        pendingReturnQueryOrUndefined(client)(pendingToCreate, scheduledToEdit.id),
        deleteFareEntityQueryOrUndefined(client, 'pending_returns')(pendingToDelete)
      ];

      return Promise.all(promises);
    });

const updateScheduledFareQuery =
  (client: PoolClient) =>
  async (farePg: Entity & ScheduledPersistence): Promise<QueryResult> =>
    client.query(updateFareQueryString, [
      farePg.id,
      farePg.passenger,
      farePg.datetime,
      farePg.departure,
      farePg.arrival,
      farePg.distance,
      farePg.driver,
      farePg.duration,
      farePg.kind,
      farePg.nature,
      farePg.creator
    ]);

const updateFareQueryString: string = `
      UPDATE scheduled_fares
      SET 
          passenger = $2,
          datetime = $3,
          departure = $4,
          arrival = $5,
          distance = $6,
          driver = $7,
          duration = $8,
          kind = $9,
          nature = $10,
          creator = $11
      WHERE id = $1
      RETURNING *
    `;

const toTransfer = (queriesResults: (QueryResult | undefined)[]): unknown => ({
  scheduledEdited: queriesResults[0] === undefined ? undefined : [queriesResults[0].rows[0]].map(fromDBtoScheduledCandidate)[0],
  pendingCreated: queriesResults[1] === undefined ? undefined : [queriesResults[1].rows[0]].map(fromDBtoPendingCandidate)[0],
  pendingDeleted: queriesResults[2] === undefined ? undefined : [queriesResults[2].rows[0]].map(fromDBtoPendingCandidate)[0]
});
