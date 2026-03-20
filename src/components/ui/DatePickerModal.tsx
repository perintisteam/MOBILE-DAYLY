import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

import { getLocalISODate, parseLocalISODate } from '@/utils/date';

export function DatePickerModal(props: {
  visible: boolean;
  isDark: boolean;
  initialDate: string; // YYYY-MM-DD
  onClose: () => void;
  onSelect: (date: string) => void;
}) {
  const { visible, isDark, initialDate, onClose, onSelect } = props;

  const safeInitialDate = (() => {
    const isIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(initialDate);
    if (!isIsoDate) return getLocalISODate();
    const dt = parseLocalISODate(initialDate);
    return Number.isNaN(dt.getTime()) ? getLocalISODate() : initialDate;
  })();

  const theme = {
    calendarBackground: isDark ? '#0b0b0b' : '#ffffff',
    dayTextColor: isDark ? '#e5e7eb' : '#111827',
    monthTextColor: isDark ? '#ffffff' : '#111827',
    textSectionTitleColor: isDark ? '#e5e7eb' : '#6b7280',
    arrowColor: isDark ? '#e5e7eb' : '#111827',
    selectedDayBackgroundColor: isDark ? '#4f46e5' : '#4f46e5',
    selectedDayTextColor: '#ffffff',
    todayTextColor: isDark ? '#a78bfa' : '#4f46e5',
    textDisabledColor: isDark ? 'rgba(229,231,235,0.4)' : 'rgba(17,24,39,0.3)',
    'stylesheet.calendar.main': {},
  };

  const marked = {
    [safeInitialDate]: {
      selected: true,
      selectedColor: '#4f46e5',
    },
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/40">
        <View className={`rounded-t-3xl ${isDark ? 'bg-neutral-900' : 'bg-white'} p-4`}>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className={`text-lg font-black ${isDark ? 'text-white' : 'text-black'}`}>
              Pilih tanggal
            </Text>
            <Pressable onPress={onClose} className="rounded-lg border border-white/10 px-2 py-1">
              <Text className={`font-black ${isDark ? 'text-white' : 'text-black'}`}>Tutup</Text>
            </Pressable>
          </View>

          <Calendar
            current={safeInitialDate}
            markedDates={marked}
            theme={theme}
            onDayPress={(day) => {
              onSelect(day.dateString);
              onClose();
            }}
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,24,39,0.08)',
            }}
          />
        </View>
      </View>
    </Modal>
  );
}
