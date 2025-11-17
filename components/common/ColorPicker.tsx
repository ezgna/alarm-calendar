import { View, TouchableOpacity, Text } from 'react-native';
import { COLOR_IDS, COLOR_LABELS, DEFAULT_COLOR_ID, getColorHex, type ColorId } from './colorVariants';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStore } from '@/features/subscription/store';
import { requirePremium } from '@/features/subscription/paywall';

type Props = {
  value: string;
  onChange: (id: string) => void;
};

export default function ColorPicker({ value, onChange }: Props) {
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const freePalette: ColorId[] = ['green', 'pink'];
  const orderedColorIds: ColorId[] = [...freePalette, ...COLOR_IDS.filter((id) => !freePalette.includes(id))];
  const premiumUnlockedColors = new Set(isPremium ? orderedColorIds : freePalette);

  const handlePress = async (id: string, locked: boolean) => {
    if (!locked) {
      onChange(id);
      return;
    }
    const ok = await requirePremium();
    if (ok) {
      onChange(id);
    }
  };

  return (
    <View className="flex-row flex-wrap gap-2">
      {orderedColorIds.map((id) => {
        const hex = getColorHex(id);
        const label = COLOR_LABELS[id];
        const isActive = value === id || (!value && id === DEFAULT_COLOR_ID);
        const isLocked = !premiumUnlockedColors.has(id);
        return (
          <TouchableOpacity
            key={id}
            onPress={() => handlePress(id, isLocked)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
              backgroundColor: hex.bg,
              opacity: isLocked ? 0.5 : 1,
              transform: [{ scale: isActive ? 1.05 : 1 }],
              shadowColor: isActive ? '#000' : 'transparent',
              shadowOpacity: isActive ? 0.2 : 0,
              shadowRadius: isActive ? 4 : 0,
              shadowOffset: isActive ? { width: 0, height: 2 } : { width: 0, height: 0 },
              elevation: isActive ? 3 : 0,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {isActive ? <Ionicons name="checkmark" size={14} color={hex.text} /> : null}
              <Text style={{ color: hex.text, fontWeight: isActive ? '700' : '500', marginLeft: isActive ? 6 : 0 }}>{label}</Text>
              {isLocked ? <Ionicons name="lock-closed" size={12} color={hex.text} style={{ marginLeft: 6 }} /> : null}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
