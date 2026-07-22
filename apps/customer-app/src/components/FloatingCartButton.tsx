import React, { useEffect } from 'react';
import { StyleSheet, Pressable, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Svg, Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCartStore, selectItemCount } from '../stores/cartStore';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors, Radii, Spacing, Typography } from '@quicky/ui-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function FloatingCartButton() {
  const itemCount = useCartStore(selectItemCount);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const scale = useSharedValue(1);
  const burstScale = useSharedValue(0);
  const burstOpacity = useSharedValue(0);

  // Trigger animation when itemCount changes and is > 0
  useEffect(() => {
    if (itemCount > 0) {
      // Bounce the cart
      scale.value = withSequence(
        withTiming(1.2, { duration: 150 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );

      // Star burst animation
      burstScale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1.5, { duration: 300 }),
        withTiming(1.8, { duration: 200 })
      );
      burstOpacity.value = withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 200 })
      );
    }
  }, [itemCount, scale, burstScale, burstOpacity]);

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const rBurstStyle = useAnimatedStyle(() => ({
    transform: [{ scale: burstScale.value }],
    opacity: burstOpacity.value,
  }));

  if (itemCount === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { bottom: insets.bottom + Spacing.xl }]}>
      <Animated.View style={[styles.burstContainer, rBurstStyle]} pointerEvents="none">
        {/* Simple star burst representation */}
        {[...Array(6)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.sparkle,
              { transform: [{ rotate: `${i * 60}deg` }, { translateY: -25 }] },
            ]}
          />
        ))}
      </Animated.View>

      <Animated.View style={[rStyle]}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => navigation.navigate('Cart')}
        >
          {/* Shopping Cart Icon (SVG) */}
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              fill={Colors.white}
            />
            <Path
              d="M20 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              fill={Colors.white}
            />
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M1 2C0.447715 2 0 2.44772 0 3C0 3.55228 0.447715 4 1 4H2.13886L5.05608 14.5029C5.55395 16.2952 7.18956 17.5 9.06019 17.5H19C19.5523 17.5 20 17.0523 20 16.5C20 15.9477 19.5523 15.5 19 15.5H9.06019C8.12488 15.5 7.30707 14.8976 7.05814 14.0014L6.72477 12.8015H19.7997C21.4391 12.8015 22.8427 11.6033 23.1558 9.99126L23.9558 5.87201C24.3211 3.99026 22.8803 2.25 20.9619 2.25H4.25736L3.92984 1.0711C3.77123 0.499691 3.25048 0.111111 2.65655 0.111111H1V2ZM5.12788 4.25L5.96122 7.25H21.2618L20.4618 11.3692C20.3575 11.9066 19.8896 12.3015 19.3402 12.3015H7.36224L6.52891 9.30148L5.68171 6.25148L5.12788 4.25Z"
              fill={Colors.white}
            />
          </Svg>

          {/* Badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{itemCount}</Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: Spacing.lg,
    zIndex: 999,
  },
  button: {
    backgroundColor: Colors.black,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.freshRed,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  badgeText: {
    color: Colors.white,
    fontSize: Typography.badge.fontSize,
    fontWeight: '800',
  },
  burstContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkle: {
    position: 'absolute',
    width: 4,
    height: 12,
    backgroundColor: Colors.white,
    borderRadius: 2,
  },
});
