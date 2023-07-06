import { QueryResult } from 'pg';
import { chain as taskEitherChain, fold as taskEitherFold, map as taskEitherMap } from 'fp-ts/TaskEither';
import { Task } from 'fp-ts/Task';
import { pipe } from 'fp-ts/lib/function';
import { left as eitherLeft } from 'fp-ts/Either';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastify from 'fastify';
import postgres from '@fastify/postgres';
import { closeGracefullyOnSignalInterrupt, start } from './server.utils';
import { scheduleFares } from './commands/schedule-fare/schedule-fares';
import { persistFares, ScheduledFarePersistence, toFaresPersistence } from './commands/schedule-fare/schedule-fare.persistence';
import { scheduleFareValidation } from './commands/schedule-fare/schedule-fare.validation';
import { getDatabaseInfos, PgInfos } from './queries/database-status/database-status.query';
import HttpReporter, { Errors } from './reporter/HttpReporter';
import { isDateISO8601String } from './rules/DateISO8601.rule';
import { faresForTheDateQuery } from './queries/fares-for-date/fares-for-date.persistence';
import { resetDatabaseStructure } from './commands/database/reset-structure.persistence';
import { faresToScheduleForTheDateQuery } from './queries/fares-to-schedule-for-date/fares-to-schedule-for-date.persistence';
import { $affectReturnValidation } from './commands/schedule-return/affect-return.validation';
import { affectReturn } from './commands/schedule-return/affect-return';
import {
  persistFareAndDeleteToSchedule,
  toScheduledReturnPersistence
} from './commands/schedule-return/affect-return.persistence';
import {
  FareForDateRequest,
  FareToScheduleForDateRequest,
  FareToScheduleRequest,
  ReturnToAffectRequest
} from './routes/requests';
import { Entity } from './definitions/entity.definition';
import { FareReturnToSchedule, ScheduledFare } from './definitions/fares.definitions';
import { TaskEither } from 'fp-ts/lib/TaskEither';

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

server.post('/schedule-return', async (req: ReturnToAffectRequest, reply: FastifyReply): Promise<void> => {
  await pipe(
    req.body,
    $affectReturnValidation(server.pg),
    affectReturn,
    taskEitherMap(toScheduledReturnPersistence),
    taskEitherChain(
      (fareToPersist: ScheduledFarePersistence): TaskEither<Errors, QueryResult[]> =>
        persistFareAndDeleteToSchedule(server.pg)(fareToPersist, req.body.fareId)
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
  (fares: Entity<ScheduledFare>[]): Task<void> =>
  async (): Promise<void> =>
    reply.code(200).send(fares);

server.get('/fares-for-date/:date', async (req: FareForDateRequest, reply: FastifyReply): Promise<void> => {
  await pipe(
    isDateISO8601String.decode(req.params.date),
    faresForTheDateQuery(server.pg),
    taskEitherFold(onTaskWithErrors(reply), onTaskWithScheduledFaresResult(reply))
  )();
});

const onTaskWithFaresToScheduleResult =
  (reply: FastifyReply) =>
  (fares: Entity<FareReturnToSchedule>[]): Task<void> =>
  async (): Promise<void> =>
    reply.code(200).send(fares);
server.get(
  '/fares-to-schedule-for-date/:date',
  async (req: FareToScheduleForDateRequest, reply: FastifyReply): Promise<void> => {
    await pipe(
      isDateISO8601String.decode(req.params.date),
      faresToScheduleForTheDateQuery(server.pg),
      taskEitherFold(onTaskWithErrors(reply), onTaskWithFaresToScheduleResult(reply))
    )();
  }
);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
start({ server, nodeProcess: process });
