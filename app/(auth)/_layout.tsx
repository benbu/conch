import { useAuthContext } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { ActivityIndicator, Modal, Platform, StyleSheet, Text, View } from 'react-native';

export default function AuthLayout() {
  const { checkingCredentials } = useAuthContext();
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
      <Modal transparent visible={checkingCredentials} animationType="fade" statusBarTranslucent>
        <View style={styles.overlay}>
          <View style={styles.modalBox} accessibilityLabel="checking-credentials-modal">
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.modalText}>Checking credentials...</Text>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  modalText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
});

