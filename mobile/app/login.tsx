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
import { sendOtp, verifyOtp } from '../src/services/api';
import { saveToken, savePhone } from '../src/utils/storage';
import { Colors, Spacing, Radius, Typography, Shadow } from '../src/utils/theme';

type Step = 'phone' | 'otp';

export default function LoginScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; otp?: string }>({});

  function validatePhone(): boolean {
    if (!phone.trim()) {
      setErrors({ phone: 'Phone number is required' });
      return false;
    }
    if (!/^\+?[1-9]\d{9,14}$/.test(phone.trim())) {
      setErrors({ phone: 'Enter a valid phone number (e.g. +919876543210)' });
      return false;
    }
    setErrors({});
    return true;
  }

  async function handleSendOtp() {
    if (!validatePhone()) return;
    setLoading(true);
    try {
      await sendOtp(phone.trim());
      setStep('otp');
      setErrors({});
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to send OTP. Is the backend running?';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otp.trim() || otp.length !== 6) {
      setErrors({ otp: 'Enter the 6-digit OTP from server log' });
      return;
    }
    setLoading(true);
    try {
      const { token } = await verifyOtp(phone.trim(), otp.trim());
      await saveToken(token);
      await savePhone(phone.trim());
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Invalid OTP. Please try again.';
      const attemptsLeft = err?.response?.data?.attemptsLeft;
      setErrors({
        otp: attemptsLeft !== undefined ? `${msg} (${attemptsLeft} attempts left)` : msg,
      });
    } finally {
      setLoading(false);
    }
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>₹</Text>
          </View>
          <Text style={styles.appName}>MiniLedger</Text>
          <Text style={styles.tagline}>Track loans with friends</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, Shadow.card]}>
          {step === 'phone' ? (
            <>
              <Text style={styles.cardTitle}>Welcome</Text>
              <Text style={styles.cardSubtitle}>
                Enter your phone number to sign in or create an account.
              </Text>
              <Input
                label="Phone Number"
                placeholder="+91 98765 43210"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoFocus
                error={errors.phone}
              />
              <Button
                title="Send OTP"
                onPress={handleSendOtp}
                loading={loading}
              />
              <Text style={styles.hint}>
                💡 Check the backend terminal for the OTP code
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>Verify OTP</Text>
              <Text style={styles.cardSubtitle}>
                Check the backend server terminal for the 6-digit OTP.
              </Text>
              <View style={styles.phonePill}>
                <Text style={styles.phonePillText}>{phone}</Text>
              </View>
              <Input
                label="6-Digit OTP"
                placeholder="• • • • • •"
                value={otp}
                onChangeText={(v) => {
                  setOtp(v.replace(/\D/g, '').slice(0, 6));
                  setErrors({});
                }}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                error={errors.otp}
                style={styles.otpInput}
              />
              <Button
                title="Verify & Sign In"
                onPress={handleVerifyOtp}
                loading={loading}
              />
              <TouchableOpacity
                onPress={() => {
                  setStep('phone');
                  setOtp('');
                  setErrors({});
                }}
                style={styles.backBtn}
              >
                <Text style={styles.backBtnText}>← Change number</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoText: {
    fontSize: 36,
    color: Colors.primary,
    fontWeight: '700',
  },
  appName: {
    ...Typography.heading1,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  cardTitle: {
    ...Typography.heading2,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  phonePill: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  phonePillText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 8,
  },
  hint: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  backBtn: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  backBtnText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
