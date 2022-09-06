import {
  Router,
} from 'express';
import { xrpToDrops, AccountSetAsfFlags } from 'xrpl';
import { XummTypes } from 'xumm-sdk';
import jwt from 'jsonwebtoken';
import Sdk from '../xumm';
import { addClient, removeClient } from '../sseClients';
import { TokenPayload, UserPayload } from '../interfaces';
import { checkTrustline, getCoinReserve } from '../ripple';
import { auth } from '../middleware';
import { User } from '../models';

const router = Router();

interface TransactionPayload {
  success: boolean;
  error?: string;
  status: 'initial' | 'done' | 'error';
  url?: string;
}

router.post('/users/xumm-login', async (req, res) => {
  const payload = await Sdk.payload.create({
    TransactionType: 'SignIn',
  });

  console.log('payload created', payload);

  if (!payload) {
    return res.status(400).send('Something went wrong. Please try again');
  }

  return res.send({
    uuid: payload.uuid,
    authUrl: payload.next.always,
  });
});

router.get('/users/xumm-login/:txUuid', async (req, res) => {
  const { txUuid } = req.params;

  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  };

  res.writeHead(200, headers);

  res.write(`id: ${txUuid}\n`);
  const connectedMessage = {
    message: 'Added!',
  };

  res.write(`data: ${JSON.stringify(connectedMessage)}\n\n`);

  console.info(`Adding client ${txUuid}`);
  addClient({
    transactionUuid: txUuid,
    response: res,
  });

  req.on('close', () => {
    console.log(`${txUuid} client connection closed.`);
    removeClient(txUuid);
  });
});

router.get('/me', auth, async (req, res) => {
  // @ts-ignore
  const { user } = req;
  if (!user) return res.status(400).send('User not found');

  const userPayload: UserPayload = {
    account: user.account,
    hasPaidGate: user.hasPaidGate,
    token: user.token,
    hasStreamTrustline: await checkTrustline(user.account, process.env.STREAM_ADDRESS || ''),
  };

  return res.send(userPayload);
});

router.get('/users/pay-gate/:token', async (req, res) => {
  const { token } = req.params;

  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no',
  };

  res.writeHead(200, headers);

  const decoded = (jwt.verify(token, process.env.JWT_SECRET || '12345') as TokenPayload);

  // eslint-disable-next-line no-underscore-dangle
  const user = await User.findOne({ _id: decoded._id, token }).exec();

  if (!user) {
    const errorPayload: TransactionPayload = {
      success: false,
      error: 'Authentication failed',
      status: 'error',
    };

    res.write(`data: ${JSON.stringify(errorPayload)}\n\n`);
    res.end();
    return;
  }

  if (user.hasPaidGate) {
    const errorPayload: TransactionPayload = {
      success: false,
      error: 'You have already paid the gate fee.',
      status: 'error',
    };

    res.write(`data: ${JSON.stringify(errorPayload)}\n\n`);
    res.end();
    return;
  }

  const payloadBody: XummTypes.CreatePayload = {
    txjson: {
      TransactionType: 'Payment',
      Destination: process.env.CBOT_ADDRESS,
      Amount: xrpToDrops(0.1),
      Memos: [
        {
          Memo: {
            MemoData: Buffer.from('Amnis.Link Gate Fee', 'utf8').toString('hex').toUpperCase(),
          },
        },
      ],
    },
    user_token: user.xummToken,
  };

  const subscription = await Sdk.payload.createAndSubscribe(payloadBody, (event) => {
    if (event.data.signed === true) {
      const successPayload: TransactionPayload = {
        success: true,
        status: 'done',
      };

      user.hasPaidGate = true;
      // TODO: ensure no bug appears because of no await
      user.save();

      res.write(`data: ${JSON.stringify(successPayload)}\n\n`);
    }

    if (event.data.signed === false) {
      const errorPayload: TransactionPayload = {
        success: false,
        error: 'You have declined the payment.',
        status: 'error',
      };

      res.write(`data: ${JSON.stringify(errorPayload)}\n\n`);
    }
  });

  const payload = subscription.created;

  console.log('payload', payload);

  if (!payload) {
    const errorPayload: TransactionPayload = {
      success: false,
      error: 'Something went wrong. Please try again',
      status: 'error',
    };
    res.write(`data: ${JSON.stringify(errorPayload)}\n\n`);
  } else {
    res.write(`id: ${payload.uuid}\n`);

    const successPayload: TransactionPayload = {
      success: true,
      status: 'initial',
      url: payload.next.always,
    };

    res.write(`data: ${JSON.stringify(successPayload)}\n\n`);
  }

  req.on('close', () => {
    console.log(`${payload?.uuid} client connection closed.`);
  });
});

router.get('/users/open-trustline/:token', async (req, res) => {
  const { token } = req.params;

  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no',
  };

  res.writeHead(200, headers);

  const decoded = (jwt.verify(token, process.env.JWT_SECRET || '12345') as TokenPayload);

  // eslint-disable-next-line no-underscore-dangle
  const user = await User.findOne({ _id: decoded._id, token }).exec();

  if (!user) {
    const errorPayload: TransactionPayload = {
      success: false,
      error: 'Authentication failed',
      status: 'error',
    };

    res.write(`data: ${JSON.stringify(errorPayload)}\n\n`);
    res.end();
    return;
  }

  const hasStreamTrustline = await checkTrustline(user.account, process.env.STREAM_ADDRESS || '');
  if (hasStreamTrustline) {
    const errorPayload: TransactionPayload = {
      success: false,
      error: 'You already have the trustline.',
      status: 'error',
    };

    res.write(`data: ${JSON.stringify(errorPayload)}\n\n`);
    res.end();
    return;
  }

  const coinAddress = process.env.STREAM_ADDRESS || '';
  const coinCurrencyCode = '53545245414D0000000000000000000000000000';

  const payloadBody: XummTypes.CreatePayload = {
    user_token: user.xummToken,
    txjson: {
      TransactionType: 'TrustSet',
      Account: user.account,
      Flags: '131072',
      LimitAmount: {
        issuer: coinAddress,
        currency: coinCurrencyCode,
        value: '999990000',
      },
    },
  };

  const subscription = await Sdk.payload.createAndSubscribe(payloadBody, (event) => {
    if (event.data.signed === true) {
      const successPayload: TransactionPayload = {
        success: true,
        status: 'done',
      };

      res.write(`data: ${JSON.stringify(successPayload)}\n\n`);
    }

    if (event.data.signed === false) {
      const errorPayload: TransactionPayload = {
        success: false,
        error: 'You have declined the signing.',
        status: 'error',
      };

      res.write(`data: ${JSON.stringify(errorPayload)}\n\n`);
    }
  });

  const payload = subscription.created;
  console.log('payload', payload);

  if (!payload) {
    const errorPayload: TransactionPayload = {
      success: false,
      error: 'Something went wrong. Please try again',
      status: 'error',
    };
    res.write(`data: ${JSON.stringify(errorPayload)}\n\n`);
  } else {
    res.write(`id: ${payload.uuid}\n`);

    const successPayload: TransactionPayload = {
      success: true,
      status: 'initial',
      url: payload.next.always,
    };

    res.write(`data: ${JSON.stringify(successPayload)}\n\n`);
  }

  req.on('close', () => {
    console.log(`${payload?.uuid} client connection closed.`);
  });
});

// router.post('/users/login/:token', async (req, res) => {
//   /**
//    * https://gist.github.com/WietseWind/db05775b81d4f87c5d5bb17ab7707526
//    */
//   const { token } = req.params;
//   let user;
//   console.log('token', token);
//   if (process.env.ENFORCE_OTT === 'false') {
//     user = await User.findOne();
//   } else {
//     // const data = `${token}.${process.env.XUMM_API_SECRET}.4F918E2E-34ED-429B-AF6A-9E30F1012432`;
//     // const data = `${token}.${process.env.XUMM_API_SECRET}.DEE9EAC8-A455-4C1E-AC4F-8E49E40AA403`;
//     // const hash = crypto
//     //   .createHash('sha1')
//     //   .update(data.toUpperCase())
//     //   .digest('hex');
//
//     const xummResponse = await Sdk.xApp.get(token);
//     // const xummResponse = await Xumm.xApp.get(`${token}/${hash}`);
//
//     if (!xummResponse) return res.status(404).send('Something went wrong. Please try again');
//
//     const { user: xummId, account } = xummResponse;
//
//     if (!account) return res.status(404).send('Something went wrong. Please try again');
//
//     const kycStatus = await Sdk.getKycStatus(account);
//
//     if (kycStatus !== 'SUCCESSFUL') {
//       return res.status(404).send(
//         "KYC - False (Can't send tokens to anonymous wallets, re-open with your primary verified wallet)",
//       );
//     }
//
//     user = await User.findOrCreateWithXumm(xummId, account);
//   }
//
//   if (!user) return res.status(404).send('Something went wrong. Please try again');
//   const authToken = await user.generateAuthToken();
//
//   return res.send(
//     {
//       user: {
//         account: user.account,
//         // hasPaidGate: false,
//         hasPaidGate: user.hasPaidGate,
//         // hasStreamTrustline: true,
//         hasStreamTrustline: await checkTrustline(user.account, process.env.STREAM_ADDRESS || ''),
//       },
//       token: authToken,
//     },
//   );
// });

export default router;
