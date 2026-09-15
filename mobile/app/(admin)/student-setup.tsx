/**
 * SmartAttend — Admin Student Account Setup Screen
 * Design reference: stitch_smartattend_mobile_app_onboarding/student_account_setup/code.html
 */
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../auth/AuthProvider';

export default function StudentAccountSetupScreen() {
  const router = useRouter();
  const { tokens } = useAuth();

  const [name, setName] = useState('');
  const [usn, setUsn] = useState('');
  const [email, setEmail] = useState('');
  const [dept, setDept] = useState('Computer Science');
  const [semester, setSemester] = useState('6');
const [section, setSection] = useState('A');

  const handleCreate = async () => {
    console.log("CREATE BUTTON CODE IS RUNNING");
    alert("CREATE BUTTON CODE IS RUNNING");
  if (!name || !usn || !email) {
    Alert.alert(
      'Incomplete Form',
      'Please enter Name, USN, and Email.'
    );
    return;
  }

  try {
    console.log(
  'ADMIN STUDENT CREATE TOKEN:',
  tokens?.accessToken ? 'TOKEN EXISTS' : 'NO TOKEN'
);
    const response = await apiRequest<{
  data: {
    name: string;
    usn: string;
  };
}>('/admin/students', {
      method: 'POST',
      token: tokens?.accessToken,
      body: {
        name: name.trim(),
        email: email.trim(),
        registerNumber: usn.trim().toUpperCase(),
        department: dept.trim(),
        semester: semester,
        section: section,
        academicYear: '2026-27',
      },
    });

    Alert.alert(
      'Student Created',
      `${response.data.name} (${response.data.usn}) was created successfully.`,
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ],
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to create student';

    Alert.alert('Creation Failed', message);
  }
};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>New Student Account</Text>
        <Pressable onPress={handleCreate}>
          <Text style={styles.createText}>Create</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Aarav Sharma"
            placeholderTextColor="#94A3B8"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>University Seat Number (USN) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2023CS101"
            placeholderTextColor="#94A3B8"
            value={usn}
            onChangeText={setUsn}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="student@college.edu"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Department</Text>
          <TextInput
            style={styles.input}
            value={dept}
            onChangeText={setDept}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Semester</Text>
          <TextInput
            style={styles.input}
            value={semester}
            onChangeText={setSemester}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Section</Text>
          <TextInput
            style={styles.input}
            value={section}
            onChangeText={setSection}
          />
        </View>
      </ScrollView>
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
  },
  backText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  createText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
});
