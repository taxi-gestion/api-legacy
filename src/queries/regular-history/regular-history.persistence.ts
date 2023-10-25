import { TaskEither } from 'fp-ts/lib/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { Either } from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, map as taskEitherMap, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PoolClient, QueryResult } from 'pg';
import { Errors } from '../../reporter';
import { onDatabaseError } from '../../errors';
import {
  fromDBtoPendingCandidate,
  fromDBtoScheduledCandidate,
  fromDBtoSubcontractedCandidate,
  fromDBtoUnassignedCandidate
} from '../../mappers';

export const regularHistoryPersistenceQuery =
  (database: PostgresDb) =>
  (regularId: Either<Errors, string>): TaskEither<Errors, unknown> =>
    pipe(regularId, fromEither, taskEitherChain(getRegularHistory(database)), taskEitherMap(toTransfer));

const getRegularHistory =
  (database: PostgresDb) =>
  (regularId: string): TaskEither<Errors, QueryResult[]> =>
    taskEitherTryCatch(historyFromFaresQueries(database)(regularId), onDatabaseError(`regularHistoryPersistenceQuery`));

const historyFromFaresQueries = (database: PostgresDb) => (regularId: string) => async (): Promise<QueryResult[]> =>
  database.transact(
    async (client: PoolClient): Promise<QueryResult[]> =>
      Promise.all([
        faresWherePassengerQuery(client, 'scheduled_fares')(regularId),
        faresWherePassengerQuery(client, 'pending_returns')(regularId),
        faresWherePassengerQuery(client, 'subcontracted_fares')(regularId),
        faresWherePassengerQuery(client, 'unassigned_fares')(regularId)
      ])
  );

export const faresWherePassengerQuery =
  (client: PoolClient, tableName: string) =>
  async (regularId: string): Promise<QueryResult> => {
    const queryString: string = `
    SELECT * FROM ${tableName} WHERE passenger->>'id' = $1
  `;
    return client.query(queryString, [regularId]);
  };

const toTransfer = (queriesResult: QueryResult[]): unknown => ({
  scheduled: queriesResult[0]?.rows.map(fromDBtoScheduledCandidate),
  pending: queriesResult[1]?.rows.map(fromDBtoPendingCandidate),
  subcontracted: queriesResult[2]?.rows.map(fromDBtoSubcontractedCandidate),
  unassigned: queriesResult[3]?.rows.map(fromDBtoUnassignedCandidate)
});
