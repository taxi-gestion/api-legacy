import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/function';
import { ApplicativePar as TaskEitherPar, chain as taskEitherChain, fromEither } from 'fp-ts/TaskEither';
import { allRecurringFares } from '../../_common/all-recurring-fares.persistence';
import { recurringFaresValidation } from '../../_common/recurring-fares.validation';
import { sequenceT } from 'fp-ts/Apply';
import { fold as taskEitherFold, TaskEither, map as taskEitherMap } from 'fp-ts/lib/TaskEither';
import { Errors, isYYYYMMDDDate } from '../../codecs';
import { Either } from 'fp-ts/Either';
import { CommandsResult, Entity, Recurring, Scheduled } from '../../definitions';
import { recurringAppliedValidation } from './apply-recurring-for-date.validation';
import { onErroredTask, onSuccessfulTaskWith } from '../../server.utils';
import { keepOnlyMatchingRecurringForDay } from './keep-only-matching-recurring-for-day';

import { recurringStrategies } from './recurring-strategies';
import { applyStrategyPipeline, sequenceAdapterResults } from '../../_common/strategy.pattern';
import { StrategyPipeline } from '../../definitions/strategy.definitions';
import { purgePreviousFaresCreatedByRecurrenceForDate } from './purge-previous.persistence';

export type ApplyRecurringForDate = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: {
    date: string;
  };
}>;

export type ScheduledAndReturnPersist = {
  scheduledToCreate: Scheduled;
  scheduledReturnToCreate: Scheduled;
};

// eslint-disable-next-line @typescript-eslint/require-await
export const applyRecurringForDateCommand = async (server: FastifyInstance): Promise<void> => {
  server.route({
    method: 'GET',
    url: '/recurring/apply/:date',
    handler: async (req: ApplyRecurringForDate, reply: FastifyReply): Promise<void> => {
      await pipe(
        isYYYYMMDDDate.decode(req.params.date),
        getRecurringsAndPurgePrevious(server),
        taskEitherChain(keepOnlyMatchingRecurringForDay),
        taskEitherChain(applyStrategies(server)),
        taskEitherChain(recurringAppliedValidation),
        taskEitherFold(onErroredTask(reply), onSuccessfulTaskWith(reply)<CommandsResult<'apply-recurring'>>)
      )();
    }
  });
};

const getRecurringsAndPurgePrevious =
  (server: FastifyInstance) =>
  (dateEither: Either<Errors, string>): TaskEither<Errors, [string, (Entity & Recurring)[]]> =>
    pipe(
      sequenceT(TaskEitherPar)(validatedDate(dateEither), getRecurringFares(server), purgePreviousFares(dateEither, server)),
      taskEitherMap(discardPurgeResult)
    );

const validatedDate = (dateEither: Either<Errors, string>): TaskEither<Errors, string> => fromEither(dateEither);

const purgePreviousFares = (dateEither: Either<Errors, string>, server: FastifyInstance): TaskEither<Errors, unknown> =>
  pipe(
    validatedDate(dateEither),
    taskEitherChain(
      (date: string): TaskEither<Errors, unknown> => purgePreviousFaresCreatedByRecurrenceForDate(server.pg)(date)
    )
  );

const getRecurringFares = (server: FastifyInstance): TaskEither<Errors, (Entity & Recurring)[]> =>
  pipe(allRecurringFares(server.pg), taskEitherChain(recurringFaresValidation));
const discardPurgeResult = ([date, fares, _]: [string, (Entity & Recurring)[], unknown]): [string, (Entity & Recurring)[]] => [
  date,
  fares
];

const applyStrategies =
  (server: FastifyInstance) =>
  ([date, fares]: [string, (Entity & Recurring)[]]): TaskEither<Errors, unknown[]> =>
    pipe(
      applyStrategyPipeline<Recurring>(recurringStrategies({ date, database: server.pg }) as StrategyPipeline<Recurring>[])(
        fares
      ),
      sequenceAdapterResults
    );
