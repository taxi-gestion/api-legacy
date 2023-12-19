import {
  AdapterOperation,
  ConditionOnDomain,
  EncodeToAdapter,
  EncodeToDomain
} from '../../../definitions/strategy.definitions';
import { UnassignedPersist } from '../../allocate-unassigned/allocate-unassigned.route';
import { Recurring, Unassigned } from '../../../definitions';
import { PostgresDb } from '@fastify/postgres';
import { TaskEither } from 'fp-ts/TaskEither';
import { Errors } from '../../../codecs';
import { pipe } from 'fp-ts/function';
import { insertUnassignedIn } from '../../allocate-unassigned/allocate-unassigned.persistence';
import { Encode } from 'io-ts';

export type RecurringForUnassigned = Recurring & { driver: undefined };
export const hasUnassigned: ConditionOnDomain<Recurring, RecurringForUnassigned> = (
  recurring: Recurring
): recurring is RecurringForUnassigned => recurring.driver === undefined;

export type OneUnassigned = [Unassigned];

export const encodeToOneUnassigned =
  (date: string): EncodeToDomain<RecurringForUnassigned, OneUnassigned> =>
  (recurring: RecurringForUnassigned): OneUnassigned =>
    [encodeUnassigned(date)(recurring)];
export const persistSingleUnassigned =
  (database: PostgresDb): AdapterOperation<UnassignedPersist> =>
  (fares: UnassignedPersist): TaskEither<Errors, unknown> =>
    pipe(fares, insertUnassignedIn(database));
export const encodeToUnassignedPersist: EncodeToAdapter<OneUnassigned, UnassignedPersist> = (
  fares: OneUnassigned
): UnassignedPersist => encodeUnassignedPersist(fares);

const encodeUnassigned: (date: string) => Encode<RecurringForUnassigned, Unassigned> =
  (date: string) =>
  (recurring: RecurringForUnassigned): Unassigned => ({
    departure: recurring.departure,
    arrival: recurring.arrival,
    distance: recurring.distance,
    duration: recurring.duration,
    nature: recurring.nature,
    passenger: recurring.passenger,
    kind: recurring.kind,
    datetime: `${date}T${recurring.departureTime}`,
    status: 'unassigned',
    creator: 'recurrence'
  });

const encodeUnassignedPersist = ([unassigned]: OneUnassigned): UnassignedPersist => ({
  unassignedToCreate: unassigned
});
