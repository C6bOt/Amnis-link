import { connect } from 'mongoose';

connect(process.env.DB_CONNECT_STRING || '', {
  autoIndex: false,
});
