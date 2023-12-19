import { ApplicativePar, TaskEither } from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { StrategyPipeline } from '../definitions/strategy.definitions';
import { sequence as arraySequence } from 'fp-ts/Array';
import { Errors } from '../codecs';

export const applyStrategyPipeline =
  <Domain extends object>(strategies: StrategyPipeline<Domain>[]) =>
  (aggregates: Domain[]): TaskEither<Errors, unknown>[] =>
    pipe(aggregates.map((aggregate: Domain): TaskEither<Errors, unknown> => applyStrategy<Domain>(strategies)(aggregate)));

/* eslint-disable @typescript-eslint/typedef */
const applyStrategy =
  <Domain extends object>(strategies: StrategyPipeline<Domain>[]) =>
  (aggregate: Domain): TaskEither<Errors, unknown> =>
    pipe(
      strategies.find(([condition]): boolean => condition(aggregate)) ?? errorThatShouldNeverHappen('Strategy not found'),
      ([narrowedCondition, encodeToDomain, encodeToAdapter, adapterOperation]): TaskEither<Errors, unknown> =>
        narrowedCondition(aggregate)
          ? pipe(aggregate, encodeToDomain, encodeToAdapter, adapterOperation)
          : errorThatShouldNeverHappen('Not happening')
    );
/* eslint-enable @typescript-eslint/typedef */

const errorThatShouldNeverHappen = (message: string): never => {
  throw new Error(message);
};

export const sequenceAdapterResults = (operations: TaskEither<Errors, unknown>[]): TaskEither<Errors, unknown[]> =>
  pipe(operations, arraySequence(ApplicativePar));
