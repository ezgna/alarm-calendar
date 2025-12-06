import { DrawerContentScrollView, DrawerItem, DrawerItemList } from "@react-navigation/drawer";
import { router } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { Alert, Linking, Platform } from "react-native";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import { useSubscriptionStore } from "../../features/subscription/store";

const showTodayInDrawer = false; // ドロワーで今日を一時的に非表示。復活時は true。

function CustomDrawerContent(props: any) {
  const isAndroid = Platform.OS === "android"; // Androidではプレミアム項目を非表示
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const isSubscriptionDisabled = isAndroid;
  const showPremiumEntry = !isSubscriptionDisabled && !isPremium;
  const policyUrl = "https://sites.google.com/view/dotakyanbancho/%E3%83%97%E3%83%A9%E3%82%A4%E3%83%90%E3%82%B7%E3%83%BC%E3%83%9D%E3%83%AA%E3%82%B7%E3%83%BC";
  return (
    <DrawerContentScrollView {...props}>
      {/* 既定のリスト（ただし day は非表示にしてある） */}
      <DrawerItemList {...props} />
      {/* 日（今日）へ移動するカスタム項目。params の残存を避けるため replace を使用 */}
      {showTodayInDrawer && (
        <DrawerItem
          label="今日"
          onPress={() => {
            props.navigation.closeDrawer();
            router.replace("/(drawer)/day");
          }}
        />
      )}
      {showPremiumEntry && (
        <DrawerItem
          label="プレミアム"
          onPress={async () => {
            try {
              props.navigation.closeDrawer();
              const result = await RevenueCatUI.presentPaywallIfNeeded({ requiredEntitlementIdentifier: "premium" });
              const ok = result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED || result === PAYWALL_RESULT.NOT_PRESENTED;
              await useSubscriptionStore.getState().refreshFromPurchases();
              return ok;
            } catch (e) {
              console.warn(e);
              try {
                await useSubscriptionStore.getState().refreshFromPurchases();
              } catch {}
            }
          }}
        />
      )}
      <DrawerItem
        label="設定"
        onPress={() => {
          props.navigation.closeDrawer();
          router.push("/(modal)/settings");
        }}
      />
      <DrawerItem
        label="FAQ"
        onPress={() => {
          props.navigation.closeDrawer();
          router.push("/(modal)/faq");
        }}
      />
      <DrawerItem
        label="ポリシー"
        onPress={async () => {
          props.navigation.closeDrawer();
          Alert.alert("外部リンクを開きます", "ブラウザでプライバシーポリシーを開きますか？", [
            { text: "キャンセル", style: "cancel" },
            {
              text: "開く",
              style: "default",
              onPress: async () => {
                await Linking.openURL(policyUrl);
              },
            },
          ]);
        }}
      />
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        drawerStyle: { width: 200 },
        swipeEnabled: false,
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="index" options={{ drawerItemStyle: { display: "none" } }} />
      <Drawer.Screen name="month" options={{ drawerLabel: "カレンダー", title: "カレンダー" }} />
      <Drawer.Screen name="week" options={{ drawerLabel: "週間ビュー", title: "週間ビュー", drawerItemStyle: { display: "none" } }} />

      {/* DrawerItemList 側では非表示。ドロワーに戻す場合は showTodayInDrawer を true にしてカスタム項目を復活させる */}
      <Drawer.Screen name="day" options={{ drawerLabel: "今日", title: "今日", drawerItemStyle: { display: "none" } }} />
    </Drawer>
  );
}
