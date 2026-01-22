// AlertSetupArtifact - Configure price and news alerts for a category
// Allows setting thresholds, frequency, and notification preferences

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Bell, TrendingUp, Newspaper, Mail, MessageSquare } from 'lucide-react';

interface AlertSetupArtifactProps {
  category: string;
  onSave: (config: AlertConfig) => void;
  onBack: () => void;
}

interface AlertConfig {
  priceAlerts: boolean;
  priceThreshold: number;
  priceDirection: 'up' | 'down' | 'both';
  newsAlerts: boolean;
  newsKeywords: string[];
  frequency: 'instant' | 'daily' | 'weekly';
  channels: ('email' | 'sms' | 'app')[];
}

export const AlertSetupArtifact = ({
  category,
  onSave,
  onBack,
}: AlertSetupArtifactProps) => {
  const [config, setConfig] = useState<AlertConfig>({
    priceAlerts: true,
    priceThreshold: 5,
    priceDirection: 'both',
    newsAlerts: true,
    newsKeywords: ['supply disruption', 'price increase', 'regulation'],
    frequency: 'daily',
    channels: ['email', 'app'],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    onSave(config);
    setIsSuccess(true);
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center bg-[#fafafa]">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
          className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-5"
        >
          <Check className="w-8 h-8 text-emerald-500" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-medium text-slate-900 mb-2">Alerts Configured</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-[280px]">
            You'll receive {config.frequency} alerts for {category} via {config.channels.join(' and ')}.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
          >
            Done
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#fafafa] min-h-full">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100/80 p-5 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <Bell className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-slate-900">Set Up Alerts</h2>
            <p className="text-sm text-slate-500">{category}</p>
          </div>
        </div>
      </div>

      {/* Price Alerts */}
      <div className="bg-white rounded-2xl border border-slate-100/80 p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-slate-600" />
            <div>
              <h3 className="text-sm font-medium text-slate-900">Price Alerts</h3>
              <p className="text-xs text-slate-500">Get notified on price changes</p>
            </div>
          </div>
          <button
            onClick={() => setConfig(prev => ({ ...prev, priceAlerts: !prev.priceAlerts }))}
            className={`w-11 h-6 rounded-full transition-colors ${
              config.priceAlerts ? 'bg-violet-600' : 'bg-slate-200'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
              config.priceAlerts ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {config.priceAlerts && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            {/* Threshold */}
            <div>
              <label className="text-xs text-slate-500 mb-2 block">Alert when price changes by</label>
              <div className="flex items-center gap-2">
                {[3, 5, 10, 15].map((val) => (
                  <button
                    key={val}
                    onClick={() => setConfig(prev => ({ ...prev, priceThreshold: val }))}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      config.priceThreshold === val
                        ? 'bg-violet-100 text-violet-700 border border-violet-200'
                        : 'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            {/* Direction */}
            <div>
              <label className="text-xs text-slate-500 mb-2 block">Direction</label>
              <div className="flex items-center gap-2">
                {[
                  { value: 'up', label: 'Increases only' },
                  { value: 'down', label: 'Decreases only' },
                  { value: 'both', label: 'Both' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setConfig(prev => ({ ...prev, priceDirection: opt.value as AlertConfig['priceDirection'] }))}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      config.priceDirection === opt.value
                        ? 'bg-violet-100 text-violet-700 border border-violet-200'
                        : 'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* News Alerts */}
      <div className="bg-white rounded-2xl border border-slate-100/80 p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Newspaper className="w-5 h-5 text-slate-600" />
            <div>
              <h3 className="text-sm font-medium text-slate-900">News Alerts</h3>
              <p className="text-xs text-slate-500">Market news and updates</p>
            </div>
          </div>
          <button
            onClick={() => setConfig(prev => ({ ...prev, newsAlerts: !prev.newsAlerts }))}
            className={`w-11 h-6 rounded-full transition-colors ${
              config.newsAlerts ? 'bg-violet-600' : 'bg-slate-200'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
              config.newsAlerts ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {config.newsAlerts && (
          <div className="pt-4 border-t border-slate-100">
            <label className="text-xs text-slate-500 mb-2 block">Keywords to track</label>
            <div className="flex flex-wrap gap-2">
              {['supply disruption', 'price increase', 'regulation', 'tariffs', 'shortage'].map((keyword) => {
                const isSelected = config.newsKeywords.includes(keyword);
                return (
                  <button
                    key={keyword}
                    onClick={() => {
                      setConfig(prev => ({
                        ...prev,
                        newsKeywords: isSelected
                          ? prev.newsKeywords.filter(k => k !== keyword)
                          : [...prev.newsKeywords, keyword],
                      }));
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-violet-100 text-violet-700 border border-violet-200'
                        : 'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    {keyword}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Frequency */}
      <div className="bg-white rounded-2xl border border-slate-100/80 p-5 mb-4">
        <h3 className="text-sm font-medium text-slate-900 mb-3">Frequency</h3>
        <div className="flex items-center gap-2">
          {[
            { value: 'instant', label: 'Instant' },
            { value: 'daily', label: 'Daily digest' },
            { value: 'weekly', label: 'Weekly digest' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setConfig(prev => ({ ...prev, frequency: opt.value as AlertConfig['frequency'] }))}
              className={`flex-1 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                config.frequency === opt.value
                  ? 'bg-violet-100 text-violet-700 border border-violet-200'
                  : 'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Channels */}
      <div className="bg-white rounded-2xl border border-slate-100/80 p-5 mb-5">
        <h3 className="text-sm font-medium text-slate-900 mb-3">Notify me via</h3>
        <div className="space-y-2">
          {[
            { value: 'email', label: 'Email', icon: Mail },
            { value: 'sms', label: 'SMS', icon: MessageSquare },
            { value: 'app', label: 'In-app notification', icon: Bell },
          ].map((opt) => {
            const isSelected = config.channels.includes(opt.value as 'email' | 'sms' | 'app');
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setConfig(prev => ({
                    ...prev,
                    channels: isSelected
                      ? prev.channels.filter(c => c !== opt.value)
                      : [...prev.channels, opt.value as 'email' | 'sms' | 'app'],
                  }));
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                  isSelected
                    ? 'bg-violet-50 border border-violet-200'
                    : 'bg-slate-50 border border-slate-100 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <opt.icon className={`w-4 h-4 ${isSelected ? 'text-violet-600' : 'text-slate-500'}`} />
                  <span className={`text-sm ${isSelected ? 'text-violet-700 font-medium' : 'text-slate-600'}`}>
                    {opt.label}
                  </span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'bg-violet-600 border-violet-600' : 'border-slate-300'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isSaving || (!config.priceAlerts && !config.newsAlerts)}
        className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
      >
        {isSaving ? 'Saving...' : 'Save Alert Settings'}
      </button>
    </div>
  );
};

export default AlertSetupArtifact;
