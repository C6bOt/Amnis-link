import { Router } from 'express';

import Sdk from '../../xumm';
import { getClient } from '../../sseClients';
import { User } from '../../models';

const router = Router();

interface Payload {
  success: boolean;
  error?: string;
  token?: string;
}

router.post('/webhooks/xumm', async (req, res) => {
  console.log('Webhook payload: ', req.body);

  const { payloadResponse, userToken } = req.body;
  const {
    payload_uuidv4: transactionUuid, signed, user_token: hasUserToken,
  } = payloadResponse;

  if (!signed || !hasUserToken) return res.status(400).send();

  const {
    user_token: token, token_issued: tokenIssued, token_expiration: tokenExpiration,
  } = userToken;

  const client = getClient(transactionUuid);

  if (!client) {
    const error = `Client(transactionUuid=${transactionUuid}) not found.`;
    console.error(error);
    return res.status(400).send(error);
  }

  const payload = await Sdk.payload.get(transactionUuid);

  if (!payload) {
    const error = `Payload(uuid=${transactionUuid}) not found.`;

    console.error(error);

    client.response.write(JSON.stringify({
      success: false,
      error,
    }));

    return res.status(400).send(error);
  }

  const { response: { account } } = payload;

  if (!account) {
    const error = `Payload(uuid=${transactionUuid}) does not have an address.`;

    console.error(error);

    client.response.write(JSON.stringify({
      success: false,
      error,
    }));

    return res.status(400).send(error);
  }

  console.log('payload', payload);

  const user = await User.findOrCreateWithAccount(account);
  Object.assign(user, {
    xummToken: token,
    xummTokenIssued: tokenIssued,
    xummTokenExpiration: tokenExpiration,
  });
  // @ts-ignore
  await user.save();

  // if (process.env.ENFORCE_KYC) {
  //   const kycStatus = await user.getKycStatus();
  //   if (kycStatus !== 'SUCCESSFUL') {
  //     const error = "KYC - False (Can't send tokens to anonymous wallets, re-open with your primary verified wallet)";
  //
  //     console.error(error);
  //
  //     client.response.write(`data: ${JSON.stringify({
  //       success: false,
  //       error,
  //     })}\n\n`);
  //
  //     return res.send(error);
  //   }
  // }

  const authToken = await user.generateAuthToken();

  const responsePayload: Payload = {
    success: true,
    token: authToken,
  };

  console.log('responsePayload', responsePayload);

  client.response.write(`data: ${JSON.stringify(responsePayload)}\n\n`, (error) => {
    if (error) {
      console.error('Error sending the SSE: ', error);
    }
  });

  return res.send();
});

export default router;
