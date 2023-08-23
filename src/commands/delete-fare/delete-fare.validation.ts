import { Errors, InfrastructureError } from '../../reporter/HttpReporter';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { Entity } from '../../definitions';
import { QueryResult } from 'pg';
import { entityTupleWithSecondOptionalCodec, externalTypeCheckFor, stringCodec } from '../../codecs';

export const $deleteFareValidation =
  (db: PostgresDb) =>
  (transfer: unknown): TaskEither<Errors, [Entity, Entity?]> =>
    pipe(
      transfer,
      externalTypeCheckFor<string>(stringCodec),
      fromEither,
      taskEitherChain($toEntitiesToDelete(db)),
      taskEitherChain(internalTypeCheckForEntitiesToDelete)
    );

const $toEntitiesToDelete =
  (db: PostgresDb) =>
  (deleteFareEntityIdTransfer: string): TaskEither<Errors, unknown> =>
    taskEitherTryCatch(async (): Promise<unknown> => {
      const scheduledFareToDeleteValues: QueryResult = await db.query(
        'SELECT id,kind FROM scheduled_fares WHERE id = $1 LIMIT 1',
        [deleteFareEntityIdTransfer]
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const entitiesToDelete: [Entity] = [{ id: scheduledFareToDeleteValues.rows[0].id }];

      if (isTwoWay(scheduledFareToDeleteValues)) {
        const returnToScheduleValues: QueryResult = await db.query(
          'SELECT id FROM pending_returns WHERE outward_fare_id = $1 LIMIT 1',
          [deleteFareEntityIdTransfer]
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        entitiesToDelete.push({ id: returnToScheduleValues.rows[0].id });
      }

      return entitiesToDelete;
    }, onInfrastructureError);

const internalTypeCheckForEntitiesToDelete = (fromDB: unknown): TaskEither<Errors, [Entity, Entity?]> =>
  fromEither(entityTupleWithSecondOptionalCodec.decode(fromDB));

const isTwoWay = (fareDbResult: QueryResult): boolean => fareDbResult.rows[0].kind === 'two-way';

const onInfrastructureError = (error: unknown): Errors =>
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
