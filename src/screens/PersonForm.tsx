import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { addPerson, deletePerson, personHasExpenses, updatePerson, usePeople } from '../db/hooks';
import { Button, Field, TextInput, Toggle, TopBar } from '../components/ui';

export default function PersonForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const people = usePeople();
  const existing = id ? people.find((p) => p.id === id) : undefined;
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [isVeg, setIsVeg] = useState(false);
  const [isAlcoholic, setIsAlcoholic] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setIsVeg(existing.isVeg);
      setIsAlcoholic(existing.isAlcoholic);
    }
  }, [existing]);

  if (isEdit && people.length > 0 && !existing) {
    navigate('/people', { replace: true });
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (existing) {
      await updatePerson(existing.id, { name: name.trim(), isVeg, isAlcoholic });
    } else {
      await addPerson({
        id: uuid(),
        name: name.trim(),
        isVeg,
        isAlcoholic,
        isSelf: false,
        createdAt: Date.now(),
      });
    }
    navigate('/people');
  }

  async function handleDelete() {
    if (!existing) return;
    const hasExpenses = await personHasExpenses(existing.id);
    if (hasExpenses && !deleteWarning) {
      setDeleteWarning(
        `${existing.name} has expenses on record. Deleting them will remove them from future splits but keep past expenses for history.`,
      );
      return;
    }
    await deletePerson(existing.id);
    navigate('/people');
  }

  return (
    <div>
      <TopBar title={isEdit ? 'Edit Person' : 'Add Person'} back />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
        <Field label="Name">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Priya"
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
        <Button type="submit" disabled={!name.trim()} className="mt-2">
          {isEdit ? 'Save changes' : 'Add person'}
        </Button>

        {isEdit && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            {deleteWarning && <p className="mb-3 text-sm text-amber-600">{deleteWarning}</p>}
            <Button type="button" variant="danger" onClick={handleDelete} className="w-full">
              {deleteWarning ? 'Delete anyway' : 'Delete person'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
