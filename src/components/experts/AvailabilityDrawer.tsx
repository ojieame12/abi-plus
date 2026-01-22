// AvailabilityDrawer - Quick availability management for experts
// Matches CreditDrawer floating card aesthetic

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  Calendar,
  Check,
  Moon,
  Sun,
  Coffee,
  Plane,
} from 'lucide-react';

// Shared shadow for floating card aesthetic
const cardShadow = '0 4px 20px -8px rgba(148, 163, 184, 0.15)';

type AvailabilityStatus = 'available' | 'busy' | 'offline';

interface AvailabilitySettings {
  status: AvailabilityStatus;
  autoReplyEnabled: boolean;
  autoReplyMessage: string;
  workingHours: {
    start: string;
    end: string;
  };
  timezone: string;
  vacationMode: boolean;
  vacationUntil?: string;
}

interface AvailabilityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: AvailabilitySettings;
  onSave: (settings: AvailabilitySettings) => void;
}

const STATUS_OPTIONS: { value: AvailabilityStatus; label: string; description: string; Icon: typeof Check; color: string; activeBg: string }[] = [
  {
    value: 'available',
    label: 'Available',
    description: 'Accepting new requests',
    Icon: Check,
    color: 'text-emerald-500',
    activeBg: 'bg-emerald-50 border-emerald-200'
  },
  {
    value: 'busy',
    label: 'Busy',
    description: 'Limited availability',
    Icon: Coffee,
    color: 'text-amber-500',
    activeBg: 'bg-amber-50 border-amber-200'
  },
  {
    value: 'offline',
    label: 'Offline',
    description: 'Not accepting requests',
    Icon: Moon,
    color: 'text-slate-500',
    activeBg: 'bg-slate-100 border-slate-200'
  },
];

export function AvailabilityDrawer({
  isOpen,
  onClose,
  currentSettings,
  onSave,
}: AvailabilityDrawerProps) {
  const [settings, setSettings] = useState<AvailabilitySettings>(currentSettings);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Reset settings when drawer opens
  useEffect(() => {
    if (isOpen) {
      setSettings(currentSettings);
    }
  }, [isOpen, currentSettings]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      closeButtonRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    } else {
      previousActiveElement.current?.focus();
    }
  }, [isOpen, onClose]);

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(currentSettings);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#fafafa] shadow-2xl z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="availability-drawer-title"
          >
            {/* Header - Gradient hero style */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-100 via-slate-50 to-purple-50" />
              <div className="relative px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-white shadow-sm border border-white/60">
                      <Clock className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                      <h2 id="availability-drawer-title" className="text-lg font-medium text-slate-700">
                        Availability
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Manage when clients can reach you</p>
                    </div>
                  </div>
                  <button
                    ref={closeButtonRef}
                    onClick={onClose}
                    aria-label="Close availability drawer"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 bg-white/60 hover:bg-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Status Selection */}
              <div
                className="p-5 rounded-[20px] bg-white border border-slate-100/60"
                style={{ boxShadow: cardShadow }}
              >
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">
                  Current Status
                </h3>
                <div className="space-y-2">
                  {STATUS_OPTIONS.map((option) => {
                    const isSelected = settings.status === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setSettings({ ...settings, status: option.value })}
                        className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                          isSelected ? option.activeBg : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-white' : 'bg-white'
                          }`}>
                            <option.Icon className={`w-4 h-4 ${isSelected ? option.color : 'text-slate-400'}`} />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${isSelected ? 'text-slate-700' : 'text-slate-600'}`}>
                              {option.label}
                            </p>
                            <p className="text-xs text-slate-400">{option.description}</p>
                          </div>
                          {isSelected && (
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${option.color.replace('text-', 'bg-')}`}>
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Working Hours */}
              <div
                className="p-5 rounded-[20px] bg-white border border-slate-100/60"
                style={{ boxShadow: cardShadow }}
              >
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">
                  Working Hours
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-1.5 block">Start</label>
                    <div className="relative">
                      <Sun className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="time"
                        value={settings.workingHours.start}
                        onChange={(e) => setSettings({
                          ...settings,
                          workingHours: { ...settings.workingHours, start: e.target.value }
                        })}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300"
                      />
                    </div>
                  </div>
                  <span className="text-slate-300 mt-5">—</span>
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-1.5 block">End</label>
                    <div className="relative">
                      <Moon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="time"
                        value={settings.workingHours.end}
                        onChange={(e) => setSettings({
                          ...settings,
                          workingHours: { ...settings.workingHours, end: e.target.value }
                        })}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  {settings.timezone}
                </p>
              </div>

              {/* Vacation Mode */}
              <div
                className="p-5 rounded-[20px] bg-white border border-slate-100/60"
                style={{ boxShadow: cardShadow }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      settings.vacationMode ? 'bg-blue-50' : 'bg-slate-50'
                    }`}>
                      <Plane className={`w-4 h-4 ${settings.vacationMode ? 'text-blue-500' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Vacation Mode</p>
                      <p className="text-xs text-slate-400">Pause all incoming requests</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, vacationMode: !settings.vacationMode })}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      settings.vacationMode ? 'bg-blue-500' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        settings.vacationMode ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                {settings.vacationMode && (
                  <div className="pt-3 border-t border-slate-100">
                    <label className="text-xs text-slate-500 mb-1.5 block">Return date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="date"
                        value={settings.vacationUntil || ''}
                        onChange={(e) => setSettings({ ...settings, vacationUntil: e.target.value })}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Auto-Reply */}
              <div
                className="p-5 rounded-[20px] bg-white border border-slate-100/60"
                style={{ boxShadow: cardShadow }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Auto-Reply
                  </h3>
                  <button
                    onClick={() => setSettings({ ...settings, autoReplyEnabled: !settings.autoReplyEnabled })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      settings.autoReplyEnabled
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {settings.autoReplyEnabled ? 'On' : 'Off'}
                  </button>
                </div>
                <textarea
                  value={settings.autoReplyMessage}
                  onChange={(e) => setSettings({ ...settings, autoReplyMessage: e.target.value })}
                  disabled={!settings.autoReplyEnabled}
                  placeholder="Thanks for reaching out! I'll get back to you within 24 hours..."
                  className={`w-full h-20 p-3 rounded-xl border text-sm resize-none transition-colors ${
                    settings.autoReplyEnabled
                      ? 'bg-slate-50 border-slate-100 text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300'
                      : 'bg-slate-50/50 border-slate-100/50 text-slate-400 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
                  hasChanges
                    ? 'bg-violet-600 text-white hover:bg-violet-700'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default AvailabilityDrawer;
