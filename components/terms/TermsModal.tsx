import { useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { TERMS_TEXT_JA } from './TermsText';

type TermsModalMode = 'block' | 'view';

type Props = {
  mode?: TermsModalMode;
  onAccept?: () => void;
  onReject?: () => void;
  onClose?: () => void;
};

// 規約表示用の全画面モーダル。block モードでは閉じる手段を提供せず、同意必須。
export function TermsModal({ mode = 'block', onAccept, onReject, onClose }: Props) {
  const [scrolledToEnd, setScrolledToEnd] = useState(false);

  const paragraphs = useMemo(() => TERMS_TEXT_JA.split('\n').filter((line) => line.trim().length > 0), []);

  const handleScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const paddingToBottom = 24;
    const reachedBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    if (reachedBottom) {
      setScrolledToEnd(true);
    }
  };

  const canAccept = mode === 'block' ? scrolledToEnd : false;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={{ flex: 1, padding: 16, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>神アラーム 利用規約</Text>
          {mode === 'view' && (
            <TouchableOpacity onPress={onClose} accessibilityLabel="閉じる" hitSlop={12}>
              <Text style={{ color: '#2563EB', fontWeight: '600' }}>閉じる</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#FFFFFF' }}>
          <ScrollView
            style={{ flex: 1, padding: 16 }}
            contentContainerStyle={{ paddingBottom: 32, gap: 8 }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {paragraphs.map((line, idx) => (
              <Text key={idx} style={{ fontSize: 14, lineHeight: 20, color: '#0F172A' }}>
                {line}
              </Text>
            ))}
          </ScrollView>
        </View>

        {mode === 'block' && (
          <View style={{ gap: 8 }}>
            {!scrolledToEnd && <Text style={{ fontSize: 12, color: '#475569' }}>末尾までスクロールすると同意できます。</Text>}
            <TouchableOpacity
              onPress={() => onAccept?.()}
              disabled={!canAccept}
              style={{
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor: canAccept ? '#2563EB' : '#94A3B8',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>同意して続ける</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (onReject) {
                  onReject();
                } else {
                  Alert.alert('利用規約に同意してください', '同意しない場合は本アプリを利用できません。');
                }
              }}
              style={{ alignItems: 'center', paddingVertical: 6 }}
            >
              <Text style={{ color: '#94A3B8', fontWeight: '600' }}>同意しない</Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === 'view' && (
          <TouchableOpacity
            onPress={onClose}
            style={{ paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#E2E8F0' }}
          >
            <Text style={{ fontWeight: '600', color: '#0F172A' }}>閉じる</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
