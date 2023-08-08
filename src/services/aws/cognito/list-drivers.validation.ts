import { pipe } from 'fp-ts/function';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { fromEither } from 'fp-ts/TaskEither';
import { chain as eitherChain, Either } from 'fp-ts/Either';
import {
  AwsCognitoIdentityProviderResponse,
  awsCognitoIdentityProviderTransferCodec,
  CognitoUser,
  CognitoUserAttribute,
  driversCodec
} from './cognito.codec';
import { Driver } from '../../../definitions';
import { Errors } from '../../../reporter/HttpReporter';
import { externalTypeCheckFor } from '../../../codecs';

export const listUsersInGroupDriverValidation = (transfer: unknown): TaskEither<Errors, Driver[]> =>
  pipe(
    transfer,
    externalTypeCheckFor<AwsCognitoIdentityProviderResponse>(awsCognitoIdentityProviderTransferCodec),
    eitherChain(internalTypeCheckForListUsersInGroupDriver),
    fromEither
  );

const internalTypeCheckForListUsersInGroupDriver = (response: AwsCognitoIdentityProviderResponse): Either<Errors, Driver[]> =>
  driversCodec.decode(toDrivers(response.Users));

const toDrivers = (cognitoUsers: CognitoUser[]): Driver[] => cognitoUsers.map(toDriver);

const findAttributeValueByName = (attributeName: string, attributes: CognitoUserAttribute[]): string | undefined =>
  attributes.find((attribute: CognitoUserAttribute): boolean => attribute.name === attributeName)?.value;

const toDriver = (cognitoUser: CognitoUser): Driver => ({
  identifier:
    findAttributeValueByName('phone', cognitoUser.Attributes) ??
    findAttributeValueByName('email', cognitoUser.Attributes) ??
    '',
  username: findAttributeValueByName('username', cognitoUser.Attributes) ?? ''
});
