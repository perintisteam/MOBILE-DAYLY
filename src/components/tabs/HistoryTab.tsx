import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { getAuditLogs } from '@/db/saasDb';
import type { AuditLog } from '@/types/audit';
import { formatDayHuman, formatTime, getLocalISODate } from '@/utils/date';
import { HistoryCalendarFilterModal } from '@/components/ui/HistoryCalendarFilterModal';

export function HistoryTab(props: { isDark: boolean }) {
  const { isDark } = props;

  const [dayFilter, setDayFilter] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showCalendarFilter, setShowCalendarFilter] = useState(false);

  const rootText = isDark ? 'text-white' : 'text-black';
  const subtleText = isDark ? 'text-white/70' : 'text-black/60';
  const border = isDark ? 'border-white/10' : 'border-black/10';
  const panelBg = isDark ? 'bg-neutral-900' : 'bg-white';

  const truncate = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}...` : s);

  const cleanupPayloadToText = (payload: string) =>
    payload
      .replace(/[{}[\]"]/g, '')
      .replace(/:/g, '=')
      .replace(/,/g, ' • ');

  const getPayloadSummary = (payload: string | null): string => {
    if (!payload) return '';
    try {
      const parsed = JSON.parse(payload) as unknown;
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed)) return `list(${parsed.length})`;
        const obj = parsed as Record<string, unknown>;
        const parts: string[] = [];

        if (typeof obj.title === 'string') parts.push(`title: ${truncate(obj.title, 36)}`);
        if (typeof obj.description === 'string')
          parts.push(`desc: ${truncate(obj.description, 36)}`);
        if (typeof obj.body === 'string') parts.push(`body: ${truncate(obj.body, 36)}`);
        if (typeof obj.note === 'string') parts.push(`note: ${truncate(obj.note, 36)}`);
        if (typeof obj.category === 'string') parts.push(`cat: ${truncate(obj.category, 22)}`);
        if (typeof obj.type === 'string') parts.push(`type: ${truncate(obj.type, 12)}`);
        if (obj.amount != null) parts.push(`amount: ${String(obj.amount)}`);
        if (typeof obj.name === 'string') parts.push(`name: ${truncate(obj.name, 28)}`);
        if (typeof obj.bio === 'string') parts.push(`bio: ${truncate(obj.bio, 28)}`);
        if (typeof obj.birthday === 'string') parts.push(`birthday: ${obj.birthday}`);

        if (parts.length) return parts.join(' • ');
        const keys = Object.keys(obj).slice(0, 6);
        if (keys.length) return `keys: ${keys.join(', ')}`;
        return '';
      }
      if (typeof parsed === 'string') return truncate(parsed, 120);
    } catch {
      // ignore
    }
    return truncate(cleanupPayloadToText(payload), 120);
  };

  const getPayloadDetailsLines = (payload: string | null): string[] => {
    if (!payload) return [];
    try {
      const parsed = JSON.parse(payload) as unknown;
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed)) return [`List length: ${parsed.length}`];

        const obj = parsed as Record<string, unknown>;
        const lines: string[] = [];

        if (typeof obj.title === 'string') lines.push(`Title: ${obj.title}`);
        if (typeof obj.description === 'string') lines.push(`Description: ${obj.description}`);
        if (typeof obj.body === 'string') lines.push(`Body: ${obj.body}`);
        if (typeof obj.note === 'string') lines.push(`Note: ${obj.note}`);
        if (typeof obj.category === 'string') lines.push(`Category: ${obj.category}`);
        if (typeof obj.type === 'string') lines.push(`Type: ${obj.type}`);
        if (obj.amount != null) lines.push(`Amount: ${String(obj.amount)}`);
        if (typeof obj.name === 'string') lines.push(`Name: ${obj.name}`);
        if (typeof obj.bio === 'string') lines.push(`Bio: ${obj.bio}`);
        if (typeof obj.birthday === 'string') lines.push(`Birthday: ${obj.birthday}`);

        if (!lines.length) {
          const keys = Object.keys(obj).slice(0, 12);
          lines.push(`Keys: ${keys.join(', ')}`);
        }

        return lines;
      }
      if (typeof parsed === 'string') return [parsed];
    } catch {
      // ignore
    }
    return [truncate(cleanupPayloadToText(payload), 140)];
  };

  const refresh = () => {
    const rows = getAuditLogs({ limit: 200 });
    setLogs(rows);
  };

  useEffect(() => {
    refresh();
  }, []);

  const display = useMemo(() => {
    let out = logs;
    if (dayFilter) out = out.filter((l) => l.day === dayFilter);
    if (entityFilter.trim()) out = out.filter((l) => l.entity === entityFilter.trim());
    return out;
  }, [dayFilter, entityFilter, logs]);

  const initialDateForModal = useMemo(() => {
    return dayFilter ?? getLocalISODate();
  }, [dayFilter]);

  const dateLabel = useMemo(() => {
    return dayFilter ? formatDayHuman(dayFilter) : 'Semua tanggal';
  }, [dayFilter]);

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className={`border ${border} rounded-xl p-3 ${panelBg}`}>
        <View className="flex-row items-start justify-between">
          <View>
            <Text className={`text-xl font-black ${rootText}`}>History</Text>
            <Text className={`mt-1 font-bold ${subtleText}`}>Audit log: create/update/delete</Text>
          </View>
          <Pressable
            onPress={() => {
              try {
                refresh();
              } catch (e) {
                Alert.alert('Error', e instanceof Error ? e.message : 'Gagal memuat history');
              }
            }}
            className={`rounded-lg border px-3 py-2 ${border}`}>
            <Text className={`font-black ${subtleText}`}>Refresh</Text>
          </Pressable>
        </View>

        <View className="mt-3">
          <Pressable
            onPress={() => setShowCalendarFilter(true)}
            className={`h-[52px] rounded-lg border px-3 py-2 ${
              isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
            }`}>
            <Text className={`font-black ${subtleText}`}>Tanggal: {dateLabel}</Text>
          </Pressable>

          <View className="mt-2 flex-row">
            <Pressable
              onPress={() => setDayFilter(null)}
              className={`flex-1 rounded-lg border px-3 py-2 ${border} ${
                isDark ? 'bg-transparent' : 'bg-white'
              }`}>
              <Text className={`text-center font-black ${subtleText}`}>Clear date</Text>
            </Pressable>

            <View className="ml-2 flex-1">
              <Text className={`text-xs font-black ${subtleText}`}>Filter entity</Text>
              <TextInput
                value={entityFilter}
                onChangeText={setEntityFilter}
                placeholder="activity/money/note/profile"
                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                autoCapitalize="none"
                className={`mt-1 h-[40px] rounded-lg px-3 font-bold ${isDark ? 'bg-white/5' : 'bg-black/5'} ${rootText}`}
              />
            </View>
          </View>
        </View>

        <View className="mt-4">
          {display.length === 0 ? (
            <Text className={`font-bold ${subtleText}`}>Tidak ada data untuk filter ini.</Text>
          ) : (
            display.map((l) => {
              const dayLabel = l.day ? formatDayHuman(l.day) : '—';
              const payloadPreview = getPayloadSummary(l.payload);

              return (
                <Pressable
                  key={l.id}
                  onPress={() => setSelectedLog(l)}
                  className={`mt-3 rounded-xl border ${border} p-3 ${
                    isDark ? 'bg-white/5' : 'bg-black/5'
                  }`}>
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-2">
                      <Text className={`font-black ${rootText}`}>
                        {l.action} {l.entity}
                        {l.entityId != null ? ` #${l.entityId}` : ''}
                      </Text>
                      <Text className={`mt-1 font-bold ${subtleText}`}>
                        {formatTime(l.createdAt)} • {dayLabel}
                      </Text>
                      {payloadPreview ? (
                        <Text className={`mt-2 font-semibold ${subtleText}`}>{payloadPreview}</Text>
                      ) : null}
                      <Text
                        className={`mt-2 font-black ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                        Tap for details
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </View>

      <HistoryCalendarFilterModal
        visible={showCalendarFilter}
        isDark={isDark}
        initialDateIso={initialDateForModal}
        onClose={() => setShowCalendarFilter(false)}
        onSelectDay={(d) => {
          setDayFilter(d);
        }}
      />

      <Modal
        visible={selectedLog != null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedLog(null)}>
        <View className="flex-1 justify-center bg-black/40 p-4">
          <View className={`rounded-3xl border ${border} p-4 ${panelBg}`}>
            {selectedLog ? (
              <>
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className={`text-xl font-black ${rootText}`}>
                      {selectedLog.action} {selectedLog.entity}
                      {selectedLog.entityId != null ? ` #${selectedLog.entityId}` : ''}
                    </Text>
                    <Text className={`mt-1 font-bold ${subtleText}`}>
                      {formatTime(selectedLog.createdAt)} •{' '}
                      {selectedLog.day ? formatDayHuman(selectedLog.day) : '—'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setSelectedLog(null)}
                    className={`rounded-lg border ${border} px-3 py-2`}>
                    <Text className={`font-black ${subtleText}`}>Tutup</Text>
                  </Pressable>
                </View>

                <Text className={`mt-4 font-black ${rootText}`}>Payload</Text>
                <ScrollView className="mt-2" style={{ maxHeight: 320 }}>
                  {getPayloadDetailsLines(selectedLog.payload).map((line, idx) => (
                    <Text
                      key={`${selectedLog.id}-${idx}`}
                      className={`mt-1 font-semibold ${subtleText}`}>
                      {line}
                    </Text>
                  ))}
                </ScrollView>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
