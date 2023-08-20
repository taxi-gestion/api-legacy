import {
  array as ioArray,
  boolean as ioBoolean,
  string as ioString,
  Type,
  type as ioType,
  intersection as ioIntersection
} from 'io-ts';
import { date as ioDate } from 'io-ts-types';
import { Driver, Entity } from '../../../definitions';
import { driverCodec, entityCodec } from '../../../codecs';

/* eslint-disable @typescript-eslint/naming-convention,id-denylist */
export type AwsCognitoIdentityProviderResponse = {
  Users: CognitoUser[];
};

export type CognitoUser = {
  Attributes: CognitoUserAttribute[];
  Enabled: boolean;
  UserCreateDate: Date;
  UserLastModifiedDate: Date;
  Username: string;
  UserStatus: string;
};

export type CognitoUserAttribute = {
  Name: string;
  // eslint-disable-next-line id-denylist
  Value: string;
};

export const cognitoUserAttributeCodec: Type<CognitoUserAttribute> = ioType({
  Name: ioString,
  Value: ioString
});

const cognitoUserCodec: Type<CognitoUser> = ioType({
  Attributes: ioArray(cognitoUserAttributeCodec),
  Enabled: ioBoolean,
  UserCreateDate: ioDate,
  UserLastModifiedDate: ioDate,
  Username: ioString,
  UserStatus: ioString
});

export const awsCognitoIdentityProviderTransferCodec: Type<AwsCognitoIdentityProviderResponse> = ioType({
  Users: ioArray(cognitoUserCodec)
});
/* eslint-enable @typescript-eslint/naming-convention,id-denylist */

export const driverEntitiesCodec: Type<(Driver & Entity)[]> = ioArray(ioIntersection([driverCodec, entityCodec]));
