import { pipe } from 'fp-ts/function';
import { chain as eitherChain, Either } from 'fp-ts/Either';
import { externalTypeCheckFor, toUnassignedCodec, unassignedAllocatedCodec } from '../../codecs';
import { Errors } from '../../reporter';
import { fromEither, TaskEither } from 'fp-ts/TaskEither';
import { AllocateUnassigned, ToUnassigned } from '../../definitions';
import { toUnassignedRulesCodec } from '../../rules';

export const unassignedToAllocateValidation = (transfer: unknown): Either<Errors, ToUnassigned> =>
  pipe(transfer, externalTypeCheckFor<ToUnassigned>(toUnassignedCodec), eitherChain(rulesCheck));

export const unassignedAllocatedValidation = (transfer: unknown): TaskEither<Errors, AllocateUnassigned> =>
  pipe(transfer, externalTypeCheckFor<AllocateUnassigned>(unassignedAllocatedCodec), fromEither);

const rulesCheck = (transfer: ToUnassigned): Either<Errors, ToUnassigned> => toUnassignedRulesCodec.decode(transfer);
