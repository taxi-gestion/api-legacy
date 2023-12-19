import { TaskEither } from 'fp-ts/lib/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { Either } from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, map as taskEitherMap, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PoolClient, QueryResult } from 'pg';
import { onDatabaseError } from '../../errors';
import { fromDBtoSubcontractedCandidate } from '../../mappers';
import { Errors } from '../../codecs';

export const subcontractedFaresForTheDatePersistenceQuery =
  (database: PostgresDb) =>
  (date: Either<Errors, string>): TaskEither<Errors, unknown> =>
    pipe(date, fromEither, taskEitherChain(selectFaresForDate(database)), taskEitherMap(toTransfer));

const selectFaresForDate =
  (database: PostgresDb) =>
  (date: string): TaskEither<Errors, QueryResult> =>
    taskEitherTryCatch(selectFromFares(database)(date), onDatabaseError(`subcontractedFaresForTheDatePersistenceQuery`));

const selectFromFares = (database: PostgresDb) => (date: string) => async (): Promise<QueryResult> => {
  const client: PoolClient = await database.connect();
  try {
    return await selectSubcontractedFaresWhereDateQuery(client)(date);
  } finally {
    client.release();
  }
};

const selectSubcontractedFaresWhereDateQuery =
  (client: PoolClient) =>
  async (date: string): Promise<QueryResult> =>
    client.query(selectSubcontractedFaresWhereDateQueryString, [date]);

const selectSubcontractedFaresWhereDateQueryString: string = `
      SELECT * FROM subcontracted_fares WHERE datetime >= $1::DATE AND datetime < ($1::DATE + INTERVAL '1 day')
    `;

const toTransfer = (queryResult: QueryResult): unknown => queryResult.rows.map(fromDBtoSubcontractedCandidate);
