import { PoolClient, QueryResult } from 'pg';
import { Entity, Pending, PendingPersistence, ScheduledPersistence } from '../../definitions';
import { toPendingPersistence } from '../../mappers';

export const insertScheduledFareQuery =
  (client: PoolClient) =>
  async (farePg: ScheduledPersistence): Promise<QueryResult> =>
    client.query(insertFareQueryString, [
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

const insertFareQueryString: string = `
      INSERT INTO scheduled_fares (
          passenger,
          datetime,
          departure,
          arrival,
          distance,
          driver,
          duration,
          kind,
          nature
      ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) 
      RETURNING *
    `;

export const insertPendingReturnRelatedToScheduled =
  (client: PoolClient) =>
  async (scheduledCreatedQueryResult: QueryResult, pendingToCreate: Pending): Promise<QueryResult> =>
    insertPendingQuery(client)(
      toPendingPersistence({
        ...pendingToCreate,
        outwardFareId: scheduledCreatedQueryResult.rows[0].id as string
      })
    );

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

export const deletePendingReturnQuery =
  (client: PoolClient) =>
  async (pendingToDelete: Entity): Promise<QueryResult> =>
    client.query(removeReturnToScheduleQueryString, [pendingToDelete.id]);

const removeReturnToScheduleQueryString: string = `DELETE FROM pending_returns WHERE id = $1 RETURNING *;
      `;

export const deleteFareEntityQuery =
  (client: PoolClient, tableName: string) =>
  async (entity: Entity): Promise<QueryResult> => {
    const queryString: string = `
    DELETE FROM ${tableName} WHERE id = $1 RETURNING *
  `;
    return client.query(queryString, [entity.id]);
  };
