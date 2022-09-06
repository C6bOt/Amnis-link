import { toast } from "react-toastify";
import { API_ENDPOINT } from "./env";

type TransactionStatus = "initial" | "done" | "error";

interface TransactionProps {
  token?: string | null;
}

interface PayGateProps extends TransactionProps {
}

interface OpenTrustlineProps extends TransactionProps {}

interface PayGateFnProps {
  onClose: () => void;
}

export function useOpenTrustline({ token }: OpenTrustlineProps) {
  const openTrustline = ({ onClose }: PayGateFnProps) => {
    try {
      const openTrustlineEvent = new EventSource(`${API_ENDPOINT}/users/open-trustline/${token}`);

      openTrustlineEvent.onmessage = (event) => {
        console.log("message", event);
        const parsedData = JSON.parse(event.data);

        if ("success" in parsedData) {
          const { success, error: eventError, url } = parsedData;
          const { status }: { status: TransactionStatus} = parsedData;

          if (!success) {
            toast.error(eventError || "Something went wrong. Please try again");
            openTrustlineEvent.close();
            return;
          }

          if (status === "initial") {
            window.open(url, "_blank");
          } else {
            onClose();
            openTrustlineEvent.close();
          }
        }
      };

      openTrustlineEvent.onerror = (event) => {
        console.error("EventSource failed to connect: ", event);
        openTrustlineEvent.close();
      };

      openTrustlineEvent.onopen = (event) => {
        console.log("EventSource connected: ", event);
      };
    } catch (e) {
      // @ts-ignore
      toast.error(e.message || "Something went wrong. Please try again");
    }
    return false;
  };

  return openTrustline;
}

export function usePayGate({ token }: PayGateProps) {
  const payGate = ({ onClose }: PayGateFnProps) => {
    try {
      const payGateEvent = new EventSource(`${API_ENDPOINT}/users/pay-gate/${token}`);

      payGateEvent.onmessage = (event) => {
        console.log("message", event);
        const parsedData = JSON.parse(event.data);

        if ("success" in parsedData) {
          const { success, error: eventError, url } = parsedData;
          const { status }: { status: TransactionStatus} = parsedData;

          if (!success) {
            toast.error(eventError || "Something went wrong. Please try again");
            payGateEvent.close();
            return;
          }

          if (status === "initial") {
            window.open(url, "_blank");
          } else {
            onClose();
            payGateEvent.close();
          }
        }
      };

      payGateEvent.onerror = (event) => {
        console.error("EventSource failed to connect: ", event);
        payGateEvent.close();
      };

      payGateEvent.onopen = (event) => {
        console.log("EventSource connected: ", event);
      };
    } catch (e) {
    // @ts-ignore
      toast.error(e.message || "Something went wrong. Please try again");
    }
    return false;
  };

  return payGate;
}
