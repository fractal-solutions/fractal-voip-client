import { SimulatedSoftphoneEngine } from "./SimulatedSoftphoneEngine";
import { SipJsSoftphoneEngine } from "./SipJsSoftphoneEngine";

export const createSoftphoneEngine = (backend, callbacks) => {
  if (backend === "sipjs") return new SipJsSoftphoneEngine(callbacks);
  return new SimulatedSoftphoneEngine(callbacks);
};
