import { PoolClient, QueryResult } from 'pg';
import { Pending, PendingPersistence } from '../../definitions';
import { toPendingPersistence } from '../../mappers';

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
      pendingPg.outwardFareId,
      pendingPg.creator
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
          outward_fare_id,
          creator
      ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
      )
      RETURNING *
      `;
