import { Schema, model, Model } from 'mongoose';
import { IUser } from './user';

export enum ChallengeType {
  // eslint-disable-next-line no-unused-vars
  MEDIA = 'MEDIA',
  // eslint-disable-next-line no-unused-vars
  FAUCET = 'FAUCET'
}

export interface IChallenge {
    title: string;
    basedOnUserHolding: boolean;
    oneTime: boolean;
    frequency?: number;
    amount?: number;
    percentage?: number;
    active: boolean;
    transactionMessage?: string;
    mediaBased?: boolean;
    type: ChallengeType;
    urlSegments: string[];
    createdAt?: boolean | string;
    updatedAt?: boolean | string;
    // Methods
  // eslint-disable-next-line no-unused-vars
    getUserAmount(user: IUser): Promise<number>;
}

export interface ChallengeModel extends Model<IChallenge> {}

const ChallengeSchema = new Schema<IChallenge>({
  title: {
    type: String,
    required: true,
  },
  basedOnUserHolding: {
    type: Boolean,
    required: true,
  },
  // If oneTime = true, it will be like an AirDrop
  oneTime: {
    type: Boolean,
    default: false,
  },
  // When oneTime = false, the number of days between a user can collect again
  frequency: {
    type: Number,
  },
  // If basedOnUserHolding = false this will be the payment
  amount: {
    type: Number,
  },
  // When basedOnUserHolding = true, the coins the user will get will be computed as:
  //  user.getStreamBalance() * (percentage / 100)
  percentage: {
    // Should be between 1 and 100
    type: Number,
  },
  active: {
    type: Boolean,
    default: true,
  },
  transactionMessage: {
    type: String,
  },
  // When type = MEDIA, it means that the challenge is for a video
  // And we'll need to verify a tweet contains a video
  type: {
    type: String,
    enum: [ChallengeType.MEDIA, ChallengeType.FAUCET],
    default: ChallengeType.FAUCET,
  },
  // When type = MEDIA, this will be what we check the given URL against.
  urlSegments: {
    type: [String],
  },
}, {
  timestamps: true,
});

ChallengeSchema.method('getUserAmount', async function getUserAmount(user: IUser) {
  const challenge: IChallenge = this;
  let amount: number = 0;

  if (challenge.basedOnUserHolding && challenge.percentage) {
    const userBalance = await user.getStreamBalance();
    amount = userBalance * (challenge.percentage / 100);
  } else if (!challenge.basedOnUserHolding) {
    amount = challenge.amount || 0;
  }

  return amount;
});

const Challenge = model<IChallenge, ChallengeModel>('challenge', ChallengeSchema);

export default Challenge;
