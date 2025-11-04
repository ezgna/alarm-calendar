import { View, TouchableOpacity, Text } from 'react-native';
import { COLORS, COLOR_BY_ID } from '../../features/events/colors';

type Props = {
  value: string;
  onChange: (id: string) => void;
};

export default function ColorPicker({ value, onChange }: Props) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {COLORS.map((c) => (
        <TouchableOpacity
          key={c.id}
          className={`px-3 py-2 rounded-md border ${c.classes.bg} ${c.classes.text} ${c.classes.border ?? ''} ${
            value === c.id ? 'ring-2 ring-offset-2 ring-neutral-400' : ''
          }`}
          onPress={() => onChange(c.id)}
        >
          <Text className="font-medium">{c.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

