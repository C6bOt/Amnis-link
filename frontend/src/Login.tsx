import React, { useState, useEffect, useRef } from 'react';
import axios from "axios";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";

import { Button } from "components/button";
import logo from "assets/images/logo.png";

import { API_ENDPOINT } from "./env";
import { useUserContext } from "./context/user-context";

import styles from './App.module.css';

export interface XummPayload {
  uuid: string;
  authUrl: string;
}

export default function Login() {
  const [xummPayload, setXummPayload] = useState<XummPayload | undefined>();
  const [isLoading, setLoading] = useState(false);
  const { user: loggedUser, saveToken } = useUserContext();

  const eventSource = useRef<EventSource | undefined>();

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (!loggedUser && !isLoading && xummPayload && !eventSource.current) {
      const events = new EventSource(`${API_ENDPOINT}/users/xumm-login/${xummPayload.uuid}`);

      eventSource.current = events;

      events.onmessage = (event) => {
        const parsedData = JSON.parse(event.data);

        if ("success" in parsedData) {
          const { token, success, error } = parsedData;

          if (!success) {
            toast.error(error || "Something went wrong. Please try again");
            return;
          }

          if (saveToken) {
            saveToken(token);
          }

          toast("Welcome to Amnis Connector!");
          events.close();
        }
      };

      events.onerror = (event) => {
        console.error("EventSource failed to connect: ", event);
        events.close();
      };

      events.onopen = (event) => {
        console.log("EventSource connected: ", event);
      };

      // return () => events.close();
    }
  }, [isLoading, xummPayload]);

  const onLogin = async () => {
    setLoading(true);

    try {
      const { data } = await axios.post<XummPayload>(`${API_ENDPOINT}/users/xumm-login`);

      setXummPayload(data);

      window.open(data.authUrl, "_blank");
    } finally {
      setLoading(false);
    }
  };

  if (loggedUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.login}>
      <p className={styles.link}>Amnis.Link</p>
      <p className={styles.description}>Connecting users to cross platform game point</p>
      <div className={styles.container}>
        <img className={styles.logo} src={logo} alt="Logo Amnis.Link" />
        <Button theme="default" onClick={onLogin} disabled={isLoading}>Login</Button>
      </div>
    </div>
  );
}
