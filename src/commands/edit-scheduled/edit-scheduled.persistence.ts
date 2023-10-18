import { map as taskEitherMap, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import type { PostgresDb } from '@fastify/postgres';
import { Errors } from '../../reporter';
import { Entity, Pending, PendingPersistence, ScheduledPersistence } from '../../definitions';
import { pipe } from 'fp-ts/lib/function';
import { EditedToPersist } from './edit-scheduled.route';
import {
  fromDBtoPendingCandidate,
  fromDBtoScheduledCandidate,
  toPendingPersistence,
  toScheduledEntityPersistence
} from '../../mappers';
import { onDatabaseError } from '../../errors';

export const persistEditedFares =
  (database: PostgresDb) =>
  (fares: EditedToPersist): TaskEither<Errors, unknown> =>
    pipe(taskEitherTryCatch(applyQueries(database)(fares), onDatabaseError(`persistEditedFares`)), taskEitherMap(toTransfer));

const applyQueries =
  (database: PostgresDb) =>
  ({ scheduledToEdit, pendingToCreate, pendingToDelete }: EditedToPersist) =>
  async (): Promise<QueryResult[]> =>
    database.transact(async (client: PoolClient): Promise<QueryResult[]> => {
      const promises: Promise<QueryResult>[] = [
        updateScheduledFareQuery(client)(toScheduledEntityPersistence(scheduledToEdit)),
        ...insertPendingToCreateQueryOrEmpty(client)(pendingToCreate, scheduledToEdit.id),
        ...insertPendingToDeleteQueryOrEmpty(client)(pendingToDelete)
      ];

      return Promise.all(promises);
    });

const insertPendingToCreateQueryOrEmpty =
  (client: PoolClient) =>
  (pendingToCreate: Pending | undefined, outwardFareId: string): [] | [Promise<QueryResult>] =>
    pendingToCreate === undefined
      ? []
      : [insertPendingQuery(client)(toPendingPersistence({ ...pendingToCreate, outwardFareId }))];

const insertPendingToDeleteQueryOrEmpty =
  (client: PoolClient) =>
  (pendingEntityToDelete: Entity | undefined): [] | [Promise<QueryResult>] =>
    pendingEntityToDelete === undefined ? [] : [deletePendingQuery(client)(pendingEntityToDelete)];

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
      farePg.nature
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
          nature = $10
      WHERE id = $1
      RETURNING *
    `;

const insertPendingQuery =
  (client: PoolClient) =>
  async (pendingPg: PendingPersistence): Promise<QueryResult> =>
    client.query(insertPendingQueryString, [
      pendingPg.passenger,
      pendingPg.datetime,
      pendingPg.departure,
      pendingPg.arrival,
      pendingPg.driver,
      pendingPg.kind,
      pendingPg.nature,
      pendingPg.outwardFareId
    ]);

const insertPendingQueryString: string = `
      INSERT INTO pending_returns (
          passenger,
          datetime,
          departure,
          arrival,
          driver,
          kind,
          nature,
          outward_fare_id
      ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
      )
      RETURNING *
      `;

const deletePendingQuery =
  (client: PoolClient) =>
  async (pendingToDelete: Entity): Promise<QueryResult> =>
    client.query(removeReturnToScheduleQueryString, [pendingToDelete.id]);

const removeReturnToScheduleQueryString: string = `DELETE FROM pending_returns WHERE id = $1 RETURNING *;
      `;

const toTransfer = (queriesResults: QueryResult[]): unknown => ({
  scheduledEdited: [queriesResults[0]?.rows[0]].map(fromDBtoScheduledCandidate)[0],
  pendingCreated: queriesResults[1] === undefined ? undefined : [queriesResults[1].rows[0]].map(fromDBtoPendingCandidate)[0],
  pendingDeleted: queriesResults[2] === undefined ? undefined : [queriesResults[2].rows[0]].map(fromDBtoPendingCandidate)[0]
});
