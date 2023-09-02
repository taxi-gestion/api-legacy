import { chain as taskEitherChain, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { Errors } from '../../../reporter/http-reporter';
import { pipe } from 'fp-ts/function';
import { onDependencyError } from '../../../errors/external-dependency.error';
import axios from 'axios';
import { Place } from '../../../definitions';
import { searchPlaceValidation } from './search-place.validation';

export const $googleMapsSearchPlace =
  (googleMapsApiKey: string) =>
  (search: string): TaskEither<Errors, Place[]> =>
    pipe($callToGoogleMapsPlacesApi(googleMapsApiKey)(search), taskEitherChain(searchPlaceValidation));

const $callToGoogleMapsPlacesApi =
  (googleMapsApiKey: string) =>
  (search: string): TaskEither<Errors, unknown> =>
    taskEitherTryCatch(
      // eslint-disable-next-line @typescript-eslint/return-await,@typescript-eslint/await-thenable
      async (): Promise<unknown> => await callToGoogleMapsPlacesApi(googleMapsApiKey)(search),
      (reason: unknown): Errors => onDependencyError('call to google maps places api error', reason)
    );

const callToGoogleMapsPlacesApi =
  (googleMapsApiKey: string) =>
  async (search: string): Promise<unknown> => {
    const response: axios.AxiosResponse<unknown> = await axios({
      method: 'get',
      url: `https://maps.googleapis.com/maps/api/place/textsearch/json
      ?query=${encodeURI(search)}
      &key=${googleMapsApiKey}
      &language=fr
      `.replace(/\s+/gu, ''),
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'application/json'
      },
      responseType: 'json'
    });
    return response.data;
  };
