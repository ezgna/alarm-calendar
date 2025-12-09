import { ReactNode } from "react";
import { ActivityIndicator, Platform, Text, TouchableOpacity, View } from "react-native";
import { useSubscriptionStore } from "@/features/subscription/store";
import { requirePremium } from "@/features/subscription/paywall";
import { useThemeTokens } from "@/features/theme/useTheme";

type Props = {
  children: ReactNode;
};

// 利用規約同意後に、Premium 購読が有効になるまでアプリ本体へのアクセスをブロックするゲート
export function SubscriptionGate({ children }: Props) {
  const { t } = useThemeTokens();
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const busy = useSubscriptionStore((s) => s.busy);

  // iOS 以外ではゲートしない（Android は現状課金非対応のため）
  if (Platform.OS !== "ios") {
    return <>{children}</>;
  }

  // Premium 有効なら通常どおりレンダリング
  if (isPremium) {
    return <>{children}</>;
  }

  const handleOpenPaywall = async () => {
    await requirePremium();
  };

  return (
    <View className={`flex-1 items-center justify-center px-6 ${t.appBg}`}>
      <View className="w-full max-w-md items-center gap-4">
        <Text className={`text-xl font-semibold text-center ${t.text}`}>プレミアム登録のお願い</Text>
        <Text className={`text-sm text-center ${t.textMuted}`}>
          神アラームのご利用には、『30日間の無料お試しの登録』（サブスク登録）が必要です。登録が完了するまで、アプリ本体の機能は利用できません。
        </Text>
        <Text className="text-lg font-bold text-center text-red-600">
          いつでも解約可能です。
          {"\n"}
          30日以内にサブスクを解約すれば
          {"\n"}
          料金は一切発生致しません。
        </Text>
        {busy && (
          <View className="items-center gap-2 mt-2">
            <ActivityIndicator size="small" color="#2563EB" />
            <Text className={`text-xs ${t.textMuted}`}>購入状況を確認しています…</Text>
          </View>
        )}
        <View className="w-full mt-4">
          <TouchableOpacity onPress={handleOpenPaywall} disabled={busy} className={`px-4 py-3 rounded-full items-center ${t.buttonPrimaryBg}`}>
            <Text className={`text-sm font-semibold ${t.buttonPrimaryText}`}>プレミアム登録する</Text>
          </TouchableOpacity>
        </View>
        <Text className={`mt-4 text-[11px] text-center ${t.textMuted}`}>
          神アラームを解約しなければ31日後から月額330円（税込）が課金されます。 料金や解約方法の詳細は、App Store のサブスクリプション管理画面をご確認ください。
        </Text>
      </View>
    </View>
  );
}
