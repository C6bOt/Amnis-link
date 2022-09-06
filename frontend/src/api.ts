import { JWT_TOKEN } from './env';

// eslint-disable-next-line import/prefer-default-export
export const headers = (getJwt: boolean = false) => {
  if (getJwt) return { headers: { } };
  // if (getJwt) return { headers: { 'x-api-key': XAPP_API_KEY } };

  return {
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem(JWT_TOKEN)}`,
      // 'x-api-key': XAPP_API_KEY,
    },
  };
};
