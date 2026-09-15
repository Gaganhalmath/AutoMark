/**
 * SmartAttend — Admin Route Group Layout
 * Protected: only admin can access this group.
 * Bottom nav: Home, Users, Timetable, Attendance, More
 */

import { Redirect, Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../auth/AuthProvider';
import { Colors } from '../../constants/colors';

export default function AdminLayout() {
  const { isAuthenticated, user, isLoading } = useAuth();

  const insets = useSafeAreaInsets();

  if (isLoading) return null;

  if (!isAuthenticated || !user) {
    return <Redirect href="/login" />;
  }

  if (user.role !== 'admin') {
    if (user.role === 'student') {
      return <Redirect href="/(student)" />;
    }

    if (user.role === 'faculty') {
      return <Redirect href="/(faculty)" />;
    }

    return <Redirect href="/login" />;
  }

  return (
    <Tabs
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
      {/* Main tabs */}

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
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
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
              name={
                focused
                  ? 'clipboard'
                  : 'clipboard-outline'
              }
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={
                focused
                  ? 'grid'
                  : 'grid-outline'
              }
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* Hidden Admin screens */}

      <Tabs.Screen
        name="students"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="student-setup"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="student-profile"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="faculty"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="bulk-update"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="academic-master"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="timetable-import"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="publish-timetable"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="audit-logs"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="reports"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="settings"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    paddingTop: 6,
    paddingBottom: 0,

    backgroundColor: Colors.surface,

    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',

    elevation: 8,

    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: -2,
    },
  },

  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: -2,
  },

  tabItem: {
    paddingTop: 2,
  },
});