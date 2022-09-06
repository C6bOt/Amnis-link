import { Schema, model, Model } from 'mongoose';
import sub from 'date-fns/sub';
import { IChallenge } from './challenge';
import { IUser } from './user';

export enum PaymentStatus {
  // eslint-disable-next-line no-unused-vars
  PENDING = 'PENDING',
  // eslint-disable-next-line no-unused-vars
  COMPLETED = 'COMPLETED',
  // eslint-disable-next-line no-unused-vars
  DECLINED = 'DECLINED'
}

export interface IPayment {
  challenge: IChallenge;
  user: IUser;
  status: PaymentStatus;
  amount?: number;
  url?: string;
  completedAt?: Date;
  preSignedTransaction?: Record<string, any>;
  signedTransaction?: Record<string, any>;
  declineReason?: string;
  createdAt?: boolean | string;
  updatedAt?: boolean | string;
}

export interface PaymentModel extends Model<IPayment> {
  // eslint-disable-next-line no-unused-vars, max-len
  validateForChallengeAndUser(challenge: IChallenge, user: IUser, statuses?: PaymentStatus[]): Promise<boolean>;
}

const PaymentSchema = new Schema<IPayment>({
  challenge: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'challenge',
  },
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'user',
  },
  url: {
    type: String,
  },
  status: {
    type: String,
    enum: [PaymentStatus.PENDING, PaymentStatus.COMPLETED, PaymentStatus.DECLINED],
    default: PaymentStatus.PENDING,
  },
  amount: {
    type: Number,
  },
  completedAt: {
    type: Date,
  },
  preSignedTransaction: {
    type: Object,
  },
  signedTransaction: {
    type: Object,
  },
  declineReason: {
    type: String,
  },
}, {
  timestamps: true,
});

PaymentSchema.static('validateForChallengeAndUser', async function validateForChallengeAndUser(challenge: IChallenge, user: IUser, statuses?: PaymentStatus[]) {
  /**
   * Returns true if the user can collect the challenge.
   * For now, just check if there already exists a payment for this (challenge, user)
   */

  const statusList = statuses || [PaymentStatus.PENDING, PaymentStatus.COMPLETED];
  if (challenge.oneTime) {
    const payment = await this.findOne({
      user,
      challenge,
      status: { $in: statusList },
    });

    return !payment;
  }

  const payment = await this.findOne({
    user,
    challenge,
    status: { $in: statusList },
    createdAt: {
      $gte: sub(new Date(), { days: challenge.frequency }),
      $lte: new Date(),
    },
  });

  return !payment;
});

const Payment = model<IPayment, PaymentModel>('payment', PaymentSchema);

export default Payment;
