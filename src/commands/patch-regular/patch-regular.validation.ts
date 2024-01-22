import {
  entityCodec,
  Errors,
  externalTypeCheckFor,
  regularPatchedCodec,
  regularEntityCodec,
  regularPatchablePropertiesCodec
} from '../../codecs';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { PatchRegular, Entity, RegularPersistence, RegularPatchableProperties } from '../../definitions';
import { intersection as ioIntersection, Type, type as ioType } from 'io-ts';
import { RegularToPatch } from './patch-regular.route';
import { $onInfrastructureOrValidationError, throwEntityNotFoundValidationError } from '../../errors';
import { isDefinedGuard } from '../../domain';
import { fromDBtoRegularCandidate } from '../../mappers';
import { regularPatchablePropertiesRules, regularRules } from '../../codecs/domain-rules/regular.rules';

export const $regularToPatchValidation =
  (db: PostgresDb) =>
  (transfer: unknown): TaskEither<Errors, RegularToPatch> =>
    pipe(
      transfer,
      externalTypeCheckFor<Entity & RegularPatchableProperties>(regularPatchablePropertiesCodec),
      fromEither,
      taskEitherChain($checkRegularToPatchExist(db)),
      taskEitherChain(typeCheck),
      taskEitherChain(rulesCheck)
    );

export const patchedRegularValidation = (transfer: unknown): TaskEither<Errors, PatchRegular> =>
  pipe(transfer, externalTypeCheckFor<PatchRegular>(regularPatchedCodec), fromEither);

const $checkRegularToPatchExist =
  (db: PostgresDb) =>
  (transfer: Entity & RegularPatchableProperties): TaskEither<Errors, unknown> =>
    taskEitherTryCatch(async (): Promise<unknown> => {
      const {
        id: regularId
      }: {
        id: string;
      } = transfer;

      const [regularToPatch]: ((Entity & RegularPersistence) | undefined)[] = (
        await db.query<Entity & RegularPersistence>('SELECT * FROM regulars WHERE id = $1 LIMIT 1', [regularId])
      ).rows;

      if (!isDefinedGuard(regularToPatch)) return throwEntityNotFoundValidationError(transfer.id);
      return {
        toPatch: transfer,
        regularToPatch: fromDBtoRegularCandidate(regularToPatch)
      };
    }, $onInfrastructureOrValidationError(`$checkRegularToPatchExist`));

const typeCheck = (fromDB: unknown): TaskEither<Errors, RegularToPatch> => fromEither(regularToPatchCodec.decode(fromDB));

const rulesCheck = (regularToPatch: RegularToPatch): TaskEither<Errors, RegularToPatch> =>
  fromEither(regularToPatchRulesCodec.decode(regularToPatch));

const regularToPatchCodec: Type<RegularToPatch> = ioType({
  toPatch: regularPatchablePropertiesCodec,
  regularToPatch: regularEntityCodec
});

// eslint-disable-next-line @typescript-eslint/typedef
const regularToPatchRulesCodec = ioType({
  toPatch: regularPatchablePropertiesRules,
  regularToPatch: ioIntersection([entityCodec, regularRules])
});
