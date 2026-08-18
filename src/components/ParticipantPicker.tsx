import type { Person } from '../db/types';
import { Avatar } from './ui';

export default function ParticipantPicker({
  people,
  selectedIds,
  onToggle,
}: {
  people: Person[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
      {people.map((p) => {
        const checked = selectedIds.includes(p.id);
        return (
          <label
            key={p.id}
            className={`flex items-center gap-3 px-3 py-2.5 ${p.isSelf ? 'opacity-70' : 'cursor-pointer'}`}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={p.isSelf}
              onChange={() => onToggle(p.id)}
              className="h-4 w-4 accent-emerald-600"
            />
            <Avatar name={p.name} />
            <span className="text-sm font-medium text-slate-800">
              {p.name} {p.isSelf && <span className="text-slate-400">(You)</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}
