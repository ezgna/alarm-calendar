import { Drawer } from "expo-router/drawer";
import "../global.css";

export default function RootLayout() {
  return (
    <Drawer>
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: "Home",
          title: "overview",
        }}
      />
      <Drawer.Screen
        name="example"
        options={{
          drawerLabel: "User",
          title: "overview",
        }}
      />
    </Drawer>
  );
}
