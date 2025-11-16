import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

const TIMING_CONFIG = { duration: 180, easing: Easing.out(Easing.cubic) };

const clamp = (value: number, min: number, max: number) => {
  "worklet";
  return Math.min(Math.max(value, min), max);
};

type Props = PropsWithChildren<{
  visible: boolean;
  onRequestClose: () => void;
  onClosed?: () => void;
  topOffsetRatio?: number; // 0-1: シート上端の割合（0.25 -> 上から25%）
}>;

export default function BottomSheet({ visible, children, onRequestClose, onClosed, topOffsetRatio = 0.6 }: Props) {
  const { height } = useWindowDimensions();
  const hiddenPosition = useMemo(() => height + 60, [height]);
  const openPosition = useMemo(() => Math.min(height * topOffsetRatio, height - 160), [height, topOffsetRatio]);
  const translateY = useSharedValue(hiddenPosition);
  const dragStart = useSharedValue(0);
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);

  const handleHidden = useCallback(() => {
    setMounted(false);
    onClosed?.();
  }, [onClosed]);

  useEffect(() => {
    if (!mounted) return;
    if (visible) {
      translateY.value = withTiming(openPosition, TIMING_CONFIG);
    } else {
      translateY.value = withTiming(hiddenPosition, TIMING_CONFIG, () => {
        runOnJS(handleHidden)();
      });
    }
  }, [visible, mounted, hiddenPosition, openPosition, translateY, handleHidden]);


  const animatedStyle = useAnimatedStyle(() => ({
    top: translateY.value,
  }));

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(() => {
          dragStart.value = translateY.value;
        })
        .onUpdate((event) => {
          translateY.value = clamp(dragStart.value + event.translationY, openPosition, hiddenPosition);
        })
        .onEnd((event) => {
          const shouldClose = translateY.value > openPosition + 80 || event.velocityY > 900;
          if (shouldClose) {
            onRequestClose();
          } else {
            translateY.value = withTiming(openPosition, TIMING_CONFIG);
          }
        }),
    [dragStart, translateY, openPosition, hiddenPosition, onRequestClose]
  );

  if (!mounted) return null;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.sheet, animatedStyle]}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    overflow: "hidden",
  },
});
