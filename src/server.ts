import { QueryResult } from 'pg';
import { fold as taskEitherFold } from 'fp-ts/TaskEither';
import { Task } from 'fp-ts/Task';
import { pipe } from 'fp-ts/lib/function';
import { left as eitherLeft } from 'fp-ts/Either';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastify from 'fastify';
import postgres from '@fastify/postgres';
import { closeGracefullyOnSignalInterrupt, start } from './server.utils';
import { scheduleFares } from './commands/schedule-fare/schedule-fares';
import type { FareToScheduleRequest, ScheduledFares } from './commands/schedule-fare/schedule-fare.definitions';
import { persistFares, toFaresPersistence } from './commands/schedule-fare/schedule-fare.persistence';
import { scheduleFareValidation } from './commands/schedule-fare/schedule-fare.validation';
import { getDatabaseInfos, PgInfos } from './queries/database-status/database-status.query';
import { FareForDateRequest } from './queries/fares-for-date/fares-for-date.provider';
import HttpReporter, { Errors } from './reporter/HttpReporter';
import { isDateISO8601String } from './rules/DateISO8601.rule';
import { faresForTheDateQuery } from './queries/fares-for-date/fares-for-date.persistence';
import { resetDatabaseStructure } from './commands/database/reset-structure.persistence';

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

server.post('/database/reset', async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  await pipe(resetDatabaseStructure(server.pg), taskEitherFold(onTaskWithErrors(reply), onTaskWithRawQueryResult(reply)))();
});

/*server.post('/faker/schedule-fare/:date', async (req: FakeFareForDateRequest, reply: FastifyReply): Promise<void> => {
  await pipe(
    isDateISO8601String.decode(req.params.date),
    eitherChain((date: string): Either<Errors, ScheduledFare> => eitherRight(generateScheduledFare(date))),
    toFaresPersistence,
    persistFares(server.pg),
    taskEitherFold(onTaskWithErrors(reply), onTaskWithRawQueryResult(reply))
  )();
});*/

/*server.post('/faker/schedule-fares/:date/:count', async (req: FakeFaresForDateRequest, reply: FastifyReply): Promise<void> => {
  for (let i: number = 0; i < (req.params.count ?? 10); i++) {
    // eslint-disable-next-line no-await-in-loop
    await server.inject({
      method: 'POST',
      url: `/faker/schedule-fare/${req.params.date}`
    });
  }

  await reply.send({ message: `Successfully faked fares.` });
});*/

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
  (fares: ScheduledFares): Task<void> =>
  async (): Promise<void> =>
    reply.code(200).send(fares);

server.get('/fares-for-date/:date', async (req: FareForDateRequest, reply: FastifyReply): Promise<void> => {
  await pipe(
    isDateISO8601String.decode(req.params.date),
    faresForTheDateQuery(server.pg),
    taskEitherFold(onTaskWithErrors(reply), onTaskWithScheduledFaresResult(reply))
  )();
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
start({ server, nodeProcess: process });
