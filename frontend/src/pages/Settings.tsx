import React, { useState } from "react";
import {
  Card,
  Button,
  Input,
  Badge,
  Icon,
  Callout,
  Textarea,
} from "@shohojdhara/atomix";

interface SystemSettings {
  companyName: string;
  contactEmail: string;
  supportPhone: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  language: string;
  maintenanceMode: boolean;
  autoBackup: boolean;
  backupFrequency: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  apiRateLimit: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
}

const defaultSettings: SystemSettings = {
  companyName: "ISP Admin Panel",
  contactEmail: "admin@ispadmin.com",
  supportPhone: "+1 (555) 123-4567",
  timezone: "UTC",
  dateFormat: "MM/DD/YYYY",
  currency: "USD",
  language: "en",
  maintenanceMode: false,
  autoBackup: true,
  backupFrequency: "daily",
  emailNotifications: true,
  smsNotifications: false,
  apiRateLimit: 1000,
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
};

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleInputChange = (field: keyof SystemSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePasswordPolicyChange = (field: keyof SystemSettings["passwordPolicy"], value: any) => {
    setSettings((prev) => ({
      ...prev,
      passwordPolicy: {
        ...prev.passwordPolicy,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setSaveStatus({ type: null, message: "" });

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setSaveStatus({
        type: "success",
        message: "Settings saved successfully!",
      });
    } catch (error) {
      setSaveStatus({
        type: "error",
        message: "Failed to save settings. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setSaveStatus({ type: null, message: "" });
  };

  return (
    <div className="u-p-6 u-max-width-6xl u-mx-auto">
      <div className="u-mb-6">
        <h1 className="u-text-2xl u-font-bold u-mb-2">System Settings</h1>
        <p className="u-text-muted">
          Configure system-wide settings and preferences for your ISP admin panel.
        </p>
      </div>

      {saveStatus.type && (
        <Callout
          variant={saveStatus.type}
          className="u-mb-6"
          onClose={() => setSaveStatus({ type: null, message: "" })}
        >
          {saveStatus.message}
        </Callout>
      )}

      <div className="u-grid u-grid-cols-1 u-gap-6 lg:u-grid-cols-2">
        {/* General Settings */}
        <Card>
          <div className="u-p-4 u-border-bottom">
            <div className="u-d-flex u-align-items-center u-gap-2">
              <Icon name="Building" size={20} />
              <h2 className="u-text-lg u-font-semibold">General Settings</h2>
            </div>
          </div>
          <div className="u-p-4 u-space-y-4">
            <div>
              <label className="u-block u-text-sm u-font-medium u-mb-1">
                Company Name
              </label>
              <Input
                value={settings.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label className="u-block u-text-sm u-font-medium u-mb-1">
                Contact Email
              </label>
              <Input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                placeholder="admin@company.com"
              />
            </div>

            <div>
              <label className="u-block u-text-sm u-font-medium u-mb-1">
                Support Phone
              </label>
              <Input
                value={settings.supportPhone}
                onChange={(e) => handleInputChange("supportPhone", e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label className="u-block u-text-sm u-font-medium u-mb-1">
                Timezone
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => handleInputChange("timezone", e.target.value)}
                className="u-w-full u-p-2 u-border u-rounded u-bg-white"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>

            <div>
              <label className="u-block u-text-sm u-font-medium u-mb-1">
                Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) => handleInputChange("currency", e.target.value)}
                className="u-w-full u-p-2 u-border u-rounded u-bg-white"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Security Settings */}
        <Card>
          <div className="u-p-4 u-border-bottom">
            <div className="u-d-flex u-align-items-center u-gap-2">
              <Icon name="Shield" size={20} />
              <h2 className="u-text-lg u-font-semibold">Security Settings</h2>
            </div>
          </div>
          <div className="u-p-4 u-space-y-4">
            <div>
              <label className="u-block u-text-sm u-font-medium u-mb-1">
                API Rate Limit (requests/hour)
              </label>
              <Input
                type="number"
                value={settings.apiRateLimit}
                onChange={(e) => handleInputChange("apiRateLimit", parseInt(e.target.value))}
                min="100"
                max="10000"
              />
            </div>

            <div>
              <label className="u-block u-text-sm u-font-medium u-mb-1">
                Session Timeout (minutes)
              </label>
              <Input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleInputChange("sessionTimeout", parseInt(e.target.value))}
                min="5"
                max="480"
              />
            </div>

            <div>
              <label className="u-block u-text-sm u-font-medium u-mb-1">
                Max Login Attempts
              </label>
              <Input
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => handleInputChange("maxLoginAttempts", parseInt(e.target.value))}
                min="3"
                max="10"
              />
            </div>

            <div>
              <label className="u-block u-text-sm u-font-medium u-mb-1">
                Password Policy
              </label>
              <div className="u-space-y-2 u-p-3 u-bg-light u-rounded">
                <div className="u-d-flex u-align-items-center u-justify-content-between">
                  <span className="u-text-sm">Minimum Length</span>
                  <Input
                    type="number"
                    value={settings.passwordPolicy.minLength}
                    onChange={(e) => handlePasswordPolicyChange("minLength", parseInt(e.target.value))}
                    className="u-width-20"
                    min="6"
                    max="20"
                  />
                </div>
                <div className="u-d-flex u-align-items-center u-justify-content-between">
                  <span className="u-text-sm">Require Uppercase</span>
                  <input
                    type="checkbox"
                    checked={settings.passwordPolicy.requireUppercase}
                    onChange={(e) => handlePasswordPolicyChange("requireUppercase", e.target.checked)}
                    className="u-ml-2"
                  />
                </div>
                <div className="u-d-flex u-align-items-center u-justify-content-between">
                  <span className="u-text-sm">Require Lowercase</span>
                  <input
                    type="checkbox"
                    checked={settings.passwordPolicy.requireLowercase}
                    onChange={(e) => handlePasswordPolicyChange("requireLowercase", e.target.checked)}
                    className="u-ml-2"
                  />
                </div>
                <div className="u-d-flex u-align-items-center u-justify-content-between">
                  <span className="u-text-sm">Require Numbers</span>
                  <input
                    type="checkbox"
                    checked={settings.passwordPolicy.requireNumbers}
                    onChange={(e) => handlePasswordPolicyChange("requireNumbers", e.target.checked)}
                    className="u-ml-2"
                  />
                </div>
                <div className="u-d-flex u-align-items-center u-justify-content-between">
                  <span className="u-text-sm">Require Special Characters</span>
                  <input
                    type="checkbox"
                    checked={settings.passwordPolicy.requireSpecialChars}
                    onChange={(e) => handlePasswordPolicyChange("requireSpecialChars", e.target.checked)}
                    className="u-ml-2"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* System Settings */}
        <Card>
          <div className="u-p-4 u-border-bottom">
            <div className="u-d-flex u-align-items-center u-gap-2">
              <Icon name="Gear" size={20} />
              <h2 className="u-text-lg u-font-semibold">System Settings</h2>
            </div>
          </div>
          <div className="u-p-4 u-space-y-4">
            <div className="u-d-flex u-align-items-center u-justify-content-between">
              <div>
                <label className="u-text-sm u-font-medium">Maintenance Mode</label>
                <p className="u-text-xs u-text-muted">
                  Enable maintenance mode to restrict access
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => handleInputChange("maintenanceMode", e.target.checked)}
              />
            </div>

            <div className="u-d-flex u-align-items-center u-justify-content-between">
              <div>
                <label className="u-text-sm u-font-medium">Auto Backup</label>
                <p className="u-text-xs u-text-muted">
                  Automatically backup system data
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoBackup}
                onChange={(e) => handleInputChange("autoBackup", e.target.checked)}
              />
            </div>

            {settings.autoBackup && (
              <div>
                <label className="u-block u-text-sm u-font-medium u-mb-1">
                  Backup Frequency
                </label>
                <select
                  value={settings.backupFrequency}
                  onChange={(e) => handleInputChange("backupFrequency", e.target.value)}
                  className="u-w-full u-p-2 u-border u-rounded u-bg-white"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}

            <div className="u-d-flex u-align-items-center u-justify-content-between">
              <div>
                <label className="u-text-sm u-font-medium">Email Notifications</label>
                <p className="u-text-xs u-text-muted">
                  Send email notifications for system events
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleInputChange("emailNotifications", e.target.checked)}
              />
            </div>

            <div className="u-d-flex u-align-items-center u-justify-content-between">
              <div>
                <label className="u-text-sm u-font-medium">SMS Notifications</label>
                <p className="u-text-xs u-text-muted">
                  Send SMS notifications for critical alerts
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.smsNotifications}
                onChange={(e) => handleInputChange("smsNotifications", e.target.checked)}
              />
            </div>
          </div>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <div className="u-p-4 u-border-bottom">
            <div className="u-d-flex u-align-items-center u-gap-2">
              <Icon name="Gear" size={20} />
              <h2 className="u-text-lg u-font-semibold">Advanced Settings</h2>
            </div>
          </div>
          <div className="u-p-4 u-space-y-4">
            <div>
              <label className="u-block u-text-sm u-font-medium u-mb-1">
                System Log Level
              </label>
              <select
                defaultValue="info"
                className="u-w-full u-p-2 u-border u-rounded u-bg-white"
              >
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div>
              <label className="u-block u-text-sm u-font-medium u-mb-1">
                Database Connection Pool Size
              </label>
              <Input
                type="number"
                value="10"
                min="5"
                max="50"
              />
            </div>

            <div>
              <label className="u-block u-text-sm u-font-medium u-mb-1">
                Cache TTL (seconds)
              </label>
              <Input
                type="number"
                value="3600"
                min="60"
                max="86400"
              />
            </div>

            <div>
              <label className="u-block u-text-sm u-font-medium u-mb-1">
                Custom CSS
              </label>
              <Textarea
                placeholder="Enter custom CSS styles..."
                rows={4}
                className="u-font-mono u-text-xs"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="u-d-flex u-gap-3 u-mt-8 u-justify-content-end">
        <Button
          variant="secondary"
          onClick={handleReset}
          disabled={isLoading}
        >
          Reset to Defaults
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
                        disabled={isLoading}
        >
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default Settings;
