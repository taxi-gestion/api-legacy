import { chain as taskEitherChain, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { Errors } from '../../../codecs';
import { pipe } from 'fp-ts/function';
import { onDependencyError } from '../../../errors';
import axios from 'axios';
import { Journey, JourneyEstimate } from '../../../definitions';
import { journeyEstimateValidation } from './estimate-journey.validation';
import { getUnixTime, parseISO } from 'date-fns';

export const $googleMapsEstimateJourney =
  (googleMapsApiKey: string) =>
  (journey: Journey): TaskEither<Errors, JourneyEstimate> =>
    pipe($callToGoogleMapsDistanceMatrixApi(googleMapsApiKey)(journey), taskEitherChain(journeyEstimateValidation));

const $callToGoogleMapsDistanceMatrixApi =
  (googleMapsApiKey: string) =>
  (journey: Journey): TaskEither<Errors, unknown> =>
    taskEitherTryCatch(
      // eslint-disable-next-line @typescript-eslint/return-await,@typescript-eslint/await-thenable
      async (): Promise<unknown> => await callToGoogleMapsDistanceMatrixApi(googleMapsApiKey)(journey),
      (reason: unknown): Errors => onDependencyError('call to googleMaps distance-matrix api error', reason)
    );

const callToGoogleMapsDistanceMatrixApi =
  (googleMapsApiKey: string) =>
  async (journey: Journey): Promise<unknown> => {
    const call: string = `https://maps.googleapis.com/maps/api/distancematrix/json
        ?units=metric
        &origins=${journey.origin.context}
        &destinations=${journey.destination.context}
        &departure_time=${nowLiteralOrLaterTimestampInSeconds(journey.departureTime)}
        &mode=driving&traffic_model=best_guess
        &key=${googleMapsApiKey}&language=fr
        `.replace(/\s+/gu, '');
    // eslint-disable-next-line no-console
    console.log('callToGoogleMapsDistanceMatrixApi', call);
    const response: axios.AxiosResponse<unknown> = await axios({
      method: 'get',
      url: call,
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'application/json'
      },
      responseType: 'json'
    });

    return response.data;
  };

const nowLiteralOrLaterTimestampInSeconds = (departureTime: string): number | 'now' => {
  const datetimeTimeStamp: number = getUnixTime(parseISO(departureTime));
  return Math.round(Date.now() * 0.001) > datetimeTimeStamp ? 'now' : datetimeTimeStamp;
};
