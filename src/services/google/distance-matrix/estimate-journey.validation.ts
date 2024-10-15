/* eslint-disable no-console */
import { pipe } from 'fp-ts/function';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { fromEither } from 'fp-ts/TaskEither';
import { chain as eitherChain, Either } from 'fp-ts/Either';
import {
  GoogleMapsDistanceMatrixElement,
  GoogleMapsDistanceMatrixResponse,
  googleMapsDistanceMatrixTransferCodec
} from './distance-matrix.codec';
import { JourneyEstimate } from '../../../definitions';
import { Errors, externalTypeCheckFor, journeyEstimateCodec } from '../../../codecs';
import { journeyEstimateRules } from '../../../codecs/domain-rules/journey-estimate.rules';

export const journeyEstimateValidation = (transfer: unknown): TaskEither<Errors, JourneyEstimate> =>
  pipe(
    transfer,
    externalTypeCheckFor<GoogleMapsDistanceMatrixResponse>(googleMapsDistanceMatrixTransferCodec),
    eitherChain(internalTypeCheckForJourneyEstimate),
    eitherChain(rulesCheckForJourneyEstimate),
    fromEither
  );

const internalTypeCheckForJourneyEstimate = (response: GoogleMapsDistanceMatrixResponse): Either<Errors, JourneyEstimate> => {
  console.log('GoogleMapsDistanceMatrixResponse', response);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return journeyEstimateCodec.decode(toJourneyEstimate(response.rows[0]!.elements[0]!));
};

const rulesCheckForJourneyEstimate = (estimate: JourneyEstimate): Either<Errors, JourneyEstimate> =>
  journeyEstimateRules.decode(estimate);

const toJourneyEstimate = (element: GoogleMapsDistanceMatrixElement): JourneyEstimate => ({
  distanceInMeters: element.distance.value,
  durationInSeconds: element.duration.value
});
