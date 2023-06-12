import { TaskEither, tryCatch as tryCatchTaskEither } from 'fp-ts/lib/TaskEither';
import { Errors } from 'io-ts';
import { PostgresDb } from '@fastify/postgres';
import { Either, fold as foldEither, left as leftEither } from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import { fromEither } from 'fp-ts/TaskEither';
import { QueryResult } from 'pg';

export const faresForTheDateQuery =
  (_database: PostgresDb) =>
  (date: Either<Errors, string>): TaskEither<Errors, QueryResult> =>
    pipe(
      date,
      foldEither(
        (validationErrors: Errors): TaskEither<Errors, QueryResult> =>
          fromEither(leftEither<Errors, QueryResult>(validationErrors)),
        (_validDate: string): TaskEither<Errors, QueryResult> =>
          tryCatchTaskEither(
            // eslint-disable-next-line @typescript-eslint/require-await,arrow-body-style
            async (): Promise<QueryResult> => {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return
              return { rows: [] } as unknown as QueryResult;
            },
            (error: unknown): Errors =>
              [
                {
                  message: `Error - faresForTheDateQuery: ${(error as Error).message}`,
                  // eslint-disable-next-line id-denylist
                  value: (error as Error).name,
                  context: []
                }
              ] satisfies Errors
          )
      )
    );
