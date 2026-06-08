import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

import AppButton from '@/common/AppButton';
import EmptyState from '@/common/EmptyState';
import Loader from '@/common/Loader';
import Screen from '@/common/Screen';
import SectionCard from '@/components/dashboard/SectionCard';
import {
  BACKEND_URL,
  generateAdsReport,
  generateFinanceReport,
  generateReport,
  generateUserReport,
  getReportAnalytics,
  getReports,
} from '@/actions/reports';
import { KeyMetrics, Report } from '@/types';

const defaultKeyMetrics: KeyMetrics = {
  overview: [
    { label: 'Total Users', value: '0' },
    { label: 'Active Ads', value: '0' },
    { label: 'Total Revenue', value: '0' },
    { label: 'Ad Views', value: '0' },
  ],
  revenue: [
    { label: 'Gross Revenue', value: '0' },
    { label: 'User Payouts', value: '0' },
    { label: 'Net Profit', value: '0' },
    { label: 'Avg. Revenue/Ad', value: '0' },
  ],
  'user-activity': [
    { label: 'Daily Active Users', value: '0' },
    { label: 'Avg. Session Time', value: '0' },
    { label: 'Ads per User', value: '0' },
    { label: 'Retention Rate', value: '0' },
  ],
  'ad-performance': [
    { label: 'Total Impressions', value: '0' },
    { label: 'Click-through Rate', value: '0' },
    { label: 'Completion Rate', value: '0' },
    { label: 'Avg. View Duration', value: '0' },
  ],
  financial: [
    { label: 'Operating Revenue', value: '0' },
    { label: 'Operating Expenses', value: '0' },
    { label: 'EBITDA', value: '0' },
    { label: 'Profit Margin', value: '0' },
  ],
};

const reportTypes = [
  { id: 'overview', name: 'Overview Report' },
  { id: 'revenue', name: 'Revenue Report' },
  { id: 'user-activity', name: 'User Activity' },
  { id: 'ad-performance', name: 'Ad Performance' },
  { id: 'financial', name: 'Financial Summary' },
];

const timeframes = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: '1yr', value: '1yr' },
];

function formatDate(date: string) {
  if (!date) return '-';

  return new Date(date).toLocaleDateString();
}

export default function ReportsScreen() {
  const [selectedReport, setSelectedReport] = useState('overview');
  const [timeframe, setTimeframe] = useState('30d');
  const [analytics, setAnalytics] = useState<KeyMetrics>(defaultKeyMetrics);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadReports(selectedTimeframe: string) {
    const token = await SecureStore.getItemAsync('fad_token');

    if (!token) return;

    try {
      setLoading(true);

      const [metricsResponse, reportsResponse] = await Promise.all([
        getReportAnalytics(token, selectedTimeframe),
        getReports(token),
      ]);

      if (metricsResponse) {
        setAnalytics(metricsResponse);
      }

      setRecentReports(reportsResponse || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      Alert.alert('Error', 'Could not load reports.');
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadReports(timeframe);
    }, [timeframe])
  );

  const currentMetrics =
    analytics[selectedReport as keyof KeyMetrics] || analytics.overview;

  async function openReportFile(filePath?: string) {
    if (!filePath) return;

    await WebBrowser.openBrowserAsync(`${BACKEND_URL}${filePath}`);
  }

  async function handleGenerateReport() {
    const token = await SecureStore.getItemAsync('fad_token');

    if (!token) return;

    try {
      setLoading(true);
      const response = await generateReport(token, timeframe);

      if (response?.success) {
        await openReportFile(response.report?.file_path);
        await loadReports(timeframe);
      } else {
        Alert.alert('Error', response?.message || 'Could not generate report.');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Could not generate report.');
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickExport(type: 'performance' | 'finance' | 'users' | 'ads') {
    const token = await SecureStore.getItemAsync('fad_token');

    if (!token) return;

    try {
      setLoading(true);

      const response =
        type === 'performance'
          ? await generateReport(token, '7d')
          : type === 'finance'
            ? await generateFinanceReport(token, timeframe)
            : type === 'users'
              ? await generateUserReport(token)
              : await generateAdsReport(token, timeframe);

      if (response?.success) {
        await openReportFile(response.report?.file_path);
        await loadReports(timeframe);
      } else {
        Alert.alert('Error', response?.message || 'Could not export report.');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      Alert.alert('Error', 'Could not export report.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen
      title="Reports & Analytics"
      subtitle="Generate comprehensive reports and export data."
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

      <AppButton
        title="Generate Report"
        onPress={handleGenerateReport}
        loading={loading}
        style={styles.generateButton}
      />

      <SectionCard title="Select Report Type">
        <View style={styles.reportTypeGrid}>
          {reportTypes.map((report) => (
            <Pressable
              key={report.id}
              style={[
                styles.reportTypeCard,
                selectedReport === report.id && styles.reportTypeCardActive,
              ]}
              onPress={() => setSelectedReport(report.id)}
            >
              <Text
                style={[
                  styles.reportTypeText,
                  selectedReport === report.id && styles.reportTypeTextActive,
                ]}
              >
                {report.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>

      <View style={styles.metricsGrid}>
        {currentMetrics.map((metric, index) => (
          <View key={`${metric.label}-${index}`} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={styles.metricValue}>{metric.value}</Text>
          </View>
        ))}
      </View>

      {loading ? (
        <Loader message="Loading reports..." />
      ) : (
        <>
          <SectionCard title="Recent Reports">
            {recentReports.length ? (
              recentReports.map((report) => (
                <View key={report.id} style={styles.reportRow}>
                  <View style={styles.reportInfo}>
                    <Text style={styles.reportName}>{report.report_name}</Text>
                    <Text style={styles.reportMeta}>
                      {formatDate(report.generated_at)} |{' '}
                      {(report.file_size / 1024).toFixed(2)} KB
                    </Text>
                  </View>

                  <Pressable onPress={() => openReportFile(report.file_path)}>
                    <Text style={styles.downloadText}>Download</Text>
                  </Pressable>
                </View>
              ))
            ) : (
              <EmptyState
                title="No reports found"
                message="Generated reports will appear here."
              />
            )}
          </SectionCard>

          <View style={styles.sectionGap}>
            <SectionCard title="Quick Export Options">
              <Pressable
                style={styles.exportRow}
                onPress={() => handleQuickExport('performance')}
              >
                <View>
                  <Text style={styles.exportTitle}>Performance Summary</Text>
                  <Text style={styles.exportText}>Last 30 days overview</Text>
                </View>
                <Text style={styles.exportAction}>Export</Text>
              </Pressable>

              <Pressable
                style={styles.exportRow}
                onPress={() => handleQuickExport('finance')}
              >
                <View>
                  <Text style={styles.exportTitle}>Financial Report</Text>
                  <Text style={styles.exportText}>Revenue and expenses</Text>
                </View>
                <Text style={styles.exportAction}>Export</Text>
              </Pressable>

              <Pressable
                style={styles.exportRow}
                onPress={() => handleQuickExport('users')}
              >
                <View>
                  <Text style={styles.exportTitle}>User Data Export</Text>
                  <Text style={styles.exportText}>Complete user database</Text>
                </View>
                <Text style={styles.exportAction}>Export</Text>
              </Pressable>

              <Pressable
                style={styles.exportRow}
                onPress={() => handleQuickExport('ads')}
              >
                <View>
                  <Text style={styles.exportTitle}>Ad Analytics</Text>
                  <Text style={styles.exportText}>Detailed ad performance</Text>
                </View>
                <Text style={styles.exportAction}>Export</Text>
              </Pressable>
            </SectionCard>
          </View>
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
  generateButton: {
    marginTop: 16,
    marginBottom: 22,
  },
  reportTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  reportTypeCard: {
    width: '47%',
    minHeight: 72,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
  },
  reportTypeCardActive: {
    borderColor: 'rgba(96, 165, 250, 0.55)',
    backgroundColor: 'rgba(37, 99, 235, 0.35)',
  },
  reportTypeText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    color: '#d1d5db',
    textAlign: 'center',
  },
  reportTypeTextActive: {
    color: '#ffffff',
  },
  metricsGrid: {
    marginTop: 22,
    marginBottom: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricLabel: {
    fontSize: 13,
    color: '#d1d5db',
  },
  metricValue: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  sectionGap: {
    marginTop: 22,
  },
  reportRow: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(17, 24, 39, 0.38)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  reportMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#d1d5db',
  },
  downloadText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#60a5fa',
  },
  exportRow: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(17, 24, 39, 0.38)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exportTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  exportText: {
    marginTop: 4,
    fontSize: 13,
    color: '#d1d5db',
  },
  exportAction: {
    marginLeft: 'auto',
    fontSize: 13,
    fontWeight: '900',
    color: '#60a5fa',
  },
});