import { PoolClient, QueryResult } from 'pg';
import { Entity } from '../../definitions';

export const deleteFareEntityPersistence =
  (client: PoolClient, tableName: string) =>
  async (entity: Entity): Promise<QueryResult> => {
    const queryString: string = `
    DELETE FROM ${tableName} WHERE id = $1 RETURNING *
  `;
    return client.query(queryString, [entity.id]);
  };

export const deleteFareEntityQueryOrUndefined =
  (client: PoolClient, tableName: string) =>
  async (entityToDelete: Entity | undefined): Promise<QueryResult | undefined> =>
    entityToDelete === undefined ? undefined : deleteFareEntityPersistence(client, tableName)(entityToDelete);
