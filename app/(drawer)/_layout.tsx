import { Drawer } from "expo-router/drawer";
import { router } from "expo-router";
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from "@react-navigation/drawer";

function CustomDrawerContent(props: any) {
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
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
      <Drawer.Screen name="month" options={{ drawerLabel: "月" }} />
      <Drawer.Screen name="week" options={{ drawerLabel: "週" }} />
      <Drawer.Screen name="day" options={{ drawerLabel: "日" }} />
    </Drawer>
  );
}
