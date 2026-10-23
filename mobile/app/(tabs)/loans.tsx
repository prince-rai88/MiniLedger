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
import { Colors, Spacing, Radius, Typography, Shadow } from '../../src/utils/theme';

type FilterTab = 'all' | 'active' | 'overdue' | 'repaid';

export default function LoansScreen() {
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

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
  const overdueLoans = loans.filter((l) => l.is_overdue && !l.repaid);

  const filteredLoans =
    activeTab === 'active'
      ? activeLoans
      : activeTab === 'overdue'
      ? overdueLoans
      : activeTab === 'repaid'
      ? repaidLoans
      : loans;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primaryLight} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        {/* iOS Large Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>TRANSACTIONS</Text>
            <Text style={styles.title}>Your Loans</Text>
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

        {/* iOS Segmented Control Bar */}
        <View style={styles.segmentedControl}>
          {(
            [
              { id: 'all', label: `All (${loans.length})` },
              { id: 'active', label: `Active (${activeLoans.length})` },
              { id: 'overdue', label: `Overdue (${overdueLoans.length})` },
              { id: 'repaid', label: `Repaid (${repaidLoans.length})` },
            ] as const
          ).map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.segmentTab, isSelected && styles.segmentTabActive]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.segmentText,
                    isSelected && styles.segmentTextActive,
                    tab.id === 'overdue' && overdueLoans.length > 0 && !isSelected && { color: Colors.dangerLight },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Loan FlatList */}
        <FlatList
          data={filteredLoans}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <LoanCard loan={item} onRepaid={handleLoanRepaid} />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primaryLight}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Text style={styles.emptyIcon}>📋</Text>
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'all'
                  ? 'No loans found'
                  : `No ${activeTab} loans`}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'all'
                  ? 'Tap "＋ Add" to record your first loan to a friend'
                  : `You do not have any ${activeTab} loans right now.`}
              </Text>
              {activeTab === 'all' && (
                <TouchableOpacity
                  style={[styles.emptyAddBtn, Shadow.subtle]}
                  onPress={() => router.push('/add-loan')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyAddBtnText}>Record First Loan</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  contentWrapper: {
    flex: 1,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
    paddingTop: Spacing.xl + 10,
    paddingHorizontal: Spacing.lg,
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  eyebrow: {
    ...Typography.caption,
    color: Colors.primaryLight,
    marginBottom: 4,
  },
  title: {
    ...Typography.heading1,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: -0.2,
  },
  errorBanner: {
    backgroundColor: Colors.dangerMuted,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.2)',
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.dangerLight,
    textAlign: 'center',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    padding: 3,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  segmentTabActive: {
    backgroundColor: Colors.bgCardAlt,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: -0.2,
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  list: {
    paddingBottom: Spacing.xxl + 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyTitle: {
    ...Typography.heading3,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  emptyAddBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.full,
  },
  emptyAddBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});
