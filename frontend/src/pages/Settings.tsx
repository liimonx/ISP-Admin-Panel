import React, { useState } from "react";
import {
  Card,
  Button,
  Input,
  Icon,
  Callout,
  Textarea,
  Select,
  Toggle,
  Container,
  Grid,
  GridCol,
  Row,
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
  // Advanced settings
  logLevel: string;
  dbPoolSize: number;
  cacheTTL: number;
  customCSS: string;
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
  // Advanced settings defaults
  logLevel: "info",
  dbPoolSize: 10,
  cacheTTL: 3600,
  customCSS: "",
};

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // Custom Toggle wrapper component
  const CustomToggle: React.FC<{
    isOn: boolean;
    onToggle: (isOn: boolean) => void;
  }> = ({ isOn, onToggle }) => (
    <div 
      onClick={() => onToggle(!isOn)} 
      className={`u-w-10 u-h-6 u-rounded-full u-relative u-cursor-pointer ${isOn ? 'u-bg-primary' : 'u-bg-gray-300'}`}
    >
      <div 
        className={`u-absolute u-top-0.5 u-h-5 u-w-5 u-rounded-full u-transition-transform ${
          isOn ? 'u-bg-white u-transform-translate-x-5' : 'u-bg-white u-transform-translate-x-0'
        }`}
      />
    </div>
  );

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
    <Container className="u-p-6">
      <div className="u-mb-6">
        <h1 className="u-text-2xl u-fw-bold u-mb-2">System Settings</h1>
        <p className="u-text-secondary-emphasis">
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

      <Grid>
        {/* General Settings */}
        <GridCol sm={6} className="u-mb-4">
          <Card className="u-h-100">
            <div className="u-border-b u-p-4 u-mb-4">
              <div className="u-flex u-items-center u-gap-2">
                <Icon name="Building" size={20} />
                <h2 className="u-text-lg u-fw-semibold">General Settings</h2>
              </div>
            </div>
            <div className="u-mb-3">
              <label className="u-block u-text-sm u-fw-medium u-mb-1">
                Company Name
              </label>
              <Input
                className="u-w-100"
                value={settings.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                placeholder="Enter company name"
              />
            </div>

            <div className="u-mb-3">
              <label className="u-block u-text-sm u-fw-medium u-mb-1">
                Contact Email
              </label>
              <Input
                className="u-w-100"
                type="email"
                value={settings.contactEmail}
                onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                placeholder="admin@company.com"
              />
            </div>

            <div className="u-mb-3">
              <label className="u-block u-text-sm u-fw-medium u-mb-1">
                Support Phone
              </label>
              <Input
                className="u-w-100"
                value={settings.supportPhone}
                onChange={(e) => handleInputChange("supportPhone", e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="u-mb-3">
              <label className="u-block u-text-sm u-fw-medium u-mb-1">
                Timezone
              </label>
              <Select
                className="u-w-100"
                value={settings.timezone}
                onChange={(e) => handleInputChange("timezone", e.target.value)}
                options={[
                  { value: "UTC", label: "UTC" },
                  { value: "America/New_York", label: "Eastern Time" },
                  { value: "America/Chicago", label: "Central Time" },
                  { value: "America/Denver", label: "Mountain Time" },
                  { value: "America/Los_Angeles", label: "Pacific Time" }
                ]}
              />
            </div>

            <div className="u-mb-3">
              <label className="u-block u-text-sm u-fw-medium u-mb-1">
                Currency
              </label>
              <Select
                className="u-w-100"
                value={settings.currency}
                onChange={(e) => handleInputChange("currency", e.target.value)}
                options={[
                  { value: "USD", label: "USD ($)" },
                  { value: "EUR", label: "EUR (€)" },
                  { value: "GBP", label: "GBP (£)" },
                  { value: "JPY", label: "JPY (¥)" }
                ]}
              />
            </div>
        </Card>
        </GridCol>

        {/* Security Settings */}
        <GridCol sm={6} className="u-mb-4">
          <Card className="u-h-100">
          <div className="u-border-b u-p-4 u-mb-4">
            <div className="u-flex u-items-center u-gap-2">
              <Icon name="Shield" size={20} />
              <h2 className="u-text-lg u-fw-semibold">Security Settings</h2>
            </div>
          </div>
          <div className="u-p-4">
            <div className="u-mb-3">
              <label className="u-block u-text-sm u-fw-medium u-mb-1">
                API Rate Limit (requests/hour)
              </label>
              <Input
                type="number"
                className="u-w-100"
                value={settings.apiRateLimit}
                onChange={(e) => handleInputChange("apiRateLimit", parseInt(e.target.value))}
                min="100"
                max="10000"
              />
            </div>

            <div className="u-mb-3">
              <label className="u-block u-text-sm u-fw-medium u-mb-1">
                Session Timeout (minutes)
              </label>
              <Input
                type="number"
                className="u-w-100"
                value={settings.sessionTimeout}
                onChange={(e) => handleInputChange("sessionTimeout", parseInt(e.target.value))}
                min="5"
                max="480"
              />
            </div>

            <div className="u-mb-3">
              <label className="u-block u-text-sm u-fw-medium u-mb-1">
                Max Login Attempts
              </label>
              <Input
                type="number"
                className="u-w-100"
                value={settings.maxLoginAttempts}
                onChange={(e) => handleInputChange("maxLoginAttempts", parseInt(e.target.value))}
                min="3"
                max="10"
              />
            </div>

            <div className="u-mb-3">
              <label className="u-block u-text-sm u-fw-medium u-mb-1">
                Password Policy
              </label>
              <div className="u-p-3 u-bg-light u-rounded">
                <div className="u-flex u-items-center u-justify-between u-mb-2">
                  <span className="u-text-sm">Minimum Length</span>
                  <Input
                    type="number"
                    value={settings.passwordPolicy.minLength}
                    onChange={(e) => handlePasswordPolicyChange("minLength", parseInt(e.target.value))}
                    className="u-w-20"
                    min="6"
                    max="20"
                  />
                </div>
                <div className="u-flex u-items-center u-justify-between u-mb-2">
                  <span className="u-text-sm">Require Uppercase</span>
                  <CustomToggle
                    isOn={settings.passwordPolicy.requireUppercase}
                    onToggle={(isOn) => handlePasswordPolicyChange("requireUppercase", isOn)}
                  />
                </div>
                <div className="u-flex u-items-center u-justify-between u-mb-2">
                  <span className="u-text-sm">Require Lowercase</span>
                  <CustomToggle
                    isOn={settings.passwordPolicy.requireLowercase}
                    onToggle={(isOn) => handlePasswordPolicyChange("requireLowercase", isOn)}
                  />
                </div>
                <div className="u-flex u-items-center u-justify-between u-mb-2">
                  <span className="u-text-sm">Require Numbers</span>
                  <CustomToggle
                    isOn={settings.passwordPolicy.requireNumbers}
                    onToggle={(isOn) => handlePasswordPolicyChange("requireNumbers", isOn)}
                  />
                </div>
                <div className="u-flex u-items-center u-justify-between">
                  <span className="u-text-sm">Require Special Characters</span>
                  <CustomToggle
                    isOn={settings.passwordPolicy.requireSpecialChars}
                    onToggle={(isOn) => handlePasswordPolicyChange("requireSpecialChars", isOn)}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
        </GridCol>

        {/* System Settings */}
        <GridCol sm={6} className="u-mb-4">
          <Card className="u-h-full">
          <div className="u-border-b u-p-4 u-mb-4">
            <div className="u-flex u-items-center u-gap-2">
              <Icon name="Gear" size={20} />
              <h2 className="u-text-lg u-font-semibold">System Settings</h2>
            </div>
          </div>
          <div className="u-p-4">
            <div className="u-flex u-items-center u-justify-between u-mb-3">
              <div>
                <label className="u-text-sm u-font-medium">Maintenance Mode</label>
                <p className="u-text-xs u-text-secondary-emphasis">
                  Enable maintenance mode to restrict access
                </p>
              </div>
              <CustomToggle
                isOn={settings.maintenanceMode}
                onToggle={(isOn) => handleInputChange("maintenanceMode", isOn)}
              />
            </div>

            <div className="u-flex u-items-center u-justify-between u-mb-3">
              <div>
                <label className="u-text-sm u-font-medium">Auto Backup</label>
                <p className="u-text-xs u-text-secondary-emphasis">
                  Automatically backup system data
                </p>
              </div>
              <CustomToggle
                isOn={settings.autoBackup}
                onToggle={(isOn) => handleInputChange("autoBackup", isOn)}
              />
            </div>

            {settings.autoBackup && (
              <div className="u-mb-3">
                <label className="u-block u-text-sm u-font-medium u-mb-1">
                  Backup Frequency
                </label>
                <Select
                  value={settings.backupFrequency}
                  onChange={(e) => handleInputChange("backupFrequency", e.target.value)}
                  className="u-w-full"
                  options={[
                    { value: "hourly", label: "Hourly" },
                    { value: "daily", label: "Daily" },
                    { value: "weekly", label: "Weekly" },
                    { value: "monthly", label: "Monthly" }
                  ]}
                />
              </div>
            )}

            <div className="u-flex u-items-center u-justify-between u-mb-3">
              <div>
                <label className="u-text-sm u-font-medium">Email Notifications</label>
                <p className="u-text-xs u-text-secondary-emphasis">
                  Send email notifications for system events
                </p>
              </div>
              <CustomToggle
                isOn={settings.emailNotifications}
                onToggle={(isOn) => handleInputChange("emailNotifications", isOn)}
              />
            </div>

            <div className="u-flex u-items-center u-justify-between">
              <div>
                <label className="u-text-sm u-font-medium">SMS Notifications</label>
                <p className="u-text-xs u-text-secondary-emphasis">
                  Send SMS notifications for critical alerts
                </p>
              </div>
              <CustomToggle
                isOn={settings.smsNotifications}
                onToggle={(isOn) => handleInputChange("smsNotifications", isOn)}
              />
            </div>
          </div>
        </Card>
        </GridCol>

        {/* Advanced Settings */}
        <GridCol sm={6} className="u-mb-4">
          <Card className="u-h-100">
          <div className="u-border-b u-p-4 u-mb-4">
            <div className="u-flex u-items-center u-gap-2">
              <Icon name="Gear" size={20} />
              <h2 className="u-text-lg u-fw-semibold">Advanced Settings</h2>
            </div>
          </div>
          <div className="u-p-4">
            <div className="u-mb-3">
              <label className="u-block u-text-sm u-fw-medium u-mb-1">
                System Log Level
              </label>
              <Select
                value={settings.logLevel}
                onChange={(e) => handleInputChange("logLevel", e.target.value)}
                className="u-w-100"
                options={[
                  { value: "debug", label: "Debug" },
                  { value: "info", label: "Info" },
                  { value: "warning", label: "Warning" },
                  { value: "error", label: "Error" }
                ]}
              />
            </div>

            <div className="u-mb-3">
              <label className="u-block u-text-sm u-fw-medium u-mb-1">
                Database Connection Pool Size
              </label>
              <Input
                className="u-w-100"
                type="number"
                value={settings.dbPoolSize}
                onChange={(e) => handleInputChange("dbPoolSize", parseInt(e.target.value))}
                min="5"
                max="50"
              />
            </div>

            <div className="u-mb-3">
              <label className="u-block u-text-sm u-fw-medium u-mb-1">
                Cache TTL (seconds)
              </label>
              <Input
                className="u-w-100"
                type="number"
                value={settings.cacheTTL}
                onChange={(e) => handleInputChange("cacheTTL", parseInt(e.target.value))}
                min="60"
                max="86400"
              />
            </div>

            <div>
              <label className="u-block u-text-sm u-fw-medium u-mb-1">
                Custom CSS
              </label>
              <Textarea
                value={settings.customCSS}
                onChange={(e) => handleInputChange("customCSS", e.target.value)}
                placeholder="Enter custom CSS styles..."
                rows={4}
                className="u-text-xs u-w-100"
              />
            </div>
          </div>
        </Card>
        </GridCol>
      </Grid>

      {/* Action Buttons */}
      <Row className="u-mt-8">
        <div className="u-flex u-gap-3 u-justify-end u-w-100">
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
      </Row>
    </Container>
  );
};

export default Settings;
