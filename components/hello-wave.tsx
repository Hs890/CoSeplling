import Animated from 'react-native-reanimated';

// Wave animation component — greet karne ke liye use hota hai
export function HelloWave() {
  return (
    <Animated.Text
      style={{
        fontSize: 28,
        lineHeight: 32,
        marginTop: -6,
        animationName: {
          '0%': { transform: [{ rotate: '0deg' }] },
          '50%': { transform: [{ rotate: '25deg' }] },
          '100%': { transform: [{ rotate: '0deg' }] },
        },
        animationIterationCount: 4,
        animationDuration: '400ms',
      }}>
      👋
    </Animated.Text>
  );
}
