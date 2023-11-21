import { PoolClient, QueryResult } from 'pg';
import { Entity } from '../../definitions';

export const deletePendingReturnQuery =
  (client: PoolClient) =>
  async (pendingToDelete: Entity): Promise<QueryResult> =>
    client.query(removeReturnToScheduleQueryString, [pendingToDelete.id]);
const removeReturnToScheduleQueryString: string = `DELETE FROM pending_returns WHERE id = $1 RETURNING *;
      `;
