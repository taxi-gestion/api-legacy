import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastify from 'fastify';
import postgres from '@fastify/postgres';
import { closeGracefullyOnSignalInterrupt, start } from './server.utils';
import { databaseStatusQuery } from './queries/database-status/database-status.route';
import { predictRecurrenceCommand } from './commands/predict-recurrence/predict-recurrence.route';
import { $openAIPredictRecurrence } from './services/openai-predict-recurrence/openai-predict-recurrence';
import { resetDatabaseCommand } from './commands/database/database-reset.route';
import { scheduleFareCommand } from './commands/schedule-fare/schedule-fare.route';
import { affectReturnCommand } from './commands/affect-return/affect-return.route';
import { returnsToAffectForDateQuery } from './queries/returns-to-affect-for-date/returns-to-affect-for-date.route';
import { faresForDateQuery } from './queries/fares-for-date/fares-for-date.route';

const server: FastifyInstance = fastify();

closeGracefullyOnSignalInterrupt({ server, nodeProcess: process });

// eslint-disable-next-line @typescript-eslint/no-floating-promises
server.register(postgres, {
  connectionString: process.env['DATABASE_URL'] ?? ''
});

server.get('/', async (_request: FastifyRequest, _reply: FastifyReply): Promise<string> => 'OK\n');

server.get('/health', async (_request: FastifyRequest, _reply: FastifyReply): Promise<string> => 'OK\n');

/* eslint-disable @typescript-eslint/no-floating-promises */
server.register(databaseStatusQuery);
server.register(returnsToAffectForDateQuery, { database: server.pg });
server.register(faresForDateQuery, { database: server.pg });
server.register(resetDatabaseCommand, { database: server.pg });
server.register(scheduleFareCommand, { database: server.pg });
server.register(affectReturnCommand, { database: server.pg });
server.register(predictRecurrenceCommand, {
  adapter: $openAIPredictRecurrence(process.env['API_KEY_OPENAI'] ?? '')
});
/* eslint-enable @typescript-eslint/no-floating-promises */

// eslint-disable-next-line @typescript-eslint/no-floating-promises
start({ server, nodeProcess: process });
