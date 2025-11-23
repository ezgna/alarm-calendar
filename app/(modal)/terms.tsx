import { router } from "expo-router";
import { TermsModal } from "@/components/terms/TermsModal";

export default function TermsScreen() {
  return <TermsModal mode="view" onClose={() => router.back()} />;
}
