import React, { useCallback, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import styles from "./InputModal.module.css";
import { Button } from "../button";

type ModalProps = {
  isOpen: boolean;
  // eslint-disable-next-line no-unused-vars
  onSuccess: (tweet: string) => void;
}

export default function InputModal({
  isOpen, onSuccess,
}: ModalProps) {
  const [tweetUrl, setTweetUrl] = useState('');

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className={styles.dialog} onClose={() => {}}>
        <div className={styles.container}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>

          {/* Actual body of the modal */}
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className={styles.modalContainer}>
              <Dialog.Title className={styles.title}>
                Enter the URL.
              </Dialog.Title>

              <div className={styles.sectionContainer}>
                <div className={styles.sectionTitle}>
                  <input
                    className={styles.sectionTitleInput}
                    placeholder="Your URL"
                    value={tweetUrl}
                    onChange={(e) => setTweetUrl(e.target.value)}
                  />
                </div>

                <div className={styles.sections}>
                  <Button theme="default" className={styles.sectionButton} onClick={() => onSuccess(tweetUrl)}>
                    Collect Challenge
                  </Button>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

export interface UseModalOptions {
  initialOpen?: boolean;
  // eslint-disable-next-line no-unused-vars
  onSuccess: (challengeId: string, tweet: string) => Promise<boolean> | boolean;
  onClose?: () => void;
}

export function useInputModal({
  initialOpen,
  onClose,
  onSuccess,
}: UseModalOptions) {
  const [open, setOpen] = useState(!!initialOpen);
  const [challengeId, setChallengeId] = useState('');

  const onRequestClose = () => {
    setOpen(false);
    setTimeout(() => {
      onClose?.();
    }, 500);
  };

  const openWithChallengeId = (cId: string) => {
    setOpen(true);
    setChallengeId(cId);
  };

  const onSuccessWithClose = useCallback(async (tweet: string) => {
    const success = await onSuccess(challengeId, tweet);
    if (!success) return;
    onRequestClose();
  }, [onSuccess, onRequestClose]);

  return {
    open,
    setOpen,
    challengeId,
    setChallengeId,
    onRequestClose,
    onSuccess: onSuccessWithClose,
    openWithChallengeId,
  };
}
