import { router } from "expo-router";
import { PrivacyModal } from "@/components/terms/PrivacyModal";

// プライバシーポリシー閲覧用モーダル画面
export default function PrivacyScreen() {
  return <PrivacyModal onClose={() => router.back()} />;
}

