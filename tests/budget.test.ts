import { describe, expect, it } from "vitest";

import {
  calculateTotals,
  monthLabel,
  PAYMENTS,
  shiftMonth,
} from "../lib/budget";

describe("household budget calculations", () => {
  it("calculates each bank, total, and salary balance", () => {
    const totals = calculateTotals(
      {
        eneos: "12000",
        water: "8,000",
        orico: "15000",
        "car-loan": "30000",
        sumitomo: "10000",
        mortgage: "70000",
        metlife: "5000",
        "tokai-other-1": "2000",
        "tokai-other-2": "",
        "gifu-other-1": "3000",
        "gifu-other-2": "",
      },
      "250000",
    );

    expect(totals.tokai).toBe(37000);
    expect(totals.gifu).toBe(118000);
    expect(totals.total).toBe(155000);
    expect(totals.balance).toBe(95000);
  });

  it("keeps the configured payment dates and reserve slots", () => {
    expect(PAYMENTS.slice(0, 7).map((payment) => [payment.name, payment.day])).toEqual([
      ["エネオス", 2],
      ["カーローン", 5],
      ["水道", 26],
      ["オリコ", 26],
      ["三井住友", 26],
      ["住宅ローン", 27],
      ["メットライフ", 27],
    ]);
    expect(PAYMENTS.filter((payment) => payment.name.startsWith("予備")).length).toBe(4);
  });

  it("moves across year boundaries and formats the month label", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2027-01", -1)).toBe("2026-12");
    expect(monthLabel("2026-09")).toBe("2026年9月");
  });
});
