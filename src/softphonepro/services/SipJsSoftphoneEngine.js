export class SipJsSoftphoneEngine {
  mode = "sipjs";

  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.sip = null;
    this.userAgent = null;
    this.registerer = null;
    this.currentSession = null;
    this.pendingInvitation = null;
    this.activeProfile = null;
    this.registerPromise = null;
    this.diagnosticsStatus = "idle";
    this.remoteAudioElement = null;
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

  emitDiagnostics(status, detail = "") {
    this.diagnosticsStatus = status;
    this.callbacks.onDiagnosticsStatus?.({ status, detail });
  }

  setRemoteAudioElement(element) {
    this.remoteAudioElement = element || null;
  }

  attachRemoteMedia(session) {
    try {
      const peerConnection = session?.sessionDescriptionHandler?.peerConnection;
      if (!peerConnection || !this.remoteAudioElement) return;
      const remoteStream = new MediaStream();
      peerConnection.getReceivers().forEach(receiver => {
        if (receiver?.track) remoteStream.addTrack(receiver.track);
      });
      this.remoteAudioElement.srcObject = remoteStream;
      this.remoteAudioElement.autoplay = true;
      this.remoteAudioElement.playsInline = true;
      this.remoteAudioElement.play?.().catch(() => {});
    } catch (error) {
      this.callbacks.onError?.(String(error?.message || error));
    }
  }

  async ensureSip() {
    if (this.sip) return this.sip;
    try {
      this.sip = await import("sip.js");
      return this.sip;
    } catch {
      throw new Error("sip.js package is not installed. Run: bun add sip.js");
    }
  }

  async setupUserAgent(profile) {
    const sip = await this.ensureSip();
    if (!profile) throw new Error("No active SIP profile selected.");
    if (!profile.wsUrl) throw new Error("Missing WebSocket URL in SIP profile.");
    if (String(profile.wsUrl).includes("sip.example.com")) {
      throw new Error("Profile WebSocket URL is still placeholder (sip.example.com). Set your real WSS endpoint.");
    }
    if (!profile.username || !profile.domain) {
      throw new Error("Profile must include username and domain.");
    }

    if (this.userAgent && this.activeProfile?.id === profile?.id) return;
    await this.destroy();

    this.activeProfile = profile;
    const uri = sip.UserAgent.makeURI(`sip:${profile.username}@${profile.domain}`);
    if (!uri) throw new Error("Invalid SIP URI configuration.");

    this.userAgent = new sip.UserAgent({
      uri,
      transportOptions: {
        server: profile.wsUrl,
      },
      authorizationUsername: profile.username,
      authorizationPassword: profile.password,
      displayName: profile.displayName,
      delegate: {
        onInvite: invitation => {
          this.pendingInvitation = invitation;
          this.currentSession = invitation;
          this.callbacks.onIncomingCall?.({
            name: invitation.remoteIdentity?.displayName || "Incoming Caller",
            uri: invitation.remoteIdentity?.uri?.toString?.() || "sip:unknown@unknown",
          });

          invitation.stateChange.addListener(state => {
            if (state === sip.SessionState.Established) {
              this.attachRemoteMedia(invitation);
              this.emitCallState("connected");
            }
            if (state === sip.SessionState.Terminated) this.emitCallState("idle");
          });
        },
      },
    });

    this.emitDiagnostics("connecting", profile.wsUrl);
    await this.userAgent.start();
    this.registerer = new sip.Registerer(this.userAgent);
    this.registerer.stateChange.addListener(state => {
      if (state === sip.RegistererState.Registered) {
        this.emitRegistration("registered");
        this.emitDiagnostics("registered", profile?.wsUrl || "");
      } else if (state === sip.RegistererState.Unregistered || state === sip.RegistererState.Terminated) {
        this.emitRegistration("unregistered");
      }
    });
  }

  async register(profile) {
    if (this.registerPromise) return this.registerPromise;

    this.registerPromise = (async () => {
    try {
      this.emitRegistration("registering");
      await this.setupUserAgent(profile);
      if (!this.registerer) throw new Error("SIP registerer was not initialized.");
      await this.registerer.register();
      this.emitRegistration("registered");
      this.emitDiagnostics("registered", profile?.wsUrl || "");
      this.emitLog(`[${new Date().toLocaleTimeString()}] REGISTER ok`);
    } catch (error) {
      this.emitRegistration("unregistered");
      const message = String(error?.message || error);
      const lower = message.toLowerCase();
      if (lower.includes("websocket") || lower.includes("1006") || lower.includes("connecting")) {
        this.emitDiagnostics("ws_failed", message);
      } else if (lower.includes("tls") || lower.includes("certificate") || lower.includes("ssl")) {
        this.emitDiagnostics("tls_likely_issue", message);
      } else {
        this.emitDiagnostics("error", message);
      }
      this.callbacks.onError?.(String(error?.message || error));
    } finally {
      this.registerPromise = null;
    }
    })();

    return this.registerPromise;
  }

  async unregister() {
    try {
      await this.registerer?.unregister?.();
      this.emitRegistration("unregistered");
      this.emitDiagnostics("idle", "");
    } catch (error) {
      this.callbacks.onError?.(String(error?.message || error));
    }
  }

  async makeCall(target, options = { video: false }) {
    try {
      const sip = await this.ensureSip();
      if (!this.userAgent) throw new Error("SIP user agent not initialized. Register first.");

      const targetUri = sip.UserAgent.makeURI(target.startsWith("sip:") ? target : `sip:${target}`);
      if (!targetUri) throw new Error("Invalid target URI.");

      const inviter = new sip.Inviter(this.userAgent, targetUri, {
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: Boolean(options.video),
          },
        },
      });

      this.currentSession = inviter;
      this.emitCallState("dialing");
      inviter.stateChange.addListener(state => {
        if (state === sip.SessionState.Establishing) this.emitCallState("ringing");
        if (state === sip.SessionState.Established) {
          this.attachRemoteMedia(inviter);
          this.emitCallState("connected");
        }
        if (state === sip.SessionState.Terminated) this.emitCallState("idle");
      });

      await inviter.invite();
      this.emitLog(`[${new Date().toLocaleTimeString()}] INVITE ${target}`);
    } catch (error) {
      this.emitCallState("idle");
      this.callbacks.onError?.(String(error?.message || error));
    }
  }

  async hangup() {
    try {
      const session = this.currentSession;
      if (!session) {
        this.emitCallState("idle");
        return;
      }

      if (session.bye) await session.bye();
      else if (session.cancel) await session.cancel();
      else if (session.reject) await session.reject();

      this.emitCallState("idle");
      this.currentSession = null;
      this.pendingInvitation = null;
    } catch (error) {
      this.callbacks.onError?.(String(error?.message || error));
    }
  }

  async answerIncoming(options = { video: false }) {
    try {
      const invitation = this.pendingInvitation;
      if (!invitation) return;
      await invitation.accept({
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: Boolean(options.video),
          },
        },
      });
      this.currentSession = invitation;
      this.pendingInvitation = null;
      this.attachRemoteMedia(invitation);
      this.emitCallState("connected");
    } catch (error) {
      this.callbacks.onError?.(String(error?.message || error));
    }
  }

  async declineIncoming() {
    try {
      if (this.pendingInvitation?.reject) await this.pendingInvitation.reject();
      this.pendingInvitation = null;
      this.emitCallState("idle");
    } catch (error) {
      this.callbacks.onError?.(String(error?.message || error));
    }
  }

  simulateIncoming() {
    this.callbacks.onError?.("Incoming call simulation is only available in simulated backend mode.");
  }

  async destroy() {
    try {
      await this.registerer?.unregister?.();
      await this.userAgent?.stop?.();
    } catch {}
    this.registerer = null;
    this.userAgent = null;
    this.currentSession = null;
    this.pendingInvitation = null;
    this.registerPromise = null;
    if (this.remoteAudioElement) this.remoteAudioElement.srcObject = null;
    this.emitDiagnostics("idle", "");
  }
}
