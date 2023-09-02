import { ValidationError } from '../reporter/http-reporter';
import { Decoder } from 'io-ts';

export const entityNotFoundValidationError = (id: string): ValidationError => ({
  context: [
    {
      actual: id,
      key: 'id',
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      type: {
        name: 'isValidId'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as Decoder<any, any>
    }
  ],
  message: `Rules check failed, '${id}' not found in the database`,
  // eslint-disable-next-line id-denylist
  value: id
});

export const throwEntityNotFoundValidationError = (id: string): never => {
  // eslint-disable-next-line @typescript-eslint/no-throw-literal
  throw entityNotFoundValidationError(id);
};
