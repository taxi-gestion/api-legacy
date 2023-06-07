import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastify from 'fastify';
import postgres from '@fastify/postgres';
import { closeGracefullyOnSignalInterrupt, start } from './server.utils';
import type { PgInfos } from './database/database.reads';
import { getDatabaseInfos } from './database/database.reads';
import { addFareToPlanningGateway } from './actions/add-fare-to-planning/add-fare-to-planning.gateway';
import type { AddFareToPlanningRequest } from './actions/add-fare-to-planning/add-fare-to-planning.provider';
import { FareDraft, FareReady } from './actions/add-fare-to-planning/add-fare-to-planning.provider';
import { addFareToPlanningUseCase } from './actions/add-fare-to-planning/add-fare-to-planning.use-case';
import { addFareToPlanningPersist, toFarePg } from './actions/add-fare-to-planning/add-fare-to-planning.postgresql.adapter';
import type { QueryResult } from 'pg';

const server: FastifyInstance = fastify();

closeGracefullyOnSignalInterrupt({ server, nodeProcess: process });

// eslint-disable-next-line @typescript-eslint/no-floating-promises
server.register(postgres, {
  connectionString: process.env['DATABASE_URL'] ?? ''
});

server.get('/', async (_request: FastifyRequest, _reply: FastifyReply): Promise<string> => 'OK\n');

server.get('/health', async (_request: FastifyRequest, _reply: FastifyReply): Promise<string> => 'OK\n');

server.get('/database-status', async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const infos: Error | PgInfos = await getDatabaseInfos(server.pg)();
  await reply.send(infos);
});

server.post('/add-fare-to-planning', async (req: AddFareToPlanningRequest, reply: FastifyReply): Promise<void> => {
  const fareDraft: Error | FareDraft = addFareToPlanningGateway(req.body);
  if (!FareDraft.is(fareDraft)) return reply.send(fareDraft);

  const fareReady: Error | FareReady = addFareToPlanningUseCase(fareDraft);
  if (fareReady instanceof Error) return reply.send(fareReady);

  const inserted: Error | QueryResult = await addFareToPlanningPersist(server.pg)(toFarePg(fareReady));
  return inserted instanceof Error ? reply.send(inserted) : reply.send({ status: 'success' });
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
start({ server, nodeProcess: process });
