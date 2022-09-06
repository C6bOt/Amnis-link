import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

// eslint-disable-next-line
import { UserRoutes, ChallengeRoutes, XummWebhookRouter } from './routes';
// eslint-disable-next-line
import AdminRouter, { adminBro } from './routes/admin';
// eslint-disable-next-line
import { User } from './models';

// eslint-disable-next-line
import './db';

// eslint-disable-next-line
import './paymentProcessor';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(adminBro.options.rootPath, AdminRouter);
app.use(process.env.API_PREFIX || '', ChallengeRoutes);
app.use(process.env.API_PREFIX || '', UserRoutes);
app.use(process.env.API_PREFIX || '', XummWebhookRouter);

app.listen(port, async () => {
  if (await User.find({}).count() === 0) {
    await User.create({
      xummId: 'test',
      account: process.env.DUMMY_XRP_ADDRESS,
      hasPaidGate: true,
    });
  }
  console.log(`Server running on port ${port}.`);
});
