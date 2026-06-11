import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { apiRequest } from '@/lib/api';
import * as SecureStore from 'expo-secure-store';

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  async function handleVerifyEmail() {
    if (!email || !code) {
      Alert.alert('Missing fields', 'Please enter email and verification code.');
      return;
    }

    try {
      setLoading(true);

      const data = await apiRequest('/auth/verify-email', {
        method: 'PATCH',
        body: JSON.stringify({ email, code }),
      });

      if (!data.success) {
        Alert.alert('Verification failed', data.message || 'Something went wrong.');
        return;
      }

      if (data.token) {
        await SecureStore.setItemAsync('fad_token', data.token);
      }

      await SecureStore.setItemAsync('fad_user', JSON.stringify(data.user || { email }));

      Alert.alert('Success', data.message || 'Email verified successfully.');
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Error', 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    if (!email) {
      Alert.alert('Missing email', 'Please enter your email first.');
      return;
    }

    try {
      setResending(true);

      const data = await apiRequest('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (!data.success) {
        Alert.alert('Resend failed', data.message || 'Something went wrong.');
        return;
      }

      Alert.alert('Code sent', data.message || 'New verification code sent.');
      setResendTimer(60); // Start 1 minute timer
    } catch {
      Alert.alert('Error', 'Could not connect to server.');
    } finally {
      setResending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.logo}>FAD</Text>
          <Text style={styles.title}>Verify Email</Text>
          <Text style={styles.subtitle}>
            Enter the verification code sent to your email
          </Text>

          <View style={styles.form}>
          <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Verification Code</Text>
          <TextInput
            placeholder="Enter code"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
            maxLength={6}
            style={styles.input}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <Pressable style={styles.button} onPress={handleVerifyEmail} disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, resendTimer > 0 && styles.secondaryButtonDisabled]}
          onPress={handleResendCode}
          disabled={resending || resendTimer > 0}>
          <Text style={[styles.secondaryButtonText, resendTimer > 0 && styles.secondaryButtonTextDisabled]}>
            {resending ? 'Sending...' : resendTimer > 0 ? `Resend Code (${resendTimer}s)` : 'Resend Code'}
          </Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already verified?</Text>
          <Link href="/login" style={styles.link}>
            Login
          </Link>
        </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  card: {
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  logo: {
    fontSize: 42,
    fontWeight: '900',
    color: '#3b82f6',
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#3b82f6',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 32,
    fontSize: 15,
    color: '#d1d5db',
    textAlign: 'center',
  },
  form: {
    gap: 18,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#d1d5db',
  },
  input: {
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6b7280',
    backgroundColor: '#ffffff',
    fontSize: 16,
    color: '#0f172a',
  },
  button: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    marginTop: 6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  secondaryButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  secondaryButtonDisabled: {
    opacity: 0.5,
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    borderColor: '#6b7280',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#93c5fd',
  },
  secondaryButtonTextDisabled: {
    color: '#9ca3af',
  },
  footer: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    color: '#d1d5db',
  },
  link: {
    fontWeight: '800',
    color: '#60a5fa',
  },
});
