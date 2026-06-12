import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Linking,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { WebView } from 'react-native-webview';

import AppButton from '@/common/AppButton';
import AppInput from '@/common/AppInput';
import EmptyState from '@/common/EmptyState';
import Loader from '@/common/Loader';
import Screen from '@/common/Screen';
import { deleteAds, getAdsList, updateAdStatus } from '@/actions/ads';
import { apiRequest } from '@/lib/api'; 
import { Ad } from '@/types';

export default function AdsScreen() {
  const [ads, setAds] = useState<Partial<Ad>[]>([]);
  const [selectedAd, setSelectedAd] = useState<Partial<Ad> | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'update'>('create');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formFacility, setFormFacility] = useState('');
  const [formBudget, setFormBudget] = useState('');
  const [formTargetViews, setFormTargetViews] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('esewa');
  const [selectedAsset, setSelectedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [costPerView, setCostPerView] = useState(2);

    const [paymentHtml, setPaymentHtml] = useState('');
const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  async function loadAds() {
    const token = await SecureStore.getItemAsync('fad_token');
    if (!token) return;
    try {
      setLoading(true);
      const response = await getAdsList(token);
      setAds(response || []);
    } catch (error) {
      console.error('Error loading ads:', error);
      Alert.alert('Error', 'Could not load ads.');
    } finally {
      setLoading(false);
    }
  }

  async function loadSystemSettings() {
    const token = await SecureStore.getItemAsync('fad_token');
    if (!token) return;
    try {
      const res = await apiRequest('/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res?.cost_per_view) {
        setCostPerView(Number(res.cost_per_view));
      }
    } catch (e) {
      console.log('Settings read timeout, defaulting conversion ratios.');
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadAds();
      loadSystemSettings();
    }, [])
  );

  useEffect(() => {
    if (formBudget) {
      const computed = Math.floor(Number(formBudget) / costPerView);
      setFormTargetViews(isNaN(computed) ? '0' : computed.toString());
    } else {
      setFormTargetViews('');
    }
  }, [formBudget, costPerView]);

  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      const matchesSearch =
        ad.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.facility_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || ad.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [ads, searchTerm, filterStatus]);

  function openCreateForm() {
    setFormMode('create');
    setSelectedAd(null);
    setFormTitle('');
    setFormFacility('');
    setFormBudget('');
    setSelectedAsset(null);
    setFormPaymentMethod('esewa');
    setFormModalVisible(true);
  }

  function openUpdateForm(ad: Partial<Ad>) {
    setFormMode('update');
    setSelectedAd(ad);
    setFormTitle(ad.title || '');
    setFormFacility(ad.facility_name || '');
    setFormBudget(ad.budget?.toString() || '');
    setSelectedAsset(null);
    setFormModalVisible(true);
  }

  // Mimics web version: handles eSewa response parameters by encoding query string parameters
const makePaymentViaEsewa = (formData: any) => {
  const mobileFormData = {
    ...formData,
    success_url: String(formData.success_url).replace(
      '/api/webhook/esewa/success',
      '/api/webhook/esewa/success/mobile'
    ),
  };

  const fields = Object.keys(formData)
    .map(
      (key) =>
        `<input type="hidden" name="${key}" value="${String(mobileFormData[key]).replace(/"/g, '&quot;')}" />`
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <body onload="document.forms[0].submit()">
        <form method="POST" action="https://rc-epay.esewa.com.np/api/epay/main/v2/form">
          ${fields}
        </form>
      </body>
    </html>
  `;

  setPaymentHtml(html);
  setPaymentModalVisible(true);
};
  // Mimics web version: Khalti direct redirection layout
const makePaymentViaKhalti = (redirectUrl: string) => {
  if (!redirectUrl) {
    Alert.alert('Error', 'Khalti payment URL was not received.');
    return;
  }

  Linking.openURL(redirectUrl).catch(() => {
    Alert.alert('Error', 'Unable to redirect to Khalti portal.');
  });
};

  async function handlePickAsset() {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'App requires access to gallery to pick creative material.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 50 * 1024 * 1024) {
        Alert.alert('File size too large', 'Media assets must be smaller than 50MB.');
        return;
      }
      setSelectedAsset(asset);
    }
  }

  async function handleFormSubmit() {
    if (!formTitle || !formFacility || !formBudget) {
      Alert.alert('Validation Error', 'Please populate all structural mandatory values.');
      return;
    }

    const token = await SecureStore.getItemAsync('fad_token');
    if (!token) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('title', formTitle);
      formData.append('facility_name', formFacility);
      formData.append('budget', formBudget);
      formData.append('target_views', formTargetViews);
      formData.append('payment_method', formPaymentMethod);

      if (selectedAsset) {
        const uriParts = selectedAsset.uri.split('.');
        const fileExtension = uriParts[uriParts.length - 1];
        const mimeType =
          selectedAsset.mimeType ||
          (selectedAsset.type === 'video' ? 'video/mp4' : 'image/jpeg');

        formData.append('file', {
          uri: selectedAsset.uri,
          name: `upload_${Date.now()}.${fileExtension}`,
          type: mimeType,
        } as any);
      }

      if (formMode === 'create') {
        const response = await apiRequest('/ads/create', {
          method: 'POST',
          body: formData,
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response || response.success === false) {
          Alert.alert('Error', 'Something went wrong. Please try again.');
          return;
        }

        setFormModalVisible(false);

        // Web sync transaction logic
        if (formPaymentMethod === 'esewa' && response?.formData) {
          makePaymentViaEsewa(response.formData);
        } else if (formPaymentMethod === 'khalti' && response?.redirectUrl) {
          makePaymentViaKhalti(response.redirectUrl);
        } else {
          Alert.alert('Success', 'Ad campaign compiled successfully.');
        }

        // Locally push dynamic list representation safely matching web view metrics
        const localAd: Partial<Ad> = {
          title: formTitle,
          status: 'active',
          actual_views: 0,
          budget: formBudget,
          spent_amount: '0',
          click_through_rate: '0%',
          facility_name: formFacility,
          target_views: formTargetViews || '0',
          transaction_status: 'requested'
        };
        setAds(prev => [...prev, localAd]);

      } else if (formMode === 'update' && selectedAd) {
        const response = await apiRequest(`/ads/${selectedAd.id}`, {
          method: 'PATCH',
          body: formData,
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response) {
          Alert.alert('Error', 'Something went wrong updating campaign attributes.');
          return;
        }

        Alert.alert('Success', 'Ad updated successfully!');
        setFormModalVisible(false);
      }

      loadAds();
    } catch (error) {
      console.error('Error submitting form data:', error);
      Alert.alert('Network Failure', 'Failed to process campaign upload properties.');
    } finally {
      setLoading(false);
    }
  }

  function handleViewAd(ad: Partial<Ad>) {
    setSelectedAd(ad);
    setViewModalVisible(true);
  }

  async function handleToggleStatus(id: number, currentStatus: string) {
    const token = await SecureStore.getItemAsync('fad_token');
    if (!token) return;
    const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const response = await updateAdStatus(id, nextStatus, token);
      if (!response || response.success === false) {
        Alert.alert('Error', 'Something went wrong updating ad status.');
        return;
      }
      
      setAds(prev => prev.map(item => item.id === id ? { ...item, status: nextStatus } : item));
      Alert.alert('Success', 'Ad status updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Could not sync updated status parameters.');
    }
  }

  function handleDeleteAd(id: number, title: string) {
    Alert.alert('Delete Ad', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const token = await SecureStore.getItemAsync('fad_token');
          if (!token) return;
          try {
            const response = await deleteAds(id, token);
            if (!response || response.success === false) {
              Alert.alert('Error', 'Something went wrong deleting this ad.');
              return;
            }
            setAds(prev => prev.filter(item => item.id !== id));
            Alert.alert('Success', 'Ad deleted successfully!');
          } catch (error) {
            Alert.alert('Error', 'Could not delete target campaign entry.');
          }
        },
      },
    ]);
  }

  return (
    <Screen title="Manage Ads" subtitle="Create, monitor, and manage advertisement campaigns">
      <View style={styles.topActionsContainer}>
        <AppInput
          placeholder="Search ads or facilities..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          style={{ flex: 1, marginBottom: 0 }}
        />
        <AppButton title="+ Create" onPress={openCreateForm} style={styles.createBtn} />
      </View>

      <View style={styles.filters}>
        {['all', 'active', 'paused', 'completed'].map((status) => (
          <Pressable
            key={status}
            style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[styles.filterText, filterStatus === status && styles.filterTextActive]}>
              {status} Status
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <Loader message="Syncing workspace details..." />
      ) : filteredAds.length ? (
        <ScrollView contentContainerStyle={styles.list}>
          {filteredAds.map((ad, idx) => {
            const uniqueId = ad.id || idx;
            const budget = Number(ad.budget || 0);
            const spent = Number(ad.spent_amount || 0);
            const txStatus = ad.transaction_status?.toLowerCase();

            return (
              <View key={uniqueId} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.adTitle}>{ad.title}</Text>
                  <Text style={[styles.statusBadge, ad.status === 'active' && styles.activeBadge]}>
                    {ad.status}
                  </Text>
                </View>

                <Text style={styles.facilityLabel}>{ad.facility_name || 'Generic Facility'}</Text>

                <View style={styles.metaGrid}>
                  <Text style={styles.metaText}>Views: <Text style={styles.metaValue}>{ad.actual_views || 0}</Text></Text>
                  <Text style={styles.metaText}>CTR: <Text style={styles.metaValue}>{ad.click_through_rate || '0%'}</Text></Text>
                  <Text style={styles.metaText}>Budget: <Text style={styles.metaValue}>Rs {budget}</Text></Text>
                  <Text style={styles.metaText}>Spent: <Text style={styles.metaValue}>Rs {spent}</Text></Text>
                </View>

                {/* Tracking state conditions pulled straight from web layout code */}
                <View style={styles.txStatusContainer}>
                  <Text style={styles.txText}>
                    Transaction: {' '}
                    <Text style={{ fontWeight: 'bold', color: txStatus === 'approved' ? '#4ade80' : txStatus === 'rejected' ? '#f87171' : '#fcd34d' }}>
                      {txStatus || 'pending'}
                    </Text>
                  </Text>
                </View>

                <View style={styles.actions}>
                  <AppButton title="View" variant="secondary" onPress={() => handleViewAd(ad)} style={styles.actionButton} />
                  <AppButton title="Edit" variant="secondary" onPress={() => openUpdateForm(ad)} style={styles.actionButton} />
                  
                  {txStatus === 'requested' ? (
                    <AppButton title="⏳ Pending" variant="secondary" disabled style={styles.actionButton} />
                  ) : txStatus === 'rejected' ? (
                    <AppButton title="❌ Rejected" variant="danger" disabled style={styles.actionButton} />
                  ) : (
                    <AppButton 
                      title={ad.status === 'active' ? 'Pause' : 'Play'} 
                      onPress={() => handleToggleStatus(ad.id!, ad.status!)} 
                      style={styles.actionButton} 
                    />
                  )}

                  <AppButton title="Delete" variant="danger" onPress={() => handleDeleteAd(ad.id!, ad.title!)} style={styles.actionButton} />
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <EmptyState title="No ads found" message="Try adjusting your search or filter criteria to find what you're looking for." />
      )}

      {/* Form Modal */}
      <Modal visible={formModalVisible} transparent animationType="slide" onRequestClose={() => setFormModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{formMode === 'create' ? 'Create New Ad Campaign' : 'Update Ad Campaign'}</Text>
            
            <ScrollView style={{ marginVertical: 12 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Campaign Title *</Text>
              <AppInput placeholder="Enter campaign title" value={formTitle} onChangeText={setFormTitle} />

              <Text style={styles.fieldLabel}>Facility Name *</Text>
              <AppInput placeholder="Enter facility name" value={formFacility} onChangeText={setFormFacility} />

              <Text style={styles.fieldLabel}>Budget (Rs) *</Text>
              <AppInput placeholder="10000" keyboardType="numeric" value={formBudget} onChangeText={setFormBudget} />

              <Text style={styles.fieldLabel}>Target Views</Text>
              <AppInput placeholder="0" value={formTargetViews} editable={false} style={{ backgroundColor: 'rgba(255,255,255,0.03)' }} />

              <Text style={styles.fieldLabel}>Upload Content</Text>
              <Pressable style={styles.uploadBox} onPress={handlePickAsset}>
                {selectedAsset ? (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#4ade80', fontWeight: 'bold' }}>✓ Content Attached Ready</Text>
                    <Text style={{ color: '#9ca3af', fontSize: 11 }} numberOfLines={1}>{selectedAsset.uri.split('/').pop()}</Text>
                  </View>
                ) : (
                  <Text style={{ color: '#9ca3af', textAlign: 'center' }}>Supports: JPG, PNG, MP4, MOV (Max 50MB)</Text>
                )}
              </Pressable>

              {formMode === 'create' && (
                <View>
                  <Text style={styles.fieldLabel}>Pay Via</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                    <Pressable style={[styles.payBtn, formPaymentMethod === 'esewa' && styles.payBtnActive]} onPress={() => setFormPaymentMethod('esewa')}>
                      <Text style={styles.payBtnText}>eSewa</Text>
                    </Pressable>
                    <Pressable style={[styles.payBtn, formPaymentMethod === 'khalti' && styles.payBtnActive]} onPress={() => setFormPaymentMethod('khalti')}>
                      <Text style={styles.payBtnText}>Khalti</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.formActionsRow}>
              <AppButton title="Cancel" variant="secondary" onPress={() => setFormModalVisible(false)} style={{ flex: 1 }} />
              <AppButton title={formMode === 'create' ? 'Create Campaign' : 'Update Campaign'} onPress={handleFormSubmit} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Ad Details Modal */}
      <Modal visible={viewModalVisible} transparent animationType="fade" onRequestClose={() => setViewModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ad Details</Text>
            
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Campaign Name</Text>
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>{selectedAd?.title}</Text>
            <Text style={{ color: '#9ca3af', fontSize: 13 }}>{selectedAd?.facility_name}</Text>

            <View style={[styles.modalGrid, { marginTop: 16 }]}>
              <View style={styles.modalStat}><Text style={styles.modalLabel}>Total Views</Text><Text style={styles.modalValue}>{selectedAd?.actual_views || 0}</Text></View>
              <View style={styles.modalStat}><Text style={styles.modalLabel}>CTR</Text><Text style={styles.modalValue}>{selectedAd?.click_through_rate || '0%'}</Text></View>
              <View style={styles.modalStat}><Text style={styles.modalLabel}>Budget</Text><Text style={styles.modalValue}>Rs {selectedAd?.budget || 0}</Text></View>
              <View style={styles.modalStat}><Text style={styles.modalLabel}>Amount Spent</Text><Text style={styles.modalValue}>Rs {selectedAd?.spent_amount || 0}</Text></View>
            </View>

            <AppButton title="Close" variant="secondary" onPress={() => setViewModalVisible(false)} style={{ marginTop: 24 }} />
          </View>
        </View>
      </Modal>
      <Modal
  visible={paymentModalVisible}
  animationType="slide"
  onRequestClose={() => setPaymentModalVisible(false)}
>
  <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
    <View
      style={{
        paddingTop: 44,
        paddingHorizontal: 14,
        paddingBottom: 10,
        backgroundColor: '#111827',
      }}
    >
      <AppButton
        title="Close Payment"
        variant="secondary"
        onPress={() => {
          setPaymentModalVisible(false);
          setPaymentHtml('');
          loadAds();
        }}
      />
    </View>

	    <WebView
	      originWhitelist={['*']}
	      source={{ html: paymentHtml }}
	      javaScriptEnabled
	      domStorageEnabled
	      startInLoadingState
	      onMessage={(event) => {
	        try {
	          const message = JSON.parse(event.nativeEvent.data);
	          if (message.type === 'ESEWA_PAYMENT_COMPLETE') {
	            setPaymentModalVisible(false);
	            setPaymentHtml('');
	            loadAds();
	            Alert.alert('Payment Complete', 'Ad payment was processed.');
	          }
	        } catch {
	          // Ignore non-JSON messages from payment pages.
	        }
	      }}
	      onNavigationStateChange={(navState) => {
	        if (
	          navState.url === 'http://192.168.1.80:5173/' ||
	          navState.url === 'http://192.168.1.80:5173'
	        ) {
          setPaymentModalVisible(false);
          setPaymentHtml('');
          loadAds();
          Alert.alert('Payment Complete', 'Ad payment was processed.');
        }
      }}
    />
  </View>
</Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topActionsContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  createBtn: {
    paddingHorizontal: 16,
    height: 48,
  },
  filters: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  filterChipActive: {
    borderColor: '#2563eb',
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
  },
  filterTextActive: {
    color: '#3b82f6',
  },
  list: {
    marginTop: 16,
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#1f2937',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  facilityLabel: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    overflow: 'hidden',
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    fontSize: 11,
    fontWeight: '600',
    color: '#fde047',
    textTransform: 'capitalize',
  },
  activeBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    color: '#4ade80',
  },
  metaGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  metaText: {
    width: '48%',
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 4,
  },
  metaValue: {
    fontWeight: '600',
    color: '#ffffff',
  },
  txStatusContainer: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  txText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actions: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionButton: {
    flex: 1,
    minWidth: '22%',
    height: 36,
  },
  modalOverlay: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalCard: {
    maxHeight: '85%',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 12,
    marginBottom: 6,
  },
  uploadBox: {
    padding: 20,
    borderWidth: 2,
    borderRadius: 8,
    borderStyle: 'dashed',
    borderColor: '#374151',
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#374151',
    alignItems: 'center',
  },
  payBtnActive: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  payBtnText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  formActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modalStat: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  modalLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  modalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
});
