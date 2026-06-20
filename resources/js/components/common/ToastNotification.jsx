import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, FilePlus, XCircle, CheckCircle, CreditCard, RefreshCw, X } from 'lucide-react';

const icons = {
  new_request: FilePlus,
  request_cancelled: XCircle,
  request_claimed: CheckCircle,
  payment_verified: CreditCard,
  status_update: RefreshCw,
};

const colors = {
  new_request: 'border-l-blue-500',
  request_cancelled: 'border-l-red-500',
  request_claimed: 'border-l-emerald-500',
  payment_verified: 'border-l-emerald-500',
  status_update: 'border-l-amber-500',
};

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Audio not supported
  }
}

export default function ToastNotification() {
  const [toasts, setToasts] = useState([]);
  const [dismissing, setDismissing] = useState(new Set());
  const lastIdRef = useRef(null);
  const initialLoadRef = useRef(true);

  const addToast = useCallback((n) => {
    playNotificationSound();
    const toastId = Date.now() + Math.random();
    setToasts(prev => [...prev, { ...n, toastId }]);
    setTimeout(() => {
      setDismissing(prev => new Set(prev).add(toastId));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.toastId !== toastId));
        setDismissing(prev => { const next = new Set(prev); next.delete(toastId); return next; });
      }, 300);
    }, 4700);
  }, []);

  const dismiss = useCallback((id) => {
    setDismissing(prev => new Set(prev).add(id));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.toastId !== id));
      setDismissing(prev => { const next = new Set(prev); next.delete(id); return next; });
    }, 300);
  }, []);

  useEffect(() => {
    let mounted = true;

    const check = () => {
      fetch('/admin/api/notifications', { credentials: 'same-origin' })
        .then(res => res.json())
        .then(data => {
          if (!mounted) return;
          const items = data.notifications || [];
          if (items.length === 0) return;

          const currentMax = Math.max(...items.map(n => n.id));

          if (initialLoadRef.current) {
            initialLoadRef.current = false;
            lastIdRef.current = currentMax;
            return;
          }

          const newer = items.filter(n => n.id > lastIdRef.current && !n.is_read);
          if (newer.length > 0) {
            lastIdRef.current = currentMax;
            newer.forEach(n => addToast(n));
          } else if (currentMax > lastIdRef.current) {
            lastIdRef.current = currentMax;
          }
        })
        .catch(() => {});
    };

    check();
    const interval = setInterval(check, 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(t => {
        const Icon = icons[t.type] || Bell;
        const borderColor = colors[t.type] || 'border-l-slate-500';
        const isDismissing = dismissing.has(t.toastId);
        return (
          <div
            key={t.toastId}
            className={`pointer-events-auto bg-white rounded-lg shadow-lg border border-slate-200 border-l-4 ${borderColor} p-4 flex items-start gap-3 ${
              isDismissing ? 'animate-[slideOutRight_0.3s_ease-in_forwards]' : 'animate-[slideInRight_0.3s_ease-out]'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              <Icon className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">{t.title}</p>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.message}</p>
            </div>
            <button onClick={() => dismiss(t.toastId)} className="shrink-0 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
