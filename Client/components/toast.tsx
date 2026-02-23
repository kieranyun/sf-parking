import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

interface ToastProps {
  message: string;        // what to display
  visible: boolean;       // parent controls when to show it
  duration?: number;      // how long it stays visible (ms), default 2500
  onDismiss: () => void;  // callback when it's done — parent resets `visible`
}

export default function Toast({ message, visible, duration = 2500, onDismiss }: ToastProps) {
  // useRef creates a mutable value that persists across renders
  // WITHOUT triggering re-renders when it changes.
  // Animated.Value needs this because it manages its own
  // animation state internally — if it were regular state,
  // every frame of the animation would cause a re-render.
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Sequence: fade in → pause → fade out → tell parent we're done
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(duration),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss(); // runs after the full sequence completes
      });
    }
  }, [visible]);  // re-run this effect whenever `visible` changes

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  text: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
});
