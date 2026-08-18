export type Category = 'veg' | 'non_veg' | 'alcohol' | 'neutral';

export interface Person {
  id: string;
  name: string;
  isVeg: boolean;
  isAlcoholic: boolean;
  isSelf: boolean;
  createdAt: number;
}

export interface ExpenseItem {
  name: string;
  amount: number;
  category: Category;
}

export interface ExpenseShare {
  personId: string;
  amount: number;
}

export type ExpenseSource = 'manual' | 'bill';

export interface Expense {
  id: string;
  description: string;
  date: number;
  paidById: string;
  participantIds: string[];
  source: ExpenseSource;
  items: ExpenseItem[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  shares: ExpenseShare[];
  rawImage?: string;
  hadFallbackWarning?: boolean;
}

export interface Settlement {
  id: string;
  personId: string;
  amount: number;
  date: number;
}
