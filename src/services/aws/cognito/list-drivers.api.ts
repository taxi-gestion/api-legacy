import { chain as taskEitherChain, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { Errors } from '../../../reporter';
import { pipe } from 'fp-ts/function';
import { onDependencyError } from '../../../errors';
import { Driver, Entity } from '../../../definitions';
import { listUsersInGroupDriverValidation } from './list-drivers.validation';
import { CognitoIdentityProviderClient, ListUsersInGroupCommand } from '@aws-sdk/client-cognito-identity-provider';

type AwsCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
};

type Cognito = {
  region: string;
  userPoolId: string;
};

export const $awsCognitoListUsersInGroupDriver =
  (awsCredentials: AwsCredentials, cognito: Cognito) => (): TaskEither<Errors, (Driver & Entity)[]> =>
    pipe(
      $callToAwsCognitoIdentityProviderApi(awsCredentials, cognito)('driver'),
      taskEitherChain(listUsersInGroupDriverValidation)
    );

const $callToAwsCognitoIdentityProviderApi =
  (awsCredentials: AwsCredentials, cognito: Cognito) =>
  (group: string): TaskEither<Errors, unknown> =>
    taskEitherTryCatch(
      // eslint-disable-next-line @typescript-eslint/return-await,@typescript-eslint/await-thenable
      async (): Promise<unknown> => await callToAwsCognitoIdentityProviderApi(awsCredentials, cognito)(group),
      (reason: unknown): Errors => onDependencyError('call to aws cognito-identity-provider api error', reason)
    );

/* eslint-disable @typescript-eslint/naming-convention */
const callToAwsCognitoIdentityProviderApi =
  (awsCredentials: AwsCredentials, cognito: Cognito) =>
  async (group: string): Promise<unknown> => {
    // a client can be shared by different commands.
    const client: CognitoIdentityProviderClient = new CognitoIdentityProviderClient({
      region: cognito.region,
      credentials: awsCredentials
    });
    const command: ListUsersInGroupCommand = new ListUsersInGroupCommand({
      GroupName: group,
      UserPoolId: cognito.userPoolId
    });

    return client.send(command);
  };
/* eslint-enable @typescript-eslint/naming-convention */
