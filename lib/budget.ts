export type Bank = "tokai" | "gifu";

export type Payment = {
  id: string;
  bank: Bank;
  name: string;
  day: number;
  schedule: string;
  color: string;
};

export type Amounts = Record<string, string>;

export const PAYMENTS: Payment[] = [
  { id: "eneos", bank: "tokai", name: "エネオス", day: 2, schedule: "毎月", color: "#2E8B72" },
  { id: "car-loan", bank: "gifu", name: "カーローン", day: 5, schedule: "毎月", color: "#C47B3E" },
  { id: "water", bank: "tokai", name: "水道", day: 26, schedule: "隔月", color: "#2E8B72" },
  { id: "orico", bank: "tokai", name: "オリコ", day: 26, schedule: "毎月", color: "#2E8B72" },
  { id: "sumitomo", bank: "gifu", name: "三井住友", day: 26, schedule: "毎月", color: "#C47B3E" },
  { id: "mortgage", bank: "gifu", name: "住宅ローン", day: 27, schedule: "毎月", color: "#C47B3E" },
  { id: "metlife", bank: "gifu", name: "メットライフ", day: 27, schedule: "毎月", color: "#C47B3E" },
  { id: "tokai-other-1", bank: "tokai", name: "予備 01", day: 0, schedule: "任意", color: "#2E8B72" },
  { id: "tokai-other-2", bank: "tokai", name: "予備 02", day: 0, schedule: "任意", color: "#2E8B72" },
  { id: "gifu-other-1", bank: "gifu", name: "予備 01", day: 0, schedule: "任意", color: "#C47B3E" },
  { id: "gifu-other-2", bank: "gifu", name: "予備 02", day: 0, schedule: "任意", color: "#C47B3E" },
];

export const initialAmounts: Amounts = Object.fromEntries(PAYMENTS.map((payment) => [payment.id, ""]));

export const numeric = (value: string | undefined) => Number(value?.replace(/[^0-9]/g, "") || 0);

export const calculateTotals = (amounts: Amounts, salary: string) => {
  const tokai = PAYMENTS.filter((payment) => payment.bank === "tokai").reduce((sum, payment) => sum + numeric(amounts[payment.id]), 0);
  const gifu = PAYMENTS.filter((payment) => payment.bank === "gifu").reduce((sum, payment) => sum + numeric(amounts[payment.id]), 0);
  return { tokai, gifu, total: tokai + gifu, balance: numeric(salary) - tokai - gifu };
};

export const monthLabel = (month: string) => {
  const [year, monthNumber] = month.split("-");
  return `${year}年${Number(monthNumber)}月`;
};

export const shiftMonth = (month: string, delta: number) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const next = new Date(year, monthNumber - 1 + delta, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
};

export const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};
