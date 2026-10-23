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
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={[styles.logoCircle, Shadow.glow]}>
            <Text style={styles.logoText}>₹</Text>
          </View>
          <Text style={styles.appName}>MiniLedger</Text>
          <Text style={styles.tagline}>Intelligent Ledger for Friends</Text>
        </View>

        {/* Apple Style Glass Card */}
        <View style={[styles.card, Shadow.card]}>
          {step === 'phone' ? (
            <>
              <Text style={styles.cardTitle}>Sign In</Text>
              <Text style={styles.cardSubtitle}>
                Enter your mobile number to access your ledger.
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
                title="Continue"
                onPress={handleSendOtp}
                loading={loading}
                style={styles.actionBtn}
              />
              <View style={styles.hintContainer}>
                <Text style={styles.hintText}>
                  ⚡ OTP will appear in your backend server terminal
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>Verify Security Code</Text>
              <Text style={styles.cardSubtitle}>
                Check the backend terminal log for your 6-digit code.
              </Text>

              {/* Phone Badge */}
              <View style={styles.phoneBadge}>
                <Text style={styles.phoneBadgeText}>{phone}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setStep('phone');
                    setOtp('');
                    setErrors({});
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.changePhoneText}>Change</Text>
                </TouchableOpacity>
              </View>

              <Input
                label="6-Digit Verification Code"
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
                style={styles.actionBtn}
              />

              <TouchableOpacity
                onPress={handleSendOtp}
                disabled={loading}
                style={styles.resendBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.resendText}>Request New Code</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  appName: {
    ...Typography.heading1,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 4,
  },
  tagline: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    ...Typography.heading2,
    fontSize: 20,
    marginBottom: 6,
  },
  cardSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  actionBtn: {
    marginTop: Spacing.sm,
  },
  hintContainer: {
    marginTop: Spacing.lg,
    padding: Spacing.sm + 2,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgInput,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  phoneBadgeText: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '600',
  },
  changePhoneText: {
    ...Typography.bodySmall,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  otpInput: {
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
    fontWeight: '700',
  },
  resendBtn: {
    marginTop: Spacing.md,
    alignItems: 'center',
    padding: Spacing.xs,
  },
  resendText: {
    ...Typography.bodySmall,
    color: Colors.primaryLight,
    fontWeight: '500',
  },
});
