'use client';

import { useEffect, useId, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusableElements(node) {
  if (!node) return [];
  return Array.from(node.querySelectorAll(FOCUSABLE_SELECTOR)).filter((element) => (
    !element.hasAttribute('disabled')
    && element.getAttribute('aria-hidden') !== 'true'
    && element.offsetParent !== null
  ));
}

export function useAccessibleDialog({ open, onClose, modal = true }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    const moveFocusInside = () => {
      const focusable = getFocusableElements(dialog);
      const target = focusable.find((element) => element !== closeButtonRef.current)
        || closeButtonRef.current
        || dialog;
      target?.focus?.();
    };

    const frame = window.requestAnimationFrame(moveFocusInside);

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = getFocusableElements(dialog);
      if (!focusable.length) {
        event.preventDefault();
        dialog?.focus?.();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog?.addEventListener('keydown', handleKeyDown);
    if (modal) document.body.style.overflow = 'hidden';

    return () => {
      window.cancelAnimationFrame(frame);
      dialog?.removeEventListener('keydown', handleKeyDown);
      if (modal) document.body.style.overflow = previousOverflow;
      if (
        previousFocus
        && typeof previousFocus.focus === 'function'
        && document.contains(previousFocus)
        && previousFocus.getAttribute?.('aria-hidden') !== 'true'
      ) {
        window.requestAnimationFrame(() => previousFocus.focus());
      }
    };
  }, [modal, onClose, open]);

  return {
    dialogRef,
    closeButtonRef,
    titleId,
    dialogProps: {
      role: 'dialog',
      'aria-modal': modal || undefined,
      'aria-labelledby': titleId,
      tabIndex: -1,
    },
  };
}
