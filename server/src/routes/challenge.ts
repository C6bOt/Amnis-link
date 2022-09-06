import { Router } from 'express';

import sub from 'date-fns/sub';
import { auth } from '../middleware';
import { Challenge, Payment } from '../models';
import { IUser } from '../models/user';
import { ChallengeType, IChallenge } from '../models/challenge';
import { getStreamReserves } from '../ripple';

const router = Router();

router.get('/challenges', auth, async (req, res) => {
  // TODO: add user related data
  // @ts-ignore
  const { user } = req;

  const challenges = await Challenge.find({ active: true });

  const formattedChallenges = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const challenge of challenges) {
    let payment;
    if (challenge.oneTime) {
      // eslint-disable-next-line no-await-in-loop
      payment = await Payment.findOne({
        user, challenge,
      });
    } else {
      // eslint-disable-next-line no-await-in-loop
      payment = await Payment.findOne({
        user,
        challenge,
        createdAt: {
          $gte: sub(new Date(), { days: challenge.frequency }),
        },
      });
    }

    // eslint-disable-next-line no-await-in-loop
    const amount = await challenge.getUserAmount(user);

    formattedChallenges.push({
      // eslint-disable-next-line no-underscore-dangle
      _id: challenge._id,
      title: challenge.title,
      reward: amount,
      type: challenge.type,
      hasCollectedPayment: Boolean(payment),
      oneTime: challenge.oneTime,
      frequency: challenge.frequency,
      lastPaymentCreatedAt: challenge.oneTime ? null : (payment && payment.createdAt),
    });
  }

  return res.send({
    challenges: formattedChallenges,
  });
});

router.post('/challenges/:challengeId/collect', auth, async (req, res) => {
  // @ts-ignore
  const { user }: {user: IUser} = req;
  const { challengeId } = req.params;
  const { url }: { url: string | null | undefined } = req.body;

  console.log('url', url);
  const challenge: IChallenge | null = await Challenge.findById(challengeId);

  if (!challenge) {
    return res.status(404).send('Challenge not found');
  }

  const isMediaChallenge = challenge.type === ChallengeType.MEDIA;
  if (isMediaChallenge && !url) {
    return res.status(404).send('URL required for this challenge');
  }

  const streamReserves = await getStreamReserves();
  const challengeAmount = await challenge.getUserAmount(user);

  if (Number(streamReserves) < challengeAmount) {
    return res.status(404).send('Stream reserve not enough. Please try again later.');
  }

  if (!await Payment.validateForChallengeAndUser(challenge, user)) {
    return res.status(404).send('Payment already processed.');
  }

  if (isMediaChallenge && url) {
    const { urlSegments } = challenge;
    // If for some reason the challenge is not set properly, turn it off
    if (urlSegments.length === 0) {
      challenge.active = false;
      // @ts-ignore
      await challenge.save();
      return res.status(404).send('Challenge is misconfigured. Please try again later!');
    }

    const missedSegments = urlSegments.filter((urlSegment) => !url.includes(urlSegment));
    console.log('missedSegments', missedSegments);
    if (missedSegments.length) {
      return res.status(404).send('URL is invalid!');
    }
  }

  const payment = new Payment({
    user,
    challenge,
    url,
  });
  await payment.save();
  return res.send('Payment added');
});

export default router;
