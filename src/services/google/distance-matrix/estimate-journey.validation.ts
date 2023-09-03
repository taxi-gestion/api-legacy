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
import { Errors } from '../../../reporter';
import { externalTypeCheckFor, journeyEstimateCodec } from '../../../codecs';
import { journeyEstimateRulesCodec } from '../../../rules';

export const journeyEstimateValidation = (transfer: unknown): TaskEither<Errors, JourneyEstimate> =>
  pipe(
    transfer,
    externalTypeCheckFor<GoogleMapsDistanceMatrixResponse>(googleMapsDistanceMatrixTransferCodec),
    eitherChain(internalTypeCheckForJourneyEstimate),
    eitherChain(rulesCheckForJourneyEstimate),
    fromEither
  );

const internalTypeCheckForJourneyEstimate = (response: GoogleMapsDistanceMatrixResponse): Either<Errors, JourneyEstimate> =>
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  journeyEstimateCodec.decode(toJourneyEstimate(response.rows[0]!.elements[0]!));

const rulesCheckForJourneyEstimate = (estimate: JourneyEstimate): Either<Errors, JourneyEstimate> =>
  journeyEstimateRulesCodec.decode(estimate);

const toJourneyEstimate = (element: GoogleMapsDistanceMatrixElement): JourneyEstimate => ({
  distanceInMeters: element.distance.value,
  durationInSeconds: element.duration.value
});
