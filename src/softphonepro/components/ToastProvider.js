import React, { useCallback, useState } from "react";
import { generateId } from "../lib/utils";
import { Icon } from "./Icon";

const h = React.createElement;
export const ToastContext = React.createContext();

export function ToastProvider({ children }) {
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

export const useToast = () => React.useContext(ToastContext);

