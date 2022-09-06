import React, {
  createContext, useEffect, useState, useMemo,
} from 'react';
import axios from 'axios';

import { API_ENDPOINT, JWT_TOKEN } from 'env';
import { headers } from 'api';
import { IUser } from "interfaces";

export interface IUserContext {
  token?: string | null;
  user?: IUser;
  loading: boolean;
  error?: unknown;
  setUser?: React.Dispatch<React.SetStateAction<IUser | undefined>>;
  // eslint-disable-next-line no-unused-vars
  saveToken?: (token: string) => void;
}

const defaultValues: IUserContext = {
  loading: true,
};

const UserContext = createContext<IUserContext>(defaultValues);

const UserProvider: React.FC = function ({ children }) {
  const [token, setToken] = useState<string | undefined | null>(
    () => sessionStorage.getItem(JWT_TOKEN),
  );
  const [user, setUser] = useState<IUser | undefined>(undefined);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const getUser = async () => {
      if (token) {
        try {
          setLoading(true);

          // @ts-ignore
          const { data } = await axios.get<IUser>(
            `${API_ENDPOINT}/me`,
            // @ts-ignore
            { ...headers() },
          );

          await setUser(data || null);
        } catch (e) {
          // eslint-disable-next-line no-use-before-define
          removeToken();
          // @ts-ignore
          if (e.response) {
            // @ts-ignore
            setError(e.response.data || 'Something went wrong');
          }
          console.error(e);
        }
      }

      setLoading(false);
    };

    getUser();
  }, [token]);

  const saveToken = (t: string) => {
    console.log("token set", t);
    sessionStorage.setItem(JWT_TOKEN, t);
    setToken(t);
  };

  const removeToken = () => {
    console.log("removeing token");
    setToken(undefined);
    sessionStorage.removeItem(JWT_TOKEN);
  };

  const contextValues = useMemo(() => ({
    token,
    user,
    error,
    loading,
    setUser,
    saveToken,
  }), [token, user, error, loading, setUser, saveToken]);

  return <UserContext.Provider value={contextValues}>{children}</UserContext.Provider>;
};

export { UserContext, UserProvider };
