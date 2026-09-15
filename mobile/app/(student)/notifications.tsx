/**
 * SmartAttend — Student Notifications Screen
 * Design reference: stitch_smartattend_mobile_app_onboarding/notifications/code.html
 */
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { SmartAttendLogo } from '../../assets/SmartAttendLogo';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Shadow, Spacing } from '../../constants/spacing';
import { MOCK_STUDENT_NOTIFICATIONS } from '../../mocks/mockData';

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(MOCK_STUDENT_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <SmartAttendLogo size={32} />
          <View>
            <Text style={styles.headerBrand}>AutoMark</Text>
            <Text style={styles.headerTitle}>Notifications</Text>
          </View>
        </View>
        <View style={styles.avatar}>
          <Ionicons name="person" size={18} color={Colors.onPrimary} />
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Page header */}
        <View style={styles.topBar}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.onSurface} />
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={styles.pageTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCount} new</Text>
              </View>
            )}
          </View>
          {unreadCount > 0 && (
            <Pressable onPress={markAllRead}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          )}
        </View>

        {/* Notification cards */}
        <View style={styles.list}>
          {notifications.map((notif) => (
            <Pressable
              key={notif.id}
              style={[styles.notifCard, !notif.read && styles.notifCardUnread]}
              onPress={() => markRead(notif.id)}
            >
              <View style={[styles.notifIconWrap, { backgroundColor: `${notif.color}18` }]}>
                <Ionicons name={notif.icon as any} size={22} color={notif.color} />
              </View>
              <View style={styles.notifBody}>
                <View style={styles.notifHeader}>
                  <Text style={styles.notifTitle}>{notif.title}</Text>
                  {!notif.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notifMessage}>{notif.message}</Text>
                <View style={styles.notifMeta}>
                  <Ionicons name="time-outline" size={12} color={Colors.outline} />
                  <Text style={styles.notifTime}>{notif.time} · {notif.date}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  header: {
    height: 64, paddingHorizontal: Spacing.marginMobile,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerBrand: { ...Typography.labelMd, color: Colors.primaryContainer, fontWeight: '600' },
  headerTitle: { ...Typography.titleSm, color: Colors.onSurface },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.marginMobile, paddingVertical: Spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
  titleBlock: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pageTitle: { ...Typography.headlineMd, color: Colors.onSurface, fontWeight: '700' },
  unreadBadge: { backgroundColor: Colors.primaryContainer, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2 },
  unreadText: { ...Typography.labelXs, color: Colors.onPrimary, fontWeight: '700' },
  markAllText: { ...Typography.labelMd, color: Colors.primaryContainer, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.marginMobile, gap: Spacing.sm },
  notifCard: {
    flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start',
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl,
    padding: Spacing.md, ...Shadow.sm,
  },
  notifCardUnread: { borderLeftWidth: 3, borderLeftColor: Colors.primaryContainer },
  notifIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifBody: { flex: 1 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  notifTitle: { ...Typography.labelLg, color: Colors.onSurface, fontWeight: '600', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primaryContainer, marginLeft: 8 },
  notifMessage: { ...Typography.bodySm, color: Colors.onSurfaceVariant, lineHeight: 18, marginBottom: 6 },
  notifMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  notifTime: { ...Typography.labelXs, color: Colors.outline },
});
