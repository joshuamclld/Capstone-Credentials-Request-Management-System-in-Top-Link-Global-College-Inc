import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

const ITEM_H = 36;
const MAX_VISIBLE = 6;

export default function DashboardDropdown({
    options = [],
    value,
    onChange,
    placeholder = 'Select...',
    disabled = false,
    className = '',
    labelKey = 'label',
    valueKey = 'value',
    optionDisabled = null,
    disabledReason = null,
    positionFixed = true,
}) {
    const [open, setOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });
    const [highlighted, setHighlighted] = useState(-1);
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const highlightedRef = useRef(-1);

    highlightedRef.current = highlighted;

    const current = value != null
        ? options.find(o => (typeof o === 'object' ? o[valueKey] : o) === value)
        : null;

    const displayLabel = current
        ? (typeof current === 'object' ? current[labelKey] : current)
        : placeholder;

    const close = useCallback(() => {
        setOpen(false);
        setHighlighted(-1);
        triggerRef.current?.focus();
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
        const val = typeof opt === 'object' ? opt[valueKey] : opt;
        if (optionDisabled && optionDisabled(opt)) return;
        onChange(val);
        close();
    }, [onChange, optionDisabled, valueKey, close]);

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
                const opt = options[highlightedRef.current];
                if (!(optionDisabled && optionDisabled(opt))) {
                    pick(opt);
                }
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
    }, [open, close, options, optionDisabled, pick]);

    useEffect(() => {
        if (!open || highlighted < 0 || !menuRef.current) return;
        const el = menuRef.current.querySelector(`[data-idx="${highlighted}"]`);
        if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [highlighted, open]);

    const estH = Math.min(options.length * ITEM_H + 8, MAX_VISIBLE * ITEM_H + 8);

    return (
        <div className={`relative ${className}`} ref={triggerRef}>
            <button
                type="button"
                onClick={openMenu}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMenu(); } }}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 flex items-center justify-between gap-2 cursor-pointer ${disabled
                        ? 'opacity-50 cursor-not-allowed bg-slate-50'
                        : 'hover:border-slate-400'
                    } ${value != null ? 'text-slate-700' : 'text-slate-400'}`}
            >
                <span className="truncate">{displayLabel}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div
                    ref={menuRef}
                    role="listbox"
                    style={positionFixed ? {
                        position: 'fixed',
                        top: `${menuPos.top}px`,
                        left: `${menuPos.left}px`,
                        width: `${menuPos.width}px`,
                        zIndex: 9999,
                    } : {}}
                    className={
                        positionFixed
                            ? 'bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden'
                            : 'absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden'
                    }
                >
                    <div className="overflow-y-auto" style={{ maxHeight: `${estH}px` }}>
                        {options.length === 0 ? (
                            <div className="px-3 py-2.5 text-sm text-slate-400">No options available</div>
                        ) : (
                            options.map((opt, idx) => {
                                const val = typeof opt === 'object' ? opt[valueKey] : opt;
                                const lbl = typeof opt === 'object' ? opt[labelKey] : opt;
                                const isSelected = val === value;
                                const locked = optionDisabled ? optionDisabled(opt) : false;
                                const reason = disabledReason ? disabledReason(opt) : '';
                                const isHighlighted = idx === highlighted;
                                return (
                                    <button
                                        key={idx}
                                        data-idx={idx}
                                        role="option"
                                        aria-selected={isSelected}
                                        type="button"
                                        onClick={() => { if (!locked) pick(opt); }}
                                        disabled={locked}
                                        className={`w-full px-3 py-2.5 text-sm text-left transition-colors ${isHighlighted && !locked ? 'bg-emerald-100' : ''
                                            } ${isSelected
                                                ? 'bg-emerald-50 text-emerald-800 font-medium'
                                                : 'text-slate-700 hover:bg-slate-50'
                                            } ${locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                        onMouseEnter={() => setHighlighted(idx)}
                                    >
                                        {lbl}
                                        {locked && reason && (
                                            <span className="text-xs text-slate-400 ml-1">({reason})</span>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
