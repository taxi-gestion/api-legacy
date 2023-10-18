import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastify from 'fastify';
import formbody from '@fastify/formbody';
import postgres from '@fastify/postgres';
import { closeGracefullyOnSignalInterrupt, start } from './server.utils';
import { databaseStatusQuery } from './queries/database-status/database-status.route';
import { scheduleFareCommand } from './commands/schedule-fare/schedule-fare.route';
import { predictRecurrenceQuery } from './queries/predict-recurrence/predict-recurrence.route';
import { $openAIPredictRecurrence } from './services/openai/predict-recurrence/predict-recurrence';
import { searchPlaceQuery } from './queries/search-place/search-place.route';
import { $googleMapsSearchPlace } from './services/google/places/search-place.api';
import { estimateJourneyQuery } from './queries/estimate-journey/estimate-journey.route';
import { $googleMapsEstimateJourney } from './services/google/distance-matrix/estimate-journey.api';
import { pendingReturnsForTheDateQuery } from './queries/pending-returns-for-date/pending-returns-for-date.route';
import { scheduledFaresForTheDateQuery } from './queries/scheduled-fares-for-date/scheduled-fares-for-date.route';
import { listDriversQuery } from './queries/list-drivers/list-drivers.route';
import { registerRegularCommand } from './commands/register-regular/register-regular.route';
import { deleteFareCommand } from './commands/delete-fare/delete-fare.route';
import { editScheduledCommand } from './commands/edit-scheduled/edit-scheduled.route';
import { subcontractFareCommand } from './commands/subcontract-fare/subcontract-fare.route';
import { subcontractedFaresForTheDateQuery } from './queries/subcontracted-fares-for-date/subcontracted-fares-for-date.route';
import { schedulePendingCommand } from './commands/schedule-pending/schedule-pending.route';
import { searchRegularQuery } from './queries/search-regulars/search-regular.route';
import { deleteRegularCommand } from './commands/delete-regular/delete-regular.route';
import { editRegularCommand } from './commands/edit-regular/edit-regular.route';
import { driverAgendaForTheDateQuery } from './queries/driver-agenda-for-date/driver-agenda-for-date.route';
import { regularByIdQuery } from './queries/regular-by-id/regular-by-id.route';
import { $awsCognitoListUsersInGroupDriver } from './services/aws/cognito/list-drivers.api';
import { listDriversWithDisplayOrderQuery } from './queries/list-drivers-with-order/list-drivers-with-order.route';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { Errors } from './reporter';
import { Driver, Entity } from './definitions';
import { validateTableQuery } from './queries/validate-data/validate-data.route';
import { faresCountForTheDateQuery } from './queries/fares-count-for-date/fares-count-for-date.route';
import { allocateUnassignedCommand } from './commands/allocate-unassigned/allocate-unassigned.route';
import { scheduleUnassignedCommand } from './commands/schedule-unassigned/schedule-unassigned.route';
import { unassignedFaresForTheDateQuery } from './queries/unassigned-fares-for-date/unassigned-fares-for-date.route';

const server: FastifyInstance = fastify();

closeGracefullyOnSignalInterrupt({ server, nodeProcess: process });

// Used to parse application/x-www-form-urlencoded
// eslint-disable-next-line @typescript-eslint/no-floating-promises
server.register(formbody);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
server.register(postgres, {
  connectionString: process.env['DATABASE_URL'] ?? ''
});

const prefix: string = process.env['API_PREFIX'] ?? '';

server.get('/', async (_request: FastifyRequest, _reply: FastifyReply): Promise<string> => 'OK\n');

server.get('/health', async (_request: FastifyRequest, _reply: FastifyReply): Promise<string> => 'OK\n');

/* eslint-disable @typescript-eslint/no-floating-promises */
//Queries
server.register(databaseStatusQuery, { prefix });
server.register(driverAgendaForTheDateQuery, { prefix });

server.register(estimateJourneyQuery, {
  adapter: $googleMapsEstimateJourney(process.env['API_KEY_GOOGLE_MAPS'] ?? ''),
  prefix
});

server.register(faresCountForTheDateQuery, { prefix });

const awsCognitoListUsersInGroupDriver: () => TaskEither<Errors, (Driver & Entity)[]> = $awsCognitoListUsersInGroupDriver(
  {
    accessKeyId: process.env['AWS_ACCESS_KEY_ID'] ?? '',
    secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'] ?? ''
  },
  {
    region: process.env['AWS_REGION'] ?? '',
    userPoolId: process.env['AWS_COGNITO_USER_POOL_ID'] ?? ''
  }
);

server.register(listDriversQuery, {
  adapter: awsCognitoListUsersInGroupDriver,
  prefix
});

server.register(listDriversWithDisplayOrderQuery, {
  adapter: awsCognitoListUsersInGroupDriver,
  prefix
});

server.register(pendingReturnsForTheDateQuery, { prefix });

server.register(predictRecurrenceQuery, {
  adapter: $openAIPredictRecurrence(process.env['API_KEY_OPENAI'] ?? ''),
  prefix
});

server.register(regularByIdQuery, { prefix });
server.register(scheduledFaresForTheDateQuery, { prefix });

server.register(searchPlaceQuery, {
  adapter: $googleMapsSearchPlace(process.env['API_KEY_GOOGLE_MAPS'] ?? ''),
  prefix
});

server.register(searchRegularQuery, { prefix });
server.register(subcontractedFaresForTheDateQuery, { prefix });
server.register(unassignedFaresForTheDateQuery, { prefix });
server.register(validateTableQuery, { prefix });

//Commands
server.register(allocateUnassignedCommand, { prefix });
server.register(deleteFareCommand, { prefix });
server.register(deleteRegularCommand, { prefix });
server.register(editRegularCommand, { prefix });
server.register(editScheduledCommand, { prefix });
server.register(registerRegularCommand, { prefix });
server.register(scheduleFareCommand, { prefix });
server.register(schedulePendingCommand, { prefix });
server.register(scheduleUnassignedCommand, { prefix });
server.register(subcontractFareCommand, { prefix });
/* eslint-enable @typescript-eslint/no-floating-promises */

// eslint-disable-next-line @typescript-eslint/no-floating-promises
start({ server, nodeProcess: process });
