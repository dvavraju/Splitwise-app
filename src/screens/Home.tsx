import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { addSettlement, computeBalances, usePeople, useExpenses, useSettlements } from '../db/hooks';
import { Avatar, Button, EmptyState } from '../components/ui';
import { formatINR } from '../lib/format';

export default function Home() {
  const people = usePeople();
  const expenses = useExpenses();
  const settlements = useSettlements();
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const balances = computeBalances(people, expenses, settlements);
  const others = people.filter((p) => !p.isSelf);

  async function handleSettle(personId: string, net: number) {
    setSettlingId(personId);
    await addSettlement({ id: uuid(), personId, amount: net, date: Date.now() });
    setSettlingId(null);
  }

  return (
    <div>
      <div className="px-4 pb-2 pt-6">
        <h1 className="text-2xl font-bold text-slate-900">Balances</h1>
        <p className="text-sm text-slate-500">Who owes what, at a glance.</p>
      </div>

      {others.length === 0 ? (
        <EmptyState title="No one to split with yet" subtitle="Add people first, then log an expense" />
      ) : (
        <div className="flex flex-col divide-y divide-slate-100 px-4">
          {others.map((p) => {
            const net = balances.find((b) => b.personId === p.id)?.net ?? 0;
            const settled = Math.abs(net) < 0.01;
            return (
              <div key={p.id} className="flex items-center gap-3 py-3">
                <Avatar name={p.name} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{p.name}</p>
                  <p className={`text-xs ${settled ? 'text-slate-400' : net > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {settled
                      ? 'Settled up'
                      : net > 0
                        ? `Owes you ${formatINR(net)}`
                        : `You owe ${formatINR(Math.abs(net))}`}
                  </p>
                </div>
                {!settled && (
                  <Button
                    variant="secondary"
                    disabled={settlingId === p.id}
                    onClick={() => handleSettle(p.id, net)}
                  >
                    Mark settled
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-24 z-10 mx-auto flex max-w-md justify-end px-4">
        <Link
          to="/add"
          className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30"
        >
          <Plus size={18} /> Add Expense
        </Link>
      </div>
    </div>
  );
}
