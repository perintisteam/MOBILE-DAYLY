import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { createNote, deleteNote, getNotesByDay, updateNote } from '@/db/saasDb';
import type { Note } from '@/types/note';
import { formatDayHuman, getLocalISODate } from '@/utils/date';
import { pickImageBase64Async } from '@/utils/imagePicker';
import { DatePickerModal } from '@/components/ui/DatePickerModal';

export function NotesTab(props: { isDark: boolean }) {
  const { isDark } = props;

  const [day, setDay] = useState(() => getLocalISODate());
  const [items, setItems] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageB64, setImageB64] = useState<string | null>(null);

  const rootText = isDark ? 'text-white' : 'text-black';
  const subtleText = isDark ? 'text-white/70' : 'text-black/60';
  const panelBg = isDark ? 'bg-neutral-900' : 'bg-white';
  const border = isDark ? 'border-white/10' : 'border-black/10';
  const inputBg = isDark ? 'bg-white/5' : 'bg-black/5';

  const humanDay = useMemo(() => formatDayHuman(day), [day]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const accentFor = (id: number) => {
    switch (id % 5) {
      case 0:
        return isDark ? 'bg-emerald-500/25' : 'bg-emerald-500/15';
      case 1:
        return isDark ? 'bg-indigo-500/25' : 'bg-indigo-500/15';
      case 2:
        return isDark ? 'bg-fuchsia-500/25' : 'bg-fuchsia-500/15';
      case 3:
        return isDark ? 'bg-sky-500/25' : 'bg-sky-500/15';
      default:
        return isDark ? 'bg-amber-500/25' : 'bg-amber-500/15';
    }
  };

  const refresh = () => {
    setLoading(true);
    try {
      setItems(getNotesByDay(day));
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
    setBody('');
    setImageB64(null);
  };

  const onPickImage = async () => {
    const base64 = await pickImageBase64Async();
    setImageB64(base64);
  };

  const onSubmit = () => {
    const t = title.trim();
    const b = body.trim();
    if (!t) {
      Alert.alert('Validation', 'Judul notes tidak boleh kosong.');
      return;
    }
    if (!b) {
      Alert.alert('Validation', 'Body notes tidak boleh kosong.');
      return;
    }

    try {
      if (editingId == null) {
        createNote({ day, title: t, body: b, imageB64 });
      } else {
        updateNote({ id: editingId, day, title: t, body: b, imageB64 });
      }
      resetForm();
      refresh();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Gagal menyimpan');
    }
  };

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className={`border ${border} rounded-xl p-3 ${panelBg}`}>
        <View className="flex-row items-start justify-between">
          <View>
            <Text className={`text-xl font-black ${rootText}`}>Notes</Text>
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

        {/* Form */}
        <View
          className={`mt-4 rounded-xl border ${border} p-4 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
          <Text className={`font-black ${rootText}`}>
            {editingId == null ? 'Tambah Note' : `Edit Note #${editingId}`}
          </Text>

          <View className="mt-3">
            <Text className={`text-xs font-black ${subtleText}`}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Judul..."
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              className={`mt-1 h-[40px] w-full rounded-lg px-4 font-bold ${inputBg} ${rootText}`}
            />
          </View>

          <View className="mt-3">
            <Text className={`text-xs font-black ${subtleText}`}>Body</Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Tulis catatan..."
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              multiline
              numberOfLines={7}
              textAlignVertical="top"
              style={{ minHeight: 170 }}
              className={`mt-1 w-full rounded-lg px-4 py-3 font-semibold ${inputBg} ${rootText}`}
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
              className={`flex-1 rounded-lg border px-4 py-3 ${border} ${
                isDark ? 'bg-white/15' : 'bg-black/5'
              }`}>
              <Text className={`text-center font-black ${rootText}`}>
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
          <Text className={`text-lg font-black ${rootText}`}>Notes hari ini</Text>
          <Text className={`font-bold ${subtleText}`}>{items.length} item</Text>
        </View>

        <View className="mt-3">
          {loading ? (
            <Text className={`font-bold ${subtleText}`}>Memuat...</Text>
          ) : items.length === 0 ? (
            <Text className={`font-bold ${subtleText}`}>
              Belum ada notes. Tambahkan di form atas.
            </Text>
          ) : (
            items.map((n) => (
              <Pressable
                key={n.id}
                onPress={() => {
                  setEditingId(n.id);
                  setTitle(n.title);
                  setBody(n.body);
                  setImageB64(n.imageB64);
                }}
                className={`mt-3 overflow-hidden rounded-2xl border ${border} ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                <View className="flex-row">
                  <View className={`w-2 ${accentFor(n.id)}`} />
                  <View className="flex-1 p-3">
                    <Text className={`text-lg font-black ${rootText}`}>{n.title}</Text>
                    <Text className={`mt-2 font-semibold ${subtleText}`} numberOfLines={4}>
                      {n.body}
                    </Text>

                    {n.imageB64 ? (
                      <Image
                        source={{ uri: `data:image/jpeg;base64,${n.imageB64}` }}
                        style={{ width: '100%', height: 140, borderRadius: 14, marginTop: 10 }}
                        resizeMode="cover"
                      />
                    ) : null}

                    <View className="mt-3 flex-row">
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          setEditingId(n.id);
                          setTitle(n.title);
                          setBody(n.body);
                          setImageB64(n.imageB64);
                        }}
                        className={`mr-2 flex-1 rounded-lg border ${border} px-3 py-2 ${
                          isDark ? 'bg-indigo-500/15' : 'bg-indigo-500/10'
                        }`}>
                        <Text className={`text-center font-black ${subtleText}`}>Edit</Text>
                      </Pressable>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          Alert.alert('Hapus?', 'Hapus note ini?', [
                            { text: 'Batal', style: 'cancel' },
                            {
                              text: 'HAPUS',
                              style: 'destructive',
                              onPress: () => {
                                try {
                                  deleteNote(n.id);
                                  if (editingId === n.id) resetForm();
                                  refresh();
                                } catch (err) {
                                  Alert.alert(
                                    'Error',
                                    err instanceof Error ? err.message : 'Gagal menghapus'
                                  );
                                }
                              },
                            },
                          ]);
                        }}
                        className={`flex-1 rounded-lg border ${border} px-3 py-2 ${
                          isDark ? 'bg-red-500/10' : 'bg-red-500/10'
                        }`}>
                        <Text className={`text-center font-black ${subtleText}`}>Del</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}
