import { TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import type { PostgresDb } from '@fastify/postgres';
import { Errors, InfrastructureError } from '../../reporter/HttpReporter';
import { Entity } from '../../definitions';

export const deleteScheduledFareAndReturn =
  (database: PostgresDb) =>
  (entities: [Entity, Entity?]): TaskEither<Errors, QueryResult[]> =>
    taskEitherTryCatch(applyQueries(database, entities), onApplyQueriesError);

const applyQueries = (database: PostgresDb, entities: [Entity, Entity?]) => async (): Promise<QueryResult[]> =>
  database.transact(async (client: PoolClient): Promise<QueryResult[]> => {
    const [fareToDelete, returnToDelete]: [Entity, Entity?] = entities;
    const promises: Promise<QueryResult>[] = [
      deleteScheduledFareQuery(client, fareToDelete),
      ...removePendingReturnQueryOrEmpty(client, returnToDelete)
    ];
    return Promise.all(promises);
  });

const removePendingReturnQueryOrEmpty = (client: PoolClient, returnToDelete: Entity | undefined): [] | [Promise<QueryResult>] =>
  returnToDelete === undefined ? [] : [removePendingReturnQuery(client, returnToDelete)];

const onApplyQueriesError = (error: unknown): Errors =>
  [
    {
      isInfrastructureError: true,
      message: `database error - ${(error as Error).message}`,
      // eslint-disable-next-line id-denylist
      value: (error as Error).name,
      stack: (error as Error).stack ?? 'no stack available',
      code: (error as Error).message.includes('ECONNREFUSED') ? '503' : '500'
    } satisfies InfrastructureError
  ] satisfies Errors;

const deleteScheduledFareQuery = async (client: PoolClient, farePg: Entity): Promise<QueryResult> =>
  client.query(deleteScheduledFareQueryString, [farePg.id]);

const deleteScheduledFareQueryString: string = `
      DELETE FROM scheduled_fares WHERE id = $1 RETURNING *
      `;

const removePendingReturnQuery = async (client: PoolClient, returnToDelete: Entity): Promise<QueryResult> =>
  client.query(removePendingReturnQueryString, [returnToDelete.id]);

const removePendingReturnQueryString: string = `
  DELETE FROM pending_returns WHERE id = $1 RETURNING *
`;
