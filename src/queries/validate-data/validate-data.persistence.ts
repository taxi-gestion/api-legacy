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
  fromDBtoRegularCandidate,
  fromDBtoScheduledCandidate,
  fromDBtoSubcontractedCandidate,
  fromDBtoUnassignedCandidate
} from '../../mappers';
import { ValidableTables } from './validate-data.route';

export const tablePersistenceQuery =
  (database: PostgresDb, tableParam: string) =>
  (table: Either<Errors, ValidableTables>): TaskEither<Errors, unknown> =>
    pipe(table, fromEither, taskEitherChain(selectFaresForDate(database)), taskEitherMap(toTransfer(tableParam)));

const toTransfer =
  (table: string) =>
  (queryResult: QueryResult): unknown =>
    queryResult.rows.map(mapper(table));

const selectFaresForDate =
  (database: PostgresDb) =>
  (table: string): TaskEither<Errors, QueryResult> =>
    taskEitherTryCatch(selectFromTable(database)(table), onDatabaseError(`scheduledFaresForTheDatePersistenceQuery`));

const selectFromTable = (database: PostgresDb) => (table: string) => async (): Promise<QueryResult> => {
  const client: PoolClient = await database.connect();
  try {
    return await selectTableQuery(client)(table);
  } finally {
    client.release();
  }
};

const selectTableQuery =
  (client: PoolClient) =>
  async (table: string): Promise<QueryResult> =>
    client.query(`SELECT * FROM ${table}`);

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const mapper = (table: string) => {
  if (table === 'regulars') return fromDBtoRegularCandidate;

  if (table === 'scheduled_fares') return fromDBtoScheduledCandidate;

  if (table === 'pending_returns') return fromDBtoPendingCandidate;

  if (table === 'subcontracted_fares') return fromDBtoSubcontractedCandidate;

  if (table === 'unassigned_fares') return fromDBtoUnassignedCandidate;

  throw new Error('Invalid table to validate');
};
