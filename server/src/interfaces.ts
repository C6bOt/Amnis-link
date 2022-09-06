export interface TokenPayload {
    _id: string;
    account: string;
    xummToken: string;
}

export interface UserPayload {
    account: string;
    token: string;
    hasPaidGate: boolean;
    hasStreamTrustline: boolean;
}
