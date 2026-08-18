import { useState } from 'react';
import { db } from '../db';
import { getApiKey, setApiKey } from '../lib/apiKey';
import { Button, Field, TextInput, TopBar } from '../components/ui';

export default function SettingsScreen() {
  const [key, setKey] = useState(getApiKey());
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  function handleSaveKey() {
    setApiKey(key.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function handleExport() {
    const [people, expenses, settlements] = await Promise.all([
      db.people.toArray(),
      db.expenses.toArray(),
      db.settlements.toArray(),
    ]);
    const payload = { exportedAt: new Date().toISOString(), people, expenses, settlements };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `splitlocal-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    await Promise.all([db.people.clear(), db.expenses.clear(), db.settlements.clear()]);
    setApiKey('');
    window.location.reload();
  }

  return (
    <div>
      <TopBar title="Settings" />
      <div className="flex flex-col gap-6 p-4">
        <div>
          <Field label="Anthropic API key">
            <TextInput
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-ant-..."
            />
          </Field>
          <p className="mt-1.5 text-xs text-slate-400">
            Used only for the bill-photo parsing feature. Stored in this browser's local storage —
            visible in dev tools. Fine for personal use; don't share this app's URL with the key set.
          </p>
          <Button onClick={handleSaveKey} className="mt-3">
            {saved ? 'Saved!' : 'Save key'}
          </Button>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <p className="text-sm font-semibold text-slate-700">Data</p>
          <p className="mt-1 text-xs text-slate-400">
            Everything lives only on this device. Export a backup regularly.
          </p>
          <Button variant="secondary" onClick={handleExport} className="mt-3">
            Export data (JSON)
          </Button>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <p className="text-sm font-semibold text-red-600">Danger zone</p>
          <p className="mt-1 text-xs text-slate-400">
            Permanently deletes all people, expenses, and settlements from this device.
          </p>
          <Button variant="danger" onClick={handleReset} className="mt-3">
            {confirmReset ? 'Tap again to confirm reset' : 'Reset all data'}
          </Button>
        </div>
      </div>
    </div>
  );
}
