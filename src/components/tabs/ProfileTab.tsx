import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { getProfile, updateProfile } from '@/db/saasDb';
import type { ThemeMode } from '@/types/theme';
import { pickImageBase64Async } from '@/utils/imagePicker';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { getLocalISODate } from '@/utils/date';
import SunIcon from 'lucide-react-native/dist/esm/icons/sun.js';
import MoonIcon from 'lucide-react-native/dist/esm/icons/moon.js';

export function ProfileTab(props: {
  isDark: boolean;
  themeMode: ThemeMode;
  onSetThemeMode: (m: ThemeMode) => void;
  onProfileUpdated: () => void;
}) {
  const { isDark, themeMode, onSetThemeMode, onProfileUpdated } = props;

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [birthday, setBirthday] = useState<string | null>(null);
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);

  const rootText = isDark ? 'text-white' : 'text-black';
  const subtleText = isDark ? 'text-white/70' : 'text-black/60';
  const panelBg = isDark ? 'bg-neutral-900' : 'bg-white';
  const border = isDark ? 'border-white/10' : 'border-black/10';
  const inputBg = isDark ? 'bg-white/5' : 'bg-black/5';

  useEffect(() => {
    const p = getProfile();
    setName(p.name);
    setBio(p.bio);
    setImageB64(p.imageB64);
    setBirthday(p.birthday);
  }, []);

  const onPickImage = async () => {
    const base64 = await pickImageBase64Async();
    setImageB64(base64);
  };

  const onSaveProfile = () => {
    const n = name.trim();
    const b = bio.trim();
    if (!n) {
      Alert.alert('Validation', 'Nama tidak boleh kosong.');
      return;
    }
    try {
      updateProfile({ name: n, bio: b, imageB64, birthday });
      onProfileUpdated();
      Alert.alert('Saved', 'Profile tersimpan.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Gagal menyimpan profile');
    }
  };

  const effectiveMode: 'light' | 'dark' =
    themeMode === 'system' ? (isDark ? 'dark' : 'light') : themeMode;

  const ThemeButton = (props: {
    mode: 'light' | 'dark';
    label: string;
    Icon: React.ComponentType<{ size?: number; color?: string }>;
  }) => {
    const { mode, label, Icon } = props;
    const active = effectiveMode === mode;

    const activeClass =
      mode === 'light'
        ? isDark
          ? 'bg-gradient-to-r from-amber-500/25 via-yellow-500/15 to-indigo-500/15'
          : 'bg-gradient-to-r from-amber-400/15 via-yellow-400/10 to-indigo-500/10'
        : isDark
          ? 'bg-gradient-to-r from-slate-600/30 via-indigo-500/20 to-fuchsia-500/15'
          : 'bg-gradient-to-r from-slate-300/20 via-indigo-400/15 to-fuchsia-300/15';

    const iconColor = active
      ? mode === 'light'
        ? isDark
          ? '#fbbf24'
          : '#92400e'
        : isDark
          ? '#a5b4fc'
          : '#5b21b6'
      : isDark
        ? 'rgba(255,255,255,0.7)'
        : 'rgba(17,24,39,0.6)';

    return (
      <Pressable
        onPress={() => onSetThemeMode(mode)}
        className={`flex-1 rounded-lg border px-2 py-3 ${border} ${active ? activeClass : inputBg}`}>
        <View className="flex-row items-center justify-center gap-2">
          <Icon size={18} color={iconColor} />
          <Text className={`font-black ${active ? rootText : subtleText}`}>{label}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className={`border ${border} rounded-xl p-3 ${panelBg}`}>
        <Text className={`text-xl font-black ${rootText}`}>Profile</Text>
        <Text className={`mt-1 font-bold ${subtleText}`}>Nama, bio, dan gambar</Text>

        <View className="mt-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            {imageB64 ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${imageB64}` }}
                style={{ width: 62, height: 62, borderRadius: 16 }}
              />
            ) : (
              <View
                className={`h-[62px] w-[62px] items-center justify-center rounded-[16px] ${inputBg}`}>
                <Text className={`font-black ${subtleText}`}>
                  {name.slice(0, 1).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View className="ml-3">
              <Text className={`text-lg font-black ${rootText}`}>{name || 'Your Name'}</Text>
              <Text className={`mt-1 font-semibold ${subtleText}`} numberOfLines={2}>
                {bio || 'Write your bio...'}
              </Text>
            </View>
          </View>

          <Pressable onPress={onPickImage} className={`border ${border} rounded-lg px-3 py-2`}>
            <Text className={`font-black ${subtleText}`}>Ganti foto</Text>
          </Pressable>
        </View>

        <View className="mt-4">
          <Text className={`text-xs font-black ${subtleText}`}>Nama</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            className={`mt-1 h-[40px] rounded-lg px-3 font-bold ${inputBg} ${rootText}`}
          />
        </View>

        <View className="mt-3">
          <Text className={`text-xs font-black ${subtleText}`}>Bio</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            className={`mt-1 rounded-lg px-3 py-2 font-semibold ${inputBg} ${rootText}`}
          />
        </View>

        <View className="mt-4">
          <Text className={`text-xs font-black ${subtleText}`}>Tanggal ulang tahun</Text>
          <View className="mt-2 flex-row items-center">
            <Pressable
              onPress={() => setShowBirthdayPicker(true)}
              className={`mr-2 h-[42px] flex-1 rounded-lg border px-3 ${border} ${
                isDark ? 'bg-white/5' : 'bg-black/5'
              } items-center justify-center`}>
              <Text className={`font-black ${rootText}`}>{birthday ?? 'Belum diset'}</Text>
            </Pressable>
            <Pressable
              onPress={() => setBirthday(null)}
              className={`h-[42px] rounded-lg border px-3 ${border} ${
                isDark ? 'bg-transparent' : 'bg-white'
              } items-center justify-center`}>
              <Text className={`font-black ${subtleText}`}>Clear</Text>
            </Pressable>
          </View>
        </View>

        <DatePickerModal
          visible={showBirthdayPicker}
          isDark={isDark}
          initialDate={birthday ?? getLocalISODate()}
          onClose={() => setShowBirthdayPicker(false)}
          onSelect={(date) => {
            setBirthday(date);
            setShowBirthdayPicker(false);
          }}
        />

        <View className="mt-4 flex-row gap-2">
          <Pressable
            onPress={onSaveProfile}
            className={`flex-1 rounded-lg border px-4 py-3 ${border} ${isDark ? 'bg-white/15' : 'bg-black/5'}`}>
            <Text className={`text-center font-black ${rootText}`}>Simpan Profile</Text>
          </Pressable>
        </View>
      </View>

      {/* Theme */}
      <View className={`mt-4 border ${border} rounded-xl p-3 ${panelBg}`}>
        <Text className={`text-lg font-black ${rootText}`}>Theme</Text>
        <Text className={`mt-1 font-bold ${subtleText}`}>Pilih: Light / Dark</Text>

        <View className="mt-3 flex-row gap-2">
          <ThemeButton mode="light" label="Light" Icon={SunIcon} />
          <ThemeButton mode="dark" label="Dark" Icon={MoonIcon} />
        </View>
      </View>
    </ScrollView>
  );
}
