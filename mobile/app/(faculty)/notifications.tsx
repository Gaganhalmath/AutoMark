/**
 * SmartAttend — Faculty Notifications Screen
 * Uses real backend faculty notification APIs.
 */

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useRouter } from 'expo-router';

import { useAuth } from '../../auth/AuthProvider';
import { Colors } from '../../constants/colors';

interface BackendNotification {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface NotifItem {
  id: number;
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

const API_BASE_URL = 'http://192.168.212.213:5000/api';

export default function FacultyNotificationsScreen() {
  const router = useRouter();
  const { tokens } = useAuth();

  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatNotificationTime = (dateString: string) => {
    if (!dateString) return '';

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    const now = new Date();

    const sameDay =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (sameDay) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return 'Yesterday';
    }

    return date.toLocaleDateString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const mapNotification = (
    notification: BackendNotification
  ): NotifItem => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    time: formatNotificationTime(notification.createdAt),
    unread: !notification.isRead,
  });

  const loadNotifications = useCallback(async () => {
    if (!tokens?.accessToken) {
      setError('Authentication token is missing.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/faculty/notifications`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      console.log(
        'FACULTY NOTIFICATIONS STATUS:',
        response.status
      );

      console.log(
        'FACULTY NOTIFICATIONS RESPONSE:',
        JSON.stringify(result)
      );

      if (!response.ok) {
        throw new Error(
          result?.message || 'Failed to load notifications.'
        );
      }

      const backendNotifications: BackendNotification[] =
        Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result)
            ? result
            : [];

      setNotifications(
        backendNotifications.map(mapNotification)
      );
    } catch (err: any) {
      console.error(
        'FACULTY NOTIFICATIONS ERROR:',
        err
      );

      setError(
        err?.message ||
          'Unable to load notifications.'
      );
    } finally {
      setLoading(false);
    }
  }, [tokens?.accessToken]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const handleNotificationPress = async (
    notification: NotifItem
  ) => {
    if (!notification.unread) {
      return;
    }

    if (!tokens?.accessToken) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/faculty/notifications/${notification.id}/read`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      console.log(
        'MARK NOTIFICATION READ STATUS:',
        response.status
      );

      console.log(
        'MARK NOTIFICATION READ RESPONSE:',
        JSON.stringify(result)
      );

      if (!response.ok) {
        throw new Error(
          result?.message ||
            'Failed to mark notification as read.'
        );
      }

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id
            ? { ...item, unread: false }
            : item
        )
      );
    } catch (err) {
      console.error(
        'MARK NOTIFICATION READ ERROR:',
        err
      );
    }
  };

  const handleMarkAllRead = async () => {
    if (!tokens?.accessToken || markingAll) {
      return;
    }

    try {
      setMarkingAll(true);

      const response = await fetch(
        `${API_BASE_URL}/faculty/notifications/read-all`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      console.log(
        'MARK ALL READ STATUS:',
        response.status
      );

      console.log(
        'MARK ALL READ RESPONSE:',
        JSON.stringify(result)
      );

      if (!response.ok) {
        throw new Error(
          result?.message ||
            'Failed to mark all notifications as read.'
        );
      }

      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          unread: false,
        }))
      );
    } catch (err) {
      console.error(
        'MARK ALL READ ERROR:',
        err
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter(
    (item) => item.unread
  ).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            Faculty Notifications
          </Text>

          {unreadCount > 0 && (
            <Text style={styles.unreadCount}>
              {unreadCount} unread
            </Text>
          )}
        </View>

        <Pressable
          onPress={handleMarkAllRead}
          disabled={markingAll || unreadCount === 0}
        >
          {markingAll ? (
            <ActivityIndicator
              size="small"
              color={Colors.primary}
            />
          ) : (
            <Text
              style={[
                styles.markAllText,
                unreadCount === 0 &&
                  styles.markAllDisabled,
              ]}
            >
              Read All
            </Text>
          )}
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color={Colors.primary}
          />

          <Text style={styles.statusText}>
            Loading notifications...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>
            Unable to load notifications
          </Text>

          <Text style={styles.statusText}>
            {error}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={loadNotifications}
          >
            <Text style={styles.retryText}>
              Retry
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={
            notifications.length === 0
              ? styles.emptyScrollContent
              : styles.scrollContent
          }
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>✓</Text>

              <Text style={styles.emptyTitle}>
                No Notifications
              </Text>

              <Text style={styles.emptyText}>
                You don't have any notifications right now.
              </Text>
            </View>
          ) : (
            notifications.map((item) => (
              <Pressable
                key={item.id}
                onPress={() =>
                  handleNotificationPress(item)
                }
              >
                <View
                  style={[
                    styles.card,
                    item.unread &&
                      styles.cardUnread,
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.titleRow}>
                      {item.unread && (
                        <View
                          style={styles.unreadDot}
                        />
                      )}

                      <Text
                        style={styles.cardTitle}
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>
                    </View>

                    <Text style={styles.cardTime}>
                      {item.time}
                    </Text>
                  </View>

                  <Text style={styles.cardBody}>
                    {item.message}
                  </Text>

                  {item.unread && (
                    <Text style={styles.tapHint}>
                      Tap to mark as read
                    </Text>
                  )}
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  backBtn: {
    padding: 8,
    minWidth: 65,
  },

  backText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  unreadCount: {
    marginTop: 2,
    fontSize: 11,
    color: Colors.textSecondary,
  },

  markAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },

  markAllDisabled: {
    opacity: 0.4,
  },

  scrollContent: {
    padding: 16,
    gap: 12,
  },

  emptyScrollContent: {
    flexGrow: 1,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    elevation: 1,
  },

  cardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    backgroundColor: '#F8FAFC',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },

  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },

  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: 7,
  },

  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  cardTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  cardBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  tapHint: {
    marginTop: 8,
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },

  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  statusText: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 14,
    color: Colors.textSecondary,
  },

  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },

  retryButton: {
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },

  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: '#E2E8F0',
    color: Colors.textSecondary,
    fontSize: 28,
    lineHeight: 56,
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
});