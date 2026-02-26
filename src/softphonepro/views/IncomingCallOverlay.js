import React from "react";
import { getInitials } from "../lib/utils";

const h = React.createElement;

export function IncomingCallOverlay({ Icon, caller, onAnswer, onAnswerVideo, onDecline, onIgnore }) {
  return h(
    "div",
    { className: "incoming-overlay" },
    h("div", { className: "incoming-avatar", style: { background: "linear-gradient(135deg, var(--accent-green), #059669)", marginBottom: 24 } }, getInitials(caller.name)),
    h("div", { style: { fontSize: 28, fontWeight: 200, marginBottom: 4 } }, caller.name),
    h("div", { className: "mono", style: { fontSize: 14, color: "var(--text-muted)", marginBottom: 4 } }, caller.uri),
    h("div", { style: { fontSize: 14, color: "var(--accent-green)", marginBottom: 40, display: "flex", alignItems: "center", gap: 8 } }, h(Icon, { name: "phone-call", size: 16, color: "var(--accent-green)" }), "Incoming call..."),
    h(
      "div",
      { style: { display: "flex", gap: 20, alignItems: "center" } },
      h("div", { style: { textAlign: "center" } }, h("button", { className: "call-btn call-btn-red", onClick: onDecline, style: { marginBottom: 8 } }, h(Icon, { name: "phone-off", size: 22, color: "white" })), h("div", { style: { fontSize: 11, color: "var(--text-muted)" } }, "Decline")),
      h("div", { style: { textAlign: "center" } }, h("button", { className: "call-btn call-btn-green", onClick: onAnswer, style: { width: 72, height: 72, marginBottom: 8 } }, h(Icon, { name: "phone", size: 28, color: "white" })), h("div", { style: { fontSize: 11, color: "var(--text-muted)" } }, "Answer")),
      h("div", { style: { textAlign: "center" } }, h("button", { className: "call-btn call-btn-blue", onClick: onAnswerVideo, style: { marginBottom: 8 } }, h(Icon, { name: "video", size: 22, color: "white" })), h("div", { style: { fontSize: 11, color: "var(--text-muted)" } }, "Video"))
    ),
    h("button", { style: { marginTop: 24, padding: "8px 24px", borderRadius: 8, background: "transparent", border: "1px solid var(--border-color)", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, fontFamily: "IBM Plex Sans" }, onClick: onIgnore }, "Ignore")
  );
}
