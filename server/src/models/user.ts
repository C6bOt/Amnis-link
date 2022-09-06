import { Schema, model, Model } from 'mongoose';
import jwt from 'jsonwebtoken';
import { PossibleKycStatuses } from 'xumm-sdk/dist/src/types';

import Sdk from '../xumm';
import { TokenPayload } from '../interfaces';
import { getAccountBalance } from '../ripple';

const jwtSecret = process.env.JWT_SECRET || '12345';

export interface IUser {
    account: string;
    token?: string;
    xummToken?: string;
    xummTokenIssued?: number;
    xummTokenExpiration?: number;
    // This is for checking whether the user has paid the 2XRP sign up fee or not
    hasPaidGate: boolean;
    createdAt?: boolean | string;
    updatedAt?: boolean | string;
    // Methods
    generateAuthToken(): Promise<string>;
    getStreamBalance(): Promise<number>;
    getKycStatus(): Promise<keyof PossibleKycStatuses>;
}

export interface UserModel extends Model<IUser> {
    // eslint-disable-next-line no-unused-vars
    findOrCreateWithAccount(account: string): Promise<IUser>;
    // eslint-disable-next-line no-unused-vars
    findByAccount(account: string): Promise<IUser>
    // eslint-disable-next-line no-unused-vars
    findByToken(token: string): Promise<IUser>
}

const UserSchema = new Schema<IUser>({
  account: {
    type: String,
    required: true,
  },
  token: {
    type: String,
  },
  xummToken: {
    type: String,
  },
  xummTokenIssued: {
    type: Number,
  },
  xummTokenExpiration: {
    type: Number,
  },
  hasPaidGate: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

UserSchema.method('generateAuthToken', async function generateAuthToken() {
  const user = this;
  const tokenPayload: TokenPayload = {
    // eslint-disable-next-line no-underscore-dangle
    _id: user._id.toString(),
    account: user.account,
    xummToken: user.xummToken,
  };

  const token = jwt.sign(tokenPayload, jwtSecret);

  user.token = token;

  await user.save();

  return token;
});

UserSchema.method('getStreamBalance', async function getStreamBalance() {
  const user: IUser = this;
  const streamAddress = process.env.STREAM_ADDRESS || 'rE3BGaHdGfMYF5kXsWkkiV7DUyr7aRXKGF';
  return Number(await getAccountBalance(user.account, streamAddress));
});

UserSchema.method('getKycStatus', function getKycStatus() {
  const user: IUser = this;

  return Sdk.getKycStatus(user.account);
});

UserSchema.statics.findByAccount = async function findByAccount(account) {
  return this.findOne({ account });
};

UserSchema.statics.findOrCreateWithAccount = async function findOrCreateWithAccount(account) {
  // Checks if there exists a user with a certain account
  // Creates one otherwise
  let user = await this.findOne({ account });

  if (!user) {
    // eslint-disable-next-line no-use-before-define
    user = new User({ account });
    await user.save();
  }

  return user;
};

const User = model<IUser, UserModel>('user', UserSchema);

export default User;
