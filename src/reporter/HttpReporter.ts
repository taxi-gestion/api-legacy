import { Reporter } from 'io-ts/Reporter';
import * as t from 'io-ts';
import { pipe } from 'fp-ts/lib/function';
import * as E from 'fp-ts/lib/Either';
import { Context, ContextEntry, Errors, ValidationError } from 'io-ts';

export const reporter = <T>(validation: t.Validation<T>): DevFriendlyError[] =>
  pipe(
    validation,
    E.mapLeft((errors: Errors): DevFriendlyError[] => formatValidationErrors(errors)),
    E.fold(
      (errors: DevFriendlyError[]): DevFriendlyError[] => errors,
      (): DevFriendlyError[] => []
    )
  );

type HttpReporter = Reporter<DevFriendlyError[]> & {
  report: <T>(validation: t.Validation<T>) => DevFriendlyError[];
};

const toDevFriendlyError = (error: ValidationError): DevFriendlyError => {
  const errorContext: Context = error.context;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const actualContext: ContextEntry = errorContext.at(errorContext.length - 1)!;

  return {
    inputValue: String(error.value),
    failingRule: actualContext.type.name,
    inputKey: actualContext.key,
    humanReadable: String(error.message)
  };
};

const formatValidationErrors = (errors: Errors): DevFriendlyError[] => errors.map(toDevFriendlyError);

const httpReporter: HttpReporter = { report: reporter };
export default httpReporter;

export type DevFriendlyError = {
  inputValue: string;
  inputKey: string;
  humanReadable: string;
  failingRule: string;
};
