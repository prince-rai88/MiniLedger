import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LoanCard } from '../../src/components/LoanCard';
import { Loan, fetchLoans } from '../../src/services/api';
import { clearAuth } from '../../src/utils/storage';
import { Colors, Spacing, Radius, Typography } from '../../src/utils/theme';

export default function LoansScreen() {
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function loadLoans() {
    try {
      const data = await fetchLoans();
      setLoans(data);
      setError('');
    } catch (err: any) {
      if (err?.response?.status === 401) {
        await clearAuth();
        router.replace('/login');
      } else {
        setError('Could not load loans. Pull to refresh.');
      }
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadLoans();
    }, [])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadLoans();
    setRefreshing(false);
  }

  function handleLoanRepaid(updated: Loan) {
    setLoans((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  }

  const activeLoans = loans.filter((l) => !l.repaid);
  const repaidLoans = loans.filter((l) => l.repaid);
  const overdueCount = loans.filter((l) => l.is_overdue).length;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Loans</Text>
          {overdueCount > 0 && (
            <Text style={styles.overdueWarning}>
              ⚠️ {overdueCount} loan{overdueCount > 1 ? 's' : ''} overdue
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/add-loan')}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>＋ Add</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={[...activeLoans, ...repaidLoans]}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <LoanCard loan={item} onRepaid={handleLoanRepaid} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No loans yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap "＋ Add" to record a loan to a friend
            </Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => router.push('/add-loan')}
            >
              <Text style={styles.emptyAddBtnText}>Add First Loan</Text>
            </TouchableOpacity>
          </View>
        }
        ListHeaderComponent={
          loans.length > 0 ? (
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{activeLoans.length}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={[styles.stat, styles.statDivider]}>
                <Text style={[styles.statValue, { color: Colors.danger }]}>
                  {overdueCount}
                </Text>
                <Text style={styles.statLabel}>Overdue</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: Colors.success }]}>
                  {repaidLoans.length}
                </Text>
                <Text style={styles.statLabel}>Repaid</Text>
              </View>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: 56,
    paddingBottom: Spacing.md,
  },
  title: { ...Typography.heading2 },
  overdueWarning: {
    ...Typography.bodySmall,
    color: Colors.danger,
    marginTop: 4,
    fontWeight: '600',
  },
  addBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  list: {
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    ...Typography.bodySmall,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.heading3, marginBottom: Spacing.xs },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyAddBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.full,
  },
  emptyAddBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  errorBanner: {
    backgroundColor: Colors.dangerMuted,
    margin: Spacing.lg,
    marginTop: 0,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.danger + '30',
  },
  errorText: { ...Typography.body, color: Colors.danger },
});
