import { useMemo } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { PRIVACY_TEXT_JA } from './PrivacyText';

type Props = {
  onClose?: () => void;
};

// アプリ内でプライバシーポリシー全文を表示するモーダル
export function PrivacyModal({ onClose }: Props) {
  const paragraphs = useMemo(() => PRIVACY_TEXT_JA.split('\n').filter((line) => line.trim().length > 0), []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={{ flex: 1, padding: 16, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>プライバシーポリシー</Text>
        </View>

        <View style={{ flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#FFFFFF' }}>
          <ScrollView
            style={{ flex: 1, padding: 16 }}
            contentContainerStyle={{ paddingBottom: 32, gap: 8 }}
          >
            {paragraphs.map((line, idx) => (
              <Text key={idx} style={{ fontSize: 14, lineHeight: 20, color: '#0F172A' }}>
                {line}
              </Text>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          onPress={onClose}
          style={{ paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#E2E8F0' }}
        >
          <Text style={{ fontWeight: '600', color: '#0F172A' }}>閉じる</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
