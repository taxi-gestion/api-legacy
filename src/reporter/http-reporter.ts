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

  return {
    errorValue: String(error.value),
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    failingRule: toFailingRule(error.context),
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    humanReadable: String(error.message),
    code: getCodeFromMessage(error)
  };
};

const toFailingRule = (errorContext: Context): string => `${toFailingChain(errorContext)}${failingKeyOrEmpty(errorContext)}`;

const toFailingChain = (errorContext: Context): string =>
  errorContext.map((entry: ContextEntry): string => entry.type.name).join('.');

const failingKeyOrEmpty = (errorContext: Context): string =>
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  isEmptyStringOrUndefined(toFailingKey(errorContext.at(-1)!)) ? '' : `.${toFailingKey(errorContext.at(-1)!)}`;

const toFailingKey = (lastContext: ContextEntry): string | undefined => lastContext.key;

const isEmptyStringOrUndefined = (candidate: string | undefined): boolean => candidate === undefined || candidate === '';

const formatValidationErrors = (errors: Errors): DevFriendlyError[] => errors.map(toDevFriendlyError);

const httpReporter: HttpReporter = { report: reporter };
export default httpReporter;

export type DevFriendlyError = {
  errorValue: string;
  humanReadable: string;
  failingRule?: string;
  code: string;
};
