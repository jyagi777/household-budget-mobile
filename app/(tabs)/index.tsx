import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";

import {
  calculateTotals,
  currentMonth,
  initialAmounts,
  monthLabel,
  numeric,
  PAYMENTS,
  shiftMonth,
} from "@/lib/budget";
import type { Payment } from "@/lib/budget";

const STORAGE_KEY = "household-budget-v1";

type Amounts = Record<string, string>;

type MonthData = {
  salary: string;
  amounts: Amounts;
};

type SavedState = {
  months?: Record<string, MonthData>;
  salary?: string;
  amounts?: Amounts;
  month?: string;
};

const currency = (value: number) => `${Math.round(value).toLocaleString("ja-JP")}円`;

const emptyMonthData = (): MonthData => ({ salary: "", amounts: { ...initialAmounts } });

function SummaryCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}) {
  return (
    <View className="min-w-[47%] flex-1 rounded-3xl bg-surface px-4 py-4 shadow-sm">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xs font-semibold tracking-wide text-muted">{label}</Text>
        <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: `${accent}18` }}>
          <MaterialIcons name={icon} size={17} color={accent} />
        </View>
      </View>
      <Text className="text-xl font-bold text-foreground" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View className="mb-3 mt-7 flex-row items-end justify-between">
      <View>
        <Text className="text-lg font-bold text-foreground">{title}</Text>
        <Text className="mt-1 text-xs text-muted">{subtitle}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const [salary, setSalary] = useState("");
  const [amounts, setAmounts] = useState<Amounts>(initialAmounts);
  const [month, setMonth] = useState(currentMonth());
  const [months, setMonths] = useState<Record<string, MonthData>>({});
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const data = JSON.parse(raw) as Partial<SavedState>;
        if (data.months) {
          setMonths(data.months);
          const activeMonth = data.month ?? currentMonth();
          const activeData = data.months[activeMonth] ?? emptyMonthData();
          setSalary(activeData.salary);
          setAmounts({ ...initialAmounts, ...activeData.amounts });
          setMonth(activeMonth);
        } else {
          const legacyMonth = data.month ?? currentMonth();
          const legacyData = { salary: data.salary ?? "", amounts: { ...initialAmounts, ...(data.amounts ?? {}) } };
          setMonths({ [legacyMonth]: legacyData });
          setSalary(legacyData.salary);
          setAmounts(legacyData.amounts);
          setMonth(legacyMonth);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  const saveData = useCallback(async () => {
    const nextMonths = { ...months, [month]: { salary, amounts } };
    setMonths(nextMonths);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ months: nextMonths, month } satisfies SavedState));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }, [amounts, month, months, salary]);

  const switchMonth = (delta: number) => {
    const nextMonth = shiftMonth(month, delta);
    const nextMonths = { ...months, [month]: { salary, amounts } };
    const nextData = nextMonths[nextMonth] ?? emptyMonthData();
    setMonths(nextMonths);
    setMonth(nextMonth);
    setSalary(nextData.salary);
    setAmounts({ ...initialAmounts, ...nextData.amounts });
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ months: nextMonths, month: nextMonth } satisfies SavedState));
  };

  const totals = useMemo(() => {
    return calculateTotals(amounts, salary);
  }, [amounts, salary]);

  const setAmount = (id: string, value: string) => {
    setAmounts((current) => ({ ...current, [id]: value.replace(/[^0-9]/g, "") }));
  };

  const renderPayment = ({ item }: { item: Payment }) => {
    const isReserve = item.day === 0;
    return (
      <View className="mb-3 rounded-3xl bg-surface px-4 py-4 shadow-sm">
        <View className="flex-row items-center">
          <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${item.color}15` }}>
            {isReserve ? (
              <MaterialIcons name="edit-note" size={21} color={item.color} />
            ) : (
              <Text className="text-base font-bold" style={{ color: item.color }}>{item.day}</Text>
            )}
          </View>
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center">
              <Text className="text-base font-bold text-foreground">{item.name}</Text>
              {isReserve ? (
                <View className="ml-2 rounded-full bg-background px-2 py-1">
                  <Text className="text-[10px] font-semibold text-muted">予備欄</Text>
                </View>
              ) : null}
            </View>
            <Text className="mt-1 text-xs text-muted">
              {isReserve ? "支払先・日付をメモできます" : `${item.day}日 / ${item.schedule}`}
            </Text>
          </View>
          <View className="ml-3 w-[38%]">
            <TextInput
              accessibilityLabel={`${item.name}の金額`}
              className="rounded-2xl bg-background px-3 py-3 text-right text-base font-semibold text-foreground"
              inputMode="numeric"
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#9AA39E"
              value={amounts[item.id]}
              onChangeText={(value) => setAmount(item.id, value)}
              returnKeyType="done"
            />
          </View>
        </View>
      </View>
    );
  };

  const header = (
    <View>
      <View className="mb-5 flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-xs font-semibold tracking-[2px] text-primary">HOUSEHOLD BUDGET</Text>
          <Text className="mt-2 text-3xl font-bold leading-9 text-foreground">今月の家計簿</Text>
          <Text className="mt-2 text-sm leading-5 text-muted">支払日と引き落としを、ひとつの画面で。</Text>
        </View>
        <View className="rounded-2xl bg-primary px-3 py-3 shadow-sm">
          <Text className="text-xs font-bold text-white">個人用</Text>
        </View>
      </View>

      <View className="mb-5 flex-row items-center justify-between rounded-3xl bg-primary px-4 py-3">
        <Pressable
          accessibilityLabel="前の月"
          onPress={() => switchMonth(-1)}
          style={({ pressed }) => ({ padding: 6, opacity: pressed ? 0.65 : 1 })}
        >
          <MaterialIcons name="chevron-left" color="#FFFFFF" size={24} />
        </Pressable>
        <View className="items-center">
          <Text className="text-[11px] font-semibold tracking-widest text-white/70">SELECTED MONTH</Text>
          <Text className="mt-1 text-base font-bold text-white">{monthLabel(month)}</Text>
        </View>
        <Pressable
          accessibilityLabel="次の月"
          onPress={() => switchMonth(1)}
          style={({ pressed }) => ({ padding: 6, opacity: pressed ? 0.65 : 1 })}
        >
          <MaterialIcons name="chevron-right" color="#FFFFFF" size={24} />
        </Pressable>
      </View>

      <View className="flex-row gap-3">
        <SummaryCard label="今月の支払い" value={currency(totals.total)} accent="#2E8B72" icon="receipt-long" />
        <SummaryCard label="給料との差額" value={currency(totals.balance)} accent={totals.balance >= 0 ? "#2E8B72" : "#C45151"} icon={totals.balance >= 0 ? "trending-up" : "trending-down"} />
      </View>

      <View className="mt-3 flex-row gap-3">
        <SummaryCard label="東海労金" value={currency(totals.tokai)} accent="#2E8B72" icon="account-balance" />
        <SummaryCard label="岐阜信用金庫" value={currency(totals.gifu)} accent="#C47B3E" icon="account-balance" />
      </View>

      <View className="mt-7 rounded-3xl bg-surface px-4 py-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View className="min-w-0 flex-1">
            <Text className="text-base font-bold text-foreground">給料の金額</Text>
            <Text className="mt-1 text-xs text-muted">差額の計算に使います</Text>
          </View>
          <View className="ml-4 min-w-0 flex-1 flex-row items-center rounded-2xl bg-background px-3">
            <Text className="mr-1 text-sm font-semibold text-muted">¥</Text>
            <TextInput
              accessibilityLabel="給料の金額"
              className="min-w-0 flex-1 py-3 text-right text-base font-semibold text-foreground"
              inputMode="numeric"
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#9AA39E"
              value={salary}
              onChangeText={(value) => setSalary(value.replace(/[^0-9]/g, ""))}
              returnKeyType="done"
            />
          </View>
        </View>
      </View>

      <SectionTitle title="支払い予定" subtitle="日付順に並んでいます。金額を入力してください。" />
    </View>
  );

  const footer = (
    <View className="pb-10">
      <View className="mt-4 rounded-3xl bg-[#E9F1EC] px-4 py-4">
        <View className="flex-row items-start">
          <MaterialIcons name="info-outline" color="#2E8B72" size={19} />
          <Text className="ml-2 flex-1 text-xs leading-5 text-[#416254]">水道は「隔月・26日」として登録しています。予備欄は支払先や日付をメモして自由に使えます。</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="入力内容を保存"
        onPress={saveData}
        style={({ pressed }) => [
          { backgroundColor: "#2E8B72", borderRadius: 20, paddingVertical: 15, marginTop: 16, alignItems: "center" },
          pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
        ]}
      >
        <View className="flex-row items-center">
          <MaterialIcons name={saved ? "check" : "save"} color="#FFFFFF" size={19} />
          <Text className="ml-2 text-base font-bold text-white">{saved ? "保存しました" : "入力内容を保存"}</Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="入力内容をリセット"
        onPress={() => {
          Alert.alert("入力内容をリセット", "この月の入力をすべて空にしますか？", [
            { text: "キャンセル", style: "cancel" },
            { text: "リセット", style: "destructive", onPress: () => { setSalary(""); setAmounts(initialAmounts); } },
          ]);
        }}
        style={({ pressed }) => ({ alignItems: "center", paddingVertical: 14, opacity: pressed ? 0.55 : 1 })}
      >
        <Text className="text-sm font-semibold text-muted">入力をリセット</Text>
      </Pressable>
    </View>
  );

  if (!loaded) {
    return (
      <ScreenContainer className="items-center justify-center px-5">
        <MaterialIcons name="hourglass-empty" size={26} color="#2E8B72" />
        <Text className="mt-3 text-sm text-muted">家計簿を準備しています…</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <FlatList
        data={PAYMENTS}
        keyExtractor={(item) => item.id}
        renderItem={renderPayment}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: 14 }}
      />
    </ScreenContainer>
  );
}
