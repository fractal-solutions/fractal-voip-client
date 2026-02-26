import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { defaultProfile, defaultSettings, sampleContacts } from "./lib/defaults";
import { DIALPAD_LABELS, playDTMF, playRingtone } from "./lib/audio";
import { loadData, saveData } from "./lib/storage";
import { avatarColors, formatDuration, formatRelativeTime, generateId, getAvatarColor, getInitials } from "./lib/utils";
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

// ===== DIALPAD VIEW =====
function DialpadView({ dialString, setDialString, callState, callType, setCallTimer, callTimer, addHistory, contacts, addToast, muted, setMuted, onHold, setOnHold, onStartCall, onEndCall }) {
  const timerRef = useRef(null);
  const matchedContact = useMemo(() =>
    contacts.find(c => c.sipUri === dialString || c.phone === dialString),
    [contacts, dialString]
  );

  const handleDial = (key) => {
    playDTMF(key);
    if (callState === 'idle') {
      setDialString(prev => prev + key);
    }
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
      id: generateId(), direction: 'outgoing', type: callType || 'voice',
      contact: dialString, contactName: matchedContact?.name || dialString,
      duration: dur, timestamp: new Date().toISOString(), missed: false
    });
    onEndCall?.();
    setCallTimer(0);
    setMuted(false);
    setOnHold(false);
    addToast(`Call ended (${formatDuration(dur)})`, 'info');
  };

  useEffect(() => {
    if (callState === 'connected') {
      const start = Date.now() - callTimer * 1000;
      timerRef.current = setInterval(() => {
        setCallTimer(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [callState]);

  const keys = ['1','2','3','4','5','6','7','8','9','*','0','#'];

  if (callState !== 'idle') {
    return h('div', {
      className: 'animate-fade-in',
      style: {
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: 24, gap: 24
      }
    },
      h(Avatar, { name: matchedContact?.name || dialString, size: 96 }),
      h('div', { style: { textAlign: 'center' } },
        h('div', { style: { fontSize: 22, fontWeight: 300 } }, matchedContact?.name || dialString),
        h('div', { className: 'mono', style: { fontSize: 13, color: 'var(--text-muted)', marginTop: 4 } },
          callState === 'dialing' ? 'Dialing...' :
          callState === 'ringing' ? 'Ringing...' :
          onHold ? 'On Hold' :
          formatDuration(callTimer)
        ),
        (callState === 'dialing' || callState === 'ringing') &&
          h('div', { style: { display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 } },
            [0,1,2].map(i =>
              h('div', {
                key: i,
                style: {
                  width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-blue)',
                  animation: `pulse-dot 1.2s ease ${i * 0.2}s infinite`
                }
              })
            )
          )
      ),
      callState === 'connected' && h('div', {
        style: { display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }
      },
        [
          { icon: muted ? 'mic-off' : 'mic', label: muted ? 'Unmute' : 'Mute', onClick: () => setMuted(!muted), active: muted },
          { icon: 'pause', label: onHold ? 'Resume' : 'Hold', onClick: () => setOnHold(!onHold), active: onHold },
          { icon: 'volume-2', label: 'Speaker', onClick: () => addToast('Speaker toggled', 'info') },
          { icon: 'hash', label: 'Keypad', onClick: () => addToast('DTMF mode', 'info') },
          { icon: 'share-2', label: 'Transfer', onClick: () => addToast('Transfer (simulated)', 'info') },
          { icon: 'record', label: 'Record', onClick: () => addToast('Recording toggled', 'info') },
        ].map((btn, i) =>
          h('button', {
            key: i,
            className: `call-control-btn ${btn.active ? 'active-ctrl' : ''}`,
            onClick: btn.onClick,
          },
            h(Icon, { name: btn.icon, size: 20 }),
            h('span', { className: 'call-control-label' }, btn.label)
          )
        )
      ),
      h('div', { style: { marginTop: 24 } },
        h('button', { className: 'call-btn call-btn-red', onClick: endCall },
          h(Icon, { name: 'phone-off', size: 24, color: 'white' })
        )
      )
    );
  }

  return h('div', {
    style: {
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '16px 24px', maxWidth: 400, margin: '0 auto'
    }
  },
    h(Avatar, { name: matchedContact?.name || dialString || '?', size: 72 }),
    h('div', { style: { textAlign: 'center', marginTop: 12, marginBottom: 8, minHeight: 24 } },
      matchedContact && h('div', { style: { fontSize: 16, fontWeight: 500 } }, matchedContact.name)
    ),
    h('div', { style: { position: 'relative', width: '100%', marginBottom: 16 } },
      h('input', {
        className: 'input-field mono',
        style: { textAlign: 'center', fontSize: 22, fontWeight: 300, letterSpacing: 2, padding: '12px 40px' },
        value: dialString,
        onChange: (e) => setDialString(e.target.value),
        placeholder: 'Enter number or SIP URI'
      }),
      dialString && h('button', {
        style: {
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18
        },
        onClick: () => setDialString('')
      }, h(Icon, { name: 'x', size: 16 }))
    ),
    h('div', {
      style: {
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12, justifyItems: 'center', marginBottom: 20
      }
    },
      keys.map(key =>
        h('button', {
          key, className: 'dialpad-btn',
          onClick: () => handleDial(key)
        },
          h('span', null, key),
          DIALPAD_LABELS[key] && h('span', { className: 'sub-text' }, DIALPAD_LABELS[key])
        )
      )
    ),
    h('div', { style: { display: 'flex', gap: 20, alignItems: 'center' } },
      h('button', {
        className: 'call-btn call-btn-blue',
        onClick: () => startCall('video'),
        title: 'Video call'
      }, h(Icon, { name: 'video', size: 22, color: 'white' })),
      h('button', {
        className: 'call-btn call-btn-green',
        onClick: () => startCall('voice'),
        style: { width: 72, height: 72 },
        title: 'Voice call'
      }, h(Icon, { name: 'phone', size: 28, color: 'white' })),
      h('button', {
        style: {
          width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)', cursor: 'pointer',
          color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s'
        },
        onClick: () => setDialString(prev => prev.slice(0, -1)),
        title: 'Backspace'
      }, h(Icon, { name: 'delete-back', size: 22 }))
    )
  );
}

// ===== MESSAGES VIEW =====
function MessagesView({ messages, setMessages, contacts }) {
  const [activeThread, setActiveThread] = useState(null);
  const [input, setInput] = useState('');
  const [newMsgUri, setNewMsgUri] = useState('');
  const [showNew, setShowNew] = useState(false);
  const threads = Object.keys(messages);

  const sendMessage = () => {
    if (!input.trim() || !activeThread) return;
    const newMsg = { id: generateId(), from: 'me', text: input.trim(), timestamp: new Date().toISOString(), read: true };
    setMessages(prev => {
      const updated = { ...prev, [activeThread]: [...(prev[activeThread] || []), newMsg] };
      saveData('messages', updated);
      return updated;
    });
    setInput('');
  };

  const startNewThread = () => {
    if (!newMsgUri.trim()) return;
    const uri = newMsgUri.trim();
    if (!messages[uri]) {
      setMessages(prev => {
        const updated = { ...prev, [uri]: [] };
        saveData('messages', updated);
        return updated;
      });
    }
    setActiveThread(uri);
    setShowNew(false);
    setNewMsgUri('');
  };

  const getContactName = (uri) => {
    const c = contacts.find(c => c.sipUri === uri);
    return c ? c.name : uri;
  };

  if (activeThread) {
    const threadMsgs = messages[activeThread] || [];
    return h('div', {
      className: 'animate-slide-in',
      style: { flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }
    },
      h('div', {
        style: {
          padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', gap: 12
        }
      },
        h('button', {
          style: { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' },
          onClick: () => setActiveThread(null)
        }, h(Icon, { name: 'chevron-left', size: 20 })),
        h(Avatar, { name: getContactName(activeThread), size: 36 }),
        h('div', null,
          h('div', { style: { fontWeight: 500, fontSize: 14 } }, getContactName(activeThread)),
          h('div', { className: 'mono', style: { fontSize: 11, color: 'var(--text-muted)' } }, activeThread)
        )
      ),
      h('div', {
        style: {
          flex: 1, overflowY: 'auto', padding: 16, display: 'flex',
          flexDirection: 'column', gap: 8
        }
      },
        threadMsgs.length === 0 &&
          h('div', { className: 'empty-state' },
            h(Icon, { name: 'message-square', size: 40 }),
            h('div', { className: 'empty-state-text' }, 'No messages yet. Say hello!')
          ),
        threadMsgs.map(m =>
          h('div', {
            key: m.id,
            className: `message-bubble ${m.from === 'me' ? 'message-sent' : 'message-received'}`,
          },
            h('div', null, m.text),
            h('div', { style: { fontSize: 10, opacity: 0.6, marginTop: 4 } }, formatRelativeTime(m.timestamp))
          )
        )
      ),
      h('div', {
        style: {
          padding: 12, borderTop: '1px solid var(--border-color)',
          display: 'flex', gap: 8
        }
      },
        h('input', {
          className: 'input-field',
          value: input,
          onChange: (e) => setInput(e.target.value),
          onKeyDown: (e) => e.key === 'Enter' && sendMessage(),
          placeholder: 'Type a message...',
          style: { flex: 1 }
        }),
        h('button', {
          className: 'call-btn call-btn-blue',
          style: { width: 40, height: 40 },
          onClick: sendMessage
        }, h(Icon, { name: 'send', size: 16, color: 'white' }))
      )
    );
  }

  return h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column' } },
    h('div', {
      style: {
        padding: '16px', borderBottom: '1px solid var(--border-color)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }
    },
      h('div', { className: 'section-header' },
        h(Icon, { name: 'message-square', size: 20 }),
        'Messages'
      ),
      h('button', {
        className: 'call-btn call-btn-blue',
        style: { width: 36, height: 36 },
        onClick: () => setShowNew(true)
      }, h(Icon, { name: 'plus', size: 18, color: 'white' }))
    ),
    showNew && h('div', {
      style: {
        padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
        display: 'flex', gap: 8, animation: 'slide-up 0.2s ease'
      }
    },
      h('input', {
        className: 'input-field',
        value: newMsgUri,
        onChange: (e) => setNewMsgUri(e.target.value),
        placeholder: 'SIP URI (e.g., sip:user@server.com)',
        style: { flex: 1 },
        onKeyDown: (e) => e.key === 'Enter' && startNewThread()
      }),
      h('button', { className: 'pill-btn primary', onClick: startNewThread }, 'Start'),
      h('button', {
        className: 'pill-btn',
        onClick: () => { setShowNew(false); setNewMsgUri(''); }
      }, h(Icon, { name: 'x', size: 14 }))
    ),
    h('div', { style: { flex: 1, overflowY: 'auto' } },
      threads.length === 0 &&
        h('div', { className: 'empty-state' },
          h(Icon, { name: 'message-square', size: 48 }),
          h('div', { className: 'empty-state-text' }, 'No conversations yet. Start one!')
        ),
      threads.map(uri => {
        const msgs = messages[uri];
        const last = msgs[msgs.length - 1];
        return h('div', {
          key: uri,
          style: {
            padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
            cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center',
            transition: 'background 0.15s'
          },
          onClick: () => setActiveThread(uri),
          onMouseEnter: (e) => e.currentTarget.style.background = 'var(--bg-tertiary)',
          onMouseLeave: (e) => e.currentTarget.style.background = 'transparent'
        },
          h(Avatar, { name: getContactName(uri), size: 42 }),
          h('div', { style: { flex: 1, minWidth: 0 } },
            h('div', { style: { fontWeight: 500, fontSize: 14 } }, getContactName(uri)),
            last && h('div', {
              style: { fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
            }, last.text)
          ),
          last && h('div', { style: { fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 } }, formatRelativeTime(last.timestamp))
        );
      })
    )
  );
}

// ===== CALL HISTORY VIEW =====
function HistoryView({ history, setHistory, setDialString, setView }) {
  const [filter, setFilter] = useState('all');
  const filtered = useMemo(() => {
    if (filter === 'all') return history;
    if (filter === 'missed') return history.filter(h => h.missed);
    if (filter === 'incoming') return history.filter(h => h.direction === 'incoming');
    if (filter === 'outgoing') return history.filter(h => h.direction === 'outgoing');
    return history;
  }, [history, filter]);

  return h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column' } },
    h('div', { style: { padding: '16px', borderBottom: '1px solid var(--border-color)' } },
      h('div', { className: 'section-header', style: { marginBottom: 12 } },
        h(Icon, { name: 'history', size: 20 }),
        'Call History'
      ),
      h('div', { style: { display: 'flex', gap: 4 } },
        ['all', 'missed', 'incoming', 'outgoing'].map(f =>
          h('button', {
            key: f,
            className: `tab-btn ${filter === f ? 'active' : ''}`,
            onClick: () => setFilter(f)
          }, f.charAt(0).toUpperCase() + f.slice(1))
        )
      )
    ),
    h('div', { style: { flex: 1, overflowY: 'auto' } },
      filtered.length === 0 &&
        h('div', { className: 'empty-state' },
          h(Icon, { name: 'phone', size: 48 }),
          h('div', { className: 'empty-state-text' }, 'No calls yet — time to break the ice!')
        ),
      filtered.map(entry =>
        h('div', {
          key: entry.id,
          style: {
            padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
            display: 'flex', gap: 12, alignItems: 'center'
          }
        },
          h('div', {
            style: {
              width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: entry.missed ? 'rgba(239,68,68,0.1)' :
                         entry.direction === 'outgoing' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
            }
          },
            h(Icon, {
              name: entry.missed ? 'phone-missed' : entry.direction === 'outgoing' ? 'phone-outgoing' : 'phone-incoming',
              size: 14,
              color: entry.missed ? 'var(--accent-red)' :
                     entry.direction === 'outgoing' ? 'var(--accent-green)' : 'var(--accent-blue)'
            })
          ),
          h(Avatar, { name: entry.contactName || entry.contact, size: 38 }),
          h('div', { style: { flex: 1 } },
            h('div', { style: { fontWeight: 500, fontSize: 14 } }, entry.contactName || entry.contact),
            h('div', { style: { fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 } },
              h(Icon, { name: entry.type === 'video' ? 'video' : 'phone', size: 11 }),
              h('span', null, formatDuration(entry.duration)),
              h('span', null, formatRelativeTime(entry.timestamp))
            )
          ),
          h('button', {
            className: 'icon-action-btn green',
            onClick: () => { setDialString(entry.contact); setView('dialpad'); },
            title: 'Call back'
          }, h(Icon, { name: 'phone', size: 14 }))
        )
      )
    ),
    history.length > 0 && h('div', { style: { padding: 12, textAlign: 'center' } },
      h('button', {
        className: 'pill-btn danger-outline',
        onClick: () => { setHistory([]); saveData('history', []); }
      }, h(Icon, { name: 'trash', size: 14 }), 'Clear History')
    )
  );
}

// ===== CONTACTS VIEW =====
function ContactsView({ contacts, setContacts, setDialString, setView, addToast }) {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [form, setForm] = useState({ name: '', sipUri: '', phone: '', email: '', notes: '', color: '#3b82f6', speedDial: null });

  const filtered = useMemo(() =>
    contacts.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.sipUri.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name)),
    [contacts, search]
  );

  const saveContact = () => {
    if (!form.name.trim()) return;
    if (editContact) {
      setContacts(prev => {
        const updated = prev.map(c => c.id === editContact.id ? { ...editContact, ...form } : c);
        saveData('contacts', updated);
        return updated;
      });
      addToast('Contact updated', 'success');
    } else {
      const newContact = { ...form, id: generateId() };
      setContacts(prev => {
        const updated = [...prev, newContact];
        saveData('contacts', updated);
        return updated;
      });
      addToast('Contact added', 'success');
    }
    setShowAdd(false);
    setEditContact(null);
    setForm({ name: '', sipUri: '', phone: '', email: '', notes: '', color: '#3b82f6', speedDial: null });
  };

  const deleteContact = (id) => {
    setContacts(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveData('contacts', updated);
      return updated;
    });
    addToast('Contact deleted', 'info');
  };

  if (showAdd || editContact) {
    return h('div', {
      className: 'animate-slide-in',
      style: { flex: 1, padding: 20, overflowY: 'auto' }
    },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 } },
        h('button', {
          style: { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' },
          onClick: () => { setShowAdd(false); setEditContact(null); }
        }, h(Icon, { name: 'chevron-left', size: 20 })),
        h('div', { className: 'section-header' },
          h(Icon, { name: editContact ? 'edit' : 'user-plus', size: 20 }),
          editContact ? 'Edit Contact' : 'Add Contact'
        )
      ),
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 } },
        ['name', 'sipUri', 'phone', 'email', 'notes'].map(field =>
          h('div', { key: field },
            h('label', { style: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block', fontWeight: 500 } },
              field === 'sipUri' ? 'SIP URI' : field.charAt(0).toUpperCase() + field.slice(1)
            ),
            h('input', {
              className: 'input-field',
              value: form[field] || '',
              onChange: (e) => setForm(prev => ({ ...prev, [field]: e.target.value })),
              placeholder: field === 'sipUri' ? 'sip:user@server.com' : ''
            })
          )
        ),
        h('div', null,
          h('label', { style: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block', fontWeight: 500 } }, 'Color'),
          h('div', { style: { display: 'flex', gap: 8 } },
            avatarColors.map(c =>
              h('div', {
                key: c,
                style: {
                  width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: form.color === c ? '2px solid white' : '2px solid transparent',
                  transition: 'border 0.15s', boxShadow: form.color === c ? `0 0 8px ${c}66` : 'none'
                },
                onClick: () => setForm(prev => ({ ...prev, color: c }))
              })
            )
          )
        ),
        h('button', {
          className: 'pill-btn primary',
          style: { marginTop: 8, justifyContent: 'center' },
          onClick: saveContact
        }, h(Icon, { name: 'check-circle', size: 16, color: 'white' }),
          editContact ? 'Update Contact' : 'Save Contact')
      )
    );
  }

  return h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column' } },
    h('div', {
      style: {
        padding: '16px', borderBottom: '1px solid var(--border-color)',
        display: 'flex', gap: 8, alignItems: 'center'
      }
    },
      h('div', { style: { position: 'relative', flex: 1 } },
        h(Icon, { name: 'search', size: 15, style: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' } }),
        h('input', {
          className: 'input-field',
          style: { flex: 1, paddingLeft: 36 },
          value: search,
          onChange: (e) => setSearch(e.target.value),
          placeholder: 'Search contacts...'
        })
      ),
      h('button', {
        className: 'call-btn call-btn-blue',
        style: { width: 36, height: 36, flexShrink: 0 },
        onClick: () => setShowAdd(true)
      }, h(Icon, { name: 'plus', size: 18, color: 'white' }))
    ),
    h('div', { style: { flex: 1, overflowY: 'auto' } },
      filtered.length === 0 &&
        h('div', { className: 'empty-state' },
          h(Icon, { name: 'user', size: 48 }),
          h('div', { className: 'empty-state-text' }, 'No contacts found')
        ),
      filtered.map(c =>
        h('div', {
          key: c.id,
          style: {
            padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
            display: 'flex', gap: 12, alignItems: 'center'
          }
        },
          h(Avatar, { name: c.name, size: 42, color: c.color }),
          h('div', { style: { flex: 1 } },
            h('div', { style: { fontWeight: 500, fontSize: 14 } }, c.name),
            h('div', { className: 'mono', style: { fontSize: 11, color: 'var(--text-muted)' } }, c.sipUri)
          ),
          h('div', { style: { display: 'flex', gap: 6 } },
            h('button', {
              className: 'icon-action-btn green',
              onClick: () => { setDialString(c.sipUri); setView('dialpad'); },
              title: 'Call'
            }, h(Icon, { name: 'phone', size: 14 })),
            h('button', {
              className: 'icon-action-btn blue',
              onClick: () => {
                setEditContact(c);
                setForm({ name: c.name, sipUri: c.sipUri, phone: c.phone, email: c.email, notes: c.notes, color: c.color, speedDial: c.speedDial });
              },
              title: 'Edit'
            }, h(Icon, { name: 'edit', size: 14 })),
            h('button', {
              className: 'icon-action-btn red',
              onClick: () => deleteContact(c.id),
              title: 'Delete'
            }, h(Icon, { name: 'trash', size: 14 }))
          )
        )
      )
    ),
    h('div', { style: { padding: 12, display: 'flex', gap: 8, justifyContent: 'center' } },
      h('button', {
        className: 'pill-btn',
        onClick: () => {
          const blob = new Blob([JSON.stringify(contacts, null, 2)], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'softphone_contacts.json';
          a.click();
          addToast('Contacts exported', 'success');
        }
      }, h(Icon, { name: 'download', size: 14 }), 'Export'),
      h('button', {
        className: 'pill-btn',
        onClick: () => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.json';
          input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
              try {
                const imported = JSON.parse(ev.target.result);
                if (Array.isArray(imported)) {
                  setContacts(imported);
                  saveData('contacts', imported);
                  addToast(`Imported ${imported.length} contacts`, 'success');
                }
              } catch { addToast('Invalid JSON file', 'error'); }
            };
            reader.readAsText(file);
          };
          input.click();
        }
      }, h(Icon, { name: 'upload', size: 14 }), 'Import')
    )
  );
}

// ===== VIDEO VIEW =====
function VideoView({ addToast }) {
  const [targetUri, setTargetUri] = useState('');
  const [videoState, setVideoState] = useState('idle');
  const videoRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  const startPreview = () => {
    if (!targetUri) return;
    setVideoState('preview');
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => addToast('Camera not available (simulated mode)', 'info'));
  };

  const startVideoCall = () => {
    setVideoState('calling');
    setTimeout(() => {
      setVideoState('connected');
      addToast('Video call connected (simulated)', 'success');
    }, 2500);
  };

  const endVideoCall = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setVideoState('idle');
    addToast('Video call ended', 'info');
  };

  if (videoState === 'idle') {
    return h('div', {
      style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }
    },
      h('div', {
        style: {
          width: 80, height: 80, borderRadius: 24, background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: 8
        }
      }, h(Icon, { name: 'video', size: 36, color: 'var(--accent-blue)' })),
      h('h2', { style: { fontSize: 22, fontWeight: 300 } }, 'Video Call'),
      h('p', { style: { color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', maxWidth: 300 } },
        'Enter a SIP URI to start a video call with camera preview.'
      ),
      h('input', {
        className: 'input-field mono',
        style: { maxWidth: 340, textAlign: 'center' },
        value: targetUri,
        onChange: (e) => setTargetUri(e.target.value),
        placeholder: 'sip:user@server.com'
      }),
      h('button', {
        className: 'pill-btn primary',
        onClick: startPreview
      }, h(Icon, { name: 'video', size: 16, color: 'white' }), 'Start Preview')
    );
  }

  return h('div', {
    style: { flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', background: '#000' }
  },
    h('div', { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' } },
      videoState === 'connected' ?
        h('div', {
          style: {
            width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1d27, #0f1117)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }
        },
          h(Avatar, { name: targetUri, size: 120 }),
        ) :
        h('div', { style: { textAlign: 'center' } },
          h('div', { style: { fontSize: 18, fontWeight: 300, marginBottom: 8, color: 'white' } },
            videoState === 'preview' ? 'Ready to call?' : 'Connecting...'
          ),
          h('div', { className: 'mono', style: { fontSize: 13, color: 'var(--text-muted)' } }, targetUri),
          videoState === 'preview' &&
            h('button', {
              className: 'pill-btn success',
              style: { marginTop: 20 },
              onClick: startVideoCall
            }, h(Icon, { name: 'video', size: 16, color: 'white' }), 'Call Now')
        ),
      h('div', {
        style: {
          position: 'absolute', bottom: 80, right: 16, width: 160, height: 120,
          borderRadius: 12, overflow: 'hidden', border: '2px solid var(--border-color)',
          background: '#111'
        }
      },
        h('video', {
          ref: videoRef,
          autoPlay: true, muted: true, playsInline: true,
          style: { width: '100%', height: '100%', objectFit: 'cover' }
        }),
        !cameraOn && h('div', {
          style: {
            position: 'absolute', inset: 0, background: '#222',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }
        }, h(Icon, { name: 'video-off', size: 24, color: 'var(--text-muted)' }))
      )
    ),
    h('div', {
      style: {
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 12, padding: '12px 20px', borderRadius: 16,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)'
      }
    },
      h('button', {
        style: {
          width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: micOn ? 'var(--bg-tertiary)' : 'var(--accent-red)',
          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
        },
        onClick: () => setMicOn(!micOn)
      }, h(Icon, { name: micOn ? 'mic' : 'mic-off', size: 18, color: 'white' })),
      h('button', {
        style: {
          width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: cameraOn ? 'var(--bg-tertiary)' : 'var(--accent-red)',
          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
        },
        onClick: () => setCameraOn(!cameraOn)
      }, h(Icon, { name: cameraOn ? 'video' : 'video-off', size: 18, color: 'white' })),
      h('button', {
        className: 'call-btn call-btn-red',
        style: { width: 44, height: 44, borderRadius: 12 },
        onClick: endVideoCall
      }, h(Icon, { name: 'phone-off', size: 18, color: 'white' }))
    )
  );
}

// ===== CONFERENCE VIEW =====
function ConferenceView({ addToast }) {
  const [confState, setConfState] = useState('idle');
  const [confUri, setConfUri] = useState('');
  const [participants, setParticipants] = useState([]);
  const [selfMuted, setSelfMuted] = useState(false);

  const createConf = () => {
    const room = 'conf-' + Math.floor(Math.random() * 9000 + 1000);
    setConfUri(room);
    setConfState('active');
    setParticipants([
      { id: '1', name: 'You', uri: 'sip:you@local', muted: false, speaking: true },
      { id: '2', name: 'Alice', uri: 'sip:alice@example.com', muted: false, speaking: false },
      { id: '3', name: 'Bob', uri: 'sip:bob@example.com', muted: true, speaking: false },
    ]);
    addToast(`Conference ${room} created`, 'success');
  };

  const joinConf = () => {
    if (!confUri) return;
    setConfState('active');
    setParticipants([
      { id: '1', name: 'You', uri: 'sip:you@local', muted: false, speaking: true },
    ]);
    addToast(`Joined conference ${confUri}`, 'success');
  };

  const leaveConf = () => {
    setConfState('idle');
    setParticipants([]);
    addToast('Left conference', 'info');
  };

  if (confState === 'idle') {
    return h('div', {
      style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 }
    },
      h('div', {
        style: {
          width: 80, height: 80, borderRadius: 24, background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: 8
        }
      }, h(Icon, { name: 'users', size: 36, color: 'var(--accent-green)' })),
      h('h2', { style: { fontSize: 22, fontWeight: 300 } }, 'Conference'),
      h('button', {
        className: 'pill-btn success',
        onClick: createConf
      }, h(Icon, { name: 'plus-circle', size: 16, color: 'white' }), 'Create Conference'),
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 } },
        h('div', { style: { width: 40, height: 1, background: 'var(--border-color)' } }),
        'or join existing',
        h('div', { style: { width: 40, height: 1, background: 'var(--border-color)' } })
      ),
      h('div', { style: { display: 'flex', gap: 8 } },
        h('input', {
          className: 'input-field mono',
          style: { width: 220, textAlign: 'center' },
          value: confUri,
          onChange: (e) => setConfUri(e.target.value),
          placeholder: 'Conference ID or URI'
        }),
        h('button', { className: 'pill-btn primary', onClick: joinConf },
          h(Icon, { name: 'log-in', size: 14, color: 'white' }), 'Join')
      )
    );
  }

  return h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column' } },
    h('div', {
      style: {
        padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }
    },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
        h(Icon, { name: 'users', size: 18, color: 'var(--accent-blue)' }),
        h('span', { style: { fontWeight: 500, fontSize: 15 } }, 'Conference'),
        h('span', { className: 'mono', style: { fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 } }, confUri)
      ),
      h('span', {
        style: {
          background: 'rgba(59,130,246,0.12)', padding: '4px 12px',
          borderRadius: 12, fontSize: 12, color: 'var(--accent-blue)',
          display: 'flex', alignItems: 'center', gap: 6
        }
      }, h(Icon, { name: 'users', size: 12 }), `${participants.length} participants`)
    ),
    h('div', {
      style: {
        flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 12, padding: 16, alignContent: 'start'
      }
    },
      participants.map(p =>
        h('div', {
          key: p.id,
          className: `panel-card ${p.speaking ? 'active-card' : ''}`,
          style: {
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            border: p.speaking ? '2px solid var(--accent-green)' : undefined,
            transition: 'border 0.3s'
          }
        },
          h(Avatar, { name: p.name, size: 48 }),
          h('div', { style: { fontWeight: 500, fontSize: 13 } }, p.name),
          h('div', {
            style: {
              fontSize: 10, display: 'flex', alignItems: 'center', gap: 4,
              color: p.muted ? 'var(--accent-red)' : 'var(--text-muted)'
            }
          },
            h(Icon, { name: p.muted ? 'mic-off' : 'mic', size: 11 }),
            p.muted ? 'Muted' : 'Active'
          )
        )
      )
    ),
    h('div', {
      style: {
        padding: 12, borderTop: '1px solid var(--border-color)',
        display: 'flex', justifyContent: 'center', gap: 10
      }
    },
      h('button', {
        className: `pill-btn ${selfMuted ? 'danger-outline' : ''}`,
        onClick: () => setSelfMuted(!selfMuted)
      }, h(Icon, { name: selfMuted ? 'mic-off' : 'mic', size: 14 }), selfMuted ? 'Unmute' : 'Mute'),
      h('button', {
        className: 'pill-btn',
        onClick: () => {
          setParticipants(prev => [...prev, {
            id: generateId(), name: 'New User ' + (prev.length),
            uri: 'sip:user@example.com', muted: false, speaking: false
          }]);
          addToast('Participant added (simulated)', 'success');
        }
      }, h(Icon, { name: 'user-plus', size: 14 }), 'Add'),
      h('button', {
        className: 'pill-btn danger',
        onClick: leaveConf
      }, h(Icon, { name: 'log-out', size: 14, color: 'white' }), 'Leave')
    )
  );
}

// ===== SETTINGS VIEW =====
function SettingsView({
  profiles,
  setProfiles,
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
}) {
  const [settingsTab, setSettingsTab] = useState('accounts');
  const [editingProfile, setEditingProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ ...defaultProfile });
  const [showPassword, setShowPassword] = useState(false);
  const [sipLogs, setSipLogs] = useState([]);

  const tabs = [
    { id: 'accounts', icon: 'user', label: 'SIP Accounts' },
    { id: 'audio', icon: 'headphones', label: 'Audio' },
    { id: 'video', icon: 'video', label: 'Video' },
    { id: 'network', icon: 'shield', label: 'Network' },
    { id: 'appearance', icon: 'palette', label: 'Appearance' },
    { id: 'debug', icon: 'terminal', label: 'Debug' },
  ];

  const saveProfile = () => {
    if (!profileForm.name.trim()) return;
    if (editingProfile) {
      setProfiles(prev => {
        const updated = prev.map(p => p.id === editingProfile.id ? { ...profileForm, id: editingProfile.id } : p);
        saveData('profiles', updated);
        return updated;
      });
      addToast('Profile updated', 'success');
    } else {
      const newProf = { ...profileForm, id: generateId() };
      setProfiles(prev => {
        const updated = [...prev, newProf];
        saveData('profiles', updated);
        if (prev.length === 0) {
          setActiveProfileId(newProf.id);
          saveData('active_profile', newProf.id);
        }
        return updated;
      });
      addToast('Profile saved', 'success');
    }
    setEditingProfile(null);
    setProfileForm({ ...defaultProfile });
  };

  const testConnection = () => {
    addToast('Testing connection...', 'info');
    onRequestRegister?.(profileForm);
    setSipLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] REGISTER sip:${profileForm.domain} SIP/2.0`]);
  };

  const updateSetting = (key, value) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      saveData('settings', updated);
      return updated;
    });
  };

  const renderField = (label, key, type = 'text', placeholder = '') => {
    return h('div', { style: { marginBottom: 12 } },
      h('label', { style: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block', fontWeight: 500 } }, label),
      type === 'password' ?
        h('div', { style: { position: 'relative' } },
          h('input', {
            className: 'input-field mono',
            type: showPassword ? 'text' : 'password',
            value: profileForm[key] || '',
            onChange: (e) => setProfileForm(prev => ({ ...prev, [key]: e.target.value })),
            placeholder
          }),
          h('button', {
            style: {
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
            },
            onClick: () => setShowPassword(!showPassword)
          }, h(Icon, { name: showPassword ? 'eye-off' : 'eye', size: 16 }))
        ) :
        h('input', {
          className: `input-field ${type === 'text' ? '' : 'mono'}`,
          type: 'text',
          value: profileForm[key] || '',
          onChange: (e) => setProfileForm(prev => ({ ...prev, [key]: e.target.value })),
          placeholder
        })
    );
  };

  return h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } },
    h('div', {
      style: {
        padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
        display: 'flex', gap: 4, overflowX: 'auto', flexShrink: 0
      }
    },
      tabs.map(tab =>
        h('button', {
          key: tab.id,
          className: `tab-btn ${settingsTab === tab.id ? 'active' : ''}`,
          onClick: () => setSettingsTab(tab.id),
          style: { display: 'flex', alignItems: 'center', gap: 6 }
        },
          h(Icon, { name: tab.icon, size: 13 }),
          tab.label
        )
      )
    ),
    h('div', { style: { flex: 1, overflowY: 'auto', padding: 20 } },

      // SIP ACCOUNTS
      settingsTab === 'accounts' && (editingProfile !== null ? (
        h('div', { className: 'animate-slide-in', style: { maxWidth: 500 } },
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 } },
            h('button', {
              style: { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' },
              onClick: () => { setEditingProfile(null); setProfileForm({ ...defaultProfile }); }
            }, h(Icon, { name: 'chevron-left', size: 18 })),
            h('div', { className: 'section-header' },
              h(Icon, { name: editingProfile?.id ? 'edit' : 'plus-circle', size: 18 }),
              editingProfile?.id ? 'Edit Profile' : 'New Profile'
            )
          ),
          renderField('Profile Name', 'name', 'text', 'Office FreeSWITCH'),
          renderField('SIP Server / Domain', 'domain', 'text', 'sip.myserver.com'),
          renderField('WebSocket URL', 'wsUrl', 'text', 'wss://sip.myserver.com:7443'),
          renderField('Username', 'username', 'text', '1001'),
          renderField('Password', 'password', 'password', '••••••'),
          renderField('Display Name', 'displayName', 'text', 'John Doe'),
          h('div', { style: { marginBottom: 12 } },
            h('label', { style: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block', fontWeight: 500 } }, 'Transport'),
            h('select', {
              className: 'input-field',
              value: profileForm.transport,
              onChange: (e) => setProfileForm(prev => ({ ...prev, transport: e.target.value }))
            },
              h('option', { value: 'WSS' }, 'WSS (Secure)'),
              h('option', { value: 'WS' }, 'WS')
            )
          ),
          h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } },
            h('label', { style: { fontSize: 13, color: 'var(--text-secondary)' } }, 'Register on startup'),
            h(Toggle, { value: profileForm.registerOnStartup, onChange: (v) => setProfileForm(prev => ({ ...prev, registerOnStartup: v })) })
          ),
          renderField('Registration Expiry (s)', 'registrationExpiry', 'text', '600'),
          renderField('Outbound Proxy', 'outboundProxy', 'text', '(optional)'),
          renderField('STUN Server', 'stunServer', 'text', 'stun:stun.l.google.com:19302'),
          renderField('TURN Server', 'turnServer', 'text', '(optional)'),
          renderField('TURN Username', 'turnUsername', 'text', '(optional)'),
          renderField('TURN Credential', 'turnCredential', 'password', '(optional)'),
          renderField('ICE Gathering Timeout (ms)', 'iceTimeout', 'text', '5000'),
          h('div', { style: { display: 'flex', gap: 8, marginTop: 16 } },
            h('button', { className: 'pill-btn primary', onClick: saveProfile },
              h(Icon, { name: 'check-circle', size: 14, color: 'white' }), 'Save Profile'),
            h('button', { className: 'pill-btn', onClick: testConnection },
              h(Icon, { name: 'zap', size: 14 }), 'Test Connection')
          )
        )
      ) : (
        h('div', null,
          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } },
            h('div', { className: 'section-header' },
              h(Icon, { name: 'user', size: 18 }),
              'Server Profiles'
            ),
            h('button', {
              className: 'pill-btn primary',
              style: { fontSize: 12 },
              onClick: () => { setEditingProfile({}); setProfileForm({ ...defaultProfile }); }
            }, h(Icon, { name: 'plus', size: 14, color: 'white' }), 'Add Profile')
          ),
          profiles.length === 0 && h('div', { className: 'empty-state' },
            h(Icon, { name: 'user', size: 40 }),
            h('div', { className: 'empty-state-text' }, 'No server profiles configured. Add one to get started!')
          ),
          profiles.map(p =>
            h('div', {
              key: p.id,
              className: `panel-card ${p.id === activeProfileId ? 'active-card' : ''}`,
              style: { marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }
            },
              h('div', {
                className: `status-dot ${p.id === activeProfileId ? (regStatus === 'registered' ? 'green' : regStatus === 'registering' ? 'yellow' : 'red') : 'red'}`
              }),
              h('div', { style: { flex: 1 } },
                h('div', { style: { fontWeight: 500, fontSize: 14 } }, p.name),
                h('div', { className: 'mono', style: { fontSize: 11, color: 'var(--text-muted)' } },
                  `${p.username}@${p.domain} (${p.transport})`
                )
              ),
              h('div', { style: { display: 'flex', gap: 6 } },
                p.id !== activeProfileId && h('button', {
                  className: 'pill-btn green-outline',
                  style: { padding: '4px 12px', fontSize: 11 },
                  onClick: () => {
                    setActiveProfileId(p.id);
                    saveData('active_profile', p.id);
                    onRequestRegister?.(p);
                    addToast(`Switched to ${p.name}`, 'success');
                  }
                }, 'Activate'),
                h('button', {
                  className: 'icon-action-btn blue',
                  style: { width: 28, height: 28 },
                  onClick: () => { setEditingProfile(p); setProfileForm({ ...p }); }
                }, h(Icon, { name: 'edit', size: 12 })),
                h('button', {
                  className: 'icon-action-btn red',
                  style: { width: 28, height: 28 },
                  onClick: () => {
                    setProfiles(prev => {
                      const updated = prev.filter(x => x.id !== p.id);
                      saveData('profiles', updated);
                      if (activeProfileId === p.id && updated.length > 0) {
                        setActiveProfileId(updated[0].id);
                        saveData('active_profile', updated[0].id);
                      }
                      return updated;
                    });
                    addToast('Profile deleted', 'info');
                  }
                }, h(Icon, { name: 'trash', size: 12 }))
              )
            )
          ),
          h('div', {
            style: {
              marginTop: 24, padding: 16, borderRadius: 10,
              background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)'
            }
          },
            h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 } },
              h(Icon, { name: 'wrench', size: 14, color: 'var(--accent-blue)' }),
              h('h4', { style: { fontSize: 13, fontWeight: 500, color: 'var(--accent-blue)' } }, 'Integration Guide')
            ),
            h('p', { style: { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 8 } },
              activeBackend === "sipjs"
                ? "sip.js backend is enabled. Ensure your profile and WebSocket endpoint are correct."
                : "Simulated backend is enabled. Switch to sip.js backend in Debug tab for real signaling."
            ),
            h('pre', {
              className: 'mono',
              style: {
                fontSize: 11, color: '#10b981', background: '#0a0c10',
                padding: 12, borderRadius: 8, overflowX: 'auto', lineHeight: 1.5
              }
            },
              `bun add sip.js\n\nSet "SIP Backend" to "sipjs" in Debug tab,\nthen Re-register using your active profile.`
            )
          )
        )
      )),

      // AUDIO SETTINGS
      settingsTab === 'audio' && h('div', { style: { maxWidth: 500 } },
        h('div', { className: 'section-header', style: { marginBottom: 16 } },
          h(Icon, { name: 'headphones', size: 20 }),
          'Audio Settings'
        ),
        [
          { label: 'Ringtone', key: 'ringtone', type: 'select', options: ['classic', 'modern', 'soft', 'vibrate'] },
          { label: 'DTMF Mode', key: 'dtmfMode', type: 'select', options: ['rfc2833', 'inband', 'sip_info'] },
        ].map(item =>
          h('div', { key: item.key, style: { marginBottom: 14 } },
            h('label', { style: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block', fontWeight: 500 } }, item.label),
            h('select', {
              className: 'input-field',
              value: settings[item.key],
              onChange: (e) => updateSetting(item.key, e.target.value)
            },
              item.options.map(o => h('option', { key: o, value: o }, o))
            )
          )
        ),
        h('div', { style: { marginBottom: 14 } },
          h('label', { style: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block', fontWeight: 500 } },
            `Ring Volume: ${Math.round(settings.ringVolume * 100)}%`
          ),
          h('input', {
            type: 'range', min: 0, max: 1, step: 0.05,
            value: settings.ringVolume,
            onChange: (e) => updateSetting('ringVolume', parseFloat(e.target.value)),
            style: { width: '100%', accentColor: 'var(--accent-blue)' }
          })
        ),
        [
          { label: 'Auto Answer', key: 'autoAnswer' },
          { label: 'Echo Cancellation', key: 'echoCancellation' },
          { label: 'Noise Suppression', key: 'noiseSuppression' },
        ].map(item =>
          h('div', {
            key: item.key,
            style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }
          },
            h('label', { style: { fontSize: 13, color: 'var(--text-secondary)' } }, item.label),
            h(Toggle, { value: settings[item.key], onChange: (v) => updateSetting(item.key, v) })
          )
        )
      ),

      // VIDEO SETTINGS
      settingsTab === 'video' && h('div', { style: { maxWidth: 500 } },
        h('div', { className: 'section-header', style: { marginBottom: 16 } },
          h(Icon, { name: 'video', size: 20 }),
          'Video Settings'
        ),
        h('div', { style: { marginBottom: 14 } },
          h('label', { style: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block', fontWeight: 500 } }, 'Preferred Resolution'),
          h('select', {
            className: 'input-field',
            value: settings.videoResolution,
            onChange: (e) => updateSetting('videoResolution', e.target.value)
          },
            ['480p', '720p', '1080p'].map(o => h('option', { key: o, value: o }, o))
          )
        ),
        h('div', {
          style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }
        },
          h('label', { style: { fontSize: 13, color: 'var(--text-secondary)' } }, 'Self-view during calls'),
          h(Toggle, { value: settings.selfView, onChange: (v) => updateSetting('selfView', v) })
        )
      ),

      // NETWORK
      settingsTab === 'network' && h('div', { style: { maxWidth: 500 } },
        h('div', { className: 'section-header', style: { marginBottom: 16 } },
          h(Icon, { name: 'shield', size: 20 }),
          'Network & Advanced'
        ),
        h('div', { style: { marginBottom: 14 } },
          h('label', { style: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block', fontWeight: 500 } }, 'ICE Candidate Policy'),
          h('select', {
            className: 'input-field',
            value: settings.iceCandidatePolicy,
            onChange: (e) => updateSetting('iceCandidatePolicy', e.target.value)
          },
            ['all', 'relay'].map(o => h('option', { key: o, value: o }, o))
          )
        ),
        h('div', { style: { marginBottom: 14 } },
          h('label', { style: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block', fontWeight: 500 } }, 'SRTP Mode'),
          h('select', {
            className: 'input-field',
            value: settings.srtpMode,
            onChange: (e) => updateSetting('srtpMode', e.target.value)
          },
            ['optional', 'required', 'disabled'].map(o => h('option', { key: o, value: o }, o))
          )
        ),
        [
          { label: 'Session Timers', key: 'sessionTimers' },
          { label: 'Debug SIP Trace Logging', key: 'debugLog' },
        ].map(item =>
          h('div', {
            key: item.key,
            style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }
          },
            h('label', { style: { fontSize: 13, color: 'var(--text-secondary)' } }, item.label),
            h(Toggle, { value: settings[item.key], onChange: (v) => updateSetting(item.key, v) })
          )
        )
      ),

      // APPEARANCE
      settingsTab === 'appearance' && h('div', { style: { maxWidth: 500 } },
        h('div', { className: 'section-header', style: { marginBottom: 16 } },
          h(Icon, { name: 'palette', size: 20 }),
          'Appearance'
        ),
        h('div', { style: { marginBottom: 14 } },
          h('label', { style: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, display: 'block', fontWeight: 500 } }, 'Accent Color'),
          h('div', { style: { display: 'flex', gap: 10 } },
            ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'].map(c =>
              h('div', {
                key: c,
                style: {
                  width: 36, height: 36, borderRadius: 10, background: c, cursor: 'pointer',
                  border: settings.accentColor === c ? '3px solid white' : '3px solid transparent',
                  transition: 'all 0.15s',
                  boxShadow: settings.accentColor === c ? `0 0 12px ${c}66` : 'none'
                },
                onClick: () => updateSetting('accentColor', c)
              })
            )
          )
        ),
        h('div', { style: { marginBottom: 14 } },
          h('label', { style: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block', fontWeight: 500 } }, 'Font Size'),
          h('select', {
            className: 'input-field',
            value: settings.fontSize,
            onChange: (e) => updateSetting('fontSize', e.target.value)
          },
            ['small', 'medium', 'large'].map(o => h('option', { key: o, value: o }, o))
          )
        ),
        h('div', {
          style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }
        },
          h('label', { style: { fontSize: 13, color: 'var(--text-secondary)' } }, 'Compact Mode'),
          h(Toggle, { value: settings.compact, onChange: (v) => updateSetting('compact', v) })
        )
      ),

      // DEBUG
      settingsTab === 'debug' && h('div', null,
        h('div', { className: 'section-header', style: { marginBottom: 16 } },
          h(Icon, { name: 'terminal', size: 20 }),
          'Debug Tools'
        ),
        h('div', { style: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' } },
          h('button', {
            className: 'pill-btn warn-outline',
            onClick: simulateIncoming
          }, h(Icon, { name: 'phone-incoming', size: 14 }), 'Simulate Incoming Call'),
          h('button', {
            className: 'pill-btn green-outline',
            onClick: () => {
              onRequestRegister?.();
              addToast('Re-registering...', 'info');
            }
          }, h(Icon, { name: 'rotate-cw', size: 14 }), 'Re-register'),
          h('button', {
            className: 'pill-btn danger-outline',
            onClick: () => {
              onRequestUnregister?.();
              addToast('Unregistered', 'info');
            }
          }, h(Icon, { name: 'phone-off', size: 14 }), 'Unregister')
        ),
        h('div', { style: { marginBottom: 14 } },
          h('label', { style: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block', fontWeight: 500 } }, 'SIP Backend'),
          h('select', {
            className: 'input-field',
            style: { maxWidth: 260 },
            value: settings.sipBackend || "simulated",
            onChange: (e) => updateSetting("sipBackend", e.target.value)
          },
            h('option', { value: 'simulated' }, 'simulated'),
            h('option', { value: 'sipjs' }, 'sipjs')
          ),
          h('div', { className: 'mono', style: { fontSize: 11, color: 'var(--text-muted)', marginTop: 4 } }, `active: ${activeBackend}`)
        ),
        h('div', { style: { marginBottom: 14 } },
          h('label', { style: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block', fontWeight: 500 } }, 'Log Level'),
          h('select', {
            className: 'input-field',
            style: { maxWidth: 200 },
            value: settings.logLevel,
            onChange: (e) => updateSetting('logLevel', e.target.value)
          },
            ['error', 'warn', 'info', 'debug'].map(o => h('option', { key: o, value: o }, o))
          )
        ),
        sipLogs.length > 0 && h('div', null,
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 } },
            h(Icon, { name: 'terminal', size: 14, color: 'var(--accent-green)' }),
            h('h4', { style: { fontSize: 13, fontWeight: 500, color: 'var(--accent-green)' } }, 'SIP Trace')
          ),
          h('pre', {
            className: 'mono',
            style: {
              fontSize: 11, color: '#10b981', background: '#0a0c10',
              padding: 12, borderRadius: 8, maxHeight: 300, overflowY: 'auto', lineHeight: 1.6
            }
          }, sipLogs.join('\n'))
        )
      )
    )
  );
}

// ===== INCOMING CALL OVERLAY =====
function IncomingCallOverlay({ caller, onAnswer, onAnswerVideo, onDecline, onIgnore }) {
  return h('div', { className: 'incoming-overlay' },
    h('div', {
      className: 'incoming-avatar',
      style: { background: 'linear-gradient(135deg, var(--accent-green), #059669)', marginBottom: 24 }
    }, getInitials(caller.name)),
    h('div', { style: { fontSize: 28, fontWeight: 200, marginBottom: 4 } }, caller.name),
    h('div', { className: 'mono', style: { fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 } }, caller.uri),
    h('div', {
      style: {
        fontSize: 14, color: 'var(--accent-green)', marginBottom: 40,
        display: 'flex', alignItems: 'center', gap: 8
      }
    },
      h(Icon, { name: 'phone-call', size: 16, color: 'var(--accent-green)' }),
      'Incoming call...'
    ),
    h('div', { style: { display: 'flex', gap: 20, alignItems: 'center' } },
      h('div', { style: { textAlign: 'center' } },
        h('button', { className: 'call-btn call-btn-red', onClick: onDecline, style: { marginBottom: 8 } },
          h(Icon, { name: 'phone-off', size: 22, color: 'white' })
        ),
        h('div', { style: { fontSize: 11, color: 'var(--text-muted)' } }, 'Decline')
      ),
      h('div', { style: { textAlign: 'center' } },
        h('button', {
          className: 'call-btn call-btn-green',
          onClick: onAnswer,
          style: { width: 72, height: 72, marginBottom: 8 }
        }, h(Icon, { name: 'phone', size: 28, color: 'white' })),
        h('div', { style: { fontSize: 11, color: 'var(--text-muted)' } }, 'Answer')
      ),
      h('div', { style: { textAlign: 'center' } },
        h('button', { className: 'call-btn call-btn-blue', onClick: onAnswerVideo, style: { marginBottom: 8 } },
          h(Icon, { name: 'video', size: 22, color: 'white' })
        ),
        h('div', { style: { fontSize: 11, color: 'var(--text-muted)' } }, 'Video')
      )
    ),
    h('button', {
      style: {
        marginTop: 24, padding: '8px 24px', borderRadius: 8, background: 'transparent',
        border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer',
        fontSize: 13, fontFamily: 'IBM Plex Sans'
      },
      onClick: onIgnore
    }, 'Ignore')
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
