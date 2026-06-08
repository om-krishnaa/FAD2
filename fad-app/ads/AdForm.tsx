import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import AppButton from '@/common/AppButton';
import AppInput from '@/common/AppInput';
import { Ad } from '@/types';

type PickedFile = {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
};

type AdFormProps = {
  visible: boolean;
  mode: 'create' | 'update';
  initialData?: Partial<Ad> | null;
  onClose: () => void;
  onSubmit: (
    adData: Partial<Ad> & {
      facility_name?: string;
      target_views?: string;
    },
    uploadedFile?: PickedFile,
    paymentMethod?: string
  ) => void;
};

export default function AdForm({
  visible,
  mode,
  initialData,
  onClose,
  onSubmit,
}: AdFormProps) {
  const [title, setTitle] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [budget, setBudget] = useState('');
  const [targetViews, setTargetViews] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('esewa');
  const [file, setFile] = useState<PickedFile | undefined>();

  useEffect(() => {
    if (!visible) return;

    setTitle(initialData?.title || '');
    setFacilityName((initialData as any)?.facility_name || '');
    setBudget(initialData?.budget?.toString() || '');
    setTargetViews((initialData as any)?.target_views?.toString() || '');
    setFile(undefined);
  }, [visible, initialData]);

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    if (asset.size && asset.size > 50 * 1024 * 1024) {
      Alert.alert('File too large', 'File size must be less than 50MB.');
      return;
    }

    setFile({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType,
      size: asset.size,
    });
  }

  function handleSubmit() {
    if (!title.trim() || !facilityName.trim() || !budget.trim()) {
      Alert.alert('Missing fields', 'Please fill title, facility name, and budget.');
      return;
    }

    onSubmit(
      {
        id: initialData?.id,
        title: title.trim(),
        facility_name: facilityName.trim(),
        budget,
        target_views: targetViews || '0',
      },
      file,
      paymentMethod
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {mode === 'create' ? 'Create New Ad Campaign' : 'Update Ad Campaign'}
          </Text>

          <View style={styles.form}>
            <AppInput label="Campaign Title" value={title} onChangeText={setTitle} />
            <AppInput label="Facility Name" value={facilityName} onChangeText={setFacilityName} />
            <AppInput
              label="Budget (Rs)"
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
            />
            <AppInput
              label="Target Views"
              value={targetViews}
              onChangeText={setTargetViews}
              keyboardType="numeric"
            />

            <Pressable style={styles.uploadBox} onPress={pickFile}>
              <Text style={styles.uploadTitle}>
                {file ? file.name : 'Choose image or video'}
              </Text>
              <Text style={styles.uploadText}>JPG, PNG, MP4, MOV. Max 50MB.</Text>
            </Pressable>

            {mode === 'create' ? (
              <View style={styles.paymentRow}>
                {['esewa', 'khalti'].map((method) => (
                  <Pressable
                    key={method}
                    style={[
                      styles.paymentChip,
                      paymentMethod === method && styles.paymentChipActive,
                    ]}
                    onPress={() => setPaymentMethod(method)}
                  >
                    <Text
                      style={[
                        styles.paymentText,
                        paymentMethod === method && styles.paymentTextActive,
                      ]}
                    >
                      {method}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <View style={styles.actions}>
              <AppButton title="Cancel" variant="secondary" onPress={onClose} style={styles.button} />
              <AppButton
                title={mode === 'create' ? 'Create' : 'Update'}
                onPress={handleSubmit}
                style={styles.button}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  card: {
    maxHeight: '90%',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: '#111827',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  form: {
    marginTop: 18,
    gap: 14,
  },
  uploadBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(96, 165, 250, 0.55)',
    backgroundColor: 'rgba(37, 99, 235, 0.16)',
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  uploadText: {
    marginTop: 4,
    fontSize: 13,
    color: '#d1d5db',
  },
  paymentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
  },
  paymentChipActive: {
    borderColor: 'rgba(96, 165, 250, 0.55)',
    backgroundColor: 'rgba(37, 99, 235, 0.35)',
  },
  paymentText: {
    fontWeight: '800',
    color: '#d1d5db',
    textTransform: 'capitalize',
  },
  paymentTextActive: {
    color: '#ffffff',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
  },
});