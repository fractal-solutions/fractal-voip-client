import React, { useMemo, useState } from "react";
import { saveData } from "../lib/storage";
import { avatarColors, generateId } from "../lib/utils";

const h = React.createElement;

export function ContactsView({ Icon, Avatar, contacts, setContacts, setDialString, setView, addToast }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [form, setForm] = useState({ name: "", sipUri: "", phone: "", email: "", notes: "", color: "#3b82f6", speedDial: null });

  const filtered = useMemo(
    () =>
      contacts
        .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.sipUri.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [contacts, search]
  );

  const saveContact = () => {
    if (!form.name.trim()) return;
    if (editContact) {
      setContacts(prev => {
        const updated = prev.map(c => (c.id === editContact.id ? { ...editContact, ...form } : c));
        saveData("contacts", updated);
        return updated;
      });
      addToast("Contact updated", "success");
    } else {
      const newContact = { ...form, id: generateId() };
      setContacts(prev => {
        const updated = [...prev, newContact];
        saveData("contacts", updated);
        return updated;
      });
      addToast("Contact added", "success");
    }
    setShowAdd(false);
    setEditContact(null);
    setForm({ name: "", sipUri: "", phone: "", email: "", notes: "", color: "#3b82f6", speedDial: null });
  };

  const deleteContact = id => {
    setContacts(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveData("contacts", updated);
      return updated;
    });
    addToast("Contact deleted", "info");
  };

  if (showAdd || editContact) {
    return h(
      "div",
      { className: "animate-slide-in", style: { flex: 1, padding: 20, overflowY: "auto" } },
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 } },
        h(
          "button",
          { style: { background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }, onClick: () => { setShowAdd(false); setEditContact(null); } },
          h(Icon, { name: "chevron-left", size: 20 })
        ),
        h("div", { className: "section-header" }, h(Icon, { name: editContact ? "edit" : "user-plus", size: 20 }), editContact ? "Edit Contact" : "Add Contact")
      ),
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 } },
        ["name", "sipUri", "phone", "email", "notes"].map(field =>
          h(
            "div",
            { key: field },
            h("label", { style: { fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block", fontWeight: 500 } }, field === "sipUri" ? "SIP URI" : field.charAt(0).toUpperCase() + field.slice(1)),
            h("input", {
              className: "input-field",
              value: form[field] || "",
              onChange: e => setForm(prev => ({ ...prev, [field]: e.target.value })),
              placeholder: field === "sipUri" ? "sip:user@server.com" : "",
            })
          )
        ),
        h(
          "div",
          null,
          h("label", { style: { fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block", fontWeight: 500 } }, "Color"),
          h(
            "div",
            { style: { display: "flex", gap: 8 } },
            avatarColors.map(color =>
              h("div", {
                key: color,
                style: {
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: color,
                  cursor: "pointer",
                  border: form.color === color ? "2px solid white" : "2px solid transparent",
                  transition: "border 0.15s",
                  boxShadow: form.color === color ? `0 0 8px ${color}66` : "none",
                },
                onClick: () => setForm(prev => ({ ...prev, color })),
              })
            )
          )
        ),
        h(
          "button",
          { className: "pill-btn primary", style: { marginTop: 8, justifyContent: "center" }, onClick: saveContact },
          h(Icon, { name: "check-circle", size: 16, color: "white" }),
          editContact ? "Update Contact" : "Save Contact"
        )
      )
    );
  }

  return h(
    "div",
    { style: { flex: 1, display: "flex", flexDirection: "column" } },
    h(
      "div",
      { style: { padding: "16px", borderBottom: "1px solid var(--border-color)", display: "flex", gap: 8, alignItems: "center" } },
      h(
        "div",
        { style: { position: "relative", flex: 1 } },
        h(Icon, { name: "search", size: 15, style: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" } }),
        h("input", { className: "input-field", style: { flex: 1, paddingLeft: 36 }, value: search, onChange: e => setSearch(e.target.value), placeholder: "Search contacts..." })
      ),
      h("button", { className: "call-btn call-btn-blue", style: { width: 36, height: 36, flexShrink: 0 }, onClick: () => setShowAdd(true) }, h(Icon, { name: "plus", size: 18, color: "white" }))
    ),
    h(
      "div",
      { style: { flex: 1, overflowY: "auto" } },
      filtered.length === 0 && h("div", { className: "empty-state" }, h(Icon, { name: "user", size: 48 }), h("div", { className: "empty-state-text" }, "No contacts found")),
      filtered.map(c =>
        h(
          "div",
          { key: c.id, style: { padding: "12px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", gap: 12, alignItems: "center" } },
          h(Avatar, { name: c.name, size: 42, color: c.color }),
          h(
            "div",
            { style: { flex: 1 } },
            h("div", { style: { fontWeight: 500, fontSize: 14 } }, c.name),
            h("div", { className: "mono", style: { fontSize: 11, color: "var(--text-muted)" } }, c.sipUri)
          ),
          h(
            "div",
            { style: { display: "flex", gap: 6 } },
            h("button", { className: "icon-action-btn green", onClick: () => { setDialString(c.sipUri); setView("dialpad"); }, title: "Call" }, h(Icon, { name: "phone", size: 14 })),
            h(
              "button",
              {
                className: "icon-action-btn blue",
                onClick: () => {
                  setEditContact(c);
                  setForm({ name: c.name, sipUri: c.sipUri, phone: c.phone, email: c.email, notes: c.notes, color: c.color, speedDial: c.speedDial });
                },
                title: "Edit",
              },
              h(Icon, { name: "edit", size: 14 })
            ),
            h("button", { className: "icon-action-btn red", onClick: () => deleteContact(c.id), title: "Delete" }, h(Icon, { name: "trash", size: 14 }))
          )
        )
      )
    ),
    h(
      "div",
      { style: { padding: 12, display: "flex", gap: 8, justifyContent: "center" } },
      h(
        "button",
        {
          className: "pill-btn",
          onClick: () => {
            const blob = new Blob([JSON.stringify(contacts, null, 2)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "softphone_contacts.json";
            a.click();
            addToast("Contacts exported", "success");
          },
        },
        h(Icon, { name: "download", size: 14 }),
        "Export"
      ),
      h(
        "button",
        {
          className: "pill-btn",
          onClick: () => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".json";
            input.onchange = e => {
              const file = e.target.files[0];
              const reader = new FileReader();
              reader.onload = ev => {
                try {
                  const imported = JSON.parse(ev.target.result);
                  if (Array.isArray(imported)) {
                    setContacts(imported);
                    saveData("contacts", imported);
                    addToast(`Imported ${imported.length} contacts`, "success");
                  }
                } catch {
                  addToast("Invalid JSON file", "error");
                }
              };
              reader.readAsText(file);
            };
            input.click();
          },
        },
        h(Icon, { name: "upload", size: 14 }),
        "Import"
      )
    )
  );
}
