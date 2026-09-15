/**
 * SmartAttend — Faculty Route Group Layout
 * Protected: only faculty can access this group.
 */
import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../auth/AuthProvider';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

export default function FacultyLayout() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  if (isLoading) return null;
  if (!isAuthenticated || !user) return <Redirect href="/login" />;
  if (user.role !== 'faculty') {
    if (user.role === 'student') return <Redirect href="/(student)" />;
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
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="timetable"
        options={{
          title: 'Timetable',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'clipboard' : 'clipboard-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={22} color={color} />
          ),
        }}
      />
      {/* Hidden sub-screens */}
      <Tabs.Screen name="class-details" options={{ href: null }} />
      <Tabs.Screen name="manage-class" options={{ href: null }} />
      <Tabs.Screen name="start-attendance" options={{ href: null }} />
      <Tabs.Screen name="ble-session" options={{ href: null }} />
      <Tabs.Screen name="live-participation" options={{ href: null }} />
      <Tabs.Screen name="attendance-review" options={{ href: null }} />
      <Tabs.Screen name="manual-exceptions" options={{ href: null }} />
      <Tabs.Screen name="finalize-attendance" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="session-expired" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopWidth: 0,
    height: 64, paddingBottom: 8, paddingTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 8,
  },
  tabLabel: { ...Typography.labelXs, marginTop: 2 },
  tabItem: { paddingVertical: 2 },
});
