"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultUserSettings, loadUserSettings, saveUserSettings, UserSettings } from "@/lib/user-settings";

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSettings(loadUserSettings());
  }, []);

  const update = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((previous) => ({ ...previous, [key]: value }));
  };

  const saveSettings = () => {
    saveUserSettings(settings);
    setMessage("Settings saved successfully.");
  };

  const resetSettings = () => {
    setSettings(defaultUserSettings);
    saveUserSettings(defaultUserSettings);
    setMessage("Settings reset to defaults.");
  };

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="text-sm text-slate-400">Personalize risk defaults, display preferences, and workflow behavior.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trading Defaults</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm text-slate-300">Default Risk %</label>
            <input
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              type="number"
              min={0.1}
              step={0.1}
              value={settings.defaultRiskPercent}
              onChange={(event) => update("defaultRiskPercent", Number(event.target.value))}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-slate-300">Default Emotion</label>
            <select
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={settings.defaultEmotion}
              onChange={(event) => update("defaultEmotion", event.target.value as UserSettings["defaultEmotion"])}
            >
              <option value="calm">Calm</option>
              <option value="confidence">Confidence</option>
              <option value="fear">Fear</option>
              <option value="greed">Greed</option>
              <option value="frustration">Frustration</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display Preferences</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm text-slate-300">Preferred Currency</label>
              <input
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={settings.preferredCurrency}
                onChange={(event) => update("preferredCurrency", event.target.value.toUpperCase())}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm text-slate-300">Timezone</label>
              <input
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={settings.timezone}
                onChange={(event) => update("timezone", event.target.value)}
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={settings.compactTables}
              onChange={(event) => update("compactTables", event.target.checked)}
            />
            Use compact trade tables
          </label>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={saveSettings}>Save settings</Button>
        <Button variant="secondary" onClick={resetSettings}>Reset defaults</Button>
      </div>

      {message && <p className="text-sm text-emerald-400">{message}</p>}
    </div>
  );
}
