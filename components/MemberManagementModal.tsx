import { User } from '@/types';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Avatar from './Avatar';
import { AvatarWithPresence } from './PresenceIndicator';

interface MemberWithRole extends User {
  role: 'admin' | 'team' | 'user';
}

interface MemberManagementModalProps {
  visible: boolean;
  onClose: () => void;
  members: MemberWithRole[];
  currentUserId: string;
  onAddMembers: () => void;
  onUpdateRole: (userId: string, newRole: 'admin' | 'team' | 'user') => Promise<void>;
  onLeaveGroup: () => void;
  onRemoveMember?: (userId: string) => Promise<void>;
}

export default function MemberManagementModal({
  visible,
  onClose,
  members,
  currentUserId,
  onAddMembers,
  onUpdateRole,
  onLeaveGroup,
  onRemoveMember,
}: MemberManagementModalProps) {
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Get current user's role
  const currentUserRole = members.find((m) => m.id === currentUserId)?.role;
  const canAddMembers = currentUserRole === 'admin' || currentUserRole === 'team';
  const canManageRoles = currentUserRole === 'admin';

  // Check if current user is the last admin
  const adminCount = members.filter((m) => m.role === 'admin').length;
  const isLastAdmin = currentUserRole === 'admin' && adminCount === 1;

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'team' | 'user') => {
    setUpdatingUserId(userId);
    try {
      await onUpdateRole(userId, newRole);
    } catch (error) {
      Alert.alert('Error', 'Failed to update role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!onRemoveMember) return;

    Alert.alert(
      'Remove Member',
      `Remove ${userName} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setUpdatingUserId(userId);
            try {
              await onRemoveMember(userId);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove member');
            } finally {
              setUpdatingUserId(null);
            }
          },
        },
      ]
    );
  };

  const handleLeave = () => {
    if (isLastAdmin) {
      Alert.alert(
        'Cannot Leave',
        'You are the last admin. Please promote another member to admin before leaving.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: onLeaveGroup,
        },
      ]
    );
  };

  const renderRoleBadge = (role: 'admin' | 'team' | 'user') => {
    const roleColors = {
      admin: '#FF3B30',
      team: '#FF9500',
      user: '#34C759',
    };

    const roleLabels = {
      admin: 'Admin',
      team: 'Team',
      user: 'User',
    };

    return (
      <View style={[styles.roleBadge, { backgroundColor: roleColors[role] }]}>
        <Text style={styles.roleBadgeText}>{roleLabels[role]}</Text>
      </View>
    );
  };

  const renderMember = ({ item }: { item: MemberWithRole }) => {
    const isCurrentUser = item.id === currentUserId;
    const isUpdating = updatingUserId === item.id;

    return (
      <View style={styles.memberItem}>
        <View style={styles.memberInfo}>
          <AvatarWithPresence user={item} size={45}>
            <Avatar user={item} size={45} />
          </AvatarWithPresence>
          <View style={styles.memberDetails}>
            <Text style={styles.memberName}>
              {item.displayName}
              {isCurrentUser && <Text style={styles.youText}> (You)</Text>}
            </Text>
            <Text style={styles.memberEmail}>{item.email}</Text>
          </View>
        </View>

        <View style={styles.memberActions}>
          {isUpdating ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : canManageRoles && !isCurrentUser ? (
            <View style={styles.roleSelector}>
              {renderRoleBadge(item.role)}
              <TouchableOpacity
                style={styles.changeRoleButton}
                onPress={() => {
                  Alert.alert(
                    'Change Role',
                    `Change role for ${item.displayName}`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Admin',
                        onPress: () => handleRoleChange(item.id, 'admin'),
                      },
                      {
                        text: 'Team',
                        onPress: () => handleRoleChange(item.id, 'team'),
                      },
                      {
                        text: 'User',
                        onPress: () => handleRoleChange(item.id, 'user'),
                      },
                    ]
                  );
                }}
              >
                <Text style={styles.changeRoleText}>Change</Text>
              </TouchableOpacity>
              {onRemoveMember && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveMember(item.id, item.displayName)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            renderRoleBadge(item.role)
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Done</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Members</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.memberCount}>
          <Text style={styles.memberCountText}>
            {members.length} member{members.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {canAddMembers && (
          <TouchableOpacity style={styles.addButton} onPress={onAddMembers}>
            <Text style={styles.addButtonIcon}>+</Text>
            <Text style={styles.addButtonText}>Add Members</Text>
          </TouchableOpacity>
        )}

        <FlatList
          data={members}
          renderItem={renderMember}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.memberList}
        />

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.leaveButton, isLastAdmin && styles.leaveButtonDisabled]}
            onPress={handleLeave}
          >
            <Text style={styles.leaveButtonText}>Leave Group</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    paddingVertical: 8,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 60,
  },
  memberCount: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f8f8',
  },
  memberCountText: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  addButtonIcon: {
    fontSize: 24,
    color: '#007AFF',
    marginRight: 12,
    fontWeight: '600',
  },
  addButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  memberList: {
    paddingBottom: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  youText: {
    color: '#666',
    fontWeight: '400',
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  changeRoleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  changeRoleText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFE5E5',
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  leaveButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  leaveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  leaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

