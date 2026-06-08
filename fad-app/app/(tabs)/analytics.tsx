import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import EmptyState from '@/common/EmptyState';
import Loader from '@/common/Loader';
import Screen from '@/common/Screen';
import SectionCard from '@/components/dashboard/SectionCard';
import StatCard from '@/components/dashboard/StatCard';
import { getAnalytics } from '@/actions/analytics';
import { Analytics } from '@/types';

type SavedUser = {
  role?: 'user' | 'admin' | 'super_admin';
};

const timeframes = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: '1yr', value: '1yr' },
];

export default function AnalyticsScreen() {
  const [timeframe, setTimeframe] = useState('7d');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [user, setUser] = useState<SavedUser | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadAnalytics(selectedTimeframe: string) {
    const token = await SecureStore.getItemAsync('fad_token');
    const savedUser = await SecureStore.getItemAsync('fad_user');

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    if (!token) return;

    try {
      setLoading(true);
      const response = await getAnalytics(selectedTimeframe, token);
      setAnalytics(response);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadAnalytics(timeframe);
    }, [timeframe])
  );

  const maxViews = useMemo(() => {
    const values = analytics?.weeklyEngagement?.map((item) => item.total_views) || [];
    return Math.max(...values, 1);
  }, [analytics]);

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <Screen
      title="Analytics Dashboard"
      subtitle="Track performance metrics and user engagement."
    >
      <View style={styles.timeframeRow}>
        {timeframes.map((item) => (
          <Pressable
            key={item.value}
            style={[
              styles.timeframeChip,
              timeframe === item.value && styles.timeframeChipActive,
            ]}
            onPress={() => setTimeframe(item.value)}
          >
            <Text
              style={[
                styles.timeframeText,
                timeframe === item.value && styles.timeframeTextActive,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <Loader message="Loading analytics..." />
      ) : (
        <>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Ad Views"
              value={analytics?.stats?.totalViews?.toLocaleString() || '-'}
              accent="blue"
            />

            <StatCard
              title="Active Users"
              value={analytics?.stats?.activeUsers?.toLocaleString() || '-'}
              accent="green"
            />

            <StatCard
              title="Revenue Generated"
              value={
                analytics
                  ? `Rs ${analytics.stats.revenueGenerated}`
                  : '-'
              }
              accent="purple"
            />

            <StatCard
              title="Avg. CTR"
              value={
                analytics
                  ? `${Number(analytics.stats.avgCTR || 0).toFixed(2)}%`
                  : '-'
              }
              accent="orange"
            />
          </View>

          <SectionCard title="Weekly Engagement">
            {analytics?.weeklyEngagement?.length ? (
              analytics.weeklyEngagement.map((item, index) => {
                const width = `${Math.min((item.total_views / maxViews) * 100, 100)}%`;

                return (
                  <View key={`${item.day}-${index}`} style={styles.engagementRow}>
                    <Text style={styles.dayText}>{item.day}</Text>

                    <View style={styles.progressOuter}>
                      <View style={[styles.progressInner, { width }]} />
                    </View>

                    <View style={styles.engagementValues}>
                      <Text style={styles.viewsText}>{item.total_views}</Text>
                      <Text style={styles.usersText}>{item.active_users} users</Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <EmptyState
                title="No engagement data"
                message="Weekly engagement will appear here once data is available."
              />
            )}
          </SectionCard>

          <View style={styles.sectionGap}>
            <SectionCard title="Top Performing Ads">
              {analytics?.recentAds?.length ? (
                analytics.recentAds.map((ad, index) => (
                  <View key={`${ad.id}-${index}`} style={styles.adRow}>
                    <View style={styles.adInfo}>
                      <Text style={styles.adTitle}>{ad.title}</Text>
                      <Text style={styles.adMeta}>
                        {ad.actual_views?.toLocaleString() || 0} views
                      </Text>
                    </View>

                    <View style={styles.adRevenueBox}>
                      <Text style={styles.adRevenue}>Rs {ad.budget || 0}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <EmptyState
                  title="No ad performance yet"
                  message="Top performing ads will appear here."
                />
              )}
            </SectionCard>
          </View>

          {isSuperAdmin ? (
            <View style={styles.sectionGap}>
              <SectionCard title="Revenue Breakdown">
                <View style={styles.revenueGrid}>
                  <View style={styles.revenueCard}>
                    <Text style={styles.revenueValue}>
                      Rs {analytics?.revenueBreakdown?.revenueFromFacilities || 0}
                    </Text>
                    <Text style={styles.revenueLabel}>Revenue from Facilities</Text>
                  </View>

                  <View style={styles.revenueCard}>
                    <Text style={styles.revenueValue}>
                      Rs {analytics?.revenueBreakdown?.paidToUsers || 0}
                    </Text>
                    <Text style={styles.revenueLabel}>Paid to Users</Text>
                  </View>

                  <View style={styles.revenueCard}>
                    <Text style={styles.revenueValue}>
                      Rs {analytics?.revenueBreakdown?.netProfit || 0}
                    </Text>
                    <Text style={styles.revenueLabel}>Net Profit</Text>
                  </View>
                </View>
              </SectionCard>
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  timeframeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeframeChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  timeframeChipActive: {
    borderColor: 'rgba(96, 165, 250, 0.55)',
    backgroundColor: 'rgba(37, 99, 235, 0.35)',
  },
  timeframeText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#d1d5db',
  },
  timeframeTextActive: {
    color: '#ffffff',
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
  engagementRow: {
    gap: 8,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  progressOuter: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  progressInner: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
  engagementValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewsText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#d1d5db',
  },
  usersText: {
    fontSize: 13,
    color: '#93c5fd',
  },
  adRow: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(17, 24, 39, 0.38)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adInfo: {
    flex: 1,
  },
  adTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  adMeta: {
    marginTop: 4,
    fontSize: 13,
    color: '#d1d5db',
  },
  adRevenueBox: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.16)',
  },
  adRevenue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#4ade80',
  },
  revenueGrid: {
    gap: 12,
  },
  revenueCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.16)',
    alignItems: 'center',
  },
  revenueValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#60a5fa',
  },
  revenueLabel: {
    marginTop: 6,
    fontSize: 13,
    color: '#d1d5db',
    textAlign: 'center',
  },
});