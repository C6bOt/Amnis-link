# Amnis Link

## Front End
Front end is built with React and TypeScript, it uses Tailwind for css.

## Back End
Back End is built with NodeJs, TypeScript and MongoDB.

Each user has to pay a gateway fee of 2XRP in order to use the application, we track this information in a Users table where the unique field is the Ripple address.

Each challenge is saved as a document in the Challenges table, which can be configurable:
* Recurrent or one-time
* A fixed amount or a percentage based on user's holding
* A faucet or media type
  * For the faucet one, it accepts a list of URL segments with which will check whether the submitted link is valid or not.

### Payments
Each payment is also saved in a Payments table, to track the payment's status: `PENDING`, `COMPLETED` or `DECLINED`.

The declined reason is also stored in the table for debugging/monitoring purposes.

Payments are processed in a queue, one every minute, in `paymentProcessor.ts`. Before paying the reward, the validation checks are run again, to avoid paying double or paying when not all conditions are met.


### Authentication
The authentication process is:
* User requests the authentication which creates a [SSE](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
* Back End creates the Xumm payload and saves the client response mapped with the TransactionUUID.
* After the user authenticates via Xumm, the webhook request is hit. The BE sends a event message to the FE notifying that the client logged in successfully.

For opening the trustline or paying the gate fee, the process is very similar. As in a SSE is used in order to wait for the transaction to be completed.


### Admin
We use [AdminJS](https://adminjs.co/) to have an automatically generated admin dashboard through which we can add new challenges and also inspect all the payments created.
