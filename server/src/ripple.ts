import { Client } from 'xrpl';

const api = new Client(process.env.RIPPLE_SERVER || 'wss://s1.ripple.com');

const getAccountTrustLine = async (account: string, currencyAddress: string) => {
  await api.connect();
  const { result: { lines } } = await api.request({
    command: 'account_lines',
    account,
    peer: currencyAddress,
  });

  return lines.find((l) => l.account === currencyAddress);
};

// This is for checking whether an account
// has a trustline for a specific token(the currencyAddress)
// eslint-disable-next-line max-len
export const checkTrustline = async (account: string, currencyAddress: string) => !!await getAccountTrustLine(account, currencyAddress);

export const getAccountBalance = async (account: string, currencyAddress: string) => {
  // This is for checking how much of a coin an account holds.
  // For example: how much STREAM Cbot's account holds
  const line = await getAccountTrustLine(account, currencyAddress) || { balance: 0 };

  return line.balance;
};

export const getStreamReserves = () => {
  const cbotStreamAccount = process.env.CBOT_ADDRESS || 'rJ6XcrmbqTErJJxhVxe4ZD3n9HXtEFTLfm';
  const streamAddress = process.env.STREAM_ADDRESS || 'rE3BGaHdGfMYF5kXsWkkiV7DUyr7aRXKGF';
  return getAccountBalance(cbotStreamAccount, streamAddress);
};

export const getCoinReserve = async (coinAddress: string, coinCurrencyCode: string) => {
  await api.connect();

  const { result: { obligations } } = await api.request({
    command: 'gateway_balances',
    account: coinAddress,
    ledger_index: 'validated',
  });

  return obligations ? obligations[coinCurrencyCode.toUpperCase()] : 0;
};
