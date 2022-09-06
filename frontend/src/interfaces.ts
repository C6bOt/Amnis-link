export interface IUser {
    account: string;
    token?: string;
    // This is for checking whether the user has paid the 2XRP sign up fee or not
    hasPaidGate: boolean;
    hasStreamTrustline: boolean;
}

export enum ChallengeType {
    // eslint-disable-next-line no-unused-vars
    MEDIA = 'MEDIA',
    // eslint-disable-next-line no-unused-vars
    FAUCET = 'FAUCET'
}

export interface IChallenge {
    _id: string;
    title: string;
    reward: string;
    hasCollectedPayment: boolean;
    oneTime: boolean;
    frequency?: number;
    lastPaymentCreatedAt?: string;
    type: ChallengeType
}
