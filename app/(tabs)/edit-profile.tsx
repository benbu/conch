/**
 * Edit Profile Screen
 * Allow users to edit their profile information
 */

import { useAuth } from '@/hooks/useAuth';
import { auth, db } from '@/lib/firebase';
import { uploadProfileImage } from '@/services/imageService';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useHeaderHeight } from '@react-navigation/elements';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoURL(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }

    setLoading(true);

    try {
      // If photoURL is a local file URI, upload to Storage first
      let finalPhotoUrl: string | null = photoURL || null;
      const isLocal = typeof photoURL === 'string' && (photoURL.startsWith('file:') || photoURL.startsWith('content:'));
      if (isLocal) {
        finalPhotoUrl = await uploadProfileImage(user.id, photoURL);
      }

      // Update Firebase Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim(),
          photoURL: finalPhotoUrl,
        });
      }

      // Update Firestore user document (source of truth for app)
      await updateDoc(doc(db, 'users', user.id), {
        displayName: displayName.trim(),
        photoURL: finalPhotoUrl,
        bio: bio.trim(),
        updatedAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerBackTitle: '',
          title: 'Edit Profile',
        }}
      />
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: tabBarHeight }]}>
          <View style={styles.photoSection}>
            <TouchableOpacity onPress={handlePickImage} style={styles.photoButton}>
              {photoURL ? (
                <Image source={{ uri: photoURL }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>
                    {displayName.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              <View style={styles.photoOverlay}>
                <Text style={styles.photoOverlayText}>Change Photo</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Display Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your name"
              maxLength={50}
              autoCapitalize="words"
            />
          </View>

          {/* Email (Read-only) */}
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputReadonly]}
              value={user?.email || ''}
              editable={false}
            />
            <Text style={styles.hint}>Email cannot be changed</Text>
          </View>

          {/* Bio */}
          <View style={styles.field}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              maxLength={200}
              multiline
              numberOfLines={4}
            />
            <Text style={styles.characterCount}>{bio.length}/200</Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  photoButton: {
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    fontSize: 48,
    color: '#fff',
    fontWeight: '600',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    paddingVertical: 8,
  },
  photoOverlayText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputReadonly: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

