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
  createActivity,
  deleteActivity,
  getActivitiesByDay,
  getActivityCountRange,
  updateActivity,
} from '@/db/saasDb';
import type { Activity } from '@/types/activity';
import {
  formatDayHuman,
  formatDayShort,
  formatTime,
  getLocalISODate,
  parseLocalISODate,
} from '@/utils/date';
import { pickImageBase64Async } from '@/utils/imagePicker';
import { Activity7DaysChart } from '@/components/ui/Activity7DaysChart';
import { DatePickerModal } from '@/components/ui/DatePickerModal';

export function ActivityTab(props: { isDark: boolean }) {
  const { isDark } = props;
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = Math.max(240, Math.floor(screenWidth - 64));

  const [day, setDay] = useState(() => getLocalISODate());
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageB64, setImageB64] = useState<string | null>(null);

  const rootText = isDark ? 'text-white' : 'text-black';
  const subtleText = isDark ? 'text-white/70' : 'text-black/60';
  const panelBg = isDark ? 'bg-neutral-900' : 'bg-white';
  const border = isDark ? 'border-white/10' : 'border-black/10';
  const inputBg = isDark ? 'bg-white/5' : 'bg-black/5';

  const humanDay = useMemo(() => formatDayHuman(day), [day]);
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const chartSeries = useMemo(() => {
    const startDay = chartDays[0];
    const endDay = chartDays[chartDays.length - 1];
    const rows = getActivityCountRange(startDay, endDay);
    const byDay = new Map(rows.map((r) => [r.day, r]));

    return chartDays.map((d) => {
      const r = byDay.get(d);
      return { x: formatDayShort(d), y: r?.count ?? 0 };
    });
  }, [chartDays]);

  const refresh = async () => {
    setLoading(true);
    try {
      const rows = getActivitiesByDay(day);
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
    setTitle('');
    setDescription('');
    setImageB64(null);
  };

  const onPickImage = async () => {
    const base64 = await pickImageBase64Async();
    setImageB64(base64);
  };

  const onSubmit = () => {
    const t = title.trim();
    const d = description.trim();
    if (!t) {
      Alert.alert('Validation', 'Title tidak boleh kosong.');
      return;
    }
    if (!d) {
      Alert.alert('Validation', 'Deskripsi tidak boleh kosong.');
      return;
    }

    try {
      if (editingId == null) {
        createActivity({ day, title: t, description: d, imageB64 });
      } else {
        updateActivity({ id: editingId, day, title: t, description: d, imageB64 });
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
            <Text className={`text-xl font-black ${rootText}`}>Activity</Text>
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

        {/* Chart */}
        <View
          className={`mt-3 rounded-2xl border ${border} p-3 ${isDark ? 'bg-white/5' : 'bg-black/5'} shadow-sm`}>
          <Text className={`font-black ${rootText}`}>7 hari terakhir</Text>
          <Text className={`mt-1 font-bold ${subtleText}`}>Jumlah aktivitas per hari</Text>
          <View className="mt-2">
            <Activity7DaysChart
              isDark={isDark}
              width={chartWidth}
              data={chartSeries.map((p) => ({ label: p.x, count: p.y }))}
            />
          </View>
        </View>

        {/* Form */}
        <View
          className={`mt-4 rounded-xl border ${border} p-3 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
          <Text className={`font-black ${rootText}`}>
            {editingId == null ? 'Tambah Activity' : `Edit Activity #${editingId}`}
          </Text>

          <View className="mt-3">
            <Text className={`text-xs font-black ${subtleText}`}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Misal: Kerja / Belajar / Olahraga"
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              className={`mt-1 h-[40px] rounded-lg px-3 font-bold ${inputBg} ${rootText}`}
            />
          </View>

          <View className="mt-3">
            <Text className={`text-xs font-black ${subtleText}`}>Deskripsi</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Apa yang kamu lakukan?"
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              multiline
              numberOfLines={5}
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
          <Text className={`text-lg font-black ${rootText}`}>History hari ini</Text>
          <Text className={`font-bold ${subtleText}`}>{items.length} item</Text>
        </View>

        <View className="mt-3">
          {loading ? (
            <Text className={`font-bold ${subtleText}`}>Memuat...</Text>
          ) : items.length === 0 ? (
            <Text className={`font-bold ${subtleText}`}>
              Belum ada activity. Tambahkan di form atas.
            </Text>
          ) : (
            items.map((a) => (
              <View
                key={a.id}
                className={`mt-3 rounded-xl border ${border} p-3 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <Text className={`text-lg font-black ${rootText}`}>{a.title}</Text>
                    <Text className={`mt-1 font-bold ${subtleText}`}>
                      {formatTime(a.updatedAt)} • ID {a.id}
                    </Text>
                    <Text className={`mt-2 font-semibold ${rootText}`}>{a.description}</Text>
                  </View>

                  <View className="items-end">
                    {a.imageB64 ? (
                      <Image
                        source={{ uri: `data:image/jpeg;base64,${a.imageB64}` }}
                        style={{ width: 48, height: 48, borderRadius: 12, marginBottom: 8 }}
                      />
                    ) : null}

                    <View className="flex-row">
                      <Pressable
                        onPress={() => {
                          setEditingId(a.id);
                          setTitle(a.title);
                          setDescription(a.description);
                          setImageB64(a.imageB64);
                        }}
                        className={`border ${border} mr-2 rounded-lg px-2 py-1`}>
                        <Text className={`font-black ${subtleText}`}>Edit</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          Alert.alert('Hapus?', 'Kamu yakin menghapus aktivitas ini?', [
                            { text: 'Batal', style: 'cancel' },
                            {
                              text: 'HAPUS',
                              style: 'destructive',
                              onPress: () => {
                                try {
                                  deleteActivity(a.id);
                                  if (editingId === a.id) resetForm();
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
