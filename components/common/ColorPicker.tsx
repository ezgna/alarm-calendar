import { View, TouchableOpacity, Text } from 'react-native';
import { COLOR_IDS, COLOR_LABELS, DEFAULT_COLOR_ID, getColorHex } from './colorVariants';

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
              borderRadius: 6,
              borderWidth: 2,
              borderColor: isActive ? '#a3a3a3' : hex.border,
              backgroundColor: hex.bg,
            }}
          >
            <Text style={{ color: hex.text, fontWeight: '500' }}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
