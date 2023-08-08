import { array as ioArray, boolean as ioBoolean, string as ioString, Type, type as ioType } from 'io-ts';
import { Driver } from '../../../definitions';
import { driverCodec } from '../../../codecs';

/* eslint-disable @typescript-eslint/naming-convention,id-denylist */
export type AwsCognitoIdentityProviderResponse = {
  Users: CognitoUser[];
};

export type CognitoUser = {
  Attributes: CognitoUserAttribute[];
  Enabled: boolean;
  UserCreateDate: string;
  UserLastModifiedDate: string;
  Username: string;
  UserStatus: string;
};

export type CognitoUserAttribute = {
  name: string;
  // eslint-disable-next-line id-denylist
  value: string;
};

export const cognitoUserAttributeCodec: Type<CognitoUserAttribute> = ioType({
  name: ioString,
  value: ioString
});

const cognitoUserCodec: Type<CognitoUser> = ioType({
  Attributes: ioArray(cognitoUserAttributeCodec),
  Enabled: ioBoolean,
  UserCreateDate: ioString,
  UserLastModifiedDate: ioString,
  Username: ioString,
  UserStatus: ioString
});

export const awsCognitoIdentityProviderTransferCodec: Type<AwsCognitoIdentityProviderResponse> = ioType({
  Users: ioArray(cognitoUserCodec)
});
/* eslint-enable @typescript-eslint/naming-convention,id-denylist */

export const driversCodec: Type<Driver[]> = ioArray(driverCodec);
