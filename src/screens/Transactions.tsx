import { Link } from 'react-router-dom';
import { useExpenses, usePeople } from '../db/hooks';
import { TopBar, Avatar, EmptyState } from '../components/ui';
import { formatDate, formatINR } from '../lib/format';

export default function Transactions() {
  const expenses = useExpenses();
  const people = usePeople();

  function personName(id: string) {
    const p = people.find((x) => x.id === id);
    if (!p) return 'Unknown';
    return p.isSelf ? 'You' : p.name;
  }

  return (
    <div>
      <TopBar title="Transactions" />
      {expenses.length === 0 ? (
        <EmptyState title="No expenses yet" subtitle="Add your first expense to see it here" />
      ) : (
        <div className="flex flex-col divide-y divide-slate-100">
          {expenses.map((e) => (
            <Link key={e.id} to={`/transactions/${e.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-slate-50">
              <div className="flex -space-x-2">
                {e.participantIds.slice(0, 3).map((pid) => (
                  <Avatar key={pid} name={personName(pid)} />
                ))}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{e.description}</p>
                <p className="text-xs text-slate-400">
                  {formatDate(e.date)} · Paid by {personName(e.paidById)}
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-900">{formatINR(e.total)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
