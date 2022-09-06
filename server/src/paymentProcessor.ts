import { Agenda } from 'agenda';
import {
  Client, Payment as PaymentRequest, Wallet, xrpToDrops,
} from 'xrpl';
import { Payment } from './models';
import { IPayment, PaymentStatus } from './models/payment';
import { getStreamReserves } from './ripple';

const mongoConnectionString = process.env.AGENDA_CONNECT_STRING || 'mongodb://127.0.0.1/agenda';

const agenda = new Agenda({ db: { address: mongoConnectionString } });

const createAndSaveTransaction = async (payment: IPayment, amount: number) => {
  const { challenge, user } = payment;

  const api = new Client(
    process.env.RIPPLE_SERVER || 'wss://s1.ripple.com',
  );

  // TS guard
  if (!process.env.PUBLIC_KEY || !process.env.PRIVATE_KEY) return;

  const wallet = new Wallet(process.env.PUBLIC_KEY, process.env.PRIVATE_KEY);

  const fee = xrpToDrops(0.01);
  const amountStr = (
    Number.isInteger(amount) ? amount.toString() : Number(amount).toFixed(3)
  );
  await api.connect();
  console.log('after connect');
  const request: PaymentRequest = {
    Account: process.env.CBOT_ADDRESS || '',
    Amount: {
      currency: '53545245414D0000000000000000000000000000',
      issuer: process.env.STREAM_ADDRESS || '',
      value: amountStr,
    },
    Destination: user.account,
    TransactionType: 'Payment',
    Fee: fee,
  };

  if (challenge.transactionMessage) {
    Object.assign(request, {
      Memos: [
        {
          Memo: {
            MemoType: Buffer.from('Note', 'utf8').toString('hex').toUpperCase(),
            MemoData: Buffer.from(challenge.transactionMessage, 'utf8').toString('hex').toUpperCase(),
          },
        },
      ],
    });
  }
  console.log('before submit', request);
  let submitResult;
  try {
    submitResult = await api.submitAndWait(request, { wallet });
  } catch (error) {
    console.error(error);
    // eslint-disable-next-line no-param-reassign
    payment.status = PaymentStatus.DECLINED;
    // @ts-ignore
    // eslint-disable-next-line no-param-reassign
    payment.declineReason = error;
    return;
  }
  console.log('submitResult', submitResult);

  const { meta } = submitResult.result;

  const transactionResult = typeof meta === 'string' ? false : meta?.TransactionResult === 'tesSUCCESS';

  if (!submitResult.result.validated || !transactionResult) {
    // eslint-disable-next-line no-param-reassign
    payment.status = PaymentStatus.DECLINED;
    // eslint-disable-next-line no-param-reassign
    payment.declineReason = `Something went wrong. The submission result is ${JSON.stringify(submitResult)}`;
  } else {
    // eslint-disable-next-line no-param-reassign
    payment.status = PaymentStatus.COMPLETED;
    // eslint-disable-next-line no-param-reassign
    payment.completedAt = new Date();
  }
  // @ts-ignore
  // eslint-disable-next-line no-param-reassign
  payment.preSignedTransaction = JSON.stringify(request);
  // @ts-ignore
  // eslint-disable-next-line no-param-reassign
  payment.signedTransaction = JSON.stringify(submitResult);
};

agenda.define('process payments', {
  concurrency: 2,
}, async () => {
  const payment = await Payment.find({
    status: PaymentStatus.PENDING,
  })
    .populate('user')
    .populate('challenge')
    .sort('createdAt')
    .findOne();

  if (!payment) return;
  console.log('Processing payment', payment);

  const { challenge, user } = payment;

  const streamReserve = await getStreamReserves();
  const challengeAmount = await challenge.getUserAmount(user);

  // Check that we have enough reserve to send the payment
  if (Number(streamReserve) < challengeAmount) {
    payment.status = PaymentStatus.DECLINED;
    payment.declineReason = 'Reserve is too low.';

    challenge.active = false;

    await Promise.all([
      payment.save(),
      // @ts-ignore
      challenge.save(),
    ]);
    return;
  }
  // Check that we haven't already paid for this
  const paymentExists = !await Payment.validateForChallengeAndUser(
    challenge,
    user,
    [PaymentStatus.COMPLETED],
  );

  if (paymentExists) {
    payment.status = PaymentStatus.DECLINED;
    payment.declineReason = 'Payment for this user already sent.';
  } else {
    // await createAndSaveTransaction(payment, 1);
    await createAndSaveTransaction(payment, challengeAmount);
  }

  await payment.save();
});

(async function Runner() {
  console.log('Runner started');
  await agenda.start();

  await agenda.every('*/1 * * * *', 'process payments');
}());
