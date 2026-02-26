import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { defaultProfile, defaultSettings, sampleContacts } from "./lib/defaults";
import { playRingtone } from "./lib/audio";
import { loadData, saveData } from "./lib/storage";
import { generateId, getAvatarColor, getInitials } from "./lib/utils";
import { createSoftphoneEngine } from "./services/createSoftphoneEngine";
import { DialpadView as DialpadViewModule } from "./views/DialpadView";
import { MessagesView as MessagesViewModule } from "./views/MessagesView";
import { HistoryView as HistoryViewModule } from "./views/HistoryView";
import { ContactsView as ContactsViewModule } from "./views/ContactsView";
import { VideoView as VideoViewModule } from "./views/VideoView";
import { ConferenceView as ConferenceViewModule } from "./views/ConferenceView";
import { SettingsView as SettingsViewModule } from "./views/SettingsView";
import { IncomingCallOverlay as IncomingCallOverlayModule } from "./views/IncomingCallOverlay";

const h = React.createElement;

// ===== SVG ICON SYSTEM =====
// Uses Lucide-style inline SVGs for professional icons
const Icon = ({ name, size = 20, color, strokeWidth = 1.8, style = {} }) => {
  const icons = {
    phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
    'phone-call': 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z|M14.05 2a9 9 0 0 1 8 7.94|M14.05 6A5 5 0 0 1 18 10',
    'phone-off': 'M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91|M1 1l22 22',
    'phone-incoming': 'M16 2v6h6|M23 1l-7 7|M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
    'phone-outgoing': 'M23 7V1h-6|M16 8l7-7|M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
    'phone-missed': 'M22 2L16 8|M16 2l6 6|M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
    'message-square': 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    video: 'M23 7l-7 5 7 5V7z|M1 5h14v14H1z:rx2',
    'video-off': 'M16.5 9.4l-2-1.5|M1 5h11v11H1z:rx2|M23 7l-4.3 3|M1 1l22 22',
    users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2|C9 3 7 4.5 7 7s2 4 4.5 4S14 9.5 14 7s-2-4-4.5-4|M23 21v-2a4 4 0 0 0-3-3.87|M16 3.13a4 4 0 0 1 0 7.75',
    user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2|C12 3 10 4.5 10 7s-2 4 2 4 4-1.5 4-4S14 3 12 3',
    history: 'C12 2 6.5 2 3.5 5S1 12 1 12|M12 6v6l4 2|C12 22 17.5 22 20.5 19S23 12 23 12',
    settings: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z|C12 9 10 10 10 12s2 3 2 3 2-1 2-3-2-3-2-3',
    mic: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z|M19 10v2a7 7 0 0 1-14 0v-2|M12 19v4|M8 23h8',
    'mic-off': 'M1 1l22 22|M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6|M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.48-.35 2.17|M12 19v4|M8 23h8',
    'volume-2': 'M11 5L6 9H2v6h4l5 4V5z|M19.07 4.93a10 10 0 0 1 0 14.14|M15.54 8.46a5 5 0 0 1 0 7.07',
    pause: 'M6 4h4v16H6z|M14 4h4v16h-4z',
    play: 'M5 3l14 9-14 9V3z',
    'skip-forward': 'M5 4l10 8-10 8V4z|M19 5v14',
    circle: 'C12 2 6.48 2 2 6.48S2 17.52 6.48 22 12 22 17.52 17.52 22 12 22 6.48 17.52 2 12 2',
    'arrow-up-right': 'M7 17L17 7|M7 7h10v10',
    'arrow-down-left': 'M17 7L7 17|M17 17H7V7',
    x: 'M18 6L6 18|M6 6l12 12',
    plus: 'M12 5v14|M5 12h14',
    search: 'C11 4 7 5 4.5 7.5S3 14 5 16.5 11 20 14 20s5-1 6.5-3.5S22 11 22 11|M21 21l-4.35-4.35',
    send: 'M22 2L11 13|M22 2l-7 20-4-9-9-4 20-7z',
    'chevron-left': 'M15 18l-6-6 6-6',
    'chevron-right': 'M9 18l6-6-6-6',
    trash: 'M3 6h18|M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
    edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7|M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
    download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4|M7 10l5 5 5-5|M12 15V3',
    upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4|M17 8l-5-5-5 5|M12 3v12',
    'log-in': 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4|M10 17l5-5-5-5|M15 12H3',
    'log-out': 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4|M16 17l5-5-5-5|M21 12H9',
    'delete-back': 'M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z|M18 9l-6 6|M12 9l6 6',
    grid: 'M3 3h7v7H3z|M14 3h7v7h-7z|M14 14h7v7h-7z|M3 14h7v7H3z',
    'monitor': 'M2 3h20v14H2z|M8 21h8|M12 17v4',
    'camera': 'M23 7l-7 5 7 5V7z|M1 5h14v14H1z',
    wifi: 'M5 12.55a11 11 0 0 1 14.08 0|M1.42 9a16 16 0 0 1 21.16 0|M8.53 16.11a6 6 0 0 1 6.95 0|M12 20h.01',
    'shield': 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    'rotate-cw': 'M23 4v6h-6|M20.49 15a9 9 0 1 1-2.12-9.36L23 10',
    'zap': 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    'terminal': 'M4 17l6-6-6-6|M12 19h8',
    'eye': 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z|C12 9 10 10 10 12s2 3 2 3 2-1 2-3-2-3-2-3',
    'eye-off': 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24|M1 1l22 22',
    'plus-circle': 'C12 2 6.48 2 2 6.48S2 17.52 6.48 22 12 22 17.52 17.52 22 12 22 6.48 17.52 2 12 2|M12 8v8|M8 12h8',
    'arrow-left': 'M19 12H5|M12 19l-7-7 7-7',
    'user-plus': 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2|C8.5 3 6.5 4.5 6.5 7s2 4 2 4 2-1.5 2-4S10.5 3 8.5 3|M20 8v6|M23 11h-6',
    'share-2': 'C18 5 16.5 3.5 16.5 5s1.5 2 2.5 2S20 6.5 20 5 18 3 18 5|C6 12 4.5 10.5 4.5 12s1.5 2 2.5 2S8 13.5 8 12 6 10 6 12|C18 19 16.5 17.5 16.5 19s1.5 2 2.5 2S20 20.5 20 19 18 17 18 19|M8.59 13.51l6.83 3.98|M15.41 6.51l-6.82 3.98',
    'record': 'C12 2 6 2 2 8s4 10 10 10 10-4 10-10S18 2 12 2',
    'external-link': 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6|M15 3h6v6|M10 14L21 3',
    'wrench': 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
    'signal': 'M2 20h.01|M7 20v-4|M12 20v-8|M17 20V8|M22 20V4',
    'palette': 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.04-.23-.29-.38-.63-.38-1.04 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.17-4.5-9-10-9z',
    'sliders': 'M4 21v-7|M4 10V3|M12 21v-9|M12 8V3|M20 21v-5|M20 12V3|M1 14h6|M9 8h6|M17 16h6',
    'code': 'M16 18l6-6-6-6|M8 6l-6 6 6 6',
    'check-circle': 'M22 11.08V12a10 10 0 1 1-5.93-9.14|M22 4L12 14.01l-3-3',
    'alert-circle': 'C12 2 6.48 2 2 6.48S2 17.52 6.48 22 12 22 17.52 17.52 22 12 22 6.48 17.52 2 12 2|M12 8v4|M12 16h.01',
    'info': 'C12 2 6.48 2 2 6.48S2 17.52 6.48 22 12 22 17.52 17.52 22 12 22 6.48 17.52 2 12 2|M12 16v-4|M12 8h.01',
    'hash': 'M4 9h16|M4 15h16|M10 3L8 21|M16 3l-2 18',
    'headphones': 'M3 18v-6a9 9 0 0 1 18 0v6|M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z',
    'screen-share': 'M13 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3|M8 21h8|M12 17v4|M17 8l5-5|M17 3h5v5',
    'maximize': 'M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3',
    'flip': 'M8 3H5a2 2 0 0 0-2 2v3|M21 8V5a2 2 0 0 0-2-2h-3|M3 16v3a2 2 0 0 0 2 2h3|M16 21h3a2 2 0 0 0 2-2v-3|M12 8v8|M8 12h8',
  };

  const pathData = icons[name];
  if (!pathData) return h('span', { style: { width: size, height: size, display: 'inline-block' } });

  const paths = pathData.split('|');
  return h('svg', {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color || 'currentColor', strokeWidth: strokeWidth,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    style: { display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }
  },
    ...paths.map((pd, i) => {
      // Handle circle notation C cx cy rx ry
      if (pd.startsWith('C')) {
        const parts = pd.substring(1).trim().split(' ');
        if (parts.length >= 4) {
          return h('circle', { key: i, cx: parts[0], cy: parts[1], r: parts[2] || parts[3] });
        }
      }
      // Handle rect with rx
      if (pd.includes(':rx')) {
        const [rect, rx] = pd.split(':rx');
        const coords = rect.split(/[^0-9.-]+/).filter(Boolean).map(Number);
        if (coords.length >= 4) {
          return h('rect', { key: i, x: coords[0], y: coords[1], width: coords[2], height: coords[3], rx: parseInt(rx) || 2 });
        }
      }
      return h('path', { key: i, d: pd });
    })
  );
};

// ===== TOAST SYSTEM =====
const ToastContext = React.createContext();

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((msg, type = 'info') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, msg, type }]);
    if (type !== 'error') {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }
  }, []);
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return h(ToastContext.Provider, { value: { addToast } },
    children,
    h('div', { className: 'toast-container' },
      toasts.map(t =>
        h('div', {
          key: t.id,
          className: `toast glass-panel`,
          style: {
            borderLeft: `3px solid ${t.type === 'error' ? '#ef4444' : t.type === 'success' ? '#10b981' : '#3b82f6'}`,
          },
          onClick: () => removeToast(t.id)
        },
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
            h(Icon, {
              name: t.type === 'error' ? 'alert-circle' : t.type === 'success' ? 'check-circle' : 'info',
              size: 16,
              color: t.type === 'error' ? '#ef4444' : t.type === 'success' ? '#10b981' : '#3b82f6'
            }),
            h('span', null, t.msg)
          ),
          t.type !== 'error' && h('div', {
            className: 'toast-progress',
            style: { background: t.type === 'success' ? '#10b981' : '#3b82f6' }
          })
        )
      )
    )
  );
}

const useToast = () => React.useContext(ToastContext);

// ===== COMPONENTS =====

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
    setLastRegisterAt(new Date().toISOString());
    engineRef.current?.register?.(profile);
  }, [activeProfile]);

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
          lastSipError, lastRegisterAt
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

