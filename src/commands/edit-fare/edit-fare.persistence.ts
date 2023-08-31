/* eslint-disable max-lines */
import {
  chain as taskEitherChain,
  right as taskEitherRight,
  TaskEither,
  tryCatch as taskEitherTryCatch
} from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import type { PostgresDb } from '@fastify/postgres';
import { Errors, InfrastructureError } from '../../reporter/HttpReporter';
import { Entity, Pending, Scheduled } from '../../definitions';
import { EditActions } from './edit-fare';
import { pipe } from 'fp-ts/lib/function';

type ScheduledPersistence = Scheduled;
type PendingPersistence = Pending & {
  outwardFareId: string;
};

export const persistFareAndPending =
  (database: PostgresDb) =>
  (fares: EditActions): TaskEither<Errors, unknown> =>
    pipe(
      taskEitherTryCatch(applyQueries(database, fares), onApplyEditFareQueriesError),
      taskEitherChain(
        (queriesResults: QueryResult[]): TaskEither<Errors, unknown> => taskEitherRight(toEditedFares(queriesResults))
      )
    );

const applyQueries =
  (database: PostgresDb, { scheduleToEdit, pendingToCreate, pendingEntityToDelete }: EditActions) =>
  async (): Promise<QueryResult[]> =>
    database.transact(async (client: PoolClient): Promise<QueryResult[]> => {
      const promises: Promise<QueryResult>[] = [
        updateScheduledFareQuery(client, scheduleToEdit),
        ...insertPendingToCreateQueryOrEmpty(client, pendingToCreate, scheduleToEdit.id),
        ...insertPendingToDeleteQueryOrEmpty(client, pendingEntityToDelete)
      ];

      return Promise.all(promises);
    });

const insertPendingToCreateQueryOrEmpty = (
  client: PoolClient,
  pendingToCreate: Pending | null,
  outwardFareId: string
): [] | [Promise<QueryResult>] =>
  pendingToCreate === null ? [] : [insertPendingQuery(client, { ...pendingToCreate, outwardFareId })];

const insertPendingToDeleteQueryOrEmpty = (
  client: PoolClient,
  pendingEntityToDelete: Entity | null
): [] | [Promise<QueryResult>] => (pendingEntityToDelete === null ? [] : [deletePendingQuery(client, pendingEntityToDelete)]);

const onApplyEditFareQueriesError = (error: unknown): Errors =>
  [
    {
      isInfrastructureError: true,
      message: `database error onApplyEditFareQueriesError - ${(error as Error).message}`,
      // eslint-disable-next-line id-denylist
      value: (error as Error).name,
      stack: (error as Error).stack ?? 'no stack available',
      code: (error as Error).message.includes('ECONNREFUSED') ? '503' : '500'
    } satisfies InfrastructureError
  ] satisfies Errors;

const updateScheduledFareQuery = async (client: PoolClient, farePg: Entity & ScheduledPersistence): Promise<QueryResult> =>
  client.query(updateFareQueryString, [
    farePg.id,
    farePg.passenger,
    farePg.datetime,
    farePg.departure,
    farePg.destination,
    farePg.distance,
    farePg.driver,
    farePg.duration,
    farePg.kind,
    farePg.nature,
    farePg.phone,
    farePg.status
  ]);

const updateFareQueryString: string = `
      UPDATE scheduled_fares
      SET 
          passenger = $2,
          datetime = $3,
          departure = $4,
          destination = $5,
          distance = $6,
          driver = $7,
          duration = $8,
          kind = $9,
          nature = $10,
          phone = $11,
          status = $12
      WHERE id = $1
      RETURNING *
    `;

const insertPendingQuery = async (client: PoolClient, pendingPg: PendingPersistence): Promise<QueryResult> =>
  client.query(insertPendingQueryString, [
    pendingPg.passenger,
    pendingPg.datetime,
    pendingPg.departure,
    pendingPg.destination,
    pendingPg.driver,
    pendingPg.kind,
    pendingPg.nature,
    pendingPg.phone,
    pendingPg.outwardFareId
  ]);

const insertPendingQueryString: string = `
      INSERT INTO pending_returns (
          passenger,
          datetime,
          departure,
          destination,
          driver,
          kind,
          nature,
          phone,
          outward_fare_id
      ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
      )
      RETURNING *
      `;

const deletePendingQuery = async (client: PoolClient, pendingToDelete: Entity): Promise<QueryResult> =>
  client.query(removeReturnToScheduleQueryString, [pendingToDelete.id]);

const removeReturnToScheduleQueryString: string = `DELETE FROM pending_returns WHERE id = $1;
      `;

const toEditedFares = (queriesResults: QueryResult[]): unknown => [
  ...[queriesResults[0]?.rows[0]].map(fromDBtoScheduledCandidate),
  ...[queriesResults[1]?.rows[0]].map(fromDBtoPendingCandidate)
];

const fromDBtoScheduledCandidate = (row: Entity & ScheduledPersistence): unknown => ({
  id: row.id,
  passenger: row.passenger,
  datetime: row.datetime,
  departure: row.departure,
  destination: row.destination,
  distance: Number(row.distance),
  driver: row.driver,
  duration: Number(row.duration),
  kind: row.kind,
  nature: row.nature,
  phone: row.phone,
  status: 'scheduled'
});

const fromDBtoPendingCandidate = (row: Entity & PendingPersistence): unknown => ({
  id: row.id,
  passenger: row.passenger,
  datetime: row.datetime,
  departure: row.departure,
  destination: row.destination,
  driver: row.driver,
  kind: row.kind,
  nature: row.nature,
  phone: row.phone,
  status: 'pending-return'
});
