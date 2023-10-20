import { TaskEither } from 'fp-ts/lib/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { Either } from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, map as taskEitherMap, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PoolClient, QueryResult } from 'pg';
import { Errors } from '../../reporter';
import { onDatabaseError } from '../../errors';
import { fromDBtoFaresCountForDateCandidate } from '../../mappers';

export const faresCountForTheDatePersistenceQuery =
  (database: PostgresDb) =>
  (date: Either<Errors, string>): TaskEither<Errors, unknown> =>
    pipe(date, fromEither, taskEitherChain(faresCountsForDate(database)), taskEitherMap(toTransfer));

const toTransfer = (queryResult: QueryResult): unknown => queryResult.rows.map(fromDBtoFaresCountForDateCandidate)[0];

const faresCountsForDate =
  (database: PostgresDb) =>
  (date: string): TaskEither<Errors, QueryResult> =>
    taskEitherTryCatch(selectFromFares(database)(date), onDatabaseError(`faresCountForTheDatePersistenceQuery`));

const selectFromFares = (database: PostgresDb) => (date: string) => async (): Promise<QueryResult> => {
  const client: PoolClient = await database.connect();
  try {
    return await countFaresWhereDateQuery(client)(date);
  } finally {
    client.release();
  }
};
const countFaresWhereDateQuery =
  (client: PoolClient) =>
  async (date: string): Promise<QueryResult> =>
    client.query(selectFaresWhereDateQueryString, [date]);

const selectFaresWhereDateQueryString: string = `
    SELECT 
  (SELECT COUNT(*) FROM scheduled_fares WHERE DATE(datetime AT TIME ZONE 'Europe/Paris') = $1) as scheduled,
  (SELECT COUNT(*) FROM pending_returns WHERE DATE(datetime AT TIME ZONE 'Europe/Paris') = $1) as pending,
  (SELECT COUNT(*) FROM subcontracted_fares WHERE DATE(datetime AT TIME ZONE 'Europe/Paris') = $1) as subcontracted,
  (SELECT COUNT(*) FROM unassigned_fares WHERE DATE(datetime AT TIME ZONE 'Europe/Paris') = $1) as unassigned
`;
