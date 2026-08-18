import { useParams } from 'react-router-dom';
import { useExpense, usePeople } from '../db/hooks';
import { TopBar } from '../components/ui';
import { formatDate, formatINR } from '../lib/format';

const CATEGORY_LABEL: Record<string, string> = {
  veg: 'Veg',
  non_veg: 'Non-Veg',
  alcohol: 'Alcohol',
  neutral: 'Shared',
};

export default function TransactionDetail() {
  const { id } = useParams();
  const expense = useExpense(id);
  const people = usePeople();

  function personName(pid: string) {
    const p = people.find((x) => x.id === pid);
    if (!p) return 'Unknown';
    return p.isSelf ? 'You' : p.name;
  }

  if (!expense) return null;

  return (
    <div>
      <TopBar title={expense.description} back />
      <div className="flex flex-col gap-5 p-4">
        <div>
          <p className="text-3xl font-bold text-slate-900">{formatINR(expense.total)}</p>
          <p className="text-sm text-slate-500">
            {formatDate(expense.date)} · Paid by {personName(expense.paidById)}
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Items</p>
          <div className="flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {expense.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2.5">
                <div>
                  <p className="text-sm text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-400">{CATEGORY_LABEL[item.category]}</p>
                </div>
                <p className="text-sm font-medium text-slate-900">{formatINR(item.amount)}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-col gap-1 px-1 text-sm text-slate-500">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatINR(expense.subtotal)}</span>
            </div>
            {expense.tax > 0 && (
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatINR(expense.tax)}</span>
              </div>
            )}
            {expense.serviceCharge > 0 && (
              <div className="flex justify-between">
                <span>Service charge</span>
                <span>{formatINR(expense.serviceCharge)}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Split</p>
          <div className="flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {expense.shares.map((s) => (
              <div key={s.personId} className="flex items-center justify-between px-3 py-2.5">
                <span className="text-sm text-slate-800">{personName(s.personId)}</span>
                <span className="text-sm font-medium text-slate-900">{formatINR(s.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
