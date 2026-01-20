// Alert Configuration Artifact
// Action panel for setting up risk alerts

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, TrendingUp, AlertTriangle, Mail, Smartphone, Check } from 'lucide-react';
import {
  ArtifactSection,
  ArtifactFooter,
  FormGroup,
  TextInput,
  SelectInput,
  Toggle,
  RadioGroup,
} from '../primitives';

// ============================================
// TYPES
// ============================================

interface AlertConfig {
  name: string;
  triggerType: 'threshold' | 'change' | 'any_change';
  thresholdValue?: number;
  thresholdDirection?: 'above' | 'below';
  changePercent?: number;
  frequency: 'immediate' | 'daily' | 'weekly';
  channels: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  recipients: string[];
}

export interface AlertConfigArtifactProps {
  supplierId?: string;
  supplierName?: string;
  currentScore?: number;
  onSave?: (config: AlertConfig) => void;
  onCancel?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export const AlertConfigArtifact = ({
  supplierName,
  currentScore,
  onSave,
  onCancel,
}: AlertConfigArtifactProps) => {
  const [config, setConfig] = useState<AlertConfig>({
    name: supplierName ? `${supplierName} Risk Alert` : 'New Risk Alert',
    triggerType: 'threshold',
    thresholdValue: 70,
    thresholdDirection: 'above',
    changePercent: 10,
    frequency: 'immediate',
    channels: {
      email: true,
      push: false,
      inApp: true,
    },
    recipients: [],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaved(true);
    onSave?.(config);

    // Reset after showing success
    setTimeout(() => setSaved(false), 2000);
  };

  const triggerOptions = [
    {
      value: 'threshold',
      label: 'Score Threshold',
      description: 'Alert when score crosses a specific value',
    },
    {
      value: 'change',
      label: 'Score Change',
      description: 'Alert when score changes by a percentage',
    },
    {
      value: 'any_change',
      label: 'Any Change',
      description: 'Alert on any score change',
    },
  ];

  const frequencyOptions = [
    { value: 'immediate', label: 'Immediately' },
    { value: 'daily', label: 'Daily Digest' },
    { value: 'weekly', label: 'Weekly Summary' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 overflow-auto p-5 space-y-6">
        {/* Context Banner */}
        {supplierName && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-violet-50 border border-violet-100 rounded-xl"
          >
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
              <Bell size={20} className="text-violet-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-violet-900">
                Setting alert for {supplierName}
              </p>
              {currentScore !== undefined && (
                <p className="text-xs text-violet-600">
                  Current Risk Score: {currentScore}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Alert Name */}
        <FormGroup label="Alert Name" required>
          <TextInput
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            placeholder="Enter alert name"
          />
        </FormGroup>

        {/* Trigger Type */}
        <ArtifactSection title="Trigger Condition" collapsible={false}>
          <RadioGroup
            name="triggerType"
            options={triggerOptions}
            value={config.triggerType}
            onChange={(value) => setConfig({ ...config, triggerType: value as AlertConfig['triggerType'] })}
            variant="cards"
          />

          {/* Threshold Settings */}
          {config.triggerType === 'threshold' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-4 bg-slate-50 rounded-xl space-y-4"
            >
              <div className="flex gap-3">
                <FormGroup label="Direction" className="w-1/2">
                  <SelectInput
                    value={config.thresholdDirection || 'above'}
                    onChange={(e) => setConfig({ ...config, thresholdDirection: e.target.value as 'above' | 'below' })}
                    options={[
                      { value: 'above', label: 'Goes above' },
                      { value: 'below', label: 'Falls below' },
                    ]}
                  />
                </FormGroup>
                <FormGroup label="Score" className="w-1/2">
                  <TextInput
                    type="number"
                    value={config.thresholdValue || ''}
                    onChange={(e) => setConfig({ ...config, thresholdValue: parseInt(e.target.value) })}
                    placeholder="70"
                    min={0}
                    max={100}
                  />
                </FormGroup>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <AlertTriangle size={12} />
                Alert when score {config.thresholdDirection === 'above' ? 'exceeds' : 'drops below'} {config.thresholdValue}
              </p>
            </motion.div>
          )}

          {/* Change Percentage Settings */}
          {config.triggerType === 'change' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-4 bg-slate-50 rounded-xl space-y-4"
            >
              <FormGroup label="Change Threshold (%)">
                <TextInput
                  type="number"
                  value={config.changePercent || ''}
                  onChange={(e) => setConfig({ ...config, changePercent: parseInt(e.target.value) })}
                  placeholder="10"
                  min={1}
                  max={100}
                  icon={<TrendingUp size={16} />}
                />
              </FormGroup>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <TrendingUp size={12} />
                Alert when score changes by more than {config.changePercent}%
              </p>
            </motion.div>
          )}
        </ArtifactSection>

        {/* Notification Frequency */}
        <ArtifactSection title="Notification Frequency" collapsible={false}>
          <SelectInput
            value={config.frequency}
            onChange={(e) => setConfig({ ...config, frequency: e.target.value as AlertConfig['frequency'] })}
            options={frequencyOptions}
          />
        </ArtifactSection>

        {/* Delivery Channels */}
        <ArtifactSection title="Delivery Channels" collapsible={false}>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                  <Mail size={16} className="text-slate-600" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Email</p>
                  <p className="text-xs text-slate-400">Receive alerts via email</p>
                </div>
              </div>
              <Toggle
                checked={config.channels.email}
                onChange={(checked) => setConfig({
                  ...config,
                  channels: { ...config.channels, email: checked },
                })}
                label=""
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                  <Smartphone size={16} className="text-slate-600" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Push Notification</p>
                  <p className="text-xs text-slate-400">Mobile app notifications</p>
                </div>
              </div>
              <Toggle
                checked={config.channels.push}
                onChange={(checked) => setConfig({
                  ...config,
                  channels: { ...config.channels, push: checked },
                })}
                label=""
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                  <Bell size={16} className="text-slate-600" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">In-App</p>
                  <p className="text-xs text-slate-400">Show in notification center</p>
                </div>
              </div>
              <Toggle
                checked={config.channels.inApp}
                onChange={(checked) => setConfig({
                  ...config,
                  channels: { ...config.channels, inApp: checked },
                })}
                label=""
              />
            </div>
          </div>
        </ArtifactSection>
      </div>

      {/* Footer */}
      <ArtifactFooter
        primaryAction={{
          id: 'save',
          label: saved ? 'Alert Created!' : 'Create Alert',
          variant: saved ? 'primary' : 'primary',
          onClick: handleSave,
          loading: isSaving,
          icon: saved ? <Check size={16} /> : <Bell size={16} />,
        }}
        secondaryAction={{
          id: 'cancel',
          label: 'Cancel',
          variant: 'secondary',
          onClick: () => onCancel?.(),
        }}
      />
    </div>
  );
};

export default AlertConfigArtifact;
