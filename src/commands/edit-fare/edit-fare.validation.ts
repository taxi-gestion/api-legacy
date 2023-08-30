import { Errors, InfrastructureError, isInfrastructureError, ValidationError } from '../../reporter/HttpReporter';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { Entity, FareToEdit, Pending, Scheduled } from '../../definitions';
import { QueryResult } from 'pg';
import {
  externalTypeCheckFor,
  fareToEditAndOptionalPendingReturnEntityCodec,
  fareToEditAndOptionalPendingReturnEntityRulesCodec,
  fareToEditCodec,
  scheduledFareAndOptionalPendingReturnCodec
} from '../../codecs';
import { Decoder } from 'io-ts';

export const $editFareValidation =
  (db: PostgresDb) =>
  (transfer: unknown): TaskEither<Errors, [Entity & FareToEdit, Entity?]> =>
    pipe(
      transfer,
      externalTypeCheckFor<Entity & FareToEdit>(fareToEditCodec),
      fromEither,
      taskEitherChain($fareToEditExistInDb(db)),
      taskEitherChain(internalTypeCheckForFareToEdit),
      taskEitherChain(rulesCheckForFareToEdit)
    );

export const editedFaresValidation = (transfer: unknown): TaskEither<Errors, [Entity & Scheduled, (Entity & Pending)?]> =>
  pipe(
    transfer,
    externalTypeCheckFor<[Entity & Scheduled, (Entity & Pending)?]>(scheduledFareAndOptionalPendingReturnCodec),
    fromEither
  );

const $fareToEditExistInDb =
  (db: PostgresDb) =>
  (editFareTransfer: Entity & FareToEdit): TaskEither<Errors, unknown> =>
    taskEitherTryCatch(async (): Promise<unknown> => {
      const fareToEditQueryResult: QueryResult = await db.query('SELECT * FROM scheduled_fares WHERE id = $1 LIMIT 1', [
        editFareTransfer.id
      ]);

      if (fareToEditQueryResult.rows.length === 0)
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw entityNotFoundValidationError(editFareTransfer.id) satisfies ValidationError;

      const fareToEditPendingReturnQueryResult: QueryResult = await db.query(
        'SELECT id FROM pending_returns WHERE outward_fare_id = $1 LIMIT 1',
        [editFareTransfer.id]
      );

      return fareToEditPendingReturnQueryResult.rows.length === 0
        ? [editFareTransfer]
        : // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          [editFareTransfer, { id: fareToEditPendingReturnQueryResult.rows[0].id }];
    }, onError);

const internalTypeCheckForFareToEdit = (fromDB: unknown): TaskEither<Errors, [Entity & FareToEdit, Entity?]> =>
  fromEither(fareToEditAndOptionalPendingReturnEntityCodec.decode(fromDB));

const rulesCheckForFareToEdit = (
  fareToEdit: [Entity & FareToEdit, Entity?]
): TaskEither<Errors, [Entity & FareToEdit, Entity?]> =>
  fromEither(fareToEditAndOptionalPendingReturnEntityRulesCodec.decode(fareToEdit));

const onError = (error: unknown): Errors =>
  isInfrastructureError(error as InfrastructureError)
    ? ([
        {
          isInfrastructureError: true,
          message: `database error fareToEditExistInDb  - ${(error as Error).message}`,
          // eslint-disable-next-line id-denylist
          value: (error as Error).name,
          stack: (error as Error).stack ?? 'no stack available',
          code: (error as Error).message.includes('ECONNREFUSED') ? '503' : '500'
        } satisfies InfrastructureError
      ] satisfies Errors)
    : [error as ValidationError];

const entityNotFoundValidationError = (id: string): ValidationError => ({
  context: [
    {
      actual: id,
      key: 'id',
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      type: {
        name: 'isValidId'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as Decoder<any, any>
    }
  ],
  message: `Rules check failed, '${id}' not found in the database`,
  // eslint-disable-next-line id-denylist
  value: id
});
