import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Appearance,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ActivityIcon from 'lucide-react-native/dist/esm/icons/activity.js';
import HistoryIcon from 'lucide-react-native/dist/esm/icons/history.js';
import NotebookTextIcon from 'lucide-react-native/dist/esm/icons/notebook-text.js';
import UserIcon from 'lucide-react-native/dist/esm/icons/user.js';
import WalletCardsIcon from 'lucide-react-native/dist/esm/icons/wallet-cards.js';

import { initSaasDb, getProfile, getThemeMode, setThemeMode } from '@/db/saasDb';
import type { ThemeMode } from '@/types/theme';
import { ActivityTab } from '@/components/tabs/ActivityTab';
import { MoneyTab } from '@/components/tabs/MoneyTab';
import { NotesTab } from '@/components/tabs/NotesTab';
import { HistoryTab } from '@/components/tabs/HistoryTab';
import { ProfileTab } from '@/components/tabs/ProfileTab';
import { parseLocalISODate } from '@/utils/date';

type TabKey = 'activity' | 'money' | 'notes' | 'history' | 'profile';

const TAB_ITEMS: {
  key: TabKey;
  label: string;
  Icon: React.ComponentType<{ color?: string; size?: number }>;
}[] = [
  { key: 'activity', label: 'Activity', Icon: ActivityIcon },
  { key: 'money', label: 'Money', Icon: WalletCardsIcon },
  { key: 'notes', label: 'Notes', Icon: NotebookTextIcon },
  { key: 'history', label: 'History', Icon: HistoryIcon },
  { key: 'profile', label: 'Profile', Icon: UserIcon },
];

const TAB_ORDER: TabKey[] = ['activity', 'money', 'notes', 'history', 'profile'];

export function SaasApp() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<TabKey>('activity');

  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const pagerRef = useRef<ScrollView | null>(null);

  const colorScheme = Appearance.getColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const isDark = useMemo(() => {
    if (themeMode === 'dark') return true;
    if (themeMode === 'light') return false;
    return colorScheme === 'dark';
  }, [colorScheme, themeMode]);

  const [profileImageB64, setProfileImageB64] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string>('Your Name');
  const [birthday, setBirthday] = useState<string | null>(null);

  useEffect(() => {
    initSaasDb();
    const mode = getThemeMode();
    setThemeModeState(mode);
    const p = getProfile();
    setProfileImageB64(p.imageB64);
    setProfileName(p.name);
    setBirthday(p.birthday);

    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const idx = Math.max(0, Math.min(TAB_ORDER.length - 1, TAB_ORDER.indexOf(tab)));
    const x = idx * screenWidth;
    pagerRef.current?.scrollTo({ x, animated: true });
  }, [ready, tab, screenWidth]);

  const onSetThemeMode = (m: ThemeMode) => {
    setThemeModeState(m);
    setThemeMode(m);
  };

  const birthdayToday = useMemo(() => {
    if (!birthday) return false;
    const bd = parseLocalISODate(birthday);
    const now = new Date();
    return bd.getMonth() === now.getMonth() && bd.getDate() === now.getDate();
  }, [birthday]);

  const rootBg = isDark ? 'bg-neutral-950' : 'bg-neutral-50';
  const textColor = isDark ? 'text-white' : 'text-black';
  const borderColor = isDark ? 'border-white/10' : 'border-black/10';
  const panelBg = isDark ? 'bg-neutral-900/90' : 'bg-white/90';
  const subtleText = isDark ? 'text-white/70' : 'text-black/60';
  const accentBg = isDark ? 'bg-white/10' : 'bg-black/5';
  const activeText = isDark ? 'text-indigo-400' : 'text-indigo-600';
  const activeBg = isDark ? 'bg-indigo-500/20' : 'bg-indigo-500/10';

  const getActiveAccent = (key: TabKey) => {
    switch (key) {
      case 'activity':
        return {
          bg: isDark ? 'bg-emerald-500/20' : 'bg-emerald-500/10',
          border: isDark ? 'border-emerald-400/30' : 'border-emerald-500/25',
          text: isDark ? 'text-emerald-300' : 'text-emerald-700',
          icon: isDark ? '#34d399' : '#059669',
        };
      case 'money':
        return {
          bg: isDark ? 'bg-indigo-500/20' : 'bg-indigo-500/10',
          border: isDark ? 'border-indigo-400/30' : 'border-indigo-500/25',
          text: isDark ? 'text-indigo-300' : 'text-indigo-700',
          icon: isDark ? '#a5b4fc' : '#4f46e5',
        };
      case 'notes':
        return {
          bg: isDark ? 'bg-fuchsia-500/20' : 'bg-fuchsia-500/10',
          border: isDark ? 'border-fuchsia-400/30' : 'border-fuchsia-500/25',
          text: isDark ? 'text-fuchsia-300' : 'text-fuchsia-700',
          icon: isDark ? '#e9d5ff' : '#db2777',
        };
      case 'history':
        return {
          bg: isDark ? 'bg-sky-500/20' : 'bg-sky-500/10',
          border: isDark ? 'border-sky-400/30' : 'border-sky-500/25',
          text: isDark ? 'text-sky-300' : 'text-sky-700',
          icon: isDark ? '#7dd3fc' : '#0284c7',
        };
      case 'profile':
        return {
          bg: isDark ? 'bg-amber-500/20' : 'bg-amber-500/10',
          border: isDark ? 'border-amber-400/30' : 'border-amber-500/25',
          text: isDark ? 'text-amber-300' : 'text-amber-700',
          icon: isDark ? '#fbbf24' : '#d97706',
        };
      default:
        return { bg: activeBg, border: borderColor, text: activeText, icon: '#4f46e5' };
    }
  };

  const screens = useMemo(
    () => [
      <ActivityTab key="activity" isDark={isDark} />,
      <MoneyTab key="money" isDark={isDark} />,
      <NotesTab key="notes" isDark={isDark} />,
      <HistoryTab key="history" isDark={isDark} />,
      <ProfileTab
        key="profile"
        isDark={isDark}
        themeMode={themeMode}
        onSetThemeMode={onSetThemeMode}
        onProfileUpdated={() => {
          const p = getProfile();
          setProfileImageB64(p.imageB64);
          setProfileName(p.name);
          setBirthday(p.birthday);
        }}
      />,
    ],
    [isDark, themeMode]
  );

  if (!ready) {
    return (
      <View className={`flex-1 ${rootBg} items-center justify-center`}>
        <Text className={`font-bold ${textColor}`}>Loading...</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${rootBg} relative`}>
      <View className="absolute left-0 top-0 h-32 w-32 rounded-full bg-indigo-500/20" />
      <View className="absolute right-0 top-0 h-32 w-32 rounded-full bg-fuchsia-500/20" />
      <View className="absolute bottom-24 left-10 h-28 w-28 rounded-full bg-emerald-500/15" />

      <View
        className={`px-4 ${isDark ? 'pb-3' : 'pb-2'} relative`}
        style={{ paddingTop: insets.top + 8 }}>
        <View className={`flex-row items-center justify-between ${borderColor} border-b pb-3`}>
          <View>
            <Text
              className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'}`}
              style={{
                textShadowColor: isDark ? 'rgba(165,180,252,0.35)' : 'rgba(79,70,229,0.25)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 6,
              }}>
              DAYLY
            </Text>
            <Text className={`mt-1 font-bold ${subtleText}`}>Activity • Money • Notes</Text>
            {birthdayToday ? (
              <View
                className={`mt-2 rounded-2xl border px-3 py-2 ${
                  isDark
                    ? 'border-fuchsia-400/30 bg-fuchsia-500/15'
                    : 'border-fuchsia-500/20 bg-fuchsia-500/10'
                }`}>
                <Text className={`font-black ${isDark ? 'text-fuchsia-300' : 'text-fuchsia-700'}`}>
                  Selamat ulang tahun, {profileName}!
                </Text>
              </View>
            ) : null}
          </View>

          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setTab('profile')}
              className={`flex-row items-center justify-center rounded-[12px] border ${
                isDark ? 'border-white/15 bg-white/5' : 'border-black/10 bg-black/5'
              }`}>
              {profileImageB64 ? (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${profileImageB64}` }}
                  style={{ width: 38, height: 38, borderRadius: 10 }}
                />
              ) : (
                <View
                  className={`h-[38px] w-[38px] items-center justify-center rounded-[10px] ${accentBg}`}>
                  <Text className={`font-black ${textColor}`}>
                    {profileName.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      <View className={`flex-1 ${panelBg}`}>
        <ScrollView
          ref={(r) => {
            pagerRef.current = r;
          }}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            const idx = Math.round(x / screenWidth);
            const clampedIdx = Math.max(0, Math.min(TAB_ORDER.length - 1, idx));
            const key = TAB_ORDER[clampedIdx];
            if (key && key !== tab) setTab(key);
          }}
          scrollEventThrottle={16}>
          {TAB_ORDER.map((key, i) => (
            <View key={key} style={{ width: screenWidth, paddingHorizontal: 16 }}>
              {screens[i]}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Bottom navbar (mobile) */}
      <View
        className={`border-t ${borderColor} ${
          isDark
            ? 'bg-gradient-to-r from-indigo-900/40 via-fuchsia-900/35 to-emerald-900/35'
            : 'bg-gradient-to-r from-indigo-100/50 via-fuchsia-100/45 to-emerald-100/45'
        }`}
        style={{ paddingBottom: insets.bottom + 4 }}>
        <View className="flex-row px-3 py-1">
          {TAB_ITEMS.map((it) => {
            const active = tab === it.key;
            const activeAccent = active ? getActiveAccent(it.key) : null;
            const iconColor = activeAccent ? activeAccent.icon : isDark ? '#e5e7eb' : '#111827';
            const itemTextClass = activeAccent ? activeAccent.text : subtleText;

            return (
              <Pressable
                key={it.key}
                onPress={() => {
                  setTab(it.key);
                }}
                className={`mx-1 flex-1 items-center rounded-xl border py-2 ${
                  active
                    ? `${activeAccent?.border} ${activeAccent?.bg}`
                    : 'border-transparent bg-transparent'
                }`}>
                <it.Icon color={iconColor} size={22} />
                <Text className={`mt-1 font-black ${itemTextClass}`}>{it.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
