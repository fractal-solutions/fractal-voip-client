import React, { useState } from "react";
import { defaultProfile } from "../lib/defaults";
import { saveData } from "../lib/storage";
import { generateId } from "../lib/utils";

const h = React.createElement;

export function SettingsView({
  Icon,
  Toggle,
  profiles,
  setProfiles,
  activeProfile,
  activeProfileId,
  setActiveProfileId,
  settings,
  setSettings,
  regStatus,
  addToast,
  simulateIncoming,
  onRequestRegister,
  onRequestUnregister,
  activeBackend,
  lastSipError,
  lastRegisterAt,
  diagStatus,
  diagDetail,
  eventLogs,
  onClearEventLogs,
}) {
  const [settingsTab, setSettingsTab] = useState("accounts");
  const [editingProfile, setEditingProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ ...defaultProfile });
  const [showPassword, setShowPassword] = useState(false);

  const tabs = [
    { id: "accounts", icon: "user", label: "SIP Accounts" },
    { id: "audio", icon: "headphones", label: "Audio" },
    { id: "video", icon: "video", label: "Video" },
    { id: "network", icon: "shield", label: "Network" },
    { id: "appearance", icon: "palette", label: "Appearance" },
    { id: "debug", icon: "terminal", label: "Debug" },
  ];

  const saveProfile = () => {
    if (!profileForm.name.trim()) return;
    if (editingProfile) {
      setProfiles(prev => {
        const updated = prev.map(p => (p.id === editingProfile.id ? { ...profileForm, id: editingProfile.id } : p));
        saveData("profiles", updated);
        return updated;
      });
      addToast("Profile updated", "success");
    } else {
      const newProf = { ...profileForm, id: generateId() };
      setProfiles(prev => {
        const updated = [...prev, newProf];
        saveData("profiles", updated);
        if (prev.length === 0) {
          setActiveProfileId(newProf.id);
          saveData("active_profile", newProf.id);
        }
        return updated;
      });
      addToast("Profile saved", "success");
    }
    setEditingProfile(null);
    setProfileForm({ ...defaultProfile });
  };

  const testConnection = () => {
    addToast("Testing connection...", "info");
    onRequestRegister?.(profileForm);
  };

  const updateSetting = (key, value) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      saveData("settings", updated);
      return updated;
    });
  };

  const renderField = (label, key, type = "text", placeholder = "") =>
    h(
      "div",
      { style: { marginBottom: 12 } },
      h("label", { style: { fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block", fontWeight: 500 } }, label),
      type === "password"
        ? h(
            "div",
            { style: { position: "relative" } },
            h("input", {
              className: "input-field mono",
              type: showPassword ? "text" : "password",
              value: profileForm[key] || "",
              onChange: e => setProfileForm(prev => ({ ...prev, [key]: e.target.value })),
              placeholder,
            }),
            h(
              "button",
              { style: { position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }, onClick: () => setShowPassword(!showPassword) },
              h(Icon, { name: showPassword ? "eye-off" : "eye", size: 16 })
            )
          )
        : h("input", { className: `input-field ${type === "text" ? "" : "mono"}`, type: "text", value: profileForm[key] || "", onChange: e => setProfileForm(prev => ({ ...prev, [key]: e.target.value })), placeholder })
    );

  return h(
    "div",
    { style: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" } },
    h(
      "div",
      { style: { padding: "12px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", gap: 4, overflowX: "auto", flexShrink: 0 } },
      tabs.map(tab => h("button", { key: tab.id, className: `tab-btn ${settingsTab === tab.id ? "active" : ""}`, onClick: () => setSettingsTab(tab.id), style: { display: "flex", alignItems: "center", gap: 6 } }, h(Icon, { name: tab.icon, size: 13 }), tab.label))
    ),
    h(
      "div",
      { style: { flex: 1, overflowY: "auto", padding: 20 } },
      settingsTab === "accounts" &&
        (editingProfile !== null
          ? h(
              "div",
              { className: "animate-slide-in", style: { maxWidth: 500 } },
              h(
                "div",
                { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 16 } },
                h("button", { style: { background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }, onClick: () => { setEditingProfile(null); setProfileForm({ ...defaultProfile }); } }, h(Icon, { name: "chevron-left", size: 18 })),
                h("div", { className: "section-header" }, h(Icon, { name: editingProfile?.id ? "edit" : "plus-circle", size: 18 }), editingProfile?.id ? "Edit Profile" : "New Profile")
              ),
              renderField("Profile Name", "name", "text", "Office FreeSWITCH"),
              renderField("SIP Server / Domain", "domain", "text", "sip.myserver.com"),
              renderField("WebSocket URL", "wsUrl", "text", "wss://sip.myserver.com:7443"),
              renderField("Username", "username", "text", "1001"),
              renderField("Password", "password", "password", "******"),
              renderField("Display Name", "displayName", "text", "John Doe"),
              h("div", { style: { marginBottom: 12 } }, h("label", { style: { fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block", fontWeight: 500 } }, "Transport"), h("select", { className: "input-field", value: profileForm.transport, onChange: e => setProfileForm(prev => ({ ...prev, transport: e.target.value })) }, h("option", { value: "WSS" }, "WSS (Secure)"), h("option", { value: "WS" }, "WS"))),
              h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 } }, h("label", { style: { fontSize: 13, color: "var(--text-secondary)" } }, "Register on startup"), h(Toggle, { value: profileForm.registerOnStartup, onChange: value => setProfileForm(prev => ({ ...prev, registerOnStartup: value })) })),
              renderField("Registration Expiry (s)", "registrationExpiry", "text", "600"),
              renderField("Outbound Proxy", "outboundProxy", "text", "(optional)"),
              renderField("STUN Server", "stunServer", "text", "stun:stun.l.google.com:19302"),
              renderField("TURN Server", "turnServer", "text", "(optional)"),
              renderField("TURN Username", "turnUsername", "text", "(optional)"),
              renderField("TURN Credential", "turnCredential", "password", "(optional)"),
              renderField("ICE Gathering Timeout (ms)", "iceTimeout", "text", "5000"),
              h("div", { style: { display: "flex", gap: 8, marginTop: 16 } }, h("button", { className: "pill-btn primary", onClick: saveProfile }, h(Icon, { name: "check-circle", size: 14, color: "white" }), "Save Profile"), h("button", { className: "pill-btn", onClick: testConnection }, h(Icon, { name: "zap", size: 14 }), "Test Connection"))
            )
          : h(
              "div",
              null,
              h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } }, h("div", { className: "section-header" }, h(Icon, { name: "user", size: 18 }), "Server Profiles"), h("button", { className: "pill-btn primary", style: { fontSize: 12 }, onClick: () => { setEditingProfile({}); setProfileForm({ ...defaultProfile }); } }, h(Icon, { name: "plus", size: 14, color: "white" }), "Add Profile")),
              profiles.length === 0 && h("div", { className: "empty-state" }, h(Icon, { name: "user", size: 40 }), h("div", { className: "empty-state-text" }, "No server profiles configured. Add one to get started!")),
              profiles.map(p =>
                h(
                  "div",
                  { key: p.id, className: `panel-card ${p.id === activeProfileId ? "active-card" : ""}`, style: { marginBottom: 8, display: "flex", alignItems: "center", gap: 12 } },
                  h("div", { className: `status-dot ${p.id === activeProfileId ? (regStatus === "registered" ? "green" : regStatus === "registering" ? "yellow" : "red") : "red"}` }),
                  h("div", { style: { flex: 1 } }, h("div", { style: { fontWeight: 500, fontSize: 14 } }, p.name), h("div", { className: "mono", style: { fontSize: 11, color: "var(--text-muted)" } }, `${p.username}@${p.domain} (${p.transport})`)),
                  h(
                    "div",
                    { style: { display: "flex", gap: 6 } },
                    p.id !== activeProfileId &&
                      h("button", { className: "pill-btn green-outline", style: { padding: "4px 12px", fontSize: 11 }, onClick: () => { setActiveProfileId(p.id); saveData("active_profile", p.id); onRequestRegister?.(p); addToast(`Switched to ${p.name}`, "success"); } }, "Activate"),
                    h("button", { className: "icon-action-btn blue", style: { width: 28, height: 28 }, onClick: () => { setEditingProfile(p); setProfileForm({ ...p }); } }, h(Icon, { name: "edit", size: 12 })),
                    h("button", { className: "icon-action-btn red", style: { width: 28, height: 28 }, onClick: () => { setProfiles(prev => { const updated = prev.filter(x => x.id !== p.id); saveData("profiles", updated); if (activeProfileId === p.id && updated.length > 0) { setActiveProfileId(updated[0].id); saveData("active_profile", updated[0].id); } return updated; }); addToast("Profile deleted", "info"); } }, h(Icon, { name: "trash", size: 12 }))
                  )
                )
              )
            )),
      settingsTab === "audio" &&
        h(
          "div",
          { style: { maxWidth: 500 } },
          h("div", { className: "section-header", style: { marginBottom: 16 } }, h(Icon, { name: "headphones", size: 20 }), "Audio Settings"),
          [{ label: "Ringtone", key: "ringtone", options: ["classic", "modern", "soft", "vibrate"] }, { label: "DTMF Mode", key: "dtmfMode", options: ["rfc2833", "inband", "sip_info"] }].map(item =>
            h("div", { key: item.key, style: { marginBottom: 14 } }, h("label", { style: { fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block", fontWeight: 500 } }, item.label), h("select", { className: "input-field", value: settings[item.key], onChange: e => updateSetting(item.key, e.target.value) }, item.options.map(o => h("option", { key: o, value: o }, o))))
          )
        ),
      settingsTab === "video" &&
        h(
          "div",
          { style: { maxWidth: 500 } },
          h("div", { className: "section-header", style: { marginBottom: 16 } }, h(Icon, { name: "video", size: 20 }), "Video Settings"),
          h("div", { style: { marginBottom: 14 } }, h("label", { style: { fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block", fontWeight: 500 } }, "Preferred Resolution"), h("select", { className: "input-field", value: settings.videoResolution, onChange: e => updateSetting("videoResolution", e.target.value) }, ["480p", "720p", "1080p"].map(o => h("option", { key: o, value: o }, o)))),
          h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 } }, h("label", { style: { fontSize: 13, color: "var(--text-secondary)" } }, "Self-view during calls"), h(Toggle, { value: settings.selfView, onChange: value => updateSetting("selfView", value) }))
        ),
      settingsTab === "network" &&
        h(
          "div",
          { style: { maxWidth: 500 } },
          h("div", { className: "section-header", style: { marginBottom: 16 } }, h(Icon, { name: "shield", size: 20 }), "Network & Advanced"),
          h("div", { style: { marginBottom: 14 } }, h("label", { style: { fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block", fontWeight: 500 } }, "ICE Candidate Policy"), h("select", { className: "input-field", value: settings.iceCandidatePolicy, onChange: e => updateSetting("iceCandidatePolicy", e.target.value) }, ["all", "relay"].map(o => h("option", { key: o, value: o }, o)))),
          h("div", { style: { marginBottom: 14 } }, h("label", { style: { fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block", fontWeight: 500 } }, "SRTP Mode"), h("select", { className: "input-field", value: settings.srtpMode, onChange: e => updateSetting("srtpMode", e.target.value) }, ["optional", "required", "disabled"].map(o => h("option", { key: o, value: o }, o))))
        ),
      settingsTab === "appearance" &&
        h(
          "div",
          { style: { maxWidth: 500 } },
          h("div", { className: "section-header", style: { marginBottom: 16 } }, h(Icon, { name: "palette", size: 20 }), "Appearance"),
          h("div", { style: { marginBottom: 14 } }, h("label", { style: { fontSize: 12, color: "var(--text-muted)", marginBottom: 8, display: "block", fontWeight: 500 } }, "Accent Color"), h("div", { style: { display: "flex", gap: 10 } }, ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4"].map(c => h("div", { key: c, style: { width: 36, height: 36, borderRadius: 10, background: c, cursor: "pointer", border: settings.accentColor === c ? "3px solid white" : "3px solid transparent", transition: "all 0.15s", boxShadow: settings.accentColor === c ? `0 0 12px ${c}66` : "none" }, onClick: () => updateSetting("accentColor", c) })))),
          h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 } }, h("label", { style: { fontSize: 13, color: "var(--text-secondary)" } }, "Compact Mode"), h(Toggle, { value: settings.compact, onChange: value => updateSetting("compact", value) }))
        ),
      settingsTab === "debug" &&
        h(
          "div",
          null,
          h("div", { className: "section-header", style: { marginBottom: 16 } }, h(Icon, { name: "terminal", size: 20 }), "Debug Tools"),
          h(
            "div",
            { style: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" } },
            h("button", { className: "pill-btn warn-outline", onClick: simulateIncoming }, h(Icon, { name: "phone-incoming", size: 14 }), "Simulate Incoming Call"),
            h("button", { className: "pill-btn green-outline", onClick: () => { onRequestRegister?.(); addToast("Re-registering...", "info"); } }, h(Icon, { name: "rotate-cw", size: 14 }), "Re-register"),
            h("button", { className: "pill-btn danger-outline", onClick: () => { onRequestUnregister?.(); addToast("Unregistered", "info"); } }, h(Icon, { name: "phone-off", size: 14 }), "Unregister")
          ),
          h("div", { style: { marginBottom: 14 } }, h("label", { style: { fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block", fontWeight: 500 } }, "SIP Backend"), h("select", { className: "input-field", style: { maxWidth: 260 }, value: settings.sipBackend || "simulated", onChange: e => updateSetting("sipBackend", e.target.value) }, h("option", { value: "simulated" }, "simulated"), h("option", { value: "sipjs" }, "sipjs")), h("div", { className: "mono", style: { fontSize: 11, color: "var(--text-muted)", marginTop: 4 } }, `active: ${activeBackend}`)),
          h(
            "div",
            { className: "panel-card", style: { marginBottom: 14, padding: 14 } },
            h("div", { className: "section-header", style: { fontSize: 14, marginBottom: 10 } }, h(Icon, { name: "info", size: 16 }), "Connection Diagnostics"),
            h("div", { className: "mono", style: { fontSize: 12, lineHeight: 1.7, color: "var(--text-secondary)" } }, `Profile: ${activeProfile?.name || "N/A"}`),
            h("div", { className: "mono", style: { fontSize: 12, lineHeight: 1.7, color: "var(--text-secondary)" } }, `User/Domain: ${activeProfile?.username || "N/A"} @ ${activeProfile?.domain || "N/A"}`),
            h("div", { className: "mono", style: { fontSize: 12, lineHeight: 1.7, color: "var(--text-secondary)" } }, `WebSocket Target: ${activeProfile?.wsUrl || "N/A"}`),
            h("div", { className: "mono", style: { fontSize: 12, lineHeight: 1.7, color: "var(--text-secondary)" } }, `Backend: ${activeBackend}`),
            h("div", { className: "mono", style: { fontSize: 12, lineHeight: 1.7, color: "var(--text-secondary)" } }, `Diagnostics Status: ${diagStatus || "idle"}`),
            diagDetail ? h("div", { className: "mono", style: { fontSize: 12, lineHeight: 1.7, color: "var(--text-muted)" } }, `Diagnostics Detail: ${diagDetail}`) : null,
            h("div", { className: "mono", style: { fontSize: 12, lineHeight: 1.7, color: "var(--text-secondary)" } }, `Last Register Attempt: ${lastRegisterAt ? new Date(lastRegisterAt).toLocaleString() : "Never"}`),
            h("div", { className: "mono", style: { fontSize: 12, lineHeight: 1.7, color: lastSipError ? "var(--accent-red)" : "var(--accent-green)" } }, `Last SIP Error: ${lastSipError || "None"}`)
          ),
          h(
            "div",
            { className: "panel-card", style: { padding: 14 } },
            h(
              "div",
              { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 } },
              h("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, h(Icon, { name: "terminal", size: 14, color: "var(--accent-green)" }), h("h4", { style: { fontSize: 13, fontWeight: 500, color: "var(--accent-green)" } }, "Live SIP Event Log")),
              h("button", { className: "pill-btn", style: { padding: "4px 10px", fontSize: 11 }, onClick: () => onClearEventLogs?.() }, "Clear")
            ),
            h("div", { className: "mono", style: { fontSize: 11, color: "var(--text-muted)", marginBottom: 8 } }, `Showing last ${Math.min((eventLogs || []).length, 50)} events`),
            h(
              "pre",
              { className: "mono", style: { fontSize: 11, background: "#0a0c10", padding: 12, borderRadius: 8, maxHeight: 300, overflowY: "auto", lineHeight: 1.6, margin: 0 } },
              (eventLogs && eventLogs.length > 0
                ? eventLogs.map(e => `[${e.timestamp}] [${e.level || "info"}] ${e.message}`).join("\n")
                : "No SIP events yet.")
            )
          )
        )
    )
  );
}
