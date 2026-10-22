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

  const statusColor = loan.repaid
    ? Colors.success
    : loan.is_overdue
    ? Colors.danger
    : Colors.primary;

  const statusLabel = loan.repaid ? 'Repaid' : loan.is_overdue ? 'Overdue' : 'Active';

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  async function handleRepay() {
    Alert.alert(
      'Mark as Repaid',
      `Mark ₹${loan.amount.toLocaleString()} from ${loan.friend_name} as fully repaid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Repaid',
          style: 'default',
          onPress: async () => {
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
          },
        },
      ]
    );
  }

  return (
    <View
      style={[
        styles.card,
        loan.is_overdue && !loan.repaid && styles.cardOverdue,
        Shadow.card,
      ]}
    >
      {/* Status indicator bar */}
      <View style={[styles.statusBar, { backgroundColor: statusColor }]} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.nameContainer}>
            <Text style={styles.avatar}>{loan.friend_name.charAt(0).toUpperCase()}</Text>
            <View>
              <Text style={styles.friendName}>{loan.friend_name}</Text>
              <Text style={styles.date}>Due {formatDate(loan.due_date)}</Text>
            </View>
          </View>
          <View style={styles.amountContainer}>
            <Text style={[styles.amount, { color: statusColor }]}>
              ₹{loan.amount.toLocaleString()}
            </Text>
            <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
              <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
        </View>

        {!loan.repaid && (
          <TouchableOpacity
            style={styles.repayBtn}
            onPress={handleRepay}
            disabled={loading}
            activeOpacity={0.75}
          >
            {loading ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <Text style={styles.repayBtnText}>Mark as Repaid</Text>
            )}
          </TouchableOpacity>
        )}

        {loan.repaid && loan.repaid_at && (
          <Text style={styles.repaidAt}>
            Repaid on {formatDate(loan.repaid_at)}
          </Text>
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
    marginBottom: Spacing.md,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardOverdue: {
    borderColor: Colors.danger + '40',
  },
  statusBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryMuted,
    color: Colors.primary,
    textAlign: 'center',
    lineHeight: 40,
    fontSize: 18,
    fontWeight: '700',
  },
  friendName: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  date: {
    ...Typography.bodySmall,
  },
  amountContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  repayBtn: {
    marginTop: Spacing.sm,
    height: 36,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repayBtnText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  repaidAt: {
    ...Typography.bodySmall,
    color: Colors.success,
    marginTop: Spacing.xs,
    fontSize: 12,
  },
});
