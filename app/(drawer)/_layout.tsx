import { DrawerContentScrollView, DrawerItem, DrawerItemList } from "@react-navigation/drawer";
import { router } from "expo-router";
import { Drawer } from "expo-router/drawer";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import { useSubscriptionStore } from "../../features/subscription/store";

function CustomDrawerContent(props: any) {
  return (
    <DrawerContentScrollView {...props}>
      {/* 既定のリスト（ただし day は非表示にしてある） */}
      <DrawerItemList {...props} />
      {/* 日（今日）へ移動するカスタム項目。params の残存を避けるため replace を使用 */}
      <DrawerItem
        label="今日"
        onPress={() => {
          props.navigation.closeDrawer();
          router.replace("/(drawer)/day");
        }}
      />
      {/* プレミアム（RevenueCat UI のペイウォールを直接表示） */}
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
            console.warn(e)
            try {
              await useSubscriptionStore.getState().refreshFromPurchases();
            } catch {}
          }
        }}
      />
      <DrawerItem
        label="設定"
        onPress={() => {
          props.navigation.closeDrawer();
          router.push("/(modal)/settings");
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
      <Drawer.Screen name="month" options={{ drawerLabel: "月カレンダー", title: "月カレンダー" }} />
      <Drawer.Screen name="week" options={{ drawerLabel: "週間ビュー", title: "週間ビュー" }} />
      {/* DrawerItemList 側では非表示にし、上のカスタム項目から遷移させる */}
      <Drawer.Screen name="day" options={{ drawerLabel: "今日", title: "今日", drawerItemStyle: { display: "none" } }} />
    </Drawer>
  );
}
