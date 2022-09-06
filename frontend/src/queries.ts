import axios from "axios";
import { API_ENDPOINT, JWT_TOKEN } from "./env";
import { headers } from "./api";
import { IChallenge, IUser } from "./interfaces";

export const fetchUser = async () => {
  const query = new URLSearchParams(window.location.search);
  const ottToken = query.get('xAppToken');

  if (!ottToken) throw new Error("No ottToken!");

  const { data } = await axios.post(
    `${API_ENDPOINT}/users/login/${ottToken}`,
    {},
    // @ts-ignore
    headers(true),
  );

  sessionStorage.setItem(JWT_TOKEN, data.token);

  return (data.user as IUser);
};

export const fetchChallenges = async () => {
  // @ts-ignore
  const { data } = await axios.get(`${API_ENDPOINT}/challenges`, headers());

  return (data.challenges as IChallenge[]);
};
