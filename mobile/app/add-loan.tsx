import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { createLoan } from '../src/services/api';
import { Colors, Spacing, Radius, Typography, Shadow } from '../src/utils/theme';

interface Errors {
  friend_name?: string;
  amount?: string;
  due_date?: string;
}

export default function AddLoanScreen() {
  const router = useRouter();
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  function formatDateInput(raw: string): string {
    // Strip non-digits
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  }

  function validate(): boolean {
    const newErrors: Errors = {};

    if (!friendName.trim()) {
      newErrors.friend_name = 'Friend name is required';
    }

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = 'Enter a valid positive amount';
    }

    if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      newErrors.due_date = 'Enter date as YYYY-MM-DD';
    } else if (isNaN(Date.parse(dueDate))) {
      newErrors.due_date = 'Invalid date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      await createLoan({
        friend_name: friendName.trim(),
        amount: parseFloat(amount),
        due_date: dueDate,
      });
      if (Platform.OS === 'web') {
        router.back();
      } else {
        Alert.alert('✅ Loan Added', `Loan to ${friendName} recorded successfully.`, [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to create loan. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  // Quick-set common due date shortcuts
  function setQuickDate(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split('T')[0]);
    setErrors((e) => ({ ...e, due_date: undefined }));
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Modal handle */}
        <View style={styles.handle} />

        <View style={styles.headerRow}>
          <Text style={styles.title}>Add Loan</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Record money you lent to a friend
        </Text>

        <View style={[styles.card, Shadow.card]}>
          <Input
            label="Friend's Name"
            placeholder="e.g. Rahul"
            value={friendName}
            onChangeText={(v) => {
              setFriendName(v);
              setErrors((e) => ({ ...e, friend_name: undefined }));
            }}
            autoFocus
            autoCapitalize="words"
            error={errors.friend_name}
          />

          <Input
            label="Amount (₹)"
            placeholder="e.g. 1500"
            value={amount}
            onChangeText={(v) => {
              setAmount(v.replace(/[^0-9.]/g, ''));
              setErrors((e) => ({ ...e, amount: undefined }));
            }}
            keyboardType="decimal-pad"
            error={errors.amount}
          />

          <Input
            label="Due Date (YYYY-MM-DD)"
            placeholder="2025-12-31"
            value={dueDate}
            onChangeText={(v) => {
              setDueDate(formatDateInput(v));
              setErrors((e) => ({ ...e, due_date: undefined }));
            }}
            keyboardType="number-pad"
            maxLength={10}
            error={errors.due_date}
          />

          {/* Quick date shortcuts */}
          <View style={styles.shortcuts}>
            {[
              { label: '1 Week', days: 7 },
              { label: '1 Month', days: 30 },
              { label: '3 Months', days: 90 },
            ].map(({ label, days }) => (
              <TouchableOpacity
                key={days}
                style={styles.shortcut}
                onPress={() => setQuickDate(days)}
              >
                <Text style={styles.shortcutText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title="Add Loan"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: Spacing.lg, paddingTop: Spacing.md },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: { ...Typography.heading2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  shortcuts: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  shortcut: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    alignItems: 'center',
  },
  shortcutText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: { marginBottom: Spacing.xl },
});
