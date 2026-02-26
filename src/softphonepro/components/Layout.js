import React from "react";
import { getAvatarColor, getInitials } from "../lib/utils";
import { Icon } from "./Icon";

const h = React.createElement;
function Avatar({ name, size = 48, color }) {
  const c = color || getAvatarColor(name);
  return h('div', {
    style: {
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${c}, ${c}88)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 300, color: 'white', flexShrink: 0,
      boxShadow: `0 2px 12px ${c}33`
    }
  }, getInitials(name));
}

function Toggle({ value, onChange }) {
  return h('div', {
    className: `toggle-switch ${value ? 'active' : ''}`,
    onClick: () => onChange(!value)
  });
}

function StatusBar({ regStatus, activeProfile, profiles, setActiveProfileId, setView }) {
  const statusColors = { registered: 'green', registering: 'yellow', unregistered: 'red' };
  const statusLabels = { registered: 'Registered', registering: 'Registering...', unregistered: 'Unregistered' };

  return h('div', { className: 'header-bar' },
    h('div', { className: 'header-brand' },
      h('div', { className: 'header-brand-icon' },
        h(Icon, { name: 'phone-call', size: 16, color: 'white', strokeWidth: 2.2 })
      ),
      h('span', { style: { fontWeight: 600, fontSize: 15, letterSpacing: '-0.3px' } }, 'SoftPhone'),
      h('span', { style: { fontWeight: 200, fontSize: 15, color: 'var(--accent-blue)' } }, 'Pro')
    ),
    h('div', { style: { flex: 1 } }),
    h('div', { className: 'header-status' },
      h('span', { className: `status-dot ${statusColors[regStatus]}` }),
      h('span', { className: 'mono', style: { fontSize: 11, color: 'var(--text-secondary)' } },
        activeProfile ? `${activeProfile.username}@${activeProfile.domain}` : 'No profile'
      ),
      h('span', { style: { fontSize: 10, color: 'var(--text-muted)', marginLeft: 2 } },
        statusLabels[regStatus]
      )
    ),
    profiles.length > 1 && h('select', {
      style: {
        background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
        borderRadius: 6, padding: '4px 8px', color: 'var(--text-primary)',
        fontSize: 12, outline: 'none', fontFamily: 'IBM Plex Sans'
      },
      value: activeProfile?.id || '',
      onChange: (e) => setActiveProfileId(e.target.value)
    },
      profiles.map(p => h('option', { key: p.id, value: p.id }, p.name))
    ),
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 } },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 2, marginRight: 4 } },
        h(Icon, { name: 'signal', size: 14, color: regStatus === 'registered' ? 'var(--accent-green)' : 'var(--text-muted)' })
      ),
      h('button', {
        className: 'header-settings-btn',
        onClick: () => setView('settings'),
        title: 'Settings'
      }, h(Icon, { name: 'settings', size: 16 }))
    )
  );
}

function NavSidebar({ view, setView, unreadMessages }) {
  const items = [
    { id: 'dialpad', icon: 'grid', label: 'Dialpad' },
    { id: 'messages', icon: 'message-square', label: 'Messages', badge: unreadMessages },
    { id: 'video', icon: 'video', label: 'Video' },
    { id: 'conference', icon: 'users', label: 'Conference' },
    { id: 'history', icon: 'history', label: 'History' },
    { id: 'contacts', icon: 'user', label: 'Contacts' },
    { id: 'settings', icon: 'settings', label: 'Settings' },
  ];

  return h('div', { className: 'nav-rail' },
    items.map(item =>
      h('div', { key: item.id, style: { position: 'relative' } },
        h('button', {
          className: `nav-item ${view === item.id ? 'active' : ''}`,
          onClick: () => setView(item.id),
          title: item.label
        }, h(Icon, { name: item.icon, size: 20 })),
        item.badge > 0 && h('span', {
          style: {
            position: 'absolute', top: 2, right: 2, width: 16, height: 16,
            borderRadius: '50%', background: 'var(--accent-red)', fontSize: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, color: 'white'
          }
        }, item.badge)
      )
    ),
    h('div', { style: { flex: 1 } }),
    h('div', {
      style: {
        padding: '12px 0', textAlign: 'center', fontSize: 9,
        color: 'var(--text-muted)', lineHeight: 1.6
      }
    },
      h('div', null, 'v1.0'),
      h('a', {
        href: '/remix',
        style: { color: 'var(--accent-blue)', textDecoration: 'none', fontSize: 9 }
      }, 'Remix')
    )
  );
}

function MobileNav({ view, setView, unreadMessages }) {
  const items = [
    { id: 'dialpad', icon: 'grid' },
    { id: 'messages', icon: 'message-square', badge: unreadMessages },
    { id: 'history', icon: 'history' },
    { id: 'contacts', icon: 'user' },
    { id: 'settings', icon: 'settings' },
  ];

  return h('div', {
    style: {
      height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', flexShrink: 0
    }
  },
    items.map(item =>
      h('div', { key: item.id, style: { position: 'relative' } },
        h('button', {
          className: `nav-item ${view === item.id ? 'active' : ''}`,
          onClick: () => setView(item.id),
          style: { fontSize: 22 }
        }, h(Icon, { name: item.icon, size: 22 })),
        item.badge > 0 && h('span', {
          style: {
            position: 'absolute', top: 0, right: -2, width: 16, height: 16,
            borderRadius: '50%', background: 'var(--accent-red)', fontSize: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, color: 'white'
          }
        }, item.badge)
      )
    )
  );
}

export { Avatar, Toggle, StatusBar, NavSidebar, MobileNav };

