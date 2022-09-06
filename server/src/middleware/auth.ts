import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

import { User } from '../models';
import { TokenPayload } from '../interfaces';

const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    if (!token) {
      throw new Error();
    }
    const decoded = (jwt.verify(token, process.env.JWT_SECRET || '12345') as TokenPayload);

    // eslint-disable-next-line no-underscore-dangle
    const user = await User.findOne({ _id: decoded._id, token }).exec();

    if (!user) {
      throw new Error();
    }

    Object.assign(req, { user, token });
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate' });
  }
};

export default auth;
