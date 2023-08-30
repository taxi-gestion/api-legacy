import { pipe } from 'fp-ts/lib/function';
import { map as taskEitherMap, TaskEither } from 'fp-ts/TaskEither';
import { Pending, Scheduled, FareToEdit, Entity } from '../../definitions';
import { Errors } from '../../reporter/HttpReporter';

export type EditActions = {
  scheduleToEdit: Entity & Scheduled;
  pendingToCreate: Pending | null;
  pendingEntityToDelete: Entity | null;
};

export const editFare = (fareToEdit: TaskEither<Errors, [Entity & FareToEdit, Entity?]>): TaskEither<Errors, EditActions> =>
  pipe(
    fareToEdit,
    taskEitherMap(([fare, returnToDelete]: [Entity & FareToEdit, Entity?]): EditActions => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const pendingReturn: Pending | null = createPendingOrEmpty(fare);

      const scheduledFare: Entity & Scheduled = {
        ...fare,
        status: 'scheduled'
      };

      return {
        scheduleToEdit: scheduledFare,
        pendingToCreate: pendingReturn,
        pendingEntityToDelete: returnToDelete ?? null
      };
    })
  );

const createPendingOrEmpty = (fare: FareToEdit): Pending | null => {
  if (fare.kind === 'one-way') return null;

  return {
    passenger: fare.passenger,
    datetime: toZeroedTimeIso8601(fare.datetime),
    nature: fare.nature,
    phone: fare.phone,
    driver: fare.driver,
    departure: fare.destination,
    destination: fare.departure,
    status: 'pending-return',
    kind: 'two-way'
  };
};

const toZeroedTimeIso8601 = (datetime: string): string => {
  const date: Date = new Date(datetime);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
};
