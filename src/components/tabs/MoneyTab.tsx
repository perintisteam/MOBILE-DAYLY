import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  createMoney,
  deleteMoney,
  getMoneyByDay,
  getMoneySummaryRange,
  updateMoney,
} from '@/db/saasDb';
import type { MoneyTransaction } from '@/types/money';
import { formatDayHuman, formatDayShort, getLocalISODate, parseLocalISODate } from '@/utils/date';
import { formatIdr } from '@/utils/money';
import { pickImageBase64Async } from '@/utils/imagePicker';
import { Money7DaysChart, type MoneyDayChartPoint } from '@/components/ui/Money7DaysChart';
import { DatePickerModal } from '@/components/ui/DatePickerModal';

export function MoneyTab(props: { isDark: boolean }) {
  const { isDark } = props;
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = Math.max(240, Math.floor(screenWidth - 64));

  const [day, setDay] = useState(() => getLocalISODate());
  const [items, setItems] = useState<MoneyTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amountText, setAmountText] = useState(''); // input raw
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [imageB64, setImageB64] = useState<string | null>(null);

  const currency = 'IDR';

  const rootText = isDark ? 'text-white' : 'text-black';
  const subtleText = isDark ? 'text-white/70' : 'text-black/60';
  const panelBg = isDark ? 'bg-neutral-900' : 'bg-white';
  const border = isDark ? 'border-white/10' : 'border-black/10';
  const inputBg = isDark ? 'bg-white/5' : 'bg-black/5';
  const typeSelectedBg = isDark
    ? 'bg-indigo-500/25 border-indigo-400/40'
    : 'bg-indigo-500/15 border-indigo-500/25';
  const typeUnselectedBg = inputBg;

  const humanDay = useMemo(() => formatDayHuman(day), [day]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const it of items) {
      if (it.type === 'income') income += Number(it.amount) || 0;
      else expense += Number(it.amount) || 0;
    }
    return { income, expense, net: income - expense };
  }, [items]);

  const refresh = () => {
    setLoading(true);
    try {
      const rows = getMoneyByDay(day);
      setItems(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day]);

  const resetForm = () => {
    setEditingId(null);
    setType('income');
    setAmountText('');
    setCategory('');
    setNote('');
    setImageB64(null);
  };

  const onPickImage = async () => {
    const base64 = await pickImageBase64Async();
    setImageB64(base64);
  };

  const parsedAmount = useMemo(() => {
    const raw = amountText.trim();
    if (!raw) return 0;
    const cleaned = raw.replace(/[^0-9.]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }, [amountText]);

  const chartDays = useMemo(() => {
    const base = parseLocalISODate(day);
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(base);
      dt.setDate(base.getDate() - i);
      days.push(getLocalISODate(dt));
    }
    return days;
  }, [day]);

  const chartPoints = useMemo((): MoneyDayChartPoint[] => {
    const startDay = chartDays[0];
    const endDay = chartDays[chartDays.length - 1];
    const rows = getMoneySummaryRange(startDay, endDay);
    const byDay = new Map(rows.map((r) => [r.day, r]));

    return chartDays.map((d) => {
      const r = byDay.get(d);
      const income = r?.income ?? 0;
      const expense = r?.expense ?? 0;
      return {
        x: formatDayShort(d),
        label: formatDayShort(d),
        income,
        expense,
        net: income - expense,
      };
    });
  }, [chartDays]);

  const onSubmit = () => {
    const cat = category.trim();
    const nt = note.trim();
    const amt = parsedAmount;
    if (amt <= 0) {
      Alert.alert('Validation', 'Amount harus > 0.');
      return;
    }
    if (!cat) {
      Alert.alert('Validation', 'Category tidak boleh kosong.');
      return;
    }

    try {
      if (editingId == null) {
        createMoney({
          day,
          type,
          amount: amt,
          currency,
          category: cat,
          note: nt,
          imageB64,
        });
      } else {
        updateMoney({
          id: editingId,
          day,
          type,
          amount: amt,
          currency,
          category: cat,
          note: nt,
          imageB64,
        });
      }
      resetForm();
      refresh();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Gagal menyimpan');
    }
  };

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className={`border ${border} rounded-2xl p-3 ${panelBg} shadow-sm`}>
        <View className="flex-row items-start justify-between">
          <View>
            <Text className={`text-xl font-black ${rootText}`}>Money</Text>
            <Text className={`mt-1 font-bold ${subtleText}`}>Hari: {humanDay}</Text>
          </View>
          <View className="w-[132px]">
            <Text className={`text-xs font-black ${subtleText}`}>Tanggal</Text>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              className={`mt-1 h-[38px] rounded-lg px-3 font-bold ${inputBg} ${rootText} items-center justify-center border ${border}`}>
              <Text className={`font-black ${rootText}`}>{day}</Text>
            </Pressable>
          </View>
        </View>

        <DatePickerModal
          visible={showDatePicker}
          isDark={isDark}
          initialDate={day}
          onClose={() => setShowDatePicker(false)}
          onSelect={(date) => setDay(date)}
        />

        <View
          className={`mt-3 flex-row items-center justify-between ${isDark ? 'bg-white/5' : 'bg-black/5'} border ${border} rounded-xl px-3 py-2`}>
          <View>
            <Text className={`text-xs font-black ${subtleText}`}>Income</Text>
            <Text className={`font-black ${rootText}`}>{formatIdr(totals.income)}</Text>
          </View>
          <View>
            <Text className={`text-xs font-black ${subtleText}`}>Expense</Text>
            <Text className={`font-black ${rootText}`}>{formatIdr(totals.expense)}</Text>
          </View>
          <View>
            <Text className={`text-xs font-black ${subtleText}`}>Net</Text>
            <Text className={`font-black ${rootText}`}>{formatIdr(totals.net)}</Text>
          </View>
        </View>

        {/* Chart */}
        <View
          className={`mt-3 rounded-2xl border ${border} p-3 ${isDark ? 'bg-white/5' : 'bg-black/5'} shadow-sm`}>
          <Text className={`font-black ${rootText}`}>7 hari terakhir</Text>
          <Text className={`mt-1 font-bold ${subtleText}`}>Income vs Expense</Text>

          <View className="mt-2">
            <Money7DaysChart isDark={isDark} width={chartWidth} data={chartPoints} />
          </View>
        </View>

        {/* Form */}
        <View
          className={`mt-4 rounded-xl border ${border} p-3 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
          <Text className={`font-black ${rootText}`}>
            {editingId == null ? 'Tambah Transaction' : `Edit #${editingId}`}
          </Text>

          <View className="mt-3">
            <Text className={`text-xs font-black ${subtleText}`}>Type</Text>
            <View className="mt-1 flex-row">
              <Pressable
                onPress={() => setType('income')}
                className={`flex-1 border py-2 ${border} rounded-l-lg ${
                  type === 'income' ? typeSelectedBg : typeUnselectedBg
                }`}>
                <Text
                  className={`text-center font-black ${
                    type === 'income'
                      ? isDark
                        ? 'text-indigo-200'
                        : 'text-indigo-700'
                      : subtleText
                  }`}>
                  Income
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setType('expense')}
                className={`flex-1 border-b border-r border-t py-2 ${border} rounded-r-lg ${
                  type === 'expense' ? typeSelectedBg : typeUnselectedBg
                }`}>
                <Text
                  className={`text-center font-black ${
                    type === 'expense'
                      ? isDark
                        ? 'text-indigo-200'
                        : 'text-indigo-700'
                      : subtleText
                  }`}>
                  Expense
                </Text>
              </Pressable>
            </View>
          </View>

          <View className="mt-3">
            <Text className={`text-xs font-black ${subtleText}`}>Amount ({currency})</Text>
            <TextInput
              value={amountText}
              onChangeText={setAmountText}
              placeholder="100000"
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              keyboardType="numeric"
              className={`mt-1 h-[40px] rounded-lg px-3 font-bold ${inputBg} ${rootText}`}
            />
          </View>

          <View className="mt-3">
            <Text className={`text-xs font-black ${subtleText}`}>Category</Text>
            <TextInput
              value={category}
              onChangeText={setCategory}
              placeholder="Misal: Makan, Transport, Freelance"
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              className={`mt-1 h-[40px] rounded-lg px-3 font-bold ${inputBg} ${rootText}`}
            />
          </View>

          <View className="mt-3">
            <Text className={`text-xs font-black ${subtleText}`}>Note</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Opsional..."
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              multiline
              numberOfLines={3}
              className={`mt-1 rounded-lg px-3 py-2 font-semibold ${inputBg} ${rootText}`}
            />
          </View>

          <View className="mt-3">
            <Text className={`text-xs font-black ${subtleText}`}>Gambar (opsional)</Text>
            <View className="mt-1 flex-row items-center justify-between">
              <Pressable onPress={onPickImage} className={`border ${border} rounded-lg px-3 py-2`}>
                <Text className={`font-black ${rootText}`}>Pilih gambar</Text>
              </Pressable>

              {imageB64 ? (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${imageB64}` }}
                  style={{ width: 52, height: 52, borderRadius: 12 }}
                />
              ) : (
                <View
                  className={`h-[52px] w-[52px] items-center justify-center rounded-lg ${inputBg}`}>
                  <Text className={`font-black ${subtleText}`}>No</Text>
                </View>
              )}
            </View>
          </View>

          <View className="mt-4 flex-row gap-2">
            <Pressable
              onPress={onSubmit}
              className={`flex-1 rounded-xl border px-4 py-3 ${border} ${
                isDark ? 'bg-indigo-500' : 'bg-indigo-600'
              }`}>
              <Text className={`text-center font-black text-white`}>
                {editingId == null ? 'Simpan' : 'Update'}
              </Text>
            </Pressable>
            <Pressable
              onPress={resetForm}
              className={`rounded-lg border px-4 py-3 ${border} ${isDark ? 'bg-transparent' : 'bg-white'}`}>
              <Text className={`font-black ${subtleText}`}>Reset</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* List */}
      <View className={`mt-4 border ${border} rounded-xl p-3 ${panelBg}`}>
        <View className="flex-row items-center justify-between">
          <Text className={`text-lg font-black ${rootText}`}>Transactions hari ini</Text>
          <Text className={`font-bold ${subtleText}`}>{items.length} item</Text>
        </View>

        <View className="mt-3">
          {loading ? (
            <Text className={`font-bold ${subtleText}`}>Memuat...</Text>
          ) : items.length === 0 ? (
            <Text className={`font-bold ${subtleText}`}>
              Belum ada transaksi. Tambahkan di form atas.
            </Text>
          ) : (
            items.map((it) => (
              <View
                key={it.id}
                className={`mt-3 rounded-xl border ${border} p-3 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <Text className={`text-lg font-black ${rootText}`}>
                      {it.type === 'income' ? '+' : '-'} {formatIdr(it.amount)}
                    </Text>
                    <Text className={`mt-1 font-bold ${subtleText}`}>
                      {it.category} • ID {it.id}
                    </Text>
                    {it.note ? (
                      <Text className={`mt-2 font-semibold ${subtleText}`}>{it.note}</Text>
                    ) : null}
                  </View>
                  <View className="items-end">
                    {it.imageB64 ? (
                      <Image
                        source={{ uri: `data:image/jpeg;base64,${it.imageB64}` }}
                        style={{ width: 48, height: 48, borderRadius: 12, marginBottom: 8 }}
                      />
                    ) : null}

                    <View className="flex-row">
                      <Pressable
                        onPress={() => {
                          setEditingId(it.id);
                          setType(it.type);
                          setAmountText(String(it.amount));
                          setCategory(it.category);
                          setNote(it.note);
                          setImageB64(it.imageB64);
                        }}
                        className={`border ${border} mr-2 rounded-lg px-2 py-1`}>
                        <Text className={`font-black ${subtleText}`}>Edit</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          Alert.alert('Hapus?', 'Hapus transaction ini?', [
                            { text: 'Batal', style: 'cancel' },
                            {
                              text: 'HAPUS',
                              style: 'destructive',
                              onPress: () => {
                                try {
                                  deleteMoney(it.id);
                                  if (editingId === it.id) resetForm();
                                  refresh();
                                } catch (e) {
                                  Alert.alert(
                                    'Error',
                                    e instanceof Error ? e.message : 'Gagal menghapus'
                                  );
                                }
                              },
                            },
                          ]);
                        }}
                        className={`border ${border} rounded-lg px-2 py-1`}>
                        <Text className={`font-black ${subtleText}`}>Del</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}
