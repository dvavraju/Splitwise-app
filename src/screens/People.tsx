import { Link } from 'react-router-dom';
import { Plus, Wine, Beef, Leaf, GlassWater } from 'lucide-react';
import { usePeople } from '../db/hooks';
import { TopBar, Avatar, EmptyState } from '../components/ui';

export default function People() {
  const people = usePeople();
  const others = people.filter((p) => !p.isSelf);

  return (
    <div>
      <TopBar title="People" />
      <div className="flex flex-col divide-y divide-slate-100">
        {people.map((p) => (
          <Link
            key={p.id}
            to={p.isSelf ? '#' : `/people/${p.id}/edit`}
            className={`flex items-center gap-3 px-4 py-3 ${p.isSelf ? 'pointer-events-none' : 'active:bg-slate-50'}`}
          >
            <Avatar name={p.name} />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">
                {p.name} {p.isSelf && <span className="text-slate-400">(You)</span>}
              </p>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  {p.isVeg ? <Leaf size={12} /> : <Beef size={12} />}
                  {p.isVeg ? 'Veg' : 'Non-Veg'}
                </span>
                <span className="flex items-center gap-1">
                  {p.isAlcoholic ? <Wine size={12} /> : <GlassWater size={12} />}
                  {p.isAlcoholic ? 'Alcoholic' : 'Non-Alcoholic'}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {others.length === 0 && (
        <EmptyState title="No people yet" subtitle="Add your friends to start splitting bills" />
      )}
      <div className="fixed inset-x-0 bottom-24 z-10 mx-auto flex max-w-md justify-end px-4">
        <Link
          to="/people/new"
          className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30"
        >
          <Plus size={18} /> Add Person
        </Link>
      </div>
    </div>
  );
}
