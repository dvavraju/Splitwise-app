import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './index';
import type { Person, Expense, Settlement } from './types';

export function usePeople() {
  return useLiveQuery(() => db.people.orderBy('createdAt').toArray()) ?? [];
}

export function useSelf() {
  const people = usePeople();
  return people.find((p) => p.isSelf);
}

export function useExpenses() {
  return useLiveQuery(() => db.expenses.orderBy('date').reverse().toArray()) ?? [];
}

export function useExpense(id: string | undefined) {
  return useLiveQuery(() => (id ? db.expenses.get(id) : undefined), [id]);
}

export function useSettlements() {
  return useLiveQuery(() => db.settlements.toArray()) ?? [];
}

export async function addPerson(person: Person) {
  await db.people.add(person);
}

export async function updatePerson(id: string, changes: Partial<Person>) {
  await db.people.update(id, changes);
}

export async function personHasExpenses(id: string): Promise<boolean> {
  const count = await db.expenses
    .filter((e) => e.paidById === id || e.participantIds.includes(id))
    .count();
  return count > 0;
}

export async function deletePerson(id: string) {
  await db.people.delete(id);
}

export async function addExpense(expense: Expense) {
  await db.expenses.add(expense);
}

export async function addSettlement(settlement: Settlement) {
  await db.settlements.add(settlement);
}

export interface Balance {
  personId: string;
  net: number; // positive = they owe "You", negative = "You" owe them
}

/** Computes each non-self person's net balance relative to "You". */
export function computeBalances(
  people: Person[],
  expenses: Expense[],
  settlements: Settlement[],
): Balance[] {
  const self = people.find((p) => p.isSelf);
  if (!self) return [];

  const net = new Map<string, number>();
  for (const p of people) {
    if (!p.isSelf) net.set(p.id, 0);
  }

  for (const expense of expenses) {
    if (expense.paidById === self.id) {
      // You paid: every other participant owes You their share.
      for (const share of expense.shares) {
        if (share.personId === self.id) continue;
        const current = net.get(share.personId) ?? 0;
        net.set(share.personId, current + share.amount);
      }
    } else {
      // Someone else paid: You owe that payer your own share. Debts between
      // two non-self roster people aren't tracked (this app is Raju's ledger only).
      const selfShare = expense.shares.find((s) => s.personId === self.id);
      if (selfShare) {
        const current = net.get(expense.paidById) ?? 0;
        net.set(expense.paidById, current - selfShare.amount);
      }
    }
  }

  for (const s of settlements) {
    const current = net.get(s.personId) ?? 0;
    // Marking settled zeroes what they owe You (positive net reduced toward 0);
    // if You owed them (negative), settlement also brings it toward 0.
    net.set(s.personId, current - s.amount);
  }

  return Array.from(net.entries()).map(([personId, netAmount]) => ({
    personId,
    net: Math.round(netAmount * 100) / 100,
  }));
}
