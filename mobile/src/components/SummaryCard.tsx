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
  },
  success: {
    bg: Colors.bgCard,
    borderColor: Colors.success + '30',
    labelColor: Colors.success,
    amountColor: Colors.success,
    accentColor: Colors.success,
  },
  danger: {
    bg: Colors.bgCard,
    borderColor: Colors.danger + '30',
    labelColor: Colors.danger,
    amountColor: Colors.danger,
    accentColor: Colors.danger,
  },
  warning: {
    bg: Colors.bgCard,
    borderColor: Colors.warning + '30',
    labelColor: Colors.warning,
    amountColor: Colors.warning,
    accentColor: Colors.warning,
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
      {/* Accent dot */}
      <View style={[styles.dot, { backgroundColor: config.accentColor }]} />
      <Text style={[styles.label, { color: config.labelColor }]}>{label}</Text>
      <Text style={[styles.amount, { color: config.amountColor }]}>
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
    minHeight: 90,
    justifyContent: 'flex-end',
    position: 'relative',
    overflow: 'hidden',
  },
  dot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
});
