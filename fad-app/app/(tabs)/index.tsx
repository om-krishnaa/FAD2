import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { getAds } from '@/actions/ads';
import { getMyReferrals } from '@/actions/referrals';
import { getUser } from '@/actions/users';
import EmptyState from '@/common/EmptyState';
import Loader from '@/common/Loader';
import Screen from '@/common/Screen';
import SectionCard from '@/components/dashboard/SectionCard';
import StatCard from '@/components/dashboard/StatCard';
import { Ad, Referral, User } from '@/types';

export default function DashboardScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [availableAds, setAvailableAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadDashboard() {
    const token = await SecureStore.getItemAsync('fad_token');

    if (!token) return;

    try {
      setLoading(true);

      const [userResponse, referralsResponse, adsResponse] = await Promise.all([
        getUser(token),
        getMyReferrals(token),
        getAds(token),
      ]);

      setUser(userResponse);
      setReferrals(referralsResponse || []);
      setAvailableAds(adsResponse || []);
    } catch (error) {
      console.error('Error loading user dashboard:', error);
      Alert.alert('Error', 'Could not load dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  if (loading) {
    return (
      <Screen title="Dashboard" subtitle="Loading your account...">
        <Loader message="Loading dashboard..." />
      </Screen>
    );
  }

  return (
    <Screen title="Dashboard" subtitle="Welcome back to FAD">
      <View style={styles.walletCard}>
        <Text style={styles.walletLabel}>Available Balance</Text>
        <Text style={styles.walletValue}>Rs {user?.current_balance || '0'}</Text>
        <Text style={styles.walletText}>
          Watch ads, invite referrals, and request payouts from Payments.
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="Total Earned"
          value={`Rs ${user?.total_earned || '0'}`}
          accent="green"
        />
        <StatCard
          title="Ads Watched"
          value={user?.ads_watched_count || 0}
          accent="blue"
        />
        <StatCard
          title="Referrals"
          value={referrals.length}
          accent="purple"
        />
        <StatCard
          title="Status"
          value={user?.status || 'active'}
          accent="orange"
        />
      </View>

      <SectionCard title="Available Ads">
        {availableAds.length ? (
          availableAds.slice(0, 3).map((ad) => (
            <View key={ad.id} style={styles.adCard}>
              <View style={styles.adHeader}>
                <Text style={styles.adTitle}>{ad.title}</Text>
                <Text style={styles.adType}>{ad.ad_type}</Text>
              </View>

              <Text style={styles.adDescription} numberOfLines={2}>
                {ad.description || 'Watch this ad and earn rewards.'}
              </Text>

              <View style={styles.adMetaRow}>
                <Text style={styles.adMeta}>
                  Views:{' '}
                  <Text style={styles.adMetaValue}>
                    {ad.actual_views || 0}
                  </Text>
                </Text>

                <Text style={styles.adMeta}>
                  Reward:{' '}
                  <Text style={styles.adMetaValue}>
                    Rs {(ad as any).earnings_per_view || (ad as any).cost_per_view || 0}
                  </Text>
                </Text>
              </View>
            </View>
          ))
        ) : (
<View style={styles.gameCard}>
  <Text style={styles.gameTitle}>No Ads Left for Today</Text>
  <Text style={styles.gameSubtitle}>Play while new ads become available.</Text>

  <View style={styles.gameFrame}>
    <WebView
      source={{ uri: 'https://funhtml5games.com?embed=flappy' }}
      style={styles.gameWebView}
      javaScriptEnabled
      domStorageEnabled
      startInLoadingState
      scalesPageToFit
      scrollEnabled={false}
      nestedScrollEnabled={false}
      automaticallyAdjustContentInsets={false}
      setBuiltInZoomControls={false}
      setDisplayZoomControls={false}
    />
  </View>
</View>
        )}
      </SectionCard>

      {/* <View style={styles.sectionGap}>
        <SectionCard title="Referral Activity">
          {referrals.length ? (
            referrals.slice(0, 5).map((referral) => (
              <View key={referral.id} style={styles.referralRow}>
                <View>
                  <Text style={styles.referralName}>
                    {referral.new_user?.name ||
                      referral.new_user?.email ||
                      'New User'}
                  </Text>
                  <Text style={styles.referralDate}>
                    {new Date(referral.created_at).toLocaleDateString()}
                  </Text>
                </View>

                <Text style={styles.referralAmount}>
                  Rs {referral.earned_amount}
                </Text>
              </View>
            ))
          ) : (
            <EmptyState
              title="No referrals yet"
              message="Your referral activity will appear here."
            />
          )}
        </SectionCard>
      </View> */}
    </Screen>
  );
}

const styles = StyleSheet.create({
  walletCard: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.35)',
    backgroundColor: 'rgba(37, 99, 235, 0.22)',
  },
  walletLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#dbeafe',
  },
  walletValue: {
    marginTop: 8,
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
  },
  walletText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#d1d5db',
  },
  statsGrid: {
    marginTop: 22,
    marginBottom: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sectionGap: {
    marginTop: 22,
  },
  adCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(17, 24, 39, 0.38)',
  },
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  adTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
  },
  adType: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(96, 165, 250, 0.18)',
    fontSize: 12,
    fontWeight: '900',
    color: '#60a5fa',
    textTransform: 'capitalize',
  },
  adDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#d1d5db',
  },
  adMetaRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  adMeta: {
    fontSize: 13,
    color: '#d1d5db',
  },
  adMetaValue: {
    fontWeight: '900',
    color: '#ffffff',
  },
gameCard: {
  marginHorizontal: -18,
  padding: 12,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: 'rgba(96, 165, 250, 0.32)',
  backgroundColor: '#bfdbfe',
},
gameTitle: {
  fontSize: 16,
  fontWeight: '900',
  color: '#111827',
  textAlign: 'center',
},
gameSubtitle: {
  marginTop: 4,
  marginBottom: 10,
  fontSize: 13,
  fontWeight: '700',
  color: '#374151',
  textAlign: 'center',
},
gameFrame: {
  width: '100%',
  height: 520,
  overflow: 'hidden',
  borderRadius: 12,
  backgroundColor: '#bfdbfe',
},
gameWebView: {
  width: '100%',
  height: 520,
  backgroundColor: '#bfdbfe',
},
  referralRow: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(17, 24, 39, 0.38)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  referralName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  referralDate: {
    marginTop: 4,
    fontSize: 13,
    color: '#d1d5db',
  },
  referralAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#4ade80',
  },
});