import { Dialog, Transition } from "@headlessui/react";
import { Button } from "components/button";
import React, { useCallback, useState } from "react";
import styles from "./Modal.module.css";

interface TextData {
  title: string;
  body: string;
  successButton: string;
}

type ModalProps = {
  isOpen: boolean;
  onCloseModal: () => void;
  onSuccess: () => void;
  allowClose?: boolean;
  text: TextData;
};

export function Modal({
  isOpen,
  onCloseModal,
  onSuccess,
  text,
  allowClose = true,
}: ModalProps) {
  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className={styles.dialog} onClose={allowClose ? onCloseModal : () => {}}>
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
                {text.title}
              </Dialog.Title>

              <div className={styles.sectionContainer}>
                <div className={styles.sectionTitle}>
                  {text.body}
                </div>

                <div className={styles.sections}>
                  {allowClose && (
                  <Button theme="gray" className={styles.sectionButton} onClick={onCloseModal}>
                    Close
                  </Button>
                  )}
                  <Button theme="default" className={styles.sectionButton} onClick={onSuccess}>
                    {text.successButton}
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
  onSuccess: () => Promise<boolean> | boolean;
  onClose?: () => void;
}

export function useModal({
  initialOpen,
  onClose,
  onSuccess,
}: UseModalOptions) {
  const [open, setOpen] = useState(!!initialOpen);

  const onRequestClose = () => {
    setOpen(false);
    setTimeout(() => {
      onClose?.();
    }, 500);
  };

  const onSuccessWithClose = useCallback(async () => {
    const success = await onSuccess();
    if (!success) return;
    onRequestClose();
  }, [onSuccess, onRequestClose]);

  return {
    open, setOpen, onRequestClose, onSuccess: onSuccessWithClose,
  };
}
