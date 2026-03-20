import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import {
  initActivityDb,
  insertActivity,
  deleteActivity,
  getActivitiesByDay,
} from '../db/activityDb';
import type { Activity } from '../types/activity';
import { formatDayHuman, formatTime, getLocalISODate } from '../utils/date';

export function ActivityTrackerApp() {
  const todayDayIso = useMemo(() => getLocalISODate(), []);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);

  const refresh = async () => {
    setLoading(true);
    try {
      const items = await getActivitiesByDay(todayDayIso);
      setActivities(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await initActivityDb();
        if (!cancelled) await refresh();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Gagal memuat database');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && !loading;

  const handleSubmit = async () => {
    setError(null);
    try {
      if (!canSubmit) {
        setError('Isi `What` dan `Deskripsi` dulu.');
        return;
      }
      await insertActivity({ day: todayDayIso, title, description });
      setTitle('');
      setDescription('');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan aktivitas');
    }
  };

  const headerTitle = `HARI INI`;
  const humanDay = formatDayHuman(todayDayIso);

  return (
    <View className="flex-1 bg-neutral-100 px-4 py-5">
      <View className="border-4 border-black bg-black px-4 py-4">
        <Text className="text-3xl font-black leading-9 text-white">ACTIVITY TRACKER</Text>
        <Text className="mt-1 font-bold text-white/90">{humanDay}</Text>
        <Text className="mt-1 font-black text-white/90">
          {activities.length} item (tanpa login, cuma SQLite)
        </Text>
      </View>

      <View className="mt-4 border-2 border-black bg-white p-3">
        <Text className="text-xl font-black">TAMBAH AKTIVITAS</Text>
        <Text className="mt-1 font-bold text-gray-900">
          Brutal mode: catat saja, jelasin seperlunya.
        </Text>

        <View className="mt-3 border-2 border-black px-2 py-2">
          <Text className="text-xs font-black">WHAT</Text>
          <TextInput
            value={title}
            onChangeText={(t) => setTitle(t)}
            placeholder="Misal: Kerja, Belajar, Olahraga..."
            placeholderTextColor="#6b7280"
            className="mt-1 text-[15px] font-bold text-black"
            autoCapitalize="words"
          />
        </View>

        <View className="mt-3 border-2 border-black px-2 py-2">
          <Text className="text-xs font-black">DESKRIPSI</Text>
          <TextInput
            value={description}
            onChangeText={(d) => setDescription(d)}
            placeholder="Tuliskan apa yang kamu lakukan dan detailnya..."
            placeholderTextColor="#6b7280"
            className="mt-1 text-[15px] font-semibold text-black"
            multiline
            numberOfLines={4}
          />
        </View>

        {error ? (
          <View className="mt-3 border-2 border-red-600 bg-red-50 px-3 py-2">
            <Text className="font-black text-red-700">{error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          className={`mt-3 border-2 border-black px-4 py-3 ${
            canSubmit ? 'bg-neutral-200' : 'bg-neutral-100 opacity-60'
          }`}>
          <Text className="text-center text-xl font-black">SIMPAN</Text>
        </Pressable>
      </View>

      <View className="mt-4 flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-black">{headerTitle}</Text>
          <Text className="font-bold text-gray-900">Urut terbaru dulu</Text>
        </View>

        <View className="mt-3 flex-1 border-2 border-black bg-white">
          {loading ? (
            <View className="p-4">
              <Text className="text-lg font-black">Memuat...</Text>
              <Text className="mt-1 font-bold text-gray-700">DB lagi nyimpen.</Text>
            </View>
          ) : activities.length === 0 ? (
            <View className="p-4">
              <Text className="text-lg font-black">Belum ada aktivitas hari ini.</Text>
              <Text className="mt-1 font-bold text-gray-700">Tulis di atas, tekan `SIMPAN`.</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 24 }}>
              {activities.map((a) => (
                <View key={a.id} className="mb-3 border-2 border-black bg-amber-50 p-3">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-2">
                      <Text className="text-lg font-black">{a.title}</Text>
                      <Text className="mt-1 text-[12px] font-bold">
                        Jam: {formatTime(a.createdAt)} | ID: {a.id}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        Alert.alert('Hapus?', 'Kamu yakin mau hapus aktivitas ini?', [
                          { text: 'Batal', style: 'cancel' },
                          {
                            text: 'HAPUS',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                await deleteActivity(a.id);
                                await refresh();
                              } catch (e) {
                                Alert.alert(
                                  'Gagal',
                                  e instanceof Error ? e.message : 'Gagal menghapus'
                                );
                              }
                            },
                          },
                        ]);
                      }}
                      className="border-2 border-black bg-white px-2 py-1">
                      <Text className="text-[12px] font-black">HAPUS</Text>
                    </Pressable>
                  </View>

                  <Text className="mt-2 text-[14px] font-semibold text-black">{a.description}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
}
