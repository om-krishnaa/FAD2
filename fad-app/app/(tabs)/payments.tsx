import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import AppButton from '@/common/AppButton';
import EmptyState from '@/common/EmptyState';
import Loader from '@/common/Loader';
import Screen from '@/common/Screen';
import SectionCard from '@/components/dashboard/SectionCard';
import { getPayments, requestPayment } from '@/actions/payments';
import { getUser } from '@/actions/users';
import { Payment, User } from '@/types';

export default function PaymentsScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('esewa');
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);

  async function loadPayments() {
    const token = await SecureStore.getItemAsync('fad_token');

    if (!token) return;

    try {
      setLoading(true);

      const [userResponse, paymentsResponse] = await Promise.all([
        getUser(token),
        getPayments(token),
      ]);

      setUser(userResponse);
      setPayments(paymentsResponse || []);
    } catch (error) {
      console.error('Error loading payments:', error);
      Alert.alert('Error', 'Could not load payments.');
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadPayments();
    }, [])
  );

  async function handleRequestPayment() {
    const token = await SecureStore.getItemAsync('fad_token');

    if (!token) return;

    Alert.alert(
      'Request Payment',
      `Request payout using ${paymentMethod}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Request',
          onPress: async () => {
            try {
              setRequesting(true);
              const response = await requestPayment(token, paymentMethod);

              if (!response?.success) {
                Alert.alert(
                  'Request failed',
                  response?.message || 'Payment request failed.'
                );
                return;
              }

              Alert.alert('Success', response.message || 'Payment requested.');
              await loadPayments();
            } catch (error) {
              console.error('Error requesting payment:', error);
              Alert.alert('Error', 'Could not request payment.');
            } finally {
              setRequesting(false);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <Screen title="Payments" subtitle="Loading your wallet...">
        <Loader message="Loading payments..." />
      </Screen>
    );
  }

  return (
    <Screen title="Payments" subtitle="Track your earnings and withdrawals.">
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceValue}>Rs {user?.current_balance || '0'}</Text>
        <Text style={styles.balanceText}>
          Request a payout once your balance is eligible.
        </Text>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Earned</Text>
          <Text style={styles.summaryValue}>Rs {user?.total_earned || '0'}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Ads Watched</Text>
          <Text style={styles.summaryValue}>{user?.ads_watched_count || 0}</Text>
        </View>
      </View>

      <SectionCard title="Request Payment">
        <View style={styles.paymentMethods}>
          {['esewa', 'khalti'].map((method) => (
            <Pressable
              key={method}
              style={[
                styles.methodChip,
                paymentMethod === method && styles.methodChipActive,
              ]}
              onPress={() => setPaymentMethod(method)}
            >
              <Text
                style={[
                  styles.methodText,
                  paymentMethod === method && styles.methodTextActive,
                ]}
              >
                {method}
              </Text>
            </Pressable>
          ))}
        </View>

        <AppButton
          title="Request Payout"
          onPress={handleRequestPayment}
          loading={requesting}
        />
      </SectionCard>

      <View style={styles.sectionGap}>
        <SectionCard title="Payment History">
          {payments.length ? (
            payments.map((payment) => (
              <View key={payment.id} style={styles.paymentRow}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentTitle}>
                    {payment.type === 'payout' ? 'Payout' : 'Revenue'}
                  </Text>
                  <Text style={styles.paymentMeta}>
                    {payment.payment_method} |{' '}
                    {new Date(payment.created_at).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.paymentRight}>
                  <Text style={styles.paymentAmount}>Rs {payment.amount}</Text>
                  <Text
                    style={[
                      styles.statusText,
                      payment.status === 'completed' && styles.completedText,
                      payment.status === 'failed' && styles.failedText,
                    ]}
                  >
                    {payment.status}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <EmptyState
              title="No payments yet"
              message="Your payout and transaction history will appear here."
            />
          )}
        </SectionCard>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.35)',
    backgroundColor: 'rgba(37, 99, 235, 0.22)',
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#dbeafe',
  },
  balanceValue: {
    marginTop: 8,
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
  },
  balanceText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#d1d5db',
  },
  summaryGrid: {
    marginTop: 18,
    marginBottom: 22,
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#d1d5db',
  },
  summaryValue: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 10,
  },
  methodChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  methodChipActive: {
    borderColor: 'rgba(96, 165, 250, 0.55)',
    backgroundColor: 'rgba(37, 99, 235, 0.35)',
  },
  methodText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#d1d5db',
    textTransform: 'capitalize',
  },
  methodTextActive: {
    color: '#ffffff',
  },
  sectionGap: {
    marginTop: 22,
  },
  paymentRow: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(17, 24, 39, 0.38)',
    flexDirection: 'row',
    gap: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  paymentMeta: {
    marginTop: 4,
    fontSize: 13,
    color: '#d1d5db',
    textTransform: 'capitalize',
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
  },
  statusText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '900',
    color: '#facc15',
    textTransform: 'capitalize',
  },
  completedText: {
    color: '#4ade80',
  },
  failedText: {
    color: '#f87171',
  },
});