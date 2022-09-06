import React, { useEffect } from "react";
import { useQueryClient, useQuery } from "react-query";
import { Modal, useModal } from "components/modal";
import Challenge from "components/challenge";

import logo from "assets/images/logo.png";
import axios from "axios";
import { toast } from "react-toastify";
import InputModal, { useInputModal } from "./components/inputModal";

import { IChallenge } from "./interfaces";
import { fetchChallenges } from "./queries";
import { useUserContext } from "./context/user-context";
import { usePayGate, useOpenTrustline } from "./helpers";

import styles from './App.module.css';
import { API_ENDPOINT } from "./env";
import { headers } from "./api";

function Main() {
  const {
    user, loading: userLoading, error, token,
  } = useUserContext();
  const queryClient = useQueryClient();

  // eslint-disable-next-line no-use-before-define
  const payGate = usePayGate({ token });
  const openTrustline = useOpenTrustline({ token });

  const {
    isLoading: challengesLoading, data: challenges, error: challengesError,
  } = useQuery<IChallenge[]>('challenges', fetchChallenges, {
    refetchOnWindowFocus: false,
    // @ts-ignore
    useErrorBoundary: (e) => e.response?.status >= 500,
    enabled: !!user?.account,
  });

  const {
    open, setOpen, onRequestClose, onSuccess,
  } = useModal({
    onSuccess: () => payGate({ onClose: onRequestClose }),
  });

  const {
    open: openTl, setOpen: setOpenTl, onRequestClose: onRequestTlClose, onSuccess: onTlSuccess,
  } = useModal({
    onSuccess: () => openTrustline({ onClose: onRequestTlClose }),
  });

  const { open: openInput, openWithChallengeId, onSuccess: onInputSuccess } = useInputModal({
    onSuccess: async (challengeId: string, url: string) => {
      try {
        // @ts-ignore
        await axios.post(`${API_ENDPOINT}/challenges/${challengeId}/collect`, { url }, headers());
      } catch (err) {
        // @ts-ignore
        toast.error(err.response?.data || "Something went wrong. Please try again. Contact us if you still encounter issues");
        // @ts-ignore
        if (err.response?.data && !err.response.data.includes("Challenge is misconfigured. Please try again later!")) {
          return false;
        }
      }
      await queryClient.invalidateQueries(["challenges"]);
      return true;
    },
  });

  useEffect(() => {
    if (!userLoading && !user?.hasStreamTrustline) {
      setOpenTl(true);
    }
    if (!userLoading && !user?.hasPaidGate) {
      setOpen(true);
    }
  }, [user, userLoading]);

  if (error || challengesError) {
    return <p>Something went wrong</p>;
  }

  if (userLoading || !user || challengesLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <p className={styles.link}>Amnis.Link</p>
          <img className={styles.logo} src={logo} alt="Logo Amnis.Link" />
        </div>
      </div>
      {!(challenges?.length || 0) && (
        <div className={styles.title}>No challenges to complete for now.</div>
      )}

      {!!challenges?.length && (
        <>
          <div className={styles.title}>Challenges to complete</div>

          {challenges?.map(({
            _id, title, reward, hasCollectedPayment, oneTime, frequency, lastPaymentCreatedAt, type,
          }: IChallenge) => {
            const completedStatus = oneTime ? "completed" : "to_start";
            const status = hasCollectedPayment ? completedStatus : "pending";
            const formattedReward = Number.isInteger(reward) ? reward : Number(reward).toFixed(3);
            return (
              <Challenge
                key={_id}
                id={_id}
                title={title}
                type={type}
                reward={`${formattedReward} STREAM`}
                status={status}
                frequency={frequency}
                lastDate={lastPaymentCreatedAt}
                openModal={openWithChallengeId}
              />
            );
          })}
        </>
      )}

      <Modal
        isOpen={open}
        onCloseModal={onRequestClose}
        onSuccess={onSuccess}
        allowClose={false}
        text={{
          title: "Payment Required",
          body: "You need to pay 2XRP in order to access the content",
          successButton: "Pay",
        }}
      />
      <Modal
        isOpen={openTl}
        onCloseModal={onRequestTlClose}
        onSuccess={onTlSuccess}
        allowClose={false}
        text={{
          title: "Stream TrustLine Required",
          body: "You need to have the Stream TrustLine opened before accessing this xApp.",
          successButton: "Open",
        }}
      />

      <InputModal isOpen={openInput} onSuccess={onInputSuccess} />
    </div>
  );
}

export default Main;
