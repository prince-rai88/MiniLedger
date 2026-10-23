import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors, Radius, Spacing, Typography, Shadow } from '../utils/theme';
import { Loan, repayLoan } from '../services/api';

interface LoanCardProps {
  loan: Loan;
  onRepaid: (updatedLoan: Loan) => void;
}

export function LoanCard({ loan, onRepaid }: LoanCardProps) {
  const [loading, setLoading] = useState(false);

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function getInitials(name: string) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  async function performRepay() {
    setLoading(true);
    try {
      const updated = await repayLoan(loan.id);
      onRepaid(updated);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error || 'Failed to mark as repaid. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleRepay() {
    if (typeof window !== 'undefined' && window.confirm) {
      const ok = window.confirm(
        `Mark ₹${loan.amount.toLocaleString()} from ${loan.friend_name} as fully repaid?`
      );
      if (ok) {
        await performRepay();
      }
      return;
    }

    Alert.alert(
      'Mark as Repaid',
      `Mark ₹${loan.amount.toLocaleString()} from ${loan.friend_name} as fully repaid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Repaid',
          style: 'default',
          onPress: performRepay,
        },
      ]
    );
  }

  const isOverdue = loan.is_overdue && !loan.repaid;

  return (
    <View
      style={[
        styles.card,
        isOverdue && styles.cardOverdue,
        loan.repaid && styles.cardRepaid,
        Shadow.card,
      ]}
    >
      <View style={styles.topRow}>
        {/* Avatar with Initials */}
        <View
          style={[
            styles.avatar,
            loan.repaid
              ? styles.avatarRepaid
              : isOverdue
              ? styles.avatarOverdue
              : styles.avatarActive,
          ]}
        >
          <Text
            style={[
              styles.avatarText,
              loan.repaid
                ? { color: Colors.success }
                : isOverdue
                ? { color: Colors.danger }
                : { color: Colors.primaryLight },
            ]}
          >
            {getInitials(loan.friend_name)}
          </Text>
        </View>

        {/* Center Details */}
        <View style={styles.details}>
          <Text style={styles.friendName} numberOfLines={1}>
            {loan.friend_name}
          </Text>
          <Text style={styles.dateText}>
            {loan.repaid
              ? `Repaid on ${formatDate(loan.repaid_at || loan.created_at)}`
              : `Due ${formatDate(loan.due_date)}`}
          </Text>
        </View>

        {/* Right Amount */}
        <View style={styles.amountCol}>
          <Text
            style={[
              styles.amount,
              loan.repaid
                ? styles.amountRepaid
                : isOverdue
                ? styles.amountOverdue
                : styles.amountActive,
            ]}
          >
            ₹{loan.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      {/* Bottom Status / Action Strip */}
      <View style={styles.footerRow}>
        <View style={styles.statusBadgeContainer}>
          {loan.repaid ? (
            <View style={[styles.statusPill, styles.pillSuccess]}>
              <Text style={styles.pillTextSuccess}>✓ Repaid</Text>
            </View>
          ) : isOverdue ? (
            <View style={[styles.statusPill, styles.pillDanger]}>
              <Text style={styles.pillTextDanger}>⚠️ Overdue</Text>
            </View>
          ) : (
            <View style={[styles.statusPill, styles.pillActive]}>
              <Text style={styles.pillTextActive}>Active Loan</Text>
            </View>
          )}
        </View>

        {!loan.repaid && (
          <TouchableOpacity
            style={styles.repayButton}
            onPress={handleRepay}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.primaryLight} />
            ) : (
              <Text style={styles.repayButtonText}>Mark Repaid</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardOverdue: {
    borderColor: 'rgba(248, 113, 113, 0.25)',
  },
  cardRepaid: {
    opacity: 0.85,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarActive: {
    backgroundColor: Colors.primaryMuted,
  },
  avatarOverdue: {
    backgroundColor: Colors.dangerMuted,
  },
  avatarRepaid: {
    backgroundColor: Colors.successMuted,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  details: {
    flex: 1,
  },
  friendName: {
    ...Typography.heading3,
    fontSize: 16,
    marginBottom: 3,
  },
  dateText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    fontSize: 12,
  },
  amountCol: {
    alignItems: 'flex-end',
    marginLeft: Spacing.sm,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  amountActive: {
    color: Colors.textPrimary,
  },
  amountOverdue: {
    color: Colors.danger,
  },
  amountRepaid: {
    color: Colors.success,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm + 4,
    paddingTop: Spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statusBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  pillSuccess: {
    backgroundColor: Colors.successMuted,
  },
  pillDanger: {
    backgroundColor: Colors.dangerMuted,
  },
  pillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  pillTextSuccess: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.success,
  },
  pillTextDanger: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dangerLight,
  },
  pillTextActive: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  repayButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  repayButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryLight,
  },
});
