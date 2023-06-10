import { TaskEither, tryCatch as tryCatchTaskEither } from 'fp-ts/lib/TaskEither';
import { ScheduledFare } from '../../commands/schedule-fare/schedule-fare.definitions';
import { Errors } from 'io-ts';
import { PostgresDb } from '@fastify/postgres';
import { Either, fold as foldEither, left as leftEither } from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import { fromEither } from 'fp-ts/TaskEither';

export const faresForTheDateQuery =
  (_database: PostgresDb) =>
  (date: Either<Errors, string>): TaskEither<Errors, ScheduledFare[]> =>
    pipe(
      date,
      foldEither(
        (validationErrors: Errors): TaskEither<Errors, ScheduledFare[]> =>
          fromEither(leftEither<Errors, ScheduledFare[]>(validationErrors)),
        (_validDate: string): TaskEither<Errors, ScheduledFare[]> =>
          tryCatchTaskEither(
            // eslint-disable-next-line @typescript-eslint/require-await,arrow-body-style
            async (): Promise<ScheduledFare[]> => {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return
              return [] as ScheduledFare[];
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
