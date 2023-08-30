import { Reporter } from 'io-ts/Reporter';
import { Context, ContextEntry } from 'io-ts';
import { pipe } from 'fp-ts/lib/function';
import { Either, fold, mapLeft } from 'fp-ts/Either';

export type InfrastructureError = {
  isInfrastructureError: true;
  message: string;
  // eslint-disable-next-line id-denylist
  value: string;
  stack: string;
  code: string;
  //context?: Record<string, unknown>;
};

export type ValidationError = {
  // eslint-disable-next-line id-denylist
  readonly value: unknown;
  readonly context: Context;
  readonly message?: string;
};

export type Errors = (InfrastructureError | ValidationError)[];

export const reporter = <T>(errors: Either<Errors, T>): DevFriendlyError[] =>
  pipe(
    errors,
    mapLeft(formatValidationErrors),
    fold(
      (formattedErrors: DevFriendlyError[]): DevFriendlyError[] => formattedErrors,
      (): DevFriendlyError[] => []
    )
  );

type HttpReporter = Reporter<DevFriendlyError[]> & {
  report: <T>(errors: Either<Errors, T>) => DevFriendlyError[];
};

export const isInfrastructureError = (error: InfrastructureError | ValidationError): error is InfrastructureError =>
  'isInfrastructureError' in error;

// I do not have a better alternative for now without a lot of work with io-ts
const getCodeFromMessage = (error: ValidationError): '400' | '422' =>
  String(error.message).toLowerCase().startsWith('type') ? '400' : '422';

const toDevFriendlyError = (error: InfrastructureError | ValidationError): DevFriendlyError => {
  if (isInfrastructureError(error)) {
    const reason: string =
      error.code === '503' ? 'A technical dependency of the service is unavailable' : 'Internal Server Error';
    return {
      errorValue: error.value,
      humanReadable: `${reason} - ${error.message}`,
      code: error.code
    };
  }

  // We are certain to have a validation error with a context.
  const errorContext: Context = error.context;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const actualContext: ContextEntry = errorContext[errorContext.length - 1]!;

  return {
    errorValue: String(error.value),
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    failingRule: actualContext.type.name,
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    inputKey: actualContext.key,
    humanReadable: String(error.message),
    code: getCodeFromMessage(error)
  };
};

const formatValidationErrors = (errors: Errors): DevFriendlyError[] => errors.map(toDevFriendlyError);

const httpReporter: HttpReporter = { report: reporter };
export default httpReporter;

export type DevFriendlyError = {
  errorValue: string;
  inputKey?: string;
  humanReadable: string;
  failingRule?: string;
  code: string;
};
