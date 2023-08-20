import { pipe } from 'fp-ts/function';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { fromEither } from 'fp-ts/TaskEither';
import { chain as eitherChain, Either } from 'fp-ts/Either';
import {
  AwsCognitoIdentityProviderResponse,
  awsCognitoIdentityProviderTransferCodec,
  CognitoUser,
  CognitoUserAttribute,
  driverEntitiesCodec
} from './cognito.codec';
import { Driver, Entity } from '../../../definitions';
import { Errors } from '../../../reporter/HttpReporter';
import { externalTypeCheckFor } from '../../../codecs';

export const listUsersInGroupDriverValidation = (transfer: unknown): TaskEither<Errors, (Driver & Entity)[]> =>
  pipe(
    transfer,
    externalTypeCheckFor<AwsCognitoIdentityProviderResponse>(awsCognitoIdentityProviderTransferCodec),
    eitherChain(internalTypeCheckForListUsersInGroupDriver),
    fromEither
  );

const internalTypeCheckForListUsersInGroupDriver = (
  response: AwsCognitoIdentityProviderResponse
): Either<Errors, (Driver & Entity)[]> => driverEntitiesCodec.decode(toDrivers(response.Users));

const toDrivers = (cognitoUsers: CognitoUser[]): (Driver & Entity)[] => cognitoUsers.map(toDriver);

const findAttributeValueByName = (attributeName: string, attributes: CognitoUserAttribute[]): string | undefined =>
  attributes.find((attribute: CognitoUserAttribute): boolean => attribute.Name === attributeName)?.Value;

const toDriver = (cognitoUser: CognitoUser): Driver & Entity => ({
  identifier: extractMailOrPhone(cognitoUser),
  username: extractMailOrPhone(cognitoUser),
  id: cognitoUser.Username
});

const extractMailOrPhone = (user: CognitoUser): string =>
  findAttributeValueByName('phone_number', user.Attributes) ?? findAttributeValueByName('email', user.Attributes) ?? '';
