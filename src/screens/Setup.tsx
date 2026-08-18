import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { addPerson } from '../db/hooks';
import { Button, Field, TextInput, Toggle } from '../components/ui';

export default function Setup() {
  const [name, setName] = useState('');
  const [isVeg, setIsVeg] = useState(false);
  const [isAlcoholic, setIsAlcoholic] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await addPerson({
      id: uuid(),
      name: name.trim(),
      isVeg,
      isAlcoholic,
      isSelf: true,
      createdAt: Date.now(),
    });
    setSaving(false);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome to SplitLocal</h1>
        <p className="mt-1 text-sm text-slate-500">
          Let's set up your profile. Everything stays on this device.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Your name">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Raju"
            autoFocus
            required
          />
        </Field>
        <Field label="Diet">
          <Toggle checked={isVeg} onChange={setIsVeg} offLabel="Non-Veg" onLabel="Veg" />
        </Field>
        <Field label="Drinks alcohol?">
          <Toggle checked={isAlcoholic} onChange={setIsAlcoholic} offLabel="No" onLabel="Yes" />
        </Field>
        <Button type="submit" disabled={!name.trim() || saving} className="mt-2">
          Get started
        </Button>
      </form>
    </div>
  );
}
