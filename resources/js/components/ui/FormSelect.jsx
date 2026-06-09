import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

const ITEM_H = 36;
const MAX_VISIBLE = 6;

const BUTTON_CLASS = 'w-full h-12 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 text-body-md outline-none transition focus:border-primary focus:ring-1 focus:ring-primary flex items-center justify-between gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

export default function FormSelect({
  label,
  name,
  id,
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  required,
  disabled,
  error,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });
  const [highlighted, setHighlighted] = useState(-1);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const highlightedRef = useRef(-1);

  highlightedRef.current = highlighted;

  const current = value != null && value !== ''
    ? options.find(o => (typeof o === 'object' ? o.value : o) === value)
    : null;

  const displayLabel = current
    ? (typeof current === 'object' ? current.label : current)
    : placeholder;

  const close = useCallback(() => {
    setOpen(false);
    setHighlighted(-1);
  }, []);

  const calcPos = useCallback(() => {
    if (!triggerRef.current) return { top: 0, left: 0, width: 0 };
    const rect = triggerRef.current.getBoundingClientRect();
    const estH = Math.min(options.length * ITEM_H + 8, MAX_VISIBLE * ITEM_H + 8);
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = rect.bottom + 4;
    let left = rect.left;
    const width = rect.width;

    if (top + estH > vh && rect.top - estH - 4 > 0) {
      top = rect.top - estH - 4;
    }

    if (left + width > vw) {
      left = Math.max(vw - width - 8, 4);
    }

    return { top: Math.round(top), left: Math.round(left), width: Math.round(width) };
  }, [options.length]);

  const openMenu = () => {
    if (disabled) return;
    setHighlighted(-1);
    setMenuPos(calcPos());
    setOpen(true);
  };

  const pick = useCallback((opt) => {
    const val = typeof opt === 'object' ? opt.value : opt;
    onChange({ target: { name, value: val } });
    close();
  }, [onChange, name, close]);

  useEffect(() => {
    if (!open) return;

    const onMouseDown = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        close();
      }
    };

    const onScroll = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      close();
    };
    const onResize = () => close();
    const onKeyDown = (e) => {
      if (e.key === 'Escape') { close(); return; }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlighted(p => (p + 1 >= options.length ? 0 : p + 1));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlighted(p => (p - 1 < 0 ? options.length - 1 : p - 1));
        return;
      }

      if (e.key === 'Enter' && highlightedRef.current >= 0 && highlightedRef.current < options.length) {
        e.preventDefault();
        pick(options[highlightedRef.current]);
      }
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close, options, pick]);

  useEffect(() => {
    if (!open || highlighted < 0 || !menuRef.current) return;
    const el = menuRef.current.querySelector(`[data-idx="${highlighted}"]`);
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [highlighted, open]);

  const estH = Math.min(options.length * ITEM_H + 8, MAX_VISIBLE * ITEM_H + 8);

  return (
    <div className="relative w-full">
      {label && (
        <label className="block font-label-md text-label-md text-on-surface-variant mb-2">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      <button
        ref={triggerRef}
        type="button"
        onClick={openMenu}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${BUTTON_CLASS} ${className} ${value != null && value !== '' ? 'text-on-surface' : 'text-on-surface-variant'}`}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown className={`w-4 h-4 text-on-surface-variant shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="listbox"
          style={{
            position: 'fixed',
            top: `${menuPos.top}px`,
            left: `${menuPos.left}px`,
            width: `${menuPos.width}px`,
            zIndex: 9999,
          }}
          className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg overflow-hidden"
        >
          <div className="overflow-y-auto" style={{ maxHeight: `${estH}px` }}>
            {options.length === 0 ? (
              <div className="px-4 py-3 text-body-sm text-on-surface-variant">No options available</div>
            ) : (
              options.map((opt, idx) => {
                const val = typeof opt === 'object' ? opt.value : opt;
                const lbl = typeof opt === 'object' ? opt.label : opt;
                const isSelected = val === value;
                const isHighlighted = idx === highlighted;
                return (
                  <button
                    key={idx}
                    data-idx={idx}
                    role="option"
                    aria-selected={isSelected}
                    type="button"
                    onClick={() => pick(opt)}
                    className={`w-full px-4 py-2.5 text-body-sm text-left transition-colors ${
                      isHighlighted ? 'bg-primary-fixed' : ''
                    } ${
                      isSelected
                        ? 'bg-primary-container text-on-primary-container font-medium'
                        : 'text-on-surface hover:bg-surface-container-low'
                    } cursor-pointer`}
                    onMouseEnter={() => setHighlighted(idx)}
                  >
                    {lbl}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-body-sm text-error flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </p>
      )}
    </div>
  );
}
