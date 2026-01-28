// ArtifactOverlayDrawer — Overlay drawer scoped to a relatively-positioned parent.
// Slides over the report content while keeping it mounted underneath,
// preserving scroll position. Used for deep research report action forms.

import { useEffect, useRef, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ArtifactOverlayDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export const ArtifactOverlayDrawer = ({
  isOpen,
  onClose,
  children,
}: ArtifactOverlayDrawerProps) => {
  const previousActiveElement = useRef<Element | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  // Store previous focus on open, restore on close
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
    } else if (previousActiveElement.current instanceof HTMLElement) {
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, [isOpen]);

  // Move focus into the drawer on open
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      // Find first focusable element (button, input, textarea, etc.)
      const focusable = drawerRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) {
        // Delay to allow animation to start
        requestAnimationFrame(() => focusable.focus());
      }
    }
  }, [isOpen]);

  // Escape key closes
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }

      // Focus trap: Tab/Shift+Tab stays within drawer
      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/15 backdrop-blur-[2px] z-30"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.div
            ref={drawerRef}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute inset-0 bg-white z-40 flex flex-col overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ArtifactOverlayDrawer;
