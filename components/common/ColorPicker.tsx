import { View, TouchableOpacity, Text } from 'react-native';
import { COLOR_IDS, COLOR_LABELS, DEFAULT_COLOR_ID, getColorHex } from './colorVariants';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  value: string;
  onChange: (id: string) => void;
};

export default function ColorPicker({ value, onChange }: Props) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {COLOR_IDS.map((id) => {
        const hex = getColorHex(id);
        const label = COLOR_LABELS[id];
        const isActive = value === id || (!value && id === DEFAULT_COLOR_ID);
        return (
          <TouchableOpacity
            key={id}
            onPress={() => onChange(id)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
              backgroundColor: hex.bg,
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
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
