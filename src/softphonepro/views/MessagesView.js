import React, { useState } from "react";
import { saveData } from "../lib/storage";
import { formatRelativeTime, generateId } from "../lib/utils";

const h = React.createElement;

export function MessagesView({ Icon, Avatar, messages, setMessages, contacts }) {
  const [activeThread, setActiveThread] = useState(null);
  const [input, setInput] = useState("");
  const [newMsgUri, setNewMsgUri] = useState("");
  const [showNew, setShowNew] = useState(false);
  const threads = Object.keys(messages);

  const sendMessage = () => {
    if (!input.trim() || !activeThread) return;
    const newMsg = { id: generateId(), from: "me", text: input.trim(), timestamp: new Date().toISOString(), read: true };
    setMessages(prev => {
      const updated = { ...prev, [activeThread]: [...(prev[activeThread] || []), newMsg] };
      saveData("messages", updated);
      return updated;
    });
    setInput("");
  };

  const startNewThread = () => {
    if (!newMsgUri.trim()) return;
    const uri = newMsgUri.trim();
    if (!messages[uri]) {
      setMessages(prev => {
        const updated = { ...prev, [uri]: [] };
        saveData("messages", updated);
        return updated;
      });
    }
    setActiveThread(uri);
    setShowNew(false);
    setNewMsgUri("");
  };

  const getContactName = uri => {
    const c = contacts.find(contact => contact.sipUri === uri);
    return c ? c.name : uri;
  };

  if (activeThread) {
    const threadMsgs = messages[activeThread] || [];
    return h(
      "div",
      { className: "animate-slide-in", style: { flex: 1, display: "flex", flexDirection: "column", height: "100%" } },
      h(
        "div",
        {
          style: {
            padding: "12px 16px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          },
        },
        h(
          "button",
          {
            style: { background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" },
            onClick: () => setActiveThread(null),
          },
          h(Icon, { name: "chevron-left", size: 20 })
        ),
        h(Avatar, { name: getContactName(activeThread), size: 36 }),
        h(
          "div",
          null,
          h("div", { style: { fontWeight: 500, fontSize: 14 } }, getContactName(activeThread)),
          h("div", { className: "mono", style: { fontSize: 11, color: "var(--text-muted)" } }, activeThread)
        )
      ),
      h(
        "div",
        { style: { flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 } },
        threadMsgs.length === 0 &&
          h(
            "div",
            { className: "empty-state" },
            h(Icon, { name: "message-square", size: 40 }),
            h("div", { className: "empty-state-text" }, "No messages yet. Say hello!")
          ),
        threadMsgs.map(m =>
          h(
            "div",
            { key: m.id, className: `message-bubble ${m.from === "me" ? "message-sent" : "message-received"}` },
            h("div", null, m.text),
            h("div", { style: { fontSize: 10, opacity: 0.6, marginTop: 4 } }, formatRelativeTime(m.timestamp))
          )
        )
      ),
      h(
        "div",
        { style: { padding: 12, borderTop: "1px solid var(--border-color)", display: "flex", gap: 8 } },
        h("input", {
          className: "input-field",
          value: input,
          onChange: e => setInput(e.target.value),
          onKeyDown: e => e.key === "Enter" && sendMessage(),
          placeholder: "Type a message...",
          style: { flex: 1 },
        }),
        h(
          "button",
          { className: "call-btn call-btn-blue", style: { width: 40, height: 40 }, onClick: sendMessage },
          h(Icon, { name: "send", size: 16, color: "white" })
        )
      )
    );
  }

  return h(
    "div",
    { style: { flex: 1, display: "flex", flexDirection: "column" } },
    h(
      "div",
      {
        style: {
          padding: "16px",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        },
      },
      h("div", { className: "section-header" }, h(Icon, { name: "message-square", size: 20 }), "Messages"),
      h(
        "button",
        { className: "call-btn call-btn-blue", style: { width: 36, height: 36 }, onClick: () => setShowNew(true) },
        h(Icon, { name: "plus", size: 18, color: "white" })
      )
    ),
    showNew &&
      h(
        "div",
        {
          style: {
            padding: "12px 16px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            gap: 8,
            animation: "slide-up 0.2s ease",
          },
        },
        h("input", {
          className: "input-field",
          value: newMsgUri,
          onChange: e => setNewMsgUri(e.target.value),
          placeholder: "SIP URI (e.g., sip:user@server.com)",
          style: { flex: 1 },
          onKeyDown: e => e.key === "Enter" && startNewThread(),
        }),
        h("button", { className: "pill-btn primary", onClick: startNewThread }, "Start"),
        h("button", { className: "pill-btn", onClick: () => { setShowNew(false); setNewMsgUri(""); } }, h(Icon, { name: "x", size: 14 }))
      ),
    h(
      "div",
      { style: { flex: 1, overflowY: "auto" } },
      threads.length === 0 &&
        h(
          "div",
          { className: "empty-state" },
          h(Icon, { name: "message-square", size: 48 }),
          h("div", { className: "empty-state-text" }, "No conversations yet. Start one!")
        ),
      threads.map(uri => {
        const msgs = messages[uri];
        const last = msgs[msgs.length - 1];
        return h(
          "div",
          {
            key: uri,
            style: {
              padding: "12px 16px",
              borderBottom: "1px solid var(--border-color)",
              cursor: "pointer",
              display: "flex",
              gap: 12,
              alignItems: "center",
              transition: "background 0.15s",
            },
            onClick: () => setActiveThread(uri),
            onMouseEnter: e => (e.currentTarget.style.background = "var(--bg-tertiary)"),
            onMouseLeave: e => (e.currentTarget.style.background = "transparent"),
          },
          h(Avatar, { name: getContactName(uri), size: 42 }),
          h(
            "div",
            { style: { flex: 1, minWidth: 0 } },
            h("div", { style: { fontWeight: 500, fontSize: 14 } }, getContactName(uri)),
            last && h("div", { style: { fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, last.text)
          ),
          last && h("div", { style: { fontSize: 10, color: "var(--text-muted)", flexShrink: 0 } }, formatRelativeTime(last.timestamp))
        );
      })
    )
  );
}
