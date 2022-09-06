import { XummJsonTransaction } from 'xumm-sdk/dist/src/types';
import * as dotenv from 'dotenv';
import { verifySignature } from 'verify-xrpl-signature';
// eslint-disable-next-line
import { Client } from "xrpl";
import { Client as TwitterClient } from 'twitter-api-sdk';
import Sdk from './xumm';

dotenv.config();

// const main = async () => {
//   const request: XummJsonTransaction = {
//     TransactionType: 'SignIn',
//   };
//
//   const subscription = await Sdk.payload.createAndSubscribe(request, (event) => {
//     // console.log('New payload event:', event.data);
//
//     if (event.data.signed === true) {
//       console.log('Woohoo! The sign request was signed :)');
//       return event.data;
//     }
//
//     if (event.data.signed === false) {
//       console.log('The sign request was rejected :(');
//       return false;
//     }
//   });
//
//   console.log(subscription);
//
//   // const payload = await Sdk.payload.create(request);
//   // console.log('payload', payload);
// };

// const main = async () => {
//   const api = new Client('wss://s1.ripple.com');
//   await api.connect();
//   const { result } = await api.request({
//     command: 'gateway_balances',
//     ledger_index: 'validated',
//     account: 'rE3BGaHdGfMYF5kXsWkkiV7DUyr7aRXKGF',
//   });
//
//   console.log('result', result);
// };

const main = async () => {
  const client = new TwitterClient('AAAAAAAAAAAAAAAAAAAAAMi8ewEAAAAALmQ9AI%2BvwRjRf8eS09fDNHEfvFo%3D0WwWUkLS5GM4NWT13itCIHonTGENvg08QVCAQJXc9PGpAtPJIo');

  const lookupTweetById = await client.tweets.findTweetById('1555567324840747010', {
    expansions: ['attachments.media_keys'],
    'media.fields': ['duration_ms', 'type', 'url'],
  });
  console.dir(lookupTweetById, {
    depth: null,
  });
};

main();
