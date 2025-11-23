import { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { TermsModal } from './TermsModal';
import { TERMS_VERSION, useTermsStore } from '@/features/terms/store';

type Props = {
  children: ReactNode;
};

// 規約同意の有無でアプリ全体をゲートする。
export function TermsGate({ children }: Props) {
  const hydrated = useTermsStore((s) => s.hydrated);
  const accepted = useTermsStore((s) => s.hasAccepted(TERMS_VERSION));

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!accepted) {
    return <TermsModal mode="block" onAccept={() => useTermsStore.getState().accept(TERMS_VERSION)} />;
  }

  return <>{children}</>;
}
