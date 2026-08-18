import type { Category } from '../db/types';

export interface ParsedBillItem {
  name: string;
  amount: number;
  category: Category;
}

export interface ParsedBill {
  items: ParsedBillItem[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
}

const EXTRACTION_PROMPT = `You are extracting line items from a restaurant/bar bill photo. Return ONLY valid JSON,
no prose, no markdown fences, in this exact shape:

{
  "items": [
    { "name": string, "amount": number, "category": "veg" | "non_veg" | "alcohol" | "neutral" }
  ],
  "subtotal": number,
  "tax": number,
  "serviceCharge": number,
  "total": number
}

"amount" is the line's total price exactly as printed on the bill. If a quantity
greater than 1 is shown next to an item (e.g. "3 Lassi Mango"), the printed price
is already that line's total — do NOT multiply it by the quantity again.

Categorization rules:
- "alcohol": beer, wine, spirits, cocktails, any alcoholic beverage
- "non_veg": any dish containing meat, chicken, fish, seafood, egg
- "veg": vegetarian dishes with no meat/egg/alcohol
- "neutral": anything ambiguous, or shared items like bread/rice/soft drinks/water — also use this if you cannot confidently classify an item

If tax and service charge are shown as one combined line, put the full amount in "tax"
and set "serviceCharge" to 0. If amounts don't visibly sum to the printed total, still
return your best extraction — the app will reconcile it.`;

export class BillParseError extends Error {}

export async function fileToBase64(file: File): Promise<{ data: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [, data] = result.split(',');
      resolve({ data, mediaType: file.type || 'image/jpeg' });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function parseBillImage(
  apiKey: string,
  image: { data: string; mediaType: string },
): Promise<ParsedBill> {
  if (!apiKey) {
    throw new BillParseError('No Anthropic API key set. Add one in Settings.');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 8192,
      thinking: { type: 'disabled' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: image.mediaType,
                data: image.data,
              },
            },
            { type: 'text', text: EXTRACTION_PROMPT },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new BillParseError(`Anthropic API error (${response.status}): ${body.slice(0, 300)}`);
  }

  const data = await response.json();
  const textBlock = (data?.content ?? []).find((block: { type: string }) => block.type === 'text');
  const text: string = textBlock?.text ?? '';
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as ParsedBill;
    if (!Array.isArray(parsed.items)) throw new Error('missing items array');
    return {
      items: parsed.items.map((i) => ({
        name: String(i.name ?? 'Item'),
        amount: Number(i.amount) || 0,
        category: (['veg', 'non_veg', 'alcohol', 'neutral'] as const).includes(i.category)
          ? i.category
          : 'neutral',
      })),
      subtotal: Number(parsed.subtotal) || 0,
      tax: Number(parsed.tax) || 0,
      serviceCharge: Number(parsed.serviceCharge) || 0,
      total: Number(parsed.total) || 0,
    };
  } catch {
    throw new BillParseError('Could not parse the bill from the LLM response. Try manual entry.');
  }
}
