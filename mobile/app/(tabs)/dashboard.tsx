import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SummaryCard } from '../../src/components/SummaryCard';
import { fetchSummary, Summary } from '../../src/services/api';
import { clearAuth, getPhone } from '../../src/utils/storage';
import { Colors, Spacing, Radius, Typography } from '../../src/utils/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary>({
    total_lent: 0,
    total_repaid: 0,
    overdue_amount: 0,
  });
  const [phone, setPhone] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function loadData() {
    try {
      const [s, p] = await Promise.all([fetchSummary(), getPhone()]);
      setSummary(s);
      setPhone(p || '');
      setError('');
    } catch (err: any) {
      if (err?.response?.status === 401) {
        await clearAuth();
        router.replace('/login');
      } else {
        setError('Failed to load summary. Pull to refresh.');
      }
    }
  }

  // Refresh when screen comes into focus (after adding/repaying loans)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await clearAuth();
          router.replace('/login');
        },
      },
    ]);
  }

  const outstanding = summary.total_lent - summary.total_repaid;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello 👋</Text>
          <Text style={styles.phone}>{phone || 'MiniLedger User'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Error state */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Summary section */}
      <Text style={styles.sectionTitle}>Summary</Text>

      <View style={styles.summaryRow}>
        <SummaryCard
          label="Total Lent"
          amount={summary.total_lent}
          variant="default"
          style={styles.summaryCard}
        />
        <SummaryCard
          label="Total Repaid"
          amount={summary.total_repaid}
          variant="success"
          style={styles.summaryCard}
        />
      </View>

      <View style={styles.summaryRow}>
        <SummaryCard
          label="Overdue"
          amount={summary.overdue_amount}
          variant={summary.overdue_amount > 0 ? 'danger' : 'default'}
          style={styles.summaryCard}
        />
        <SummaryCard
          label="Outstanding"
          amount={outstanding}
          variant={outstanding > 0 ? 'warning' : 'default'}
          style={styles.summaryCard}
        />
      </View>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <TouchableOpacity
        style={styles.addLoanBtn}
        onPress={() => router.push('/add-loan')}
        activeOpacity={0.8}
      >
        <Text style={styles.addLoanIcon}>＋</Text>
        <View>
          <Text style={styles.addLoanTitle}>Add New Loan</Text>
          <Text style={styles.addLoanSubtitle}>Record money lent to a friend</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.viewLoansBtn}
        onPress={() => router.push('/(tabs)/loans')}
        activeOpacity={0.8}
      >
        <Text style={styles.viewLoansBtnText}>View All Loans →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingTop: 56 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  greeting: {
    ...Typography.heading1,
    marginBottom: 2,
  },
  phone: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoutText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  sectionTitle: {
    ...Typography.caption,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  summaryCard: { flex: 1 },
  addLoanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  addLoanIcon: {
    width: 44,
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: 22,
    textAlign: 'center',
    lineHeight: 44,
    fontSize: 22,
    color: '#fff',
    fontWeight: '700',
  },
  addLoanTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 2,
  },
  addLoanSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  viewLoansBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  viewLoansBtnText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: Colors.dangerMuted,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.danger + '30',
  },
  errorText: {
    ...Typography.body,
    color: Colors.danger,
  },
});
