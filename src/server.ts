/* eslint-disable max-lines */
import { QueryResult } from 'pg';
import { chain as taskEitherChain, fold as taskEitherFold, map as taskEitherMap } from 'fp-ts/TaskEither';
import { Task } from 'fp-ts/Task';
import { pipe } from 'fp-ts/lib/function';
import { left as eitherLeft, right as eitherRight } from 'fp-ts/Either';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastify from 'fastify';
import postgres from '@fastify/postgres';
import { closeGracefullyOnSignalInterrupt, start } from './server.utils';
import { scheduleFares } from './commands/schedule-fare/schedule-fares';
import { persistFares, toFaresPersistence } from './commands/schedule-fare/schedule-fare.persistence';
import { scheduleFareValidation } from './commands/schedule-fare/schedule-fare.validation';
import { getDatabaseInfos, PgInfos } from './queries/database-status/database-status.query';
import HttpReporter, { Errors } from './reporter/HttpReporter';
import { isDateISO8601String } from './rules/DateISO8601.rule';
import { faresForTheDateQuery } from './queries/fares-for-date/fares-for-date.persistence';
import { resetDatabaseStructure } from './commands/database/reset-structure.persistence';
import { returnsToAffectForTheDateQuery } from './queries/returns-to-affect-for-date/returns-to-affect-for-date.persistence';
import { $affectReturnValidation } from './commands/affect-return/affect-return.validation';
import { affectReturn } from './commands/affect-return/affect-return';
import {
  persistFareAndDeleteReturnToAffect,
  ScheduledReturnPersistence,
  toScheduledReturnPersistence
} from './commands/affect-return/affect-return.persistence';
import {
  FareForDateRequest,
  FareToScheduleRequest,
  ReturnsToAffectForDateRequest,
  ReturnToAffectRequest
} from './routes/requests';
import { Entity } from './definitions/entity.definition';
import { ReturnToAffect, Scheduled } from './definitions/fares.definitions';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import {ClientToAddRequest} from "./commands/add-client/add-client.definitions";
import {addClientValidation} from "./commands/add-client/add-client.validation";
import {persistClient, toClientPersistence} from "./commands/add-client/add-client.persistence";
import {ClientsByIdentityRequest, ClientsForFare} from "./queries/clients-by-identity/clients-by-identity.definitions";
import {clientsByIdentityQuery} from "./queries/clients-by-identity/clients-by-identity.persistence";

const server: FastifyInstance = fastify();

closeGracefullyOnSignalInterrupt({ server, nodeProcess: process });

// eslint-disable-next-line @typescript-eslint/no-floating-promises
server.register(postgres, {
  connectionString: process.env['DATABASE_URL'] ?? ''
});

server.get('/', async (_request: FastifyRequest, _reply: FastifyReply): Promise<string> => 'OK\n');

server.get('/health', async (_request: FastifyRequest, _reply: FastifyReply): Promise<string> => 'OK\n');

server.get('/database/status', async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const infos: Error | PgInfos = await getDatabaseInfos(server.pg)();
  await reply.send(infos);
});

server.get('/database/reset', async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  await pipe(resetDatabaseStructure(server.pg), taskEitherFold(onTaskWithErrors(reply), onTaskWithRawQueryResult(reply)))();
});

server.post('/schedule-fare', async (req: FareToScheduleRequest, reply: FastifyReply): Promise<void> => {
  await pipe(
    req.body,
    scheduleFareValidation,
    scheduleFares,
    toFaresPersistence,
    persistFares(server.pg),
    taskEitherFold(onTaskWithErrors(reply), onTaskWithRawQueriesResult(reply))
  )();
});

server.post('/affect-return', async (req: ReturnToAffectRequest, reply: FastifyReply): Promise<void> => {
  await pipe(
    req.body,
    $affectReturnValidation(server.pg),
    affectReturn,
    taskEitherMap(toScheduledReturnPersistence),
    taskEitherChain(
      (fareToPersist: ScheduledReturnPersistence): TaskEither<Errors, QueryResult[]> =>
        persistFareAndDeleteReturnToAffect(server.pg)(fareToPersist, req.body.fareId)
    ),
    taskEitherFold(onTaskWithErrors(reply), onTaskWithRawQueriesResult(reply))
  )();
});

const onTaskWithErrors =
  (reply: FastifyReply) =>
  (errors: Errors): Task<void> =>
  async (): Promise<void> =>
    reply.code(500).send(HttpReporter.report(eitherLeft(errors)));

const onTaskWithRawQueryResult =
  (reply: FastifyReply) =>
  (queryResult: QueryResult): Task<void> =>
  async (): Promise<void> =>
    reply.code(200).send(queryResult);

const onTaskWithRawQueriesResult =
  (reply: FastifyReply) =>
  (queryResult: QueryResult[]): Task<void> =>
  async (): Promise<void> =>
    reply.code(200).send(queryResult);

const onTaskWithScheduledFaresResult =
  (reply: FastifyReply) =>
  (fares: Entity<Scheduled>[]): Task<void> =>
  async (): Promise<void> =>
    reply.code(200).send(fares);

server.get('/fares-for-date/:date', async (req: FareForDateRequest, reply: FastifyReply): Promise<void> => {
  await pipe(
    isDateISO8601String.decode(req.params.date),
    faresForTheDateQuery(server.pg),
    taskEitherFold(onTaskWithErrors(reply), onTaskWithScheduledFaresResult(reply))
  )();
});

const onTaskWithReturnsToAffectResult =
  (reply: FastifyReply) =>
  (fares: Entity<ReturnToAffect>[]): Task<void> =>
  async (): Promise<void> =>
    reply.code(200).send(fares);

server.get(
  '/returns-to-affect-for-date/:date',
  async (req: ReturnsToAffectForDateRequest, reply: FastifyReply): Promise<void> => {
    await pipe(
      isDateISO8601String.decode(req.params.date),
      returnsToAffectForTheDateQuery(server.pg),
      taskEitherFold(onTaskWithErrors(reply), onTaskWithReturnsToAffectResult(reply))
    )();
  }
);

server.post('/add-client', async (req: ClientToAddRequest, reply: FastifyReply): Promise<void> => {
  await pipe(
    req.body,
    addClientValidation,
    toClientPersistence,
    persistClient(server.pg),
    taskEitherFold(onTaskWithErrors(reply), onTaskWithRawQueryResult(reply))
  )();
});

const onTaskWithClientsForFareResult =
  (reply: FastifyReply) =>
  (fares: ClientsForFare): Task<void> =>
  async (): Promise<void> =>
    reply.code(200).send(fares);
server.get('/clients-by-identity/:identity', async (req: ClientsByIdentityRequest, reply: FastifyReply): Promise<void> => {
  await pipe(
    eitherRight(req.params.identity),
    clientsByIdentityQuery(server.pg),
    taskEitherFold(onTaskWithErrors(reply), onTaskWithClientsForFareResult(reply))
  )();
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
start({ server, nodeProcess: process });
