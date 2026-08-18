import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { Camera, Plus, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { usePeople, addExpense } from '../db/hooks';
import { computeSplit, roundShares } from '../lib/splitEngine';
import { fileToBase64, parseBillImage, BillParseError, type ParsedBillItem } from '../lib/billParser';
import { getApiKey } from '../lib/apiKey';
import { Button, Field, TextInput, TopBar } from '../components/ui';
import ParticipantPicker from '../components/ParticipantPicker';
import { formatINR } from '../lib/format';
import type { Category } from '../db/types';

type Step = 'pick' | 'parsing' | 'review' | 'participants' | 'preview';

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'veg', label: 'Veg' },
  { value: 'non_veg', label: 'Non-Veg' },
  { value: 'alcohol', label: 'Alcohol' },
  { value: 'neutral', label: 'Neutral' },
];

export default function AddExpenseBill() {
  const navigate = useNavigate();
  const people = usePeople();
  const self = people.find((p) => p.isSelf);

  const [step, setStep] = useState<Step>('pick');
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<ParsedBillItem[]>([]);
  const [tax, setTax] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [paidById, setPaidById] = useState('');
  const [saving, setSaving] = useState(false);

  // `self` resolves asynchronously (Dexie live query), so seed these once it's available.
  useEffect(() => {
    if (self && !paidById) {
      setPaidById(self.id);
      setParticipantIds([self.id]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [self]);

  async function handleFile(file: File) {
    setError(null);
    setStep('parsing');
    try {
      const apiKey = getApiKey();
      const image = await fileToBase64(file);
      const parsed = await parseBillImage(apiKey, image);
      setItems(parsed.items);
      setTax(parsed.tax);
      setServiceCharge(parsed.serviceCharge);
      setStep('review');
    } catch (e) {
      setError(e instanceof BillParseError ? e.message : 'Something went wrong parsing the bill.');
      setStep('pick');
    }
  }

  function updateItem(index: number, patch: Partial<ParsedBillItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addItem() {
    setItems((prev) => [...prev, { name: '', amount: 0, category: 'neutral' }]);
  }

  function toggleParticipant(id: string) {
    setParticipantIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0), [items]);
  const total = subtotal + tax + serviceCharge;
  const participants = people.filter((p) => participantIds.includes(p.id));

  const { shares: rawShares, hadFallback } = useMemo(
    () => computeSplit(items, participants, tax + serviceCharge, subtotal),
    [items, participants, tax, serviceCharge, subtotal],
  );
  const shares = roundShares(rawShares, total);

  async function handleConfirm() {
    if (participantIds.length === 0 || !paidById) return;
    setSaving(true);
    await addExpense({
      id: uuid(),
      description: description.trim() || 'Bill',
      date: Date.now(),
      paidById,
      participantIds,
      source: 'bill',
      items,
      subtotal,
      tax,
      serviceCharge,
      total,
      shares: Array.from(shares.entries()).map(([personId, amount]) => ({ personId, amount })),
      hadFallbackWarning: hadFallback,
    });
    setSaving(false);
    navigate('/');
  }

  return (
    <div>
      <TopBar title="Upload Bill" back />

      {step === 'pick' && (
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          {error && (
            <p className="w-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Camera size={28} />
          </div>
          <p className="text-sm text-slate-500">Take a photo or upload an image of the bill.</p>
          <label className="cursor-pointer rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white">
            Choose photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </label>
        </div>
      )}

      {step === 'parsing' && (
        <div className="flex flex-col items-center gap-3 p-16 text-center">
          <Loader2 size={28} className="animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500">Reading the bill…</p>
        </div>
      )}

      {step === 'review' && (
        <div className="flex flex-col gap-4 p-4">
          <Field label="Description">
            <TextInput
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Dinner at Cafe"
            />
          </Field>

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">Line items</p>
            <div className="flex flex-col gap-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
                  <input
                    value={item.name}
                    onChange={(e) => updateItem(i, { name: e.target.value })}
                    placeholder="Item name"
                    className="min-w-0 flex-1 border-none px-1 text-sm outline-none"
                  />
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => updateItem(i, { amount: Number(e.target.value) })}
                    className="w-20 border-none px-1 text-right text-sm outline-none"
                  />
                  <select
                    value={item.category}
                    onChange={(e) => updateItem(i, { category: e.target.value as Category })}
                    className="rounded-md border border-slate-200 bg-white px-1 py-1 text-xs"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => removeItem(i)} className="text-slate-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addItem}
              className="mt-2 flex items-center gap-1 text-sm font-medium text-emerald-700"
            >
              <Plus size={14} /> Add line
            </button>
          </div>

          <div className="flex gap-3">
            <Field label="Tax">
              <TextInput
                type="number"
                value={tax}
                onChange={(e) => setTax(Number(e.target.value))}
              />
            </Field>
            <Field label="Service charge">
              <TextInput
                type="number"
                value={serviceCharge}
                onChange={(e) => setServiceCharge(Number(e.target.value))}
              />
            </Field>
          </div>

          <div className="flex justify-between text-sm font-medium text-slate-700">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>

          <Button onClick={() => setStep('participants')} disabled={items.length === 0}>
            Next: Select participants
          </Button>
        </div>
      )}

      {step === 'participants' && (
        <div className="flex flex-col gap-4 p-4">
          <Field label="Paid by">
            <select
              value={paidById}
              onChange={(e) => setPaidById(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base text-slate-900 outline-none"
            >
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.isSelf ? 'You' : p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Participants">
            <ParticipantPicker people={people} selectedIds={participantIds} onToggle={toggleParticipant} />
          </Field>
          <Button onClick={() => setStep('preview')} disabled={participantIds.length === 0}>
            Calculate Split
          </Button>
        </div>
      )}

      {step === 'preview' && (
        <div className="flex flex-col gap-4 p-4">
          {hadFallback && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>
                An alcohol or non-veg item had no eligible participants selected, so it was split
                across everyone instead. Go back and adjust items or participants if that's wrong.
              </span>
            </div>
          )}
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="mb-2 text-sm font-semibold text-slate-700">Per-person breakdown</p>
            <div className="flex flex-col divide-y divide-slate-100">
              {participants.map((p) => (
                <div key={p.id} className="flex justify-between py-2 text-sm">
                  <span className="text-slate-600">{p.isSelf ? 'You' : p.name}</span>
                  <span className="font-medium text-slate-900">{formatINR(shares.get(p.id) ?? 0)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-sm font-semibold text-slate-900">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>
          </div>
          <Button onClick={handleConfirm} disabled={saving}>
            Confirm &amp; Add
          </Button>
        </div>
      )}
    </div>
  );
}
