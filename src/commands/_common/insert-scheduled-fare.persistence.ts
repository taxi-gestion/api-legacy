import { PoolClient, QueryResult } from 'pg';
import { ScheduledPersistence } from '../../definitions';

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
      farePg.nature,
      farePg.creator
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
          nature,
          creator
      ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      ) 
      RETURNING *
    `;
