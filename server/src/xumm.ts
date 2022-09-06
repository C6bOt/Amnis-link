import { XummSdk } from 'xumm-sdk';

const Sdk = new XummSdk(process.env.XUMM_API_KEY, process.env.XUMM_API_SECRET);

export default Sdk;
