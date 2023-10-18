import { Errors } from '../../reporter';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { EditRegular, Entity, Regular, RegularPersistence } from '../../definitions';
import { intersection as ioIntersection, Type, type as ioType } from 'io-ts';
import { RegularToEdit } from './edit-regular.route';
import { $onInfrastructureOrValidationError, throwEntityNotFoundValidationError } from '../../errors';
import { entityCodec, externalTypeCheckFor, regularCodec, regularEntityCodec, regularEditedCodec } from '../../codecs';
import { isDefinedGuard } from '../../domain';
import { fromDBtoRegularCandidate } from '../../mappers';
import { regularRulesCodec } from '../../rules';

export const $regularToEditValidation =
  (db: PostgresDb) =>
  (transfer: unknown): TaskEither<Errors, RegularToEdit> =>
    pipe(
      transfer,
      externalTypeCheckFor<Entity & Regular>(regularEntityCodec),
      fromEither,
      taskEitherChain($checkRegularToEditExist(db)),
      taskEitherChain(typeCheck),
      taskEitherChain(rulesCheck)
    );

export const editedRegularValidation = (transfer: unknown): TaskEither<Errors, EditRegular> =>
  pipe(transfer, externalTypeCheckFor<EditRegular>(regularEditedCodec), fromEither);

const $checkRegularToEditExist =
  (db: PostgresDb) =>
  (transfer: Entity & Regular): TaskEither<Errors, unknown> =>
    taskEitherTryCatch(async (): Promise<unknown> => {
      const {
        id: regularId,
        ...toEdit
      }: {
        id: string;
      } = transfer;

      const [regularToEdit]: ((Entity & RegularPersistence) | undefined)[] = (
        await db.query<Entity & RegularPersistence>('SELECT * FROM regulars WHERE id = $1 LIMIT 1', [regularId])
      ).rows;

      if (!isDefinedGuard(regularToEdit)) return throwEntityNotFoundValidationError(transfer.id);

      return {
        toEdit: toEdit as Regular,
        regularToEdit: fromDBtoRegularCandidate(regularToEdit)
      };
    }, $onInfrastructureOrValidationError(`$checkRegularToEditExist`));

const typeCheck = (fromDB: unknown): TaskEither<Errors, RegularToEdit> => fromEither(regularToEditCodec.decode(fromDB));

const rulesCheck = (regularToEdit: RegularToEdit): TaskEither<Errors, RegularToEdit> =>
  fromEither(regularToEditRulesCodec.decode(regularToEdit));

const regularToEditCodec: Type<RegularToEdit> = ioType({
  toEdit: regularCodec,
  regularToEdit: regularEntityCodec
});

// eslint-disable-next-line @typescript-eslint/typedef
const regularToEditRulesCodec = ioType({
  toEdit: regularRulesCodec,
  regularToEdit: ioIntersection([entityCodec, regularRulesCodec])
});
