import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  const variants: Record<string, string> = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  };
  return (
    <button
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function TopBar({ title, back }: { title: string; back?: boolean }) {
  const navigate = useNavigate();
  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
      {back && (
        <button onClick={() => navigate(-1)} className="rounded-full p-1 text-slate-500 hover:bg-slate-100" aria-label="Back">
          <ChevronLeft size={22} />
        </button>
      )}
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
      {...props}
    />
  );
}

export function Toggle({
  checked,
  onChange,
  onLabel,
  offLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <div className="flex rounded-lg bg-slate-100 p-1">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
          !checked ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
        }`}
      >
        {offLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
          checked ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
        }`}
      >
        {onLabel}
      </button>
    </div>
  );
}

export function Avatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
      {initial}
    </div>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-8 py-16 text-center">
      <p className="text-base font-medium text-slate-700">{title}</p>
      {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
    </div>
  );
}
