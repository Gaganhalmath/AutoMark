/**
 * SmartAttend — Student Route Group Layout
 * Protected: only students can access this group.
 * Provides bottom tab navigation for all student screens.
 */
import { Redirect, Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../auth/AuthProvider';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

export default function StudentLayout() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  if (isLoading) return null;

  // Guard: must be authenticated student
  if (!isAuthenticated || !user) return <Redirect href="/login" />;
  if (user.role !== 'student') {
    // Wrong role — redirect to appropriate dashboard
    if (user.role === 'faculty') return <Redirect href="/(faculty)" />;
    if (user.role === 'admin') return <Redirect href="/(admin)" />;
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
  styles.tabBar,
  {
    height: 64 + insets.bottom,
    paddingBottom: 8 + insets.bottom,
  },
],
        tabBarActiveTintColor: Colors.primaryContainer,
        tabBarInactiveTintColor: Colors.onSurfaceVariant,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="timetable"
        options={{
          title: 'Timetable',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'time' : 'time-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      {/* Hidden screens — not in tab bar */}
      <Tabs.Screen name="device-registration" options={{ href: null }} />
      <Tabs.Screen name="registration-success" options={{ href: null }} />
      <Tabs.Screen name="subject-details" options={{ href: null }} />
      <Tabs.Screen name="history-detail" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="attendance-reminder" options={{ href: null }} />
      <Tabs.Screen name="attendance-check" options={{ href: null }} />
      <Tabs.Screen name="location-check" options={{ href: null }} />
      <Tabs.Screen name="all-checks-passed" options={{ href: null }} />
      <Tabs.Screen name="attendance-marked" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopWidth: 0,
    height: 64,
    paddingBottom: 8,
    paddingTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tabLabel: {
    ...Typography.labelXs,
    marginTop: 2,
  },
  tabItem: {
    paddingVertical: 2,
  },
});
