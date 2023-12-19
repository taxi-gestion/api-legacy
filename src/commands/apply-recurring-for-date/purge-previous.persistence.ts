import { PostgresDb } from '@fastify/postgres';
import { TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { Errors } from '../../codecs';
import { pipe } from 'fp-ts/function';
import { onDatabaseError } from '../../errors';
import { PoolClient, QueryResult } from 'pg';

export const purgePreviousFaresCreatedByRecurrenceForDate =
  (database: PostgresDb) =>
  (date: string): TaskEither<Errors, unknown> =>
    pipe(taskEitherTryCatch(applyQueries(database)(date), onDatabaseError(`applyRecurrencePurgePrevious`)));

const applyQueries = (database: PostgresDb) => (date: string) => async (): Promise<QueryResult[]> =>
  database.transact(
    async (client: PoolClient): Promise<QueryResult[]> =>
      Promise.all([
        purgeFaresCreatedByRecurrenceForDateFrom(client, 'unassigned_fares')(date),
        purgeFaresCreatedByRecurrenceForDateFrom(client, 'pending_returns')(date),
        purgeFaresCreatedByRecurrenceForDateFrom(client, 'scheduled_fares')(date)
      ])
  );

export const purgeFaresCreatedByRecurrenceForDateFrom =
  (client: PoolClient, tableName: string) =>
  async (date: string): Promise<QueryResult> => {
    const queryString: string = `
    DELETE FROM ${tableName} WHERE creator = 'recurrence' AND DATE(datetime) = '${date}'
  `;
    return client.query(queryString);
  };
