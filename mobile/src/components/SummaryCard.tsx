import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, Typography, Shadow } from '../utils/theme';

interface SummaryCardProps {
  label: string;
  amount: number;
  variant?: 'default' | 'success' | 'danger' | 'warning';
  style?: ViewStyle;
}

const variantConfig = {
  default: {
    bg: Colors.bgCard,
    borderColor: Colors.border,
    labelColor: Colors.textSecondary,
    amountColor: Colors.textPrimary,
    accentColor: Colors.primary,
    accentBg: Colors.primaryMuted,
    icon: '↗',
  },
  success: {
    bg: Colors.bgCard,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    labelColor: Colors.success,
    amountColor: Colors.success,
    accentColor: Colors.success,
    accentBg: Colors.successMuted,
    icon: '✓',
  },
  danger: {
    bg: Colors.bgCard,
    borderColor: 'rgba(248, 113, 113, 0.25)',
    labelColor: Colors.dangerLight,
    amountColor: Colors.danger,
    accentColor: Colors.danger,
    accentBg: Colors.dangerMuted,
    icon: '!',
  },
  warning: {
    bg: Colors.bgCard,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    labelColor: Colors.warningLight,
    amountColor: Colors.warning,
    accentColor: Colors.warning,
    accentBg: Colors.warningMuted,
    icon: '⏳',
  },
};

export function SummaryCard({ label, amount, variant = 'default', style }: SummaryCardProps) {
  const config = variantConfig[variant];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: config.bg,
          borderColor: config.borderColor,
        },
        Shadow.card,
        style,
      ]}
    >
      {/* Top Header with Label & Minimal Apple Pill */}
      <View style={styles.topRow}>
        <Text style={[styles.label, { color: config.labelColor }]}>{label}</Text>
        <View style={[styles.iconBadge, { backgroundColor: config.accentBg }]}>
          <Text style={[styles.iconText, { color: config.accentColor }]}>{config.icon}</Text>
        </View>
      </View>

      {/* Primary Currency Amount */}
      <Text style={[styles.amount, { color: config.amountColor }]} numberOfLines={1}>
        ₹{formatAmount(amount)}
      </Text>
    </View>
  );
}

function formatAmount(n: number): string {
  if (n >= 1_00_000) {
    return (n / 1_00_000).toFixed(1) + 'L';
  }
  if (n >= 1000) {
    return n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  return n.toFixed(2);
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    minHeight: 104,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 12,
    fontWeight: '700',
  },
  label: {
    ...Typography.caption,
  },
  amount: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
});
