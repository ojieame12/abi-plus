// SettingsView - Combined user and organization settings
// Shows different sections based on user role

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Bell,
  Shield,
  CreditCard,
  Users,
  Building2,
  Settings,
  Mail,
  Calendar,
  Clock,
  Lock,
  Globe,
} from 'lucide-react';
import { MOCK_CURRENT_USER, MOCK_COMPANY, MOCK_TEAMS, getMockTeamMembers } from '../services/mockOrganization';
import type { OrgRole } from '../types/organization';

interface SettingsViewProps {
  onBack: () => void;
  userRole?: OrgRole;
  onNavigateToCategories?: () => void;
  onNavigateToApprovals?: () => void;
}

type SettingsSection = 'profile' | 'notifications' | 'team' | 'organization' | 'billing' | 'security';

export function SettingsView({
  onBack,
  userRole = 'user',
  onNavigateToCategories,
  onNavigateToApprovals,
}: SettingsViewProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

  const isAdmin = userRole === 'admin' || userRole === 'owner';
  const isApprover = userRole === 'approver' || isAdmin;

  // Navigation items based on role
  const navItems: { id: SettingsSection; label: string; icon: React.ComponentType<{ className?: string }>; adminOnly?: boolean }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'organization', label: 'Organization', icon: Building2, adminOnly: true },
    { id: 'billing', label: 'Billing & Credits', icon: CreditCard, adminOnly: true },
    { id: 'security', label: 'Security', icon: Shield, adminOnly: true },
  ];

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-medium text-primary">Settings</h1>
            <p className="text-sm text-secondary">
              Manage your account and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-64 border-r border-slate-100 p-4 shrink-0 hidden md:block">
          <nav className="space-y-1">
            {filteredNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === item.id
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-secondary hover:bg-slate-50 hover:text-primary'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Quick Actions */}
          {isApprover && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3 px-3">
                Quick Actions
              </p>
              {onNavigateToApprovals && (
                <button
                  onClick={onNavigateToApprovals}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-secondary hover:bg-slate-50 hover:text-primary transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  Approval Queue
                </button>
              )}
              {onNavigateToCategories && (
                <button
                  onClick={onNavigateToCategories}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-secondary hover:bg-slate-50 hover:text-primary transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Manage Categories
                </button>
              )}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeSection === 'profile' && <ProfileSection />}
            {activeSection === 'notifications' && <NotificationsSection />}
            {activeSection === 'team' && <TeamSection />}
            {activeSection === 'organization' && isAdmin && <OrganizationSection />}
            {activeSection === 'billing' && isAdmin && <BillingSection />}
            {activeSection === 'security' && isAdmin && <SecuritySection />}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Profile Section
function ProfileSection() {
  const user = MOCK_CURRENT_USER;

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-medium text-primary mb-6">Profile Settings</h2>

      {/* Avatar & Name */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xl font-medium">
          {user.displayName.charAt(0)}
        </div>
        <div>
          <h3 className="text-lg font-medium text-primary">{user.displayName}</h3>
          <p className="text-sm text-secondary">{user.email}</p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        <FormField label="Full Name" value={user.displayName} />
        <FormField label="Email" value={user.email} type="email" disabled />
        <FormField label="Job Title" value={user.title || 'Category Manager'} />
        <FormField label="Department" value={user.department || 'Direct Materials'} />

        <div className="pt-4">
          <button className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// Notifications Section
function NotificationsSection() {
  const [settings, setSettings] = useState({
    emailDigest: true,
    priceAlerts: true,
    weeklyReport: false,
    approvalRequests: true,
    teamUpdates: true,
    marketNews: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-medium text-primary mb-6">Notification Preferences</h2>

      <div className="space-y-4">
        <ToggleItem
          icon={Mail}
          label="Email Digest"
          description="Daily summary of important updates"
          enabled={settings.emailDigest}
          onToggle={() => toggleSetting('emailDigest')}
        />
        <ToggleItem
          icon={Bell}
          label="Price Alerts"
          description="Real-time alerts for price changes in your categories"
          enabled={settings.priceAlerts}
          onToggle={() => toggleSetting('priceAlerts')}
        />
        <ToggleItem
          icon={Calendar}
          label="Weekly Report"
          description="Comprehensive weekly market summary"
          enabled={settings.weeklyReport}
          onToggle={() => toggleSetting('weeklyReport')}
        />
        <ToggleItem
          icon={Clock}
          label="Approval Requests"
          description="Get notified when requests need your approval"
          enabled={settings.approvalRequests}
          onToggle={() => toggleSetting('approvalRequests')}
        />
        <ToggleItem
          icon={Users}
          label="Team Updates"
          description="Activity from your team members"
          enabled={settings.teamUpdates}
          onToggle={() => toggleSetting('teamUpdates')}
        />
        <ToggleItem
          icon={Globe}
          label="Market News"
          description="Breaking news affecting your categories"
          enabled={settings.marketNews}
          onToggle={() => toggleSetting('marketNews')}
        />
      </div>
    </div>
  );
}

// Team Section
function TeamSection() {
  const teams = MOCK_TEAMS;

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-medium text-primary mb-6">Team Members</h2>

      {teams.map(team => {
        const members = getMockTeamMembers(team.id);
        return (
          <div key={team.id} className="mb-8">
            <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-3">
              {team.name}
            </h3>
            <div className="space-y-2">
              {members.map(member => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.displayName}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-violet-600" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-primary">{member.displayName}</p>
                      <p className="text-xs text-secondary">{member.title}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    member.role === 'admin'
                      ? 'bg-violet-100 text-violet-700'
                      : member.role === 'approver'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Organization Section (Admin only)
function OrganizationSection() {
  const company = MOCK_COMPANY;

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-medium text-primary mb-6">Organization Settings</h2>

      <div className="p-6 rounded-xl bg-slate-50 border border-slate-100 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <h3 className="font-medium text-primary">{company.name}</h3>
            <p className="text-sm text-secondary">{company.industry}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <FormField label="Company Name" value={company.name} />
        <FormField label="Industry" value={company.industry || ''} />
        <FormField label="Company Size" value={company.size ? company.size.charAt(0).toUpperCase() + company.size.slice(1) : 'Not specified'} />

        <div className="pt-4">
          <button className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// Billing Section (Admin only)
function BillingSection() {
  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-medium text-primary mb-6">Billing & Credits</h2>

      {/* Current Plan */}
      <div className="p-6 rounded-xl bg-violet-50 border border-violet-100 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-violet-600">Current Plan</p>
            <h3 className="text-xl font-medium text-violet-700">Business</h3>
          </div>
          <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-sm font-medium">
            Active
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-violet-600">Credits: </span>
            <span className="font-medium text-violet-700">52,450 / 80,000</span>
          </div>
          <div>
            <span className="text-violet-600">Slots: </span>
            <span className="font-medium text-violet-700">28 / 35</span>
          </div>
          <div>
            <span className="text-violet-600">Renewal: </span>
            <span className="font-medium text-violet-700">Mar 15, 2025</span>
          </div>
        </div>
      </div>

      {/* Upgrade Option */}
      <div className="p-6 rounded-xl border border-slate-200 mb-6">
        <h3 className="font-medium text-primary mb-2">Need more capacity?</h3>
        <p className="text-sm text-secondary mb-4">
          Upgrade to Enterprise for unlimited slots and priority support.
        </p>
        <button className="px-4 py-2 rounded-lg border border-violet-200 text-violet-600 hover:bg-violet-50 text-sm font-medium transition-colors">
          Contact Sales
        </button>
      </div>

      {/* Invoice History */}
      <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-3">
        Recent Invoices
      </h3>
      <div className="space-y-2">
        {[
          { date: 'Jan 1, 2025', amount: '$6,250', status: 'Paid' },
          { date: 'Dec 1, 2024', amount: '$6,250', status: 'Paid' },
          { date: 'Nov 1, 2024', amount: '$6,250', status: 'Paid' },
        ].map((invoice, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100"
          >
            <span className="text-sm text-primary">{invoice.date}</span>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-primary">{invoice.amount}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">
                {invoice.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Security Section (Admin only)
function SecuritySection() {
  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-medium text-primary mb-6">Security Settings</h2>

      <div className="space-y-4">
        <div className="p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-slate-500" />
              <div>
                <h3 className="text-sm font-medium text-primary">Two-Factor Authentication</h3>
                <p className="text-xs text-secondary">Add an extra layer of security</p>
              </div>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-violet-50 text-violet-600 text-sm font-medium hover:bg-violet-100 transition-colors">
              Enable
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-slate-500" />
              <div>
                <h3 className="text-sm font-medium text-primary">SSO Configuration</h3>
                <p className="text-xs text-secondary">Configure single sign-on for your organization</p>
              </div>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-slate-100 text-secondary text-sm font-medium hover:bg-slate-200 transition-colors">
              Configure
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-slate-500" />
              <div>
                <h3 className="text-sm font-medium text-primary">Active Sessions</h3>
                <p className="text-xs text-secondary">Manage devices logged into your account</p>
              </div>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-slate-100 text-secondary text-sm font-medium hover:bg-slate-200 transition-colors">
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Form Field Component
interface FormFieldProps {
  label: string;
  value: string;
  type?: string;
  disabled?: boolean;
}

function FormField({ label, value, type = 'text', disabled }: FormFieldProps) {
  const [fieldValue, setFieldValue] = useState(value);

  return (
    <div>
      <label className="block text-sm font-medium text-primary mb-1.5">{label}</label>
      <input
        type={type}
        value={fieldValue}
        onChange={(e) => setFieldValue(e.target.value)}
        disabled={disabled}
        className={`w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all ${
          disabled ? 'bg-slate-50 text-secondary cursor-not-allowed' : 'bg-white'
        }`}
      />
    </div>
  );
}

// Toggle Item Component
interface ToggleItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

function ToggleItem({ icon: Icon, label, description, enabled, onToggle }: ToggleItemProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-slate-100">
          <Icon className="w-4 h-4 text-slate-600" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-primary">{label}</h3>
          <p className="text-xs text-secondary">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          enabled ? 'bg-violet-600' : 'bg-slate-200'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
            enabled ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}
