import React, { useState } from "react";
import { generateId } from "../lib/utils";

const h = React.createElement;

export function ConferenceView({ Icon, Avatar, addToast }) {
  const [confState, setConfState] = useState("idle");
  const [confUri, setConfUri] = useState("");
  const [participants, setParticipants] = useState([]);
  const [selfMuted, setSelfMuted] = useState(false);

  const createConf = () => {
    const room = "conf-" + Math.floor(Math.random() * 9000 + 1000);
    setConfUri(room);
    setConfState("active");
    setParticipants([
      { id: "1", name: "You", uri: "sip:you@local", muted: false, speaking: true },
      { id: "2", name: "Alice", uri: "sip:alice@example.com", muted: false, speaking: false },
      { id: "3", name: "Bob", uri: "sip:bob@example.com", muted: true, speaking: false },
    ]);
    addToast(`Conference ${room} created`, "success");
  };

  const joinConf = () => {
    if (!confUri) return;
    setConfState("active");
    setParticipants([{ id: "1", name: "You", uri: "sip:you@local", muted: false, speaking: true }]);
    addToast(`Joined conference ${confUri}`, "success");
  };

  const leaveConf = () => {
    setConfState("idle");
    setParticipants([]);
    addToast("Left conference", "info");
  };

  if (confState === "idle") {
    return h(
      "div",
      { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 20 } },
      h("div", { style: { width: 80, height: 80, borderRadius: 24, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 } }, h(Icon, { name: "users", size: 36, color: "var(--accent-green)" })),
      h("h2", { style: { fontSize: 22, fontWeight: 300 } }, "Conference"),
      h("button", { className: "pill-btn success", onClick: createConf }, h(Icon, { name: "plus-circle", size: 16, color: "white" }), "Create Conference"),
      h("div", { style: { display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 13 } }, h("div", { style: { width: 40, height: 1, background: "var(--border-color)" } }), "or join existing", h("div", { style: { width: 40, height: 1, background: "var(--border-color)" } })),
      h(
        "div",
        { style: { display: "flex", gap: 8 } },
        h("input", { className: "input-field mono", style: { width: 220, textAlign: "center" }, value: confUri, onChange: e => setConfUri(e.target.value), placeholder: "Conference ID or URI" }),
        h("button", { className: "pill-btn primary", onClick: joinConf }, h(Icon, { name: "log-in", size: 14, color: "white" }), "Join")
      )
    );
  }

  return h(
    "div",
    { style: { flex: 1, display: "flex", flexDirection: "column" } },
    h(
      "div",
      { style: { padding: "12px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" } },
      h("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, h(Icon, { name: "users", size: 18, color: "var(--accent-blue)" }), h("span", { style: { fontWeight: 500, fontSize: 15 } }, "Conference"), h("span", { className: "mono", style: { fontSize: 12, color: "var(--text-muted)", marginLeft: 4 } }, confUri)),
      h("span", { style: { background: "rgba(59,130,246,0.12)", padding: "4px 12px", borderRadius: 12, fontSize: 12, color: "var(--accent-blue)", display: "flex", alignItems: "center", gap: 6 } }, h(Icon, { name: "users", size: 12 }), `${participants.length} participants`)
    ),
    h(
      "div",
      { style: { flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, padding: 16, alignContent: "start" } },
      participants.map(p =>
        h(
          "div",
          { key: p.id, className: `panel-card ${p.speaking ? "active-card" : ""}`, style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, border: p.speaking ? "2px solid var(--accent-green)" : undefined, transition: "border 0.3s" } },
          h(Avatar, { name: p.name, size: 48 }),
          h("div", { style: { fontWeight: 500, fontSize: 13 } }, p.name),
          h("div", { style: { fontSize: 10, display: "flex", alignItems: "center", gap: 4, color: p.muted ? "var(--accent-red)" : "var(--text-muted)" } }, h(Icon, { name: p.muted ? "mic-off" : "mic", size: 11 }), p.muted ? "Muted" : "Active")
        )
      )
    ),
    h(
      "div",
      { style: { padding: 12, borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "center", gap: 10 } },
      h("button", { className: `pill-btn ${selfMuted ? "danger-outline" : ""}`, onClick: () => setSelfMuted(!selfMuted) }, h(Icon, { name: selfMuted ? "mic-off" : "mic", size: 14 }), selfMuted ? "Unmute" : "Mute"),
      h(
        "button",
        {
          className: "pill-btn",
          onClick: () => {
            setParticipants(prev => [...prev, { id: generateId(), name: "New User " + prev.length, uri: "sip:user@example.com", muted: false, speaking: false }]);
            addToast("Participant added (simulated)", "success");
          },
        },
        h(Icon, { name: "user-plus", size: 14 }),
        "Add"
      ),
      h("button", { className: "pill-btn danger", onClick: leaveConf }, h(Icon, { name: "log-out", size: 14, color: "white" }), "Leave")
    )
  );
}
