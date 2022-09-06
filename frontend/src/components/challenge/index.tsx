import React from "react";
import axios from "axios";
import cx from "classnames";
import { CheckCircleIcon } from "@heroicons/react/outline";
import { useMutation, useQueryClient } from "react-query";
import add from "date-fns/add";
import differenceInHours from 'date-fns/differenceInHours';
import { toast } from "react-toastify";

import { Status } from "constants/challenge-status";
import { Button } from "components/button";
import { API_ENDPOINT } from "env";
import { headers } from "api";
import styles from "./Challenge.module.css";
import { ChallengeType } from "../../interfaces";

type ChallengeProps = {
  id: string;
  title: string;
  reward: string;
  status: keyof typeof Status;
  type: ChallengeType,
  // eslint-disable-next-line no-unused-vars
  openModal: (cId: string) => void;
  frequency?: number | undefined;
  lastDate?: string | undefined;
};

function Challenge({
  id,
  title,
  reward,
  status,
  frequency,
  lastDate,
  type,
  openModal,
}: ChallengeProps) {
  const queryClient = useQueryClient();
  // @ts-ignore
  const { mutateAsync, isLoading } = useMutation(() => axios.post(`${API_ENDPOINT}/challenges/${id}/collect`, {}, headers()), {
    onSuccess: () => {
      toast("Challenge collected. It may take a couple of minutes before the funds arrive.");
      queryClient.refetchQueries(["challenges"]);
    },
    onError: (error) => {
      // @ts-ignore
      toast.error(error.response?.data || "Something went wrong. Please try again. Contact us if you still encounter issues");
      queryClient.refetchQueries(["challenges"]);
    },
  });

  const onCollectChallenge = async () => {
    try {
      const res = await mutateAsync();
      console.log("res", res);
    } catch (err) {
      console.error(err);
    }
  };

  let difference;

  if (status === Status.to_start && lastDate && frequency) {
    const nextAvailableTime = add(new Date(lastDate), {
      days: frequency,
    });

    difference = differenceInHours(nextAvailableTime, new Date());
  }

  return (
    <div className={styles.container}>
      <div
        className={cx(styles.title, {
          [styles.completed]: status === Status.completed,
        })}
      >
        {title}
      </div>
      <div className={styles.row}>
        {status === Status.completed && (
          <CheckCircleIcon className={styles.icon} />
        )}
        <div
          className={cx(styles.reward, {
            [styles.completed]: status === Status.completed,
          })}
        >
          {reward}
        </div>
      </div>
      {status === Status.to_start && difference && (
        <div className={styles.reward}>
          You have to wait
          {' '}
          {difference}
          {' '}
          more hours.
        </div>
      )}
      {status === Status.pending && (
        <div className={styles.collectButtonContainer}>
          <Button theme="default" size="sm" onClick={type === ChallengeType.FAUCET ? onCollectChallenge : () => openModal(id)} disabled={isLoading}>
            Collect
          </Button>
        </div>
      )}
    </div>
  );
}

export default Challenge;
