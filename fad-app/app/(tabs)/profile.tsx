import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as SecureStore from 'expo-secure-store';

import AppButton from '@/common/AppButton';
import EmptyState from '@/common/EmptyState';
import Loader from '@/common/Loader';
import Screen from '@/common/Screen';
import SectionCard from '@/components/dashboard/SectionCard';
import { getMyReferrals } from '@/actions/referrals';
import { getUser } from '@/actions/users';
import { Referral, User } from '@/types';

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadProfile() {
    const token = await SecureStore.getItemAsync('fad_token');

    if (!token) return;

    try {
      setLoading(true);

      const [userResponse, referralsResponse] = await Promise.all([
        getUser(token),
        getMyReferrals(token),
      ]);

      setUser(userResponse);
      setReferrals(referralsResponse || []);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Could not load profile.');
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('fad_token');
          await SecureStore.deleteItemAsync('fad_user');
          setUser(null);
          router.replace('/login');
        },
      },
    ]);
  }

  async function handleCopyReferralLink() {
    const referralLink = `http://192.168.1.80:5173?ref=${user?.id}`;
    await Clipboard.setStringAsync(referralLink);
    Alert.alert('Success', 'Referral link copied to clipboard!');
  }

  async function handleShareReferralLink() {
    const referralLink = `http://192.168.1.80:5173?ref=${user?.id}`;
    try {
      await Share.share({
        message: `Join me on FAD and start earning! Use my referral link: ${referralLink}`,
        url: referralLink,
        title: 'Join FAD',
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share referral link.');
    }
  }

  if (loading) {
    return (
      <Screen title="Profile" subtitle="Loading your account...">
        <Loader message="Loading profile..." />
      </Screen>
    );
  }

  return (
    <Screen title="Profile" subtitle="Manage your FAD account.">
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.name || user?.email || 'F').charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>{user?.name || 'FAD User'}</Text>
        <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>

        <View style={styles.badgeRow}>
          <Text style={styles.roleBadge}>{user?.role || 'user'}</Text>
          <Text style={styles.statusBadge}>{user?.status || 'active'}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Current Balance</Text>
          <Text style={styles.statValue}>Rs {user?.current_balance || '0'}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Earned</Text>
          <Text style={styles.statValue}>Rs {user?.total_earned || '0'}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Ads Watched</Text>
          <Text style={styles.statValue}>{user?.ads_watched_count || 0}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Referrals</Text>
          <Text style={styles.statValue}>{referrals.length}</Text>
        </View>
      </View>

      <SectionCard title="Referral History">
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
            message="Your referral history will appear here."
          />
        )}
      </SectionCard>

      <SectionCard title="Your Referral Link">
        <View style={styles.referralLinkContainer}>
          <Text style={styles.referralLinkLabel}>Share this link to earn rewards</Text>
          <View style={styles.referralLinkBox}>
            <Text
              style={styles.referralLinkText}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              http://192.168.1.80:5173?ref={user?.id}
            </Text>
          </View>
          <View style={styles.referralButtonRow}>
            <Pressable
              style={[styles.referralButton, styles.copyButton]}
              onPress={handleCopyReferralLink}
            >
              <Text style={styles.buttonText}>Copy Link</Text>
            </Pressable>
            <Pressable
              style={[styles.referralButton, styles.shareButton]}
              onPress={handleShareReferralLink}
            >
              <Text style={styles.buttonText}>Share</Text>
            </Pressable>
          </View>
        </View>
      </SectionCard>

      <AppButton
        title="Logout"
        variant="danger"
        onPress={handleLogout}
        style={styles.logoutButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.35)',
    backgroundColor: 'rgba(37, 99, 235, 0.22)',
    alignItems: 'center',
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
  },
  name: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
  },
  email: {
    marginTop: 4,
    fontSize: 14,
    color: '#d1d5db',
  },
  badgeRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(96, 165, 250, 0.22)',
    fontSize: 12,
    fontWeight: '900',
    color: '#60a5fa',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    fontSize: 12,
    fontWeight: '900',
    color: '#4ade80',
    textTransform: 'capitalize',
  },
  statsGrid: {
    marginTop: 22,
    marginBottom: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statLabel: {
    fontSize: 13,
    color: '#d1d5db',
  },
  statValue: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
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
  logoutButton: {
    marginTop: 26,
  },
  referralLinkContainer: {
    gap: 12,
  },
  referralLinkLabel: {
    fontSize: 13,
    color: '#d1d5db',
    fontWeight: '600',
  },
  referralLinkBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.35)',
  },
  referralLinkText: {
    fontSize: 12,
    color: '#60a5fa',
    fontFamily: 'monospace',
  },
  referralButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  referralButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButton: {
    backgroundColor: '#2563eb',
  },
  shareButton: {
    backgroundColor: '#7c3aed',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});