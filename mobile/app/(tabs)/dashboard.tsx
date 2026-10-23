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
import { Colors, Spacing, Radius, Typography, Shadow } from '../../src/utils/theme';

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

  // Refresh when screen comes into focus
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
    async function doLogout() {
      await clearAuth();
      router.replace('/login');
    }

    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm('Are you sure you want to sign out?')) {
        doLogout();
      }
      return;
    }

    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: doLogout,
      },
    ]);
  }

  const outstanding = Math.max(0, summary.total_lent - summary.total_repaid);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.primaryLight}
        />
      }
    >
      {/* iOS Large Title Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>FINANCIAL OVERVIEW</Text>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>{phone || 'MiniLedger Account'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Error state */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Hero Outstanding Balance Card (Apple Wallet style) */}
      <View style={[styles.heroCard, Shadow.card]}>
        <View style={styles.heroTopRow}>
          <Text style={styles.heroLabel}>NET OUTSTANDING</Text>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>Active Ledger</Text>
          </View>
        </View>
        <Text style={styles.heroAmount}>
          ₹{outstanding.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </Text>
        <Text style={styles.heroSubtext}>
          Total pending return from your friends
        </Text>
      </View>

      {/* Summary Grid */}
      <Text style={styles.sectionHeader}>LEDGER BREAKDOWN</Text>
      <View style={styles.summaryGrid}>
        <View style={styles.gridRow}>
          <SummaryCard
            label="Total Lent"
            amount={summary.total_lent}
            variant="default"
            style={styles.gridCol}
          />
          <SummaryCard
            label="Total Repaid"
            amount={summary.total_repaid}
            variant="success"
            style={styles.gridCol}
          />
        </View>
        <View style={styles.gridRow}>
          <SummaryCard
            label="Overdue Debt"
            amount={summary.overdue_amount}
            variant={summary.overdue_amount > 0 ? 'danger' : 'default'}
            style={styles.gridCol}
          />
          <SummaryCard
            label="Outstanding"
            amount={outstanding}
            variant={outstanding > 0 ? 'warning' : 'default'}
            style={styles.gridCol}
          />
        </View>
      </View>

      {/* Quick Actions Header */}
      <Text style={styles.sectionHeader}>QUICK ACTIONS</Text>

      {/* Primary Add Loan Action */}
      <TouchableOpacity
        style={[styles.actionCard, Shadow.card]}
        onPress={() => router.push('/add-loan')}
        activeOpacity={0.8}
      >
        <View style={styles.actionLeft}>
          <View style={styles.actionIconContainer}>
            <Text style={styles.actionIcon}>＋</Text>
          </View>
          <View>
            <Text style={styles.actionTitle}>Add New Loan</Text>
            <Text style={styles.actionSubtitle}>Record money lent to a friend</Text>
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {/* Secondary View All Loans Action */}
      <TouchableOpacity
        style={styles.secondaryActionCard}
        onPress={() => router.push('/(tabs)/loans')}
        activeOpacity={0.7}
      >
        <Text style={styles.secondaryActionText}>View All Loans History →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl + 10,
    paddingBottom: Spacing.xxl,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  eyebrow: {
    ...Typography.caption,
    color: Colors.primaryLight,
    marginBottom: 4,
  },
  title: {
    ...Typography.heading1,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginTop: 2,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  errorBanner: {
    backgroundColor: Colors.dangerMuted,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.2)',
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.dangerLight,
    textAlign: 'center',
  },
  heroCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  heroLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  heroPill: {
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primaryLight,
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1,
    marginBottom: 4,
  },
  heroSubtext: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  sectionHeader: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    letterSpacing: 1.0,
  },
  summaryGrid: {
    marginBottom: Spacing.xl,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  gridCol: {
    flex: 1,
  },
  actionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  actionIcon: {
    fontSize: 22,
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  actionTitle: {
    ...Typography.heading3,
    fontSize: 16,
    marginBottom: 2,
  },
  actionSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  chevron: {
    fontSize: 22,
    color: Colors.textMuted,
    fontWeight: '300',
  },
  secondaryActionCard: {
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    ...Typography.bodySmall,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
});
