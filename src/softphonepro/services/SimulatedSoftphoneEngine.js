export class SimulatedSoftphoneEngine {
  mode = "simulated";

  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.timers = [];
    this.pendingIncoming = null;
  }

  emitRegistration(status) {
    this.callbacks.onRegistrationStatus?.(status);
  }

  emitCallState(state) {
    this.callbacks.onCallState?.(state);
  }

  emitLog(message) {
    this.callbacks.onLog?.(message);
  }

  register(profile) {
    this.emitRegistration("registering");
    this.emitLog(`REGISTER sip:${profile?.domain || "server"} SIP/2.0`);
    const t = setTimeout(() => {
      this.emitRegistration("registered");
      this.emitLog("SIP/2.0 200 OK");
    }, 1800);
    this.timers.push(t);
  }

  unregister() {
    this.emitRegistration("unregistered");
  }

  makeCall(target) {
    this.emitCallState("dialing");
    const t1 = setTimeout(() => this.emitCallState("ringing"), 900);
    const t2 = setTimeout(() => this.emitCallState("connected"), 2600);
    this.timers.push(t1, t2);
    this.emitLog(`INVITE ${target} SIP/2.0`);
  }

  hangup() {
    this.emitCallState("idle");
    this.emitLog("BYE SIP/2.0");
  }

  simulateIncoming() {
    const names = ["Alice Johnson", "Bob Smith", "Charlie Brown", "Unknown"];
    const uris = ["sip:alice@fs.local", "sip:bob@fs.local", "sip:charlie@fs.local", "sip:+15559876543@carrier.net"];
    const idx = Math.floor(Math.random() * names.length);
    this.pendingIncoming = { name: names[idx], uri: uris[idx] };
    this.callbacks.onIncomingCall?.(this.pendingIncoming);
  }

  answerIncoming() {
    this.pendingIncoming = null;
    this.emitCallState("connected");
  }

  declineIncoming() {
    this.pendingIncoming = null;
    this.emitCallState("idle");
  }

  destroy() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }
}
