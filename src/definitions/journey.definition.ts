import { TaskEither } from 'fp-ts/TaskEither';
import { Errors } from '../reporter/HttpReporter';
import { Place } from './place.definition';

export type Journey = {
  origin: Place;
  destination: Place;
  departureTime: string;
};

export type JourneyEstimate = {
  durationInSeconds: number;
  distanceInMeters: number;
};

export type EstimateJourneyAdapter = (journey: Journey) => TaskEither<Errors, JourneyEstimate>;
