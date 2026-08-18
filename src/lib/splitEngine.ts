import type { Category, ExpenseItem, Person } from '../db/types';

export interface SplitResult {
  shares: Map<string, number>; // personId -> amount
  /** true if any alcohol/non_veg item had zero eligible participants and fell back to splitting across everyone */
  hadFallback: boolean;
}

function filterEligible(category: Category, participants: Person[]): Person[] {
  switch (category) {
    case 'alcohol':
      return participants.filter((p) => p.isAlcoholic);
    case 'non_veg':
      return participants.filter((p) => p.isVeg === false);
    case 'veg':
    case 'neutral':
      return participants;
  }
}

/**
 * Splits a bill's line items across participants per the category rules
 * (PRD §6/§7), then distributes tax/service-charge proportionally to each
 * participant's computed subtotal share.
 */
export function computeSplit(
  items: ExpenseItem[],
  participants: Person[],
  taxAndServiceCharge: number,
  subtotal: number,
): SplitResult {
  const shares = new Map<string, number>();
  for (const p of participants) shares.set(p.id, 0);

  let hadFallback = false;
  const taxRate = subtotal > 0 ? taxAndServiceCharge / subtotal : 0;

  for (const item of items) {
    let eligible = filterEligible(item.category, participants);
    if (eligible.length === 0) {
      eligible = participants;
      if (item.category === 'alcohol' || item.category === 'non_veg') {
        hadFallback = true;
      }
    }
    const perHead = eligible.length > 0 ? item.amount / eligible.length : 0;
    for (const p of eligible) {
      shares.set(p.id, (shares.get(p.id) ?? 0) + perHead);
    }
  }

  for (const p of participants) {
    const base = shares.get(p.id) ?? 0;
    shares.set(p.id, base + base * taxRate);
  }

  return { shares, hadFallback };
}

/** Rounds every share to 2dp; any rounding remainder is applied to the largest share so the total matches exactly. */
export function roundShares(shares: Map<string, number>, expectedTotal: number): Map<string, number> {
  const rounded = new Map<string, number>();
  for (const [id, amount] of shares) {
    rounded.set(id, Math.round(amount * 100) / 100);
  }
  const sum = Array.from(rounded.values()).reduce((a, b) => a + b, 0);
  const diff = Math.round((expectedTotal - sum) * 100) / 100;
  if (diff !== 0 && rounded.size > 0) {
    let largestId = rounded.keys().next().value as string;
    let largestVal = -Infinity;
    for (const [id, amount] of rounded) {
      if (amount > largestVal) {
        largestVal = amount;
        largestId = id;
      }
    }
    rounded.set(largestId, Math.round((rounded.get(largestId)! + diff) * 100) / 100);
  }
  return rounded;
}
