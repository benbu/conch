import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function AuthLayout() {
  return (
    <LinearGradient
      colors={[ 'rgb(100, 38, 201)', 'rgb(170, 228, 238)' ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'fade',
        animationTypeForReplace: Platform.OS === 'ios' ? 'push' : undefined,
      }}>
        <Stack.Screen
          name="login"
          options={Platform.OS === 'ios' ? { animation: 'slide_from_left', animationTypeForReplace: 'pop' } : {}}
        />
        <Stack.Screen
          name="signup"
          options={Platform.OS === 'ios' ? { animation: 'slide_from_right', animationTypeForReplace: 'pop' } : {}}
        />
      </Stack>
    </LinearGradient>
  );
}

