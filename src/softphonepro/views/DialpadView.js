import React, { useEffect, useMemo, useRef } from "react";
import { DIALPAD_LABELS, playDTMF } from "../lib/audio";
import { formatDuration, generateId } from "../lib/utils";

const h = React.createElement;

export function DialpadView({
  Icon,
  Avatar,
  dialString,
  setDialString,
  callState,
  callType,
  setCallTimer,
  callTimer,
  addHistory,
  contacts,
  addToast,
  muted,
  setMuted,
  onHold,
  setOnHold,
  onStartCall,
  onEndCall,
}) {
  const timerRef = useRef(null);
  const matchedContact = useMemo(() => contacts.find(c => c.sipUri === dialString || c.phone === dialString), [contacts, dialString]);

  const handleDial = key => {
    playDTMF(key);
    if (callState === "idle") setDialString(prev => prev + key);
  };

  const startCall = type => {
    if (!dialString) return;
    setCallTimer(0);
    onStartCall?.(dialString, type);
  };

  const endCall = () => {
    clearInterval(timerRef.current);
    const dur = callTimer;
    addHistory({
      id: generateId(),
      direction: "outgoing",
      type: callType || "voice",
      contact: dialString,
      contactName: matchedContact?.name || dialString,
      duration: dur,
      timestamp: new Date().toISOString(),
      missed: false,
    });
    onEndCall?.();
    setCallTimer(0);
    setMuted(false);
    setOnHold(false);
    addToast(`Call ended (${formatDuration(dur)})`, "info");
  };

  useEffect(() => {
    if (callState === "connected") {
      const start = Date.now() - callTimer * 1000;
      timerRef.current = setInterval(() => {
        setCallTimer(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [callState]);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

  if (callState !== "idle") {
    return h(
      "div",
      {
        className: "animate-fade-in",
        style: {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          gap: 24,
        },
      },
      h(Avatar, { name: matchedContact?.name || dialString, size: 96 }),
      h(
        "div",
        { style: { textAlign: "center" } },
        h("div", { style: { fontSize: 22, fontWeight: 300 } }, matchedContact?.name || dialString),
        h(
          "div",
          { className: "mono", style: { fontSize: 13, color: "var(--text-muted)", marginTop: 4 } },
          callState === "dialing" ? "Dialing..." : callState === "ringing" ? "Ringing..." : onHold ? "On Hold" : formatDuration(callTimer)
        ),
        (callState === "dialing" || callState === "ringing") &&
          h(
            "div",
            { style: { display: "flex", justifyContent: "center", gap: 8, marginTop: 16 } },
            [0, 1, 2].map(i =>
              h("div", {
                key: i,
                style: {
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--accent-blue)",
                  animation: `pulse-dot 1.2s ease ${i * 0.2}s infinite`,
                },
              })
            )
          )
      ),
      callState === "connected" &&
        h(
          "div",
          { style: { display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" } },
          [
            { icon: muted ? "mic-off" : "mic", label: muted ? "Unmute" : "Mute", onClick: () => setMuted(!muted), active: muted },
            { icon: "pause", label: onHold ? "Resume" : "Hold", onClick: () => setOnHold(!onHold), active: onHold },
            { icon: "volume-2", label: "Speaker", onClick: () => addToast("Speaker toggled", "info") },
            { icon: "hash", label: "Keypad", onClick: () => addToast("DTMF mode", "info") },
            { icon: "share-2", label: "Transfer", onClick: () => addToast("Transfer (simulated)", "info") },
            { icon: "record", label: "Record", onClick: () => addToast("Recording toggled", "info") },
          ].map((btn, i) =>
            h(
              "button",
              {
                key: i,
                className: `call-control-btn ${btn.active ? "active-ctrl" : ""}`,
                onClick: btn.onClick,
              },
              h(Icon, { name: btn.icon, size: 20 }),
              h("span", { className: "call-control-label" }, btn.label)
            )
          )
        ),
      h(
        "div",
        { style: { marginTop: 24 } },
        h(
          "button",
          { className: "call-btn call-btn-red", onClick: endCall },
          h(Icon, { name: "phone-off", size: 24, color: "white" })
        )
      )
    );
  }

  return h(
    "div",
    {
      style: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px 24px",
        maxWidth: 400,
        margin: "0 auto",
      },
    },
    h(Avatar, { name: matchedContact?.name || dialString || "?", size: 72 }),
    h("div", { style: { textAlign: "center", marginTop: 12, marginBottom: 8, minHeight: 24 } }, matchedContact && h("div", { style: { fontSize: 16, fontWeight: 500 } }, matchedContact.name)),
    h(
      "div",
      { style: { position: "relative", width: "100%", marginBottom: 16 } },
      h("input", {
        className: "input-field mono",
        style: { textAlign: "center", fontSize: 22, fontWeight: 300, letterSpacing: 2, padding: "12px 40px" },
        value: dialString,
        onChange: e => setDialString(e.target.value),
        placeholder: "Enter number or SIP URI",
      }),
      dialString &&
        h(
          "button",
          {
            style: {
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: 18,
            },
            onClick: () => setDialString(""),
          },
          h(Icon, { name: "x", size: 16 })
        )
    ),
    h(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          justifyItems: "center",
          marginBottom: 20,
        },
      },
      keys.map(key =>
        h(
          "button",
          {
            key,
            className: "dialpad-btn",
            onClick: () => handleDial(key),
          },
          h("span", null, key),
          DIALPAD_LABELS[key] && h("span", { className: "sub-text" }, DIALPAD_LABELS[key])
        )
      )
    ),
    h(
      "div",
      { style: { display: "flex", gap: 20, alignItems: "center" } },
      h(
        "button",
        {
          className: "call-btn call-btn-blue",
          onClick: () => startCall("video"),
          title: "Video call",
        },
        h(Icon, { name: "video", size: 22, color: "white" })
      ),
      h(
        "button",
        {
          className: "call-btn call-btn-green",
          onClick: () => startCall("voice"),
          style: { width: 72, height: 72 },
          title: "Voice call",
        },
        h(Icon, { name: "phone", size: 28, color: "white" })
      ),
      h(
        "button",
        {
          style: {
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border-color)",
            cursor: "pointer",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s",
          },
          onClick: () => setDialString(prev => prev.slice(0, -1)),
          title: "Backspace",
        },
        h(Icon, { name: "delete-back", size: 22 })
      )
    )
  );
}
