import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Text,
  Avatar,
  Card,
  List,
  Switch,
  Divider,
  Button,
  IconButton,
  useTheme,
  Portal,
  Modal,
  TextInput,
} from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { themeConstants } from '../../utils/theme';
import { User, UserRole } from '../../types';

const { width } = Dimensions.get('window');

const ProfileScreen: React.FC = () => {
  const theme = useTheme();
  const { user, biometricEnabled, enableBiometricAuth } = useAuth();
  const dispatch = useDispatch();
  
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isBiometricModalVisible, setIsBiometricModalVisible] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state for editing profile
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await dispatch(logout() as any);
      setIsLogoutModalVisible(false);
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricToggle = async () => {
    try {
      setIsLoading(true);
      await enableBiometricAuth();
      setIsBiometricModalVisible(false);
    } catch (error) {
      console.error('Biometric toggle error:', error);
      Alert.alert('Error', 'Failed to update biometric settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement profile update API call
      console.log('Saving profile:', editForm);
      setIsEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleDisplayName = (role: UserRole): string => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrator';
      case UserRole.SUPER_ADMIN:
        return 'Super Administrator';
      case UserRole.WORKER:
      default:
        return 'Worker';
    }
  };

  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case UserRole.ADMIN:
        return themeConstants.colors.secondary['500'];
      case UserRole.SUPER_ADMIN:
        return themeConstants.colors.accent['500'];
      case UserRole.WORKER:
      default:
        return themeConstants.colors.primary['500'];
    }
  };

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineMedium">Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.avatarContainer}>
            <Avatar.Image
              size={80}
              source={
                user.profilePicture
                  ? { uri: user.profilePicture }
                  : require('../../../assets/icon.png')
              }
              style={styles.avatar}
            />
            <TouchableOpacity
              style={[styles.editAvatarButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setIsEditModalVisible(true)}
              accessible={true}
              accessibilityLabel="Edit profile picture"
              accessibilityRole="button"
            >
              <Text style={[styles.editAvatarText, { color: theme.colors.onPrimary }]}>
                Edit
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.userInfo}>
            <Text variant="headlineSmall" style={[styles.userName, { color: theme.colors.onBackground }]}>
              {user.firstName} {user.lastName}
            </Text>
            <Text variant="bodyMedium" style={[styles.userEmail, { color: theme.colors.onSurfaceVariant }]}>
              {user.email}
            </Text>
            <View style={styles.roleContainer}>
              <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
                <Text style={[styles.roleText, { color: theme.colors.onPrimary }]}>
                  {getRoleDisplayName(user.role)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Profile Information Card */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                Profile Information
              </Text>
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => setIsEditModalVisible(true)}
                accessible={true}
                accessibilityLabel="Edit profile information"
              />
            </View>
            
            <List.Item
              title="Full Name"
              description={`${user.firstName} ${user.lastName}`}
              left={(props) => <List.Icon {...props} icon="account" />}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
            
            <Divider />
            
            <List.Item
              title="Email"
              description={user.email}
              left={(props) => <List.Icon {...props} icon="email" />}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
            
            <Divider />
            
            <List.Item
              title="Phone"
              description={user.phone || 'Not provided'}
              left={(props) => <List.Icon {...props} icon="phone" />}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
            
            <Divider />
            
            <List.Item
              title="Member Since"
              description={formatDate(user.createdAt)}
              left={(props) => <List.Icon {...props} icon="calendar" />}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
            
            {user.lastLoginAt && (
              <>
                <Divider />
                <List.Item
                  title="Last Login"
                  description={formatDate(user.lastLoginAt)}
                  left={(props) => <List.Icon {...props} icon="clock" />}
                  titleStyle={{ color: theme.colors.onSurface }}
                  descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                />
              </>
            )}
          </Card.Content>
        </Card>

        {/* Security Settings Card */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Security & Privacy
            </Text>
            
            <List.Item
              title="Biometric Authentication"
              description="Use fingerprint or face ID to sign in"
              left={(props) => <List.Icon {...props} icon="fingerprint" />}
              right={() => (
                <Switch
                  value={biometricEnabled}
                  onValueChange={() => setIsBiometricModalVisible(true)}
                  accessible={true}
                  accessibilityLabel="Toggle biometric authentication"
                />
              )}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
            
            <Divider />
            
            <List.Item
              title="Change Password"
              description="Update your account password"
              left={(props) => <List.Icon {...props} icon="lock" />}
              onPress={() => Alert.alert('Coming Soon', 'Password change feature will be available soon.')}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
            
            <Divider />
            
            <List.Item
              title="Two-Factor Authentication"
              description="Add an extra layer of security"
              left={(props) => <List.Icon {...props} icon="shield" />}
              onPress={() => Alert.alert('Coming Soon', 'Two-factor authentication will be available soon.')}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
          </Card.Content>
        </Card>

        {/* Notification Settings Card */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Notifications
            </Text>
            
            <List.Item
              title="Push Notifications"
              description="Receive notifications on your device"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={user.notificationSettings?.pushEnabled ?? true}
                  onValueChange={() => Alert.alert('Coming Soon', 'Notification settings will be available soon.')}
                  accessible={true}
                  accessibilityLabel="Toggle push notifications"
                />
              )}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
            
            <Divider />
            
            <List.Item
              title="Email Notifications"
              description="Receive notifications via email"
              left={(props) => <List.Icon {...props} icon="email-outline" />}
              right={() => (
                <Switch
                  value={user.notificationSettings?.emailEnabled ?? true}
                  onValueChange={() => Alert.alert('Coming Soon', 'Email notification settings will be available soon.')}
                  accessible={true}
                  accessibilityLabel="Toggle email notifications"
                />
              )}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
          </Card.Content>
        </Card>

        {/* Account Actions Card */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Account Actions
            </Text>
            
            <List.Item
              title="Help & Support"
              description="Get help with your account"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              onPress={() => Alert.alert('Coming Soon', 'Help and support will be available soon.')}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
            
            <Divider />
            
            <List.Item
              title="Privacy Policy"
              description="Read our privacy policy"
              left={(props) => <List.Icon {...props} icon="file-document" />}
              onPress={() => Alert.alert('Coming Soon', 'Privacy policy will be available soon.')}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
            
            <Divider />
            
            <List.Item
              title="Terms of Service"
              description="Read our terms of service"
              left={(props) => <List.Icon {...props} icon="file-document-outline" />}
              onPress={() => Alert.alert('Coming Soon', 'Terms of service will be available soon.')}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
            
            <Divider />
            
            <List.Item
              title="Sign Out"
              description="Sign out of your account"
              left={(props) => <List.Icon {...props} icon="logout" color={themeConstants.colors.error['500']} />}
              onPress={() => setIsLogoutModalVisible(true)}
              titleStyle={{ color: themeConstants.colors.error['500'] }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
          </Card.Content>
        </Card>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text variant="bodySmall" style={[styles.versionText, { color: theme.colors.onSurfaceVariant }]}>
            GaterLink v0.0.1
          </Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Portal>
        <Modal
          visible={isEditModalVisible}
          onDismiss={() => setIsEditModalVisible(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            Edit Profile
          </Text>
          
          <TextInput
            label="First Name"
            value={editForm.firstName}
            onChangeText={(text) => setEditForm({ ...editForm, firstName: text })}
            mode="outlined"
            style={styles.input}
            accessible={true}
            accessibilityLabel="First name input"
          />
          
          <TextInput
            label="Last Name"
            value={editForm.lastName}
            onChangeText={(text) => setEditForm({ ...editForm, lastName: text })}
            mode="outlined"
            style={styles.input}
            accessible={true}
            accessibilityLabel="Last name input"
          />
          
          <TextInput
            label="Phone Number"
            value={editForm.phone}
            onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
            accessible={true}
            accessibilityLabel="Phone number input"
          />
          
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setIsEditModalVisible(false)}
              style={styles.modalButton}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveProfile}
              style={styles.modalButton}
              loading={isLoading}
              disabled={isLoading}
            >
              Save
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Biometric Modal */}
      <Portal>
        <Modal
          visible={isBiometricModalVisible}
          onDismiss={() => setIsBiometricModalVisible(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            Biometric Authentication
          </Text>
          
          <Text variant="bodyMedium" style={[styles.modalDescription, { color: theme.colors.onSurfaceVariant }]}>
            {biometricEnabled 
              ? 'Are you sure you want to disable biometric authentication?'
              : 'Enable biometric authentication to sign in quickly and securely using your fingerprint or face ID.'
            }
          </Text>
          
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setIsBiometricModalVisible(false)}
              style={styles.modalButton}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleBiometricToggle}
              style={styles.modalButton}
              loading={isLoading}
              disabled={isLoading}
            >
              {biometricEnabled ? 'Disable' : 'Enable'}
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Logout Confirmation Modal */}
      <Portal>
        <Modal
          visible={isLogoutModalVisible}
          onDismiss={() => setIsLogoutModalVisible(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            Sign Out
          </Text>
          
          <Text variant="bodyMedium" style={[styles.modalDescription, { color: theme.colors.onSurfaceVariant }]}>
            Are you sure you want to sign out of your account?
          </Text>
          
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setIsLogoutModalVisible(false)}
              style={styles.modalButton}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleLogout}
              style={[styles.modalButton, { backgroundColor: themeConstants.colors.error['500'] }]}
              loading={isLoading}
              disabled={isLoading}
            >
              Sign Out
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: themeConstants.spacing.xl,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: themeConstants.spacing.xl,
    paddingHorizontal: themeConstants.spacing.md,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: themeConstants.spacing.md,
  },
  avatar: {
    marginBottom: themeConstants.spacing.sm,
  },
  editAvatarButton: {
    paddingHorizontal: themeConstants.spacing.md,
    paddingVertical: themeConstants.spacing.xs,
    borderRadius: themeConstants.borderRadius.md,
  },
  editAvatarText: {
    fontSize: themeConstants.typography.fontSize.sm,
    fontWeight: '500' as const,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontWeight: '700' as const,
    marginBottom: themeConstants.spacing.xs,
  },
  userEmail: {
    marginBottom: themeConstants.spacing.sm,
  },
  roleContainer: {
    marginTop: themeConstants.spacing.xs,
  },
  roleBadge: {
    paddingHorizontal: themeConstants.spacing.md,
    paddingVertical: themeConstants.spacing.xs,
    borderRadius: themeConstants.borderRadius.full,
  },
  roleText: {
    fontSize: themeConstants.typography.fontSize.sm,
    fontWeight: '500' as const,
  },
  card: {
    marginHorizontal: themeConstants.spacing.md,
    marginBottom: themeConstants.spacing.md,
    borderRadius: themeConstants.borderRadius.lg,
    ...themeConstants.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: themeConstants.spacing.sm,
  },
  cardTitle: {
    fontWeight: '600' as const,
    marginBottom: themeConstants.spacing.sm,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: themeConstants.spacing.lg,
  },
  versionText: {
    textAlign: 'center',
  },
  modalContainer: {
    margin: themeConstants.spacing.lg,
    padding: themeConstants.spacing.lg,
    borderRadius: themeConstants.borderRadius.lg,
    ...themeConstants.shadows.lg,
  },
  modalTitle: {
    fontWeight: '700' as const,
    marginBottom: themeConstants.spacing.md,
    textAlign: 'center',
  },
  modalDescription: {
    marginBottom: themeConstants.spacing.lg,
    textAlign: 'center',
    lineHeight: themeConstants.typography.lineHeight.normal,
  },
  input: {
    marginBottom: themeConstants.spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: themeConstants.spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});

export default ProfileScreen;
