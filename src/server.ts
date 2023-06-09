import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastify from 'fastify';
import postgres from '@fastify/postgres';
import { closeGracefullyOnSignalInterrupt, start } from './server.utils';
import type { PgInfos } from './database/database.reads';
import { getDatabaseInfos } from './database/database.reads';
import { addFareToPlanningGateway } from './actions/add-fare-to-planning/add-fare-to-planning.gateway';
import type { AddFareToPlanningRequest } from './actions/add-fare-to-planning/add-fare-to-planning.provider';
import { addFareToPlanningUseCase } from './actions/add-fare-to-planning/add-fare-to-planning.use-case';
import { left } from 'fp-ts/Either';
import { Errors } from 'io-ts';
import { pipe } from 'fp-ts/lib/function';
import { addFareToPlanningPersist, toFarePg } from './actions/add-fare-to-planning/add-fare-to-planning.postgresql.adapter';
import { fold as foldTaskEither } from 'fp-ts/TaskEither';
import { QueryResult } from 'pg';
import { Task } from 'fp-ts/Task';

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
  await pipe(
    addFareToPlanningGateway(req.body),
    addFareToPlanningUseCase,
    toFarePg,
    addFareToPlanningPersist(server.pg),
    foldTaskEither(
      (errors: Errors): Task<void> =>
        async (): Promise<void> =>
          reply.code(500).send(left(errors)),
      (queryResult: QueryResult): Task<void> =>
        async (): Promise<void> =>
          reply.code(200).send(queryResult)
    )
  )();
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
start({ server, nodeProcess: process });
