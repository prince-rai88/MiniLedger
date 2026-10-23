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
        {/* iOS Modal Grabber Bar */}
        <View style={styles.handle} />

        {/* Header Bar */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>New Loan</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Main Card */}
        <View style={[styles.card, Shadow.card]}>
          <Input
            label="Borrower / Friend Name"
            placeholder="e.g. Rahul Verma"
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
            placeholder="2026-12-31"
            value={dueDate}
            onChangeText={(v) => {
              setDueDate(formatDateInput(v));
              setErrors((e) => ({ ...e, due_date: undefined }));
            }}
            keyboardType="number-pad"
            maxLength={10}
            error={errors.due_date}
          />

          {/* Quick Date Chips */}
          <Text style={styles.shortcutsLabel}>Quick Set Due Date</Text>
          <View style={styles.shortcuts}>
            {[
              { label: '1 Week', days: 7 },
              { label: '1 Month', days: 30 },
              { label: '3 Months', days: 90 },
            ].map(({ label, days }) => (
              <TouchableOpacity
                key={days}
                style={styles.shortcutChip}
                onPress={() => setQuickDate(days)}
                activeOpacity={0.7}
              >
                <Text style={styles.shortcutText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title="Save Loan"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    padding: Spacing.lg,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: Spacing.xxl,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    paddingHorizontal: 4,
  },
  cancelBtn: {
    width: 60,
  },
  cancelText: {
    ...Typography.body,
    color: Colors.primaryLight,
    fontWeight: '500',
  },
  modalTitle: {
    ...Typography.heading3,
    fontSize: 17,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  shortcutsLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  shortcuts: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  shortcutChip: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shortcutText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 12,
  },
  submitBtn: {
    marginTop: Spacing.sm,
  },
});
