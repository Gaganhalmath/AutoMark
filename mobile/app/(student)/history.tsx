/**
 * SmartAttend — Student Attendance History Screen
 * Real backend attendance history
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { SmartAttendLogo } from '../../assets/SmartAttendLogo';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Shadow, Spacing } from '../../constants/spacing';
import { useAuth } from '../../auth/AuthProvider';

const API_BASE_URL = 'https://automark-backend-wput.onrender.com/api';

type AttendanceRecord = {
  attendanceId: number;
  sessionId: number;
  date: string | null;
  markedAt: string | null;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  source: string | null;
  subject: {
    id: number | null;
    code: string | null;
    name: string | null;
  } | null;
};

type FilterTab = 'all' | 'present' | 'absent' | 'late';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'present', label: 'Present' },
  { key: 'absent', label: 'Absent' },
  { key: 'late', label: 'Late' },
];

const STATUS_CONFIG = {
  PRESENT: {
    bg: '#EAF8ED',
    text: '#16A34A',
    label: 'Present',
    icon: 'checkmark-circle',
    stripColor: '#16A34A',
  },
  ABSENT: {
    bg: '#FDECEC',
    text: '#DC2626',
    label: 'Absent',
    icon: 'close-circle',
    stripColor: '#DC2626',
  },
  LATE: {
    bg: '#FFF7E6',
    text: '#F59E0B',
    label: 'Late',
    icon: 'time',
    stripColor: '#F59E0B',
  },
};

export default function HistoryScreen() {
  const router = useRouter();
  const { tokens } = useAuth();

  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [error, setError] = useState('');

  const fetchHistory = async (isRefresh = false) => {
    if (!tokens?.accessToken) {
      setError('Authentication token is missing.');
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
  setRefreshing(true);
} else {
  setLoading(true);
}

setError('');

      const response = await fetch(
        `${API_BASE_URL}/student/attendance/history`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        },
      );

      const result = await response.json();

      console.log('STUDENT HISTORY STATUS:', response.status);
      console.log('STUDENT HISTORY RESPONSE:', result);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Failed to load attendance history',
        );
      }

      setRecords(result.data || []);
    } catch (err) {
      console.error('STUDENT HISTORY ERROR:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load attendance history',
      );
    } finally {
      setLoading(false);
setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [tokens?.accessToken]);

  const formatDate = (date: string | null) => {
    if (!date) return 'Unknown date';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (date: string | null) => {
    if (!date) return '';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    return parsed.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return records.filter((record) => {
      let matchesFilter = true;

      if (filter === 'present') {
        matchesFilter = record.status === 'PRESENT';
      }

      if (filter === 'absent') {
        matchesFilter = record.status === 'ABSENT';
      }

      if (filter === 'late') {
        matchesFilter = record.status === 'LATE';
      }

      const subjectName = record.subject?.name || '';
      const subjectCode = record.subject?.code || '';
      const dateText = record.date || '';
      const statusText = record.status || '';

      const matchesSearch =
        !q ||
        subjectName.toLowerCase().includes(q) ||
        subjectCode.toLowerCase().includes(q) ||
        dateText.toLowerCase().includes(q) ||
        statusText.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [records, filter, search]);

  const presentCount = records.filter(
    (item) => item.status === 'PRESENT',
  ).length;

  const absentCount = records.filter(
    (item) => item.status === 'ABSENT',
  ).length;

  const lateCount = records.filter(
    (item) => item.status === 'LATE',
  ).length;

  const attendanceRate =
    records.length > 0
      ? Math.round((presentCount / records.length) * 1000) / 10
      : 0;

  const groupedRecords = useMemo(() => {
    const groups: {
      [key: string]: AttendanceRecord[];
    } = {};

    filtered.forEach((record) => {
      const date = record.date
        ? new Date(record.date)
        : null;

      const key =
        date && !Number.isNaN(date.getTime())
          ? date.toLocaleDateString('en-IN', {
              month: 'long',
              year: 'numeric',
            })
          : 'Other';

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(record);
    });

    return Object.entries(groups);
  }, [filtered]);

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <SmartAttendLogo size={32} />

          <View>
            <Text style={styles.headerBrand}>
              AutoMark
            </Text>

            <Text style={styles.headerTitle}>
              History
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            style={styles.iconBtn}
            onPress={() =>
              router.push('/(student)/notifications')
            }
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={Colors.onSurfaceVariant}
            />
          </Pressable>

          <View style={styles.avatar}>
            <Ionicons
              name="person"
              size={18}
              color={Colors.onPrimary}
            />
          </View>
        </View>
      </View>

      <ScrollView
  style={styles.scroll}
  contentContainerStyle={styles.scrollContent}
  showsVerticalScrollIndicator={false}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={() => fetchHistory(true)}
      colors={[Colors.primaryContainer]}
      tintColor={Colors.primaryContainer}
    />
  }
>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={Colors.onSurface}
            />
          </Pressable>

          <View style={styles.titleRow}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={Colors.primaryContainer}
            />

            <Text style={styles.pageTitle}>
              Attendance History
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color={Colors.onSurfaceVariant}
            style={styles.searchIcon}
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Search by subject, code or date"
            placeholderTextColor={Colors.outline}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Summary */}
        {!loading && !error && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text
                style={[
                  styles.summaryValue,
                  { color: '#16A34A' },
                ]}
              >
                {presentCount}
              </Text>

              <Text style={styles.summaryLabel}>
                Present
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text
                style={[
                  styles.summaryValue,
                  { color: '#DC2626' },
                ]}
              >
                {absentCount}
              </Text>

              <Text style={styles.summaryLabel}>
                Absent
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text
                style={[
                  styles.summaryValue,
                  { color: '#F59E0B' },
                ]}
              >
                {lateCount}
              </Text>

              <Text style={styles.summaryLabel}>
                Late
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text
                style={[
                  styles.summaryValue,
                  { color: Colors.primaryContainer },
                ]}
              >
                {attendanceRate}%
              </Text>

              <Text style={styles.summaryLabel}>
                Rate
              </Text>
            </View>
          </View>
        )}

        {/* Filter tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          <View style={styles.filterRow}>
            {FILTER_TABS.map((tab) => {
              const active = filter === tab.key;

              let count = records.length;

              if (tab.key === 'present') {
                count = presentCount;
              }

              if (tab.key === 'absent') {
                count = absentCount;
              }

              if (tab.key === 'late') {
                count = lateCount;
              }

              return (
                <Pressable
                  key={tab.key}
                  style={[
                    styles.filterTab,
                    active && styles.filterTabActive,
                  ]}
                  onPress={() => setFilter(tab.key)}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      active &&
                        styles.filterTabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>

                  <View
                    style={[
                      styles.filterBadge,
                      {
                        backgroundColor: active
                          ? 'rgba(255,255,255,0.25)'
                          : Colors.surfaceContainerHigh,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterBadgeText,
                        active && {
                          color: Colors.onPrimary,
                        },
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Loading */}
        {loading && (
          <View style={styles.centerState}>
            <ActivityIndicator
              size="large"
              color={Colors.primaryContainer}
            />

            <Text style={styles.stateText}>
              Loading attendance history...
            </Text>
          </View>
        )}

        {/* Error */}
        {!loading && error !== '' && (
          <View style={styles.errorState}>
            <Ionicons
              name="alert-circle-outline"
              size={40}
              color={Colors.error}
            />

            <Text style={styles.emptyTitle}>
              Unable to load history
            </Text>

            <Text style={styles.emptyBody}>
              {error}
            </Text>

            <Pressable
              style={styles.resetBtn}
              onPress={fetchHistory}
            >
              <Text style={styles.resetBtnText}>
                Try Again
              </Text>
            </Pressable>
          </View>
        )}

        {/* Data */}
        {!loading &&
          error === '' &&
          groupedRecords.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={28}
                  color={Colors.onSurfaceVariant}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No attendance records found
              </Text>

              <Text style={styles.emptyBody}>
                No attendance records match your current
                filter or search.
              </Text>

              <Pressable
                style={styles.resetBtn}
                onPress={() => {
                  setFilter('all');
                  setSearch('');
                }}
              >
                <Text style={styles.resetBtnText}>
                  Reset Filters
                </Text>
              </Pressable>
            </View>
          )}

        {!loading &&
          error === '' &&
          groupedRecords.map(([month, monthRecords]) => (
            <View key={month}>
              {/* Month header */}
              <View style={styles.monthHeader}>
                <View style={styles.monthLeft}>
                  <Text style={styles.monthText}>
                    {month}
                  </Text>

                  <View style={styles.monthBadge}>
                    <Text style={styles.monthBadgeText}>
                      {monthRecords.length}{' '}
                      {monthRecords.length === 1
                        ? 'record'
                        : 'records'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Cards */}
              <View style={styles.cardsList}>
                {monthRecords.map((record) => {
                  const cfg =
                    STATUS_CONFIG[record.status] ??
                    STATUS_CONFIG.ABSENT;

                  return (
                    <Pressable
                      key={record.attendanceId}
                      style={styles.sessionCard}
                      onPress={() =>
                        router.push({
                          pathname:
                            '/(student)/history-detail',
                          params: {
                            sessionId: String(
                              record.sessionId,
                            ),
                            attendanceId: String(
                              record.attendanceId,
                            ),
                          },
                        })
                      }
                    >
                      {/* Left strip */}
                      <View
                        style={[
                          styles.strip,
                          {
                            backgroundColor:
                              cfg.stripColor,
                          },
                        ]}
                      />

                      <View style={styles.sessionContent}>
                        {/* Subject + Status */}
                        <View style={styles.sessionRow}>
                          <View style={styles.sessionLeft}>
                            <View
                              style={styles.subjectRow}
                            >
                              <Ionicons
                                name="school-outline"
                                size={18}
                                color={
                                  Colors.primaryContainer
                                }
                              />

                              <Text
                                style={
                                  styles.sessionSubject
                                }
                                numberOfLines={2}
                              >
                                {record.subject?.name ||
                                  'Unknown Subject'}
                              </Text>
                            </View>

                            <Text
                              style={styles.sessionSection}
                            >
                              {record.subject?.code ||
                                'No subject code'}
                              {' • '}
                              Session #{record.sessionId}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor:
                                  cfg.bg,
                              },
                            ]}
                          >
                            <Ionicons
                              name={cfg.icon as any}
                              size={14}
                              color={cfg.text}
                            />

                            <Text
                              style={[
                                styles.statusBadgeText,
                                {
                                  color: cfg.text,
                                },
                              ]}
                            >
                              {cfg.label}
                            </Text>
                          </View>
                        </View>

                        {/* Date */}
                        <View style={styles.timeRow}>
                          <Ionicons
                            name="calendar-outline"
                            size={16}
                            color={Colors.outline}
                          />

                          <Text style={styles.timeText}>
                            {formatDate(record.date)}
                          </Text>
                        </View>

                        {/* Marked time */}
                        {record.markedAt && (
                          <View style={styles.timeRow}>
                            <Ionicons
                              name="time-outline"
                              size={16}
                              color={Colors.outline}
                            />

                            <Text style={styles.timeText}>
                              Marked at{' '}
                              {formatTime(
                                record.markedAt,
                              )}
                            </Text>
                          </View>
                        )}

                        {/* Source */}
                        <View style={styles.sourceRow}>
                          <Ionicons
                            name={
                              record.source === 'BLE'
                                ? 'bluetooth-outline'
                                : 'create-outline'
                            }
                            size={15}
                            color={
                              Colors.onSurfaceVariant
                            }
                          />

                          <Text style={styles.sourceText}>
                            Source:{' '}
                            {record.source || 'Manual'}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}

        {/* Info */}
        {!loading && error === '' && records.length > 0 && (
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={Colors.primaryContainer}
              />
            </View>

            <Text style={styles.infoText}>
              This history shows attendance records
              recorded for your account. BLE attendance
              is identified by the BLE source.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },

  header: {
    height: 64,
    paddingHorizontal: Spacing.marginMobile,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  headerBrand: {
    ...Typography.labelMd,
    color: Colors.primaryContainer,
    fontWeight: '600',
  },

  headerTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 32,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.marginMobile,
    paddingVertical: Spacing.sm,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  pageTitle: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    fontWeight: '700',
  },

  searchContainer: {
    marginHorizontal: Spacing.marginMobile,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    height: 48,
    ...Shadow.sm,
  },

  searchIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },

  searchInput: {
    flex: 1,
    paddingLeft: 44,
    paddingRight: Spacing.md,
    ...Typography.bodySm,
    color: Colors.onSurface,
  },

  summaryCard: {
    marginHorizontal: Spacing.marginMobile,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: 12,
    flexDirection: 'row',
    ...Shadow.sm,
  },

  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },

  summaryValue: {
    ...Typography.titleSm,
    fontWeight: '700',
  },

  summaryLabel: {
    ...Typography.labelXs,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },

  filterScroll: {
    paddingLeft: Spacing.marginMobile,
    marginBottom: Spacing.xl,
  },

  filterRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingRight: Spacing.marginMobile,
    paddingBottom: 4,
  },

  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 100,
    backgroundColor: Colors.surfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  filterTabActive: {
    backgroundColor: Colors.primaryContainer,
  },

  filterTabText: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },

  filterTabTextActive: {
    color: Colors.onPrimary,
    fontWeight: '600',
  },

  filterBadge: {
    borderRadius: 100,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },

  filterBadgeText: {
    ...Typography.labelXs,
    color: Colors.onSurface,
    fontWeight: '700',
  },

  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },

  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
    gap: 8,
  },

  stateText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    marginHorizontal: Spacing.marginMobile,
    ...Shadow.sm,
    gap: 8,
  },

  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  emptyTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: '600',
    textAlign: 'center',
  },

  emptyBody: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 280,
  },

  resetBtn: {
    marginTop: 8,
    backgroundColor: Colors.primaryContainer,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  resetBtnText: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
    fontWeight: '600',
  },

  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.marginMobile,
    marginBottom: Spacing.md,
  },

  monthLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  monthText: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: '700',
  },

  monthBadge: {
    backgroundColor: Colors.primaryFixed,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },

  monthBadgeText: {
    ...Typography.labelXs,
    color: Colors.onPrimaryFixed,
    fontWeight: '600',
  },

  cardsList: {
    paddingHorizontal: Spacing.marginMobile,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },

  sessionCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Shadow.sm,
  },

  strip: {
    width: 4,
  },

  sessionContent: {
    flex: 1,
    padding: 14,
    gap: 8,
  },

  sessionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },

  sessionLeft: {
    flex: 1,
  },

  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },

  sessionSubject: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: '600',
    flexShrink: 1,
  },

  sessionSection: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 0,
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  timeText: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },

  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  sourceText: {
    ...Typography.labelXs,
    color: Colors.onSurfaceVariant,
  },

  infoCard: {
    marginHorizontal: Spacing.marginMobile,
    marginTop: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },

  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  infoText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    flex: 1,
    lineHeight: 18,
  },
});