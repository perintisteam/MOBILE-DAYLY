import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

import { getLocalISODate, parseLocalISODate } from '@/utils/date';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function safeToDayIso(v: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return getLocalISODate();
  const dt = parseLocalISODate(v);
  return Number.isNaN(dt.getTime()) ? getLocalISODate() : v;
}

export function HistoryCalendarFilterModal(props: {
  visible: boolean;
  isDark: boolean;
  initialDateIso: string; // YYYY-MM-DD
  onClose: () => void;
  onSelectDay: (dayIso: string) => void;
}) {
  const { visible, isDark, initialDateIso, onClose, onSelectDay } = props;

  const [anchor, setAnchor] = useState<Date>(() => parseLocalISODate(safeToDayIso(initialDateIso)));
  const [yearDraft, setYearDraft] = useState<string>(() => String(new Date().getFullYear()));

  useEffect(() => {
    if (!visible) return;
    const dayIso = safeToDayIso(initialDateIso);
    const dt = parseLocalISODate(dayIso);
    setAnchor(dt);
    setYearDraft(String(dt.getFullYear()));
  }, [initialDateIso, visible]);

  const theme = useMemo(() => {
    return {
      calendarBackground: isDark ? '#0b0b0b' : '#ffffff',
      dayTextColor: isDark ? '#e5e7eb' : '#111827',
      monthTextColor: isDark ? '#ffffff' : '#111827',
      textSectionTitleColor: isDark ? '#e5e7eb' : '#6b7280',
      arrowColor: isDark ? '#e5e7eb' : '#111827',
      selectedDayBackgroundColor: isDark ? '#4f46e5' : '#4f46e5',
      selectedDayTextColor: '#ffffff',
      todayTextColor: isDark ? '#a78bfa' : '#4f46e5',
      textDisabledColor: isDark ? 'rgba(229,231,235,0.4)' : 'rgba(17,24,39,0.3)',
    };
  }, [isDark]);

  const marked = useMemo(() => {
    const safeDay = safeToDayIso(initialDateIso);
    return {
      [safeDay]: { selected: true, selectedColor: '#4f46e5' },
    };
  }, [initialDateIso]);

  const monthStartIso = useMemo(() => {
    const y = anchor.getFullYear();
    const m = anchor.getMonth() + 1;
    return `${y}-${pad2(m)}-01`;
  }, [anchor]);

  const moveMonth = (delta: number) => {
    const next = new Date(anchor);
    next.setMonth(next.getMonth() + delta);
    setAnchor(next);
  };

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];

  const renderHeader = () => {
    const currentY = anchor.getFullYear();
    const currentM = anchor.getMonth();
    const label = `${monthNames[currentM]} ${currentY}`;

    return (
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => moveMonth(-1)}
            className="rounded-lg border border-white/10 px-2 py-1">
            <Text className={`font-black ${isDark ? 'text-white' : 'text-black'}`}>{'<'}</Text>
          </Pressable>

          <View>
            <Text className={`font-black ${isDark ? 'text-white' : 'text-black'}`}>{label}</Text>
            <View className="mt-1 flex-row items-center gap-2">
              <Pressable
                onPress={() => setYearDraft(String(currentY - 10))}
                className={`rounded-lg border px-2 py-1 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                <Text className={`font-black ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                  {'-10'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setYearDraft(String(currentY - 1))}
                className={`rounded-lg border px-2 py-1 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                <Text className={`font-black ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                  {'-1'}
                </Text>
              </Pressable>
              <TextInput
                value={yearDraft}
                onChangeText={setYearDraft}
                keyboardType="numeric"
                className={`h-[34px] w-[74px] rounded-lg border px-2 font-bold ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white'
                    : 'border-black/10 bg-black/5 text-black'
                }`}
              />
              <Pressable
                onPress={() => {
                  const y = Number(yearDraft);
                  if (Number.isFinite(y)) {
                    const next = new Date(anchor);
                    next.setFullYear(y);
                    setAnchor(next);
                  }
                }}
                className={`rounded-lg border px-2 py-1 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                <Text className={`font-black ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                  {'Go'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setYearDraft(String(currentY + 1))}
                className={`rounded-lg border px-2 py-1 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                <Text className={`font-black ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                  {'+1'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setYearDraft(String(currentY + 10))}
                className={`rounded-lg border px-2 py-1 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                <Text className={`font-black ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                  {'+10'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => moveMonth(1)}
          className="rounded-lg border border-white/10 px-2 py-1">
          <Text className={`font-black ${isDark ? 'text-white' : 'text-black'}`}>{'>'}</Text>
        </Pressable>
      </View>
    );
  };

  const renderDayMode = () => {
    return (
      <View className="rounded-t-3xl p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className={`text-lg font-black ${isDark ? 'text-white' : 'text-black'}`}>
            Filter day
          </Text>
          <Pressable
            onPress={onClose}
            className={`rounded-lg border px-2 py-1 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            <Text className={`font-black ${isDark ? 'text-white' : 'text-black'}`}>Tutup</Text>
          </Pressable>
        </View>

        {renderHeader()}

        <Calendar
          current={monthStartIso}
          markedDates={marked}
          theme={theme}
          enableSwipeMonths
          onDayPress={(day) => {
            onSelectDay(day.dateString);
            onClose();
          }}
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,24,39,0.08)',
          }}
        />
      </View>
    );
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        {/* prevent onPress bubbling when touching modal content */}
        <Pressable className={isDark ? 'bg-neutral-900' : 'bg-white'} onPress={() => {}}>
          {renderDayMode()}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
