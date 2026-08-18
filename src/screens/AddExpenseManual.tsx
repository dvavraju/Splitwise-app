import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { usePeople, addExpense } from '../db/hooks';
import { computeSplit, roundShares } from '../lib/splitEngine';
import { Button, Field, TextInput, TopBar } from '../components/ui';
import ParticipantPicker from '../components/ParticipantPicker';
import { formatINR } from '../lib/format';
import type { Category } from '../db/types';

type SplitMethod = 'equal' | 'preference';

const PREFERENCE_OPTIONS: { value: Category; label: string }[] = [
  { value: 'veg', label: 'Veg' },
  { value: 'non_veg', label: 'Non-Veg' },
  { value: 'alcohol', label: 'Alcohol' },
  { value: 'neutral', label: 'Mixed / Shared' },
];

export default function AddExpenseManual() {
  const navigate = useNavigate();
  const people = usePeople();
  const self = people.find((p) => p.isSelf);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidById, setPaidById] = useState('');
  const [participantIds, setParticipantIds] = useState<string[]>([]);

  // `self` resolves asynchronously (Dexie live query), so seed these once it's available.
  useEffect(() => {
    if (self && !paidById) {
      setPaidById(self.id);
      setParticipantIds([self.id]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [self]);
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [category, setCategory] = useState<Category>('neutral');
  const [saving, setSaving] = useState(false);

  const numericAmount = parseFloat(amount) || 0;
  const participants = people.filter((p) => participantIds.includes(p.id));

  function toggleParticipant(id: string) {
    setParticipantIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const effectiveCategory: Category = splitMethod === 'equal' ? 'neutral' : category;
  const { shares: rawShares } = computeSplit(
    [{ name: description || 'Expense', amount: numericAmount, category: effectiveCategory }],
    participants,
    0,
    numericAmount,
  );
  const shares = roundShares(rawShares, numericAmount);

  const canSubmit = numericAmount > 0 && paidById && participantIds.length > 0;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    await addExpense({
      id: uuid(),
      description: description.trim() || 'Expense',
      date: Date.now(),
      paidById,
      participantIds,
      source: 'manual',
      items: [{ name: description || 'Expense', amount: numericAmount, category: effectiveCategory }],
      subtotal: numericAmount,
      tax: 0,
      serviceCharge: 0,
      total: numericAmount,
      shares: Array.from(shares.entries()).map(([personId, amt]) => ({ personId, amount: amt })),
    });
    setSaving(false);
    navigate('/');
  }

  return (
    <div>
      <TopBar title="Manual Expense" back />
      <div className="flex flex-col gap-4 p-4">
        <Field label="Description">
          <TextInput
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Dinner at Cafe"
          />
        </Field>
        <Field label="Amount (₹)">
          <TextInput
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </Field>
        <Field label="Paid by">
          <select
            value={paidById}
            onChange={(e) => setPaidById(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
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
        <Field label="Split method">
          <div className="flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setSplitMethod('equal')}
              className={`flex-1 rounded-md py-2 text-sm font-medium ${splitMethod === 'equal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Equal
            </button>
            <button
              type="button"
              onClick={() => setSplitMethod('preference')}
              className={`flex-1 rounded-md py-2 text-sm font-medium ${splitMethod === 'preference' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              By Preference
            </button>
          </div>
        </Field>

        {splitMethod === 'preference' && (
          <Field label="What kind of expense is this?">
            <div className="grid grid-cols-2 gap-2">
              {PREFERENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCategory(opt.value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                    category === opt.value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>
        )}

        {numericAmount > 0 && participants.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="mb-2 text-sm font-semibold text-slate-700">Preview</p>
            <div className="flex flex-col gap-1.5">
              {participants.map((p) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span className="text-slate-600">{p.isSelf ? 'You' : p.name}</span>
                  <span className="font-medium text-slate-900">{formatINR(shares.get(p.id) ?? 0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={handleSubmit} disabled={!canSubmit || saving} className="mt-2">
          Add Expense
        </Button>
      </div>
    </div>
  );
}
