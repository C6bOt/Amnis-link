import AdminBro from 'admin-bro';
import AdminBroExpress from '@admin-bro/express';
import AdminBroMongoose from '@admin-bro/mongoose';

import { Challenge, Payment, User } from '../models';

AdminBro.registerAdapter(AdminBroMongoose);

const ADMIN = {
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
};

// https://adminbro.com/tutorial-customizing-resources.html
export const adminBro = new AdminBro({
  resources: [
    {
      resource: Challenge,
    },
    {
      resource: Payment,
    },
    {
      resource: User,
      options: {
        editProperties: ['account', 'token', 'hasPaidGate'],
      },
    },
  ],
  rootPath: '/admin',
});

const adminRouter = AdminBroExpress.buildAuthenticatedRouter(
  adminBro,
  {
    authenticate: async (email, password) => {
      if (ADMIN.password === password && ADMIN.email === email) {
        return ADMIN;
      }
      return null;
    },
    cookieName: 'adminbro',
    cookiePassword: 'somePassword',
  },
  null,
  {
    saveUninitialized: false,
    resave: true,
    preventAssignment: true,
  },
);

export default adminRouter;
