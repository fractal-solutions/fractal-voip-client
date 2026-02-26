import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { defaultProfile, defaultSettings, sampleContacts } from "./lib/defaults";
import { playRingtone } from "./lib/audio";
import { loadData, saveData } from "./lib/storage";
import { generateId } from "./lib/utils";
import { createSoftphoneEngine } from "./services/createSoftphoneEngine";
import { DialpadView as DialpadViewModule } from "./views/DialpadView";
import { MessagesView as MessagesViewModule } from "./views/MessagesView";
import { HistoryView as HistoryViewModule } from "./views/HistoryView";
import { ContactsView as ContactsViewModule } from "./views/ContactsView";
import { VideoView as VideoViewModule } from "./views/VideoView";
import { ConferenceView as ConferenceViewModule } from "./views/ConferenceView";
import { SettingsView as SettingsViewModule } from "./views/SettingsView";
import { IncomingCallOverlay as IncomingCallOverlayModule } from "./views/IncomingCallOverlay";
import { Icon } from "./components/Icon";
import { Avatar, MobileNav, NavSidebar, StatusBar, Toggle } from "./components/Layout";
import { ToastProvider, useToast } from "./components/ToastProvider";

const h = React.createElement;

// ===== MAIN APP =====
function AppWrapper() {
  return h(ToastProvider, null, h(MainApp, null));
}

function MainApp() {
  const { addToast } = useToast();
  const [view, setView] = useState(loadData('active_view', 'dialpad'));
  const initProfiles = loadData('profiles', [defaultProfile]);
  const [profiles, setProfiles] = useState(initProfiles);
  const [activeProfileId, setActiveProfileId] = useState(loadData('active_profile', initProfiles[0]?.id || ''));
  const [contacts, setContacts] = useState(loadData('contacts', sampleContacts));
  const [history, setHistory] = useState(loadData('history', []));
  const [messages, setMessages] = useState(loadData('messages', {}));
  const [settings, setSettings] = useState({ ...defaultSettings, ...loadData('settings', {}) });
  const [regStatus, setRegStatus] = useState('unregistered');
  const [dialString, setDialString] = useState('');
  const [callState, setCallState] = useState('idle');
  const [callType, setCallType] = useState('voice');
  const [callTimer, setCallTimer] = useState(0);
  const [muted, setMuted] = useState(false);
  const [onHold, setOnHold] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [engineMode, setEngineMode] = useState(settings.sipBackend || "simulated");
  const [lastSipError, setLastSipError] = useState("");
  const [lastRegisterAt, setLastRegisterAt] = useState(null);
  const [diagStatus, setDiagStatus] = useState("idle");
  const [diagDetail, setDiagDetail] = useState("");
  const engineRef = useRef(null);

  const activeProfile = useMemo(() => profiles.find(p => p.id === activeProfileId), [profiles, activeProfileId]);
  const unreadMessages = useMemo(() =>
    Object.values(messages).reduce((c, msgs) => c + msgs.filter(m => m.from !== 'me' && !m.read).length, 0),
    [messages]
  );

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => { saveData('active_view', view); }, [view]);
  useEffect(() => { saveData('active_profile', activeProfileId); }, [activeProfileId]);

  useEffect(() => {
    const engine = createSoftphoneEngine(settings.sipBackend || "simulated", {
      onRegistrationStatus: status => {
        setRegStatus(status);
        if (status === "registered") setLastSipError("");
      },
      onIncomingCall: caller => {
        setIncomingCall(caller);
        playRingtone(5000);
        addToast(`Incoming call from ${caller?.name || "unknown"}`, "info");
      },
      onCallState: state => {
        setCallState(state);
        if (state === "connected") addToast("Call connected", "success");
      },
      onError: message => {
        setLastSipError(String(message));
        addToast(message, "error");
        if ((settings.sipBackend || "simulated") === "sipjs" && String(message).includes("sip.js package is not installed")) {
          setSettings(prev => {
            const updated = { ...prev, sipBackend: "simulated" };
            saveData("settings", updated);
            return updated;
          });
          addToast("Falling back to simulated backend.", "info");
        }
      },
      onDiagnosticsStatus: ({ status, detail }) => {
        setDiagStatus(status || "idle");
        setDiagDetail(detail || "");
      },
      onLog: () => {},
    });

    engineRef.current = engine;
    setEngineMode(engine.mode);

    return () => {
      engine.destroy?.();
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, [settings.sipBackend, addToast]);

  useEffect(() => {
    if (activeProfile?.registerOnStartup) {
      engineRef.current?.register?.(activeProfile);
    }
  }, [activeProfileId, activeProfile, engineMode]);

  const addHistory = useCallback((entry) => {
    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, 100);
      saveData('history', updated);
      return updated;
    });
  }, []);

  const requestRegister = useCallback((profileOverride) => {
    const profile = profileOverride || activeProfile;
    if (!profile) return;
    if (regStatus === "registering") return;
    setLastRegisterAt(new Date().toISOString());
    engineRef.current?.register?.(profile);
  }, [activeProfile, regStatus]);

  const requestUnregister = useCallback(() => {
    engineRef.current?.unregister?.();
  }, []);

  const simulateIncoming = useCallback(() => {
    engineRef.current?.simulateIncoming?.();
  }, []);

  const startOutboundCall = useCallback((target, type) => {
    if (!target) return;
    setCallType(type);
    setCallTimer(0);
    setMuted(false);
    setOnHold(false);
    addToast(`Calling ${target}...`, "info");
    engineRef.current?.makeCall?.(target, { video: type === "video" });
  }, [addToast]);

  const endActiveCall = useCallback(() => {
    engineRef.current?.hangup?.();
  }, []);

  const handleAnswerIncoming = useCallback((type) => {
    if (!incomingCall) return;
    const caller = incomingCall;
    setIncomingCall(null);
    setCallType(type);
    setDialString(caller.uri);
    setCallTimer(0);
    engineRef.current?.answerIncoming?.({ video: type === "video" });
    setView(type === 'video' ? 'video' : 'dialpad');
    addHistory({
      id: generateId(), direction: 'incoming', type,
      contact: caller.uri, contactName: caller.name,
      duration: 0, timestamp: new Date().toISOString(), missed: false
    });
    addToast(`Answered call from ${caller.name}`, 'success');
  }, [incomingCall, addHistory, addToast]);

  const handleDeclineIncoming = useCallback(() => {
    if (!incomingCall) return;
    const caller = incomingCall;
    setIncomingCall(null);
    engineRef.current?.declineIncoming?.();
    addHistory({
      id: generateId(), direction: 'incoming', type: 'voice',
      contact: caller.uri, contactName: caller.name,
      duration: 0, timestamp: new Date().toISOString(), missed: true
    });
    addToast('Call declined', 'info');
  }, [incomingCall, addHistory, addToast]);

  const renderView = () => {
    switch (view) {
      case 'dialpad':
        return h(DialpadViewModule, {
          Icon, Avatar,
          dialString, setDialString, callState, callType,
          callTimer, setCallTimer, addHistory, contacts, addToast, onStartCall: startOutboundCall, onEndCall: endActiveCall,
          muted, setMuted, onHold, setOnHold
        });
      case 'messages':
        return h(MessagesViewModule, { Icon, Avatar, messages, setMessages, contacts });
      case 'video':
        return h(VideoViewModule, { Icon, Avatar, addToast });
      case 'conference':
        return h(ConferenceViewModule, { Icon, Avatar, addToast });
      case 'history':
        return h(HistoryViewModule, { Icon, Avatar, history, setHistory, setDialString, setView });
      case 'contacts':
        return h(ContactsViewModule, { Icon, Avatar, contacts, setContacts, setDialString, setView, addToast });
      case 'settings':
        return h(SettingsViewModule, {
          Icon, Toggle,
          activeProfile,
          profiles, setProfiles, activeProfileId, setActiveProfileId,
          settings, setSettings, regStatus, addToast, simulateIncoming,
          onRequestRegister: requestRegister, onRequestUnregister: requestUnregister, activeBackend: engineMode,
          lastSipError, lastRegisterAt, diagStatus, diagDetail
        });
      default:
        return h(DialpadViewModule, {
          Icon, Avatar,
          dialString, setDialString, callState, callType,
          callTimer, setCallTimer, addHistory, contacts, addToast, onStartCall: startOutboundCall, onEndCall: endActiveCall,
          muted, setMuted, onHold, setOnHold
        });
    }
  };

  return h('div', {
    style: {
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--bg-primary)'
    }
  },
    incomingCall && h(IncomingCallOverlayModule, {
      Icon,
      caller: incomingCall,
      onAnswer: () => handleAnswerIncoming('voice'),
      onAnswerVideo: () => handleAnswerIncoming('video'),
      onDecline: handleDeclineIncoming,
      onIgnore: () => setIncomingCall(null)
    }),
    h(StatusBar, {
      regStatus, activeProfile, profiles,
      setActiveProfileId, setView
    }),
    h('div', { style: { flex: 1, display: 'flex', overflow: 'hidden' } },
      !isMobile && h(NavSidebar, { view, setView, unreadMessages }),
      h('div', {
        style: {
          flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          background: 'var(--bg-primary)'
        }
      }, renderView())
    ),
    isMobile && h(MobileNav, { view, setView, unreadMessages })
  );
}

export function SoftphoneApp() {
  return h(AppWrapper, null);
}


