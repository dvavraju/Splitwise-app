import { Link } from 'react-router-dom';
import { Camera, Keyboard } from 'lucide-react';
import { TopBar } from '../components/ui';

export default function AddExpenseChoice() {
  return (
    <div>
      <TopBar title="Add Expense" back />
      <div className="flex flex-col gap-4 p-4">
        <Link
          to="/add/manual"
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 active:bg-slate-50"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Keyboard size={22} />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Manual Amount</p>
            <p className="text-sm text-slate-500">Type in a total and split it</p>
          </div>
        </Link>
        <Link
          to="/add/bill"
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 active:bg-slate-50"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Camera size={22} />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Upload Bill</p>
            <p className="text-sm text-slate-500">Photograph a bill and let AI itemize it</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
