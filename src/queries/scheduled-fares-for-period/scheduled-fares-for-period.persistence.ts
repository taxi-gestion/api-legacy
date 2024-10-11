import { TaskEither } from 'fp-ts/lib/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { Either } from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, map as taskEitherMap, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PoolClient, QueryResult } from 'pg';
import { onDatabaseError } from '../../errors';
import { fromDBtoScheduledCandidate } from '../../mappers';
import { Errors } from '../../codecs';
import { Period } from './scheduled-fares-for-period.route';

export const scheduledFaresForThePeriodPersistenceQuery =
  (database: PostgresDb) =>
  (period: Either<Errors, Period>): TaskEither<Errors, unknown> =>
    pipe(period, fromEither, taskEitherChain(selectFaresForPeriod(database)), taskEitherMap(toTransfer));

const toTransfer = (queryResult: QueryResult): unknown => queryResult.rows.map(fromDBtoScheduledCandidate);

const selectFaresForPeriod =
  (database: PostgresDb) =>
  (period: Period): TaskEither<Errors, QueryResult> =>
    taskEitherTryCatch(selectFromFares(database)(period), onDatabaseError(`scheduledFaresForThePeriodPersistenceQuery`));

const selectFromFares = (database: PostgresDb) => (period: Period) => async (): Promise<QueryResult> => {
  const client: PoolClient = await database.connect();
  try {
    return await selectScheduledFaresWherePeriodQuery(client)(period);
  } finally {
    client.release();
  }
};

const selectScheduledFaresWherePeriodQuery =
  (client: PoolClient) =>
  async (period: Period): Promise<QueryResult> =>
    client.query(selectFaresWhereDateQueryString, [period.from, period.to]);

const selectFaresWhereDateQueryString: string = `
      SELECT * FROM scheduled_fares WHERE datetime >= $1::DATE AND datetime < ($2::DATE + INTERVAL '1 day')
    `;
