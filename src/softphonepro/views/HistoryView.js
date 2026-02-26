import React, { useMemo, useState } from "react";
import { saveData } from "../lib/storage";
import { formatDuration, formatRelativeTime } from "../lib/utils";

const h = React.createElement;

export function HistoryView({ Icon, Avatar, history, setHistory, setDialString, setView }) {
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(() => {
    if (filter === "all") return history;
    if (filter === "missed") return history.filter(entry => entry.missed);
    if (filter === "incoming") return history.filter(entry => entry.direction === "incoming");
    if (filter === "outgoing") return history.filter(entry => entry.direction === "outgoing");
    return history;
  }, [history, filter]);

  return h(
    "div",
    { style: { flex: 1, display: "flex", flexDirection: "column" } },
    h(
      "div",
      { style: { padding: "16px", borderBottom: "1px solid var(--border-color)" } },
      h("div", { className: "section-header", style: { marginBottom: 12 } }, h(Icon, { name: "history", size: 20 }), "Call History"),
      h(
        "div",
        { style: { display: "flex", gap: 4 } },
        ["all", "missed", "incoming", "outgoing"].map(f =>
          h(
            "button",
            { key: f, className: `tab-btn ${filter === f ? "active" : ""}`, onClick: () => setFilter(f) },
            f.charAt(0).toUpperCase() + f.slice(1)
          )
        )
      )
    ),
    h(
      "div",
      { style: { flex: 1, overflowY: "auto" } },
      filtered.length === 0 &&
        h("div", { className: "empty-state" }, h(Icon, { name: "phone", size: 48 }), h("div", { className: "empty-state-text" }, "No calls yet")),
      filtered.map(entry =>
        h(
          "div",
          {
            key: entry.id,
            style: {
              padding: "12px 16px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              gap: 12,
              alignItems: "center",
            },
          },
          h(
            "div",
            {
              style: {
                width: 28,
                height: 28,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: entry.missed ? "rgba(239,68,68,0.1)" : entry.direction === "outgoing" ? "rgba(16,185,129,0.1)" : "rgba(59,130,246,0.1)",
              },
            },
            h(Icon, {
              name: entry.missed ? "phone-missed" : entry.direction === "outgoing" ? "phone-outgoing" : "phone-incoming",
              size: 14,
              color: entry.missed ? "var(--accent-red)" : entry.direction === "outgoing" ? "var(--accent-green)" : "var(--accent-blue)",
            })
          ),
          h(Avatar, { name: entry.contactName || entry.contact, size: 38 }),
          h(
            "div",
            { style: { flex: 1 } },
            h("div", { style: { fontWeight: 500, fontSize: 14 } }, entry.contactName || entry.contact),
            h(
              "div",
              { style: { fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8 } },
              h(Icon, { name: entry.type === "video" ? "video" : "phone", size: 11 }),
              h("span", null, formatDuration(entry.duration)),
              h("span", null, formatRelativeTime(entry.timestamp))
            )
          ),
          h(
            "button",
            { className: "icon-action-btn green", onClick: () => { setDialString(entry.contact); setView("dialpad"); }, title: "Call back" },
            h(Icon, { name: "phone", size: 14 })
          )
        )
      )
    ),
    history.length > 0 &&
      h(
        "div",
        { style: { padding: 12, textAlign: "center" } },
        h(
          "button",
          {
            className: "pill-btn danger-outline",
            onClick: () => {
              setHistory([]);
              saveData("history", []);
            },
          },
          h(Icon, { name: "trash", size: 14 }),
          "Clear History"
        )
      )
  );
}
