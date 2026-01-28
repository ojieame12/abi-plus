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

  // Store/restore focus
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
    } else if (previousActiveElement.current instanceof HTMLElement) {
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, [isOpen]);

  // Escape key closes
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
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
          />

          {/* Drawer panel */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute inset-0 bg-white z-40 flex flex-col overflow-hidden"
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
