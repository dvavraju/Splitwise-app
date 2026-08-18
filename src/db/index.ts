import Dexie, { type EntityTable } from 'dexie';
import type { Person, Expense, Settlement } from './types';

class SplitLocalDB extends Dexie {
  people!: EntityTable<Person, 'id'>;
  expenses!: EntityTable<Expense, 'id'>;
  settlements!: EntityTable<Settlement, 'id'>;

  constructor() {
    super('splitlocal');
    this.version(1).stores({
      people: 'id, isSelf, createdAt',
      expenses: 'id, date, paidById',
      settlements: 'id, personId, date',
    });
  }
}

export const db = new SplitLocalDB();
