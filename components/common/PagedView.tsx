import React, { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';

type Props = PropsWithChildren<{
  onPage?: (delta: -1 | 1) => void;
}>;

// 簡易版: コンテンツをそのまま表示し、スワイプ閾値で onPage を発火
export default function PagedView({ children, onPage }: Props) {
  const translateX = useSharedValue(0);

  const pan = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onChange((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      const threshold = 80;
      const dx = e.translationX;
      if (dx <= -threshold && onPage) runOnJS(onPage)(1);
      else if (dx >= threshold && onPage) runOnJS(onPage)(-1);
      translateX.value = 0;
    });

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: withTiming(translateX.value, { duration: 100 }) }] }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={style} className="flex-1">
        <View className="flex-1">{children}</View>
      </Animated.View>
    </GestureDetector>
  );
}

