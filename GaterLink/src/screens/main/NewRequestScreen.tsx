import React, { useState } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  useTheme,
  HelperText,
  Card,
  RadioButton,
  Chip,
  Divider,
  IconButton,
  Surface,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootState, AppDispatch } from '../../store';
import { addRequest } from '../../store/slices/requestsSlice';
import DatabaseService from '../../services/database.service';
import ApiService from '../../services/api.service';
import LoggingService from '../../services/logging.service';
import { globalStyles } from '../../styles/global';
import { 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES, 
  REQUEST_CATEGORY, 
  REQUEST_PRIORITY,
  REQUEST_STATUS,
  REGEX_PATTERNS,
} from '../../constants';
import { AccessRequest } from '../../types';

interface FormData {
  name: string;
  phone: string;
  reason: string;
  category: typeof REQUEST_CATEGORY[keyof typeof REQUEST_CATEGORY];
  priority: typeof REQUEST_PRIORITY[keyof typeof REQUEST_PRIORITY];
  doorId?: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  reason?: string;
}

const NewRequestScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  
  const user = useSelector((state: RootState) => state.auth.user);
  const isOnline = useSelector((state: RootState) => state.sync.isOnline);
  const savedDoors = useSelector((state: RootState) => state.doors.savedDoors);
  
  const [formData, setFormData] = useState<FormData>({
    name: user?.name || '',
    phone: user?.phone || '',
    reason: '',
    category: REQUEST_CATEGORY.GENERAL,
    priority: REQUEST_PRIORITY.MEDIUM,
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDoorSelection, setShowDoorSelection] = useState(false);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = ERROR_MESSAGES.REQUIRED_FIELD;
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!formData.phone) {
      errors.phone = ERROR_MESSAGES.REQUIRED_FIELD;
    } else if (!REGEX_PATTERNS.PHONE.test(formData.phone)) {
      errors.phone = ERROR_MESSAGES.INVALID_PHONE;
    }

    if (!formData.reason.trim()) {
      errors.reason = ERROR_MESSAGES.REQUIRED_FIELD;
    } else if (formData.reason.trim().length < 10) {
      errors.reason = 'Please provide more details (at least 10 characters)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const newRequest: AccessRequest = {
        id: `req_${Date.now()}`,
        userId: user!.id,
        doorId: formData.doorId,
        name: formData.name.trim(),
        phone: formData.phone,
        reason: formData.reason.trim(),
        status: REQUEST_STATUS.PENDING,
        priority: formData.priority,
        category: formData.category,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to local database
      await DatabaseService.saveRequest(newRequest);
      dispatch(addRequest(newRequest));

      LoggingService.info('Request created', 'NewRequest', newRequest);

      // Try to sync with API if online
      if (isOnline) {
        const response = await ApiService.post<AccessRequest>('/api/requests', newRequest);
        if (response.success && response.data) {
          // Update with server-generated ID
          await DatabaseService.saveRequest(response.data);
        }
      }

      Alert.alert(
        'Success',
        SUCCESS_MESSAGES.REQUEST_CREATED,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      LoggingService.error('Failed to create request', 'NewRequest', error as Error);
      Alert.alert('Error', ERROR_MESSAGES.GENERIC_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCategoryChips = () => (
    <View style={[globalStyles.row, { flexWrap: 'wrap', marginTop: 8 }]}>
      {Object.entries(REQUEST_CATEGORY).map(([key, value]) => (
        <Chip
          key={key}
          mode={formData.category === value ? 'flat' : 'outlined'}
          onPress={() => setFormData({ ...formData, category: value })}
          style={{ margin: 4 }}
          selected={formData.category === value}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Chip>
      ))}
    </View>
  );

  const renderPrioritySelection = () => (
    <RadioButton.Group
      onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
      value={formData.priority}
    >
      <View>
        <TouchableOpacity
          onPress={() => setFormData({ ...formData, priority: REQUEST_PRIORITY.LOW })}
        >
          <View style={[globalStyles.row, { paddingVertical: 8 }]}>
            <RadioButton value={REQUEST_PRIORITY.LOW} />
            <Icon name="information" size={20} color={theme.colors.info} />
            <Text style={{ marginLeft: 8 }}>Low - General inquiry</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setFormData({ ...formData, priority: REQUEST_PRIORITY.MEDIUM })}
        >
          <View style={[globalStyles.row, { paddingVertical: 8 }]}>
            <RadioButton value={REQUEST_PRIORITY.MEDIUM} />
            <Icon name="alert" size={20} color={theme.colors.warning} />
            <Text style={{ marginLeft: 8 }}>Medium - Standard request</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setFormData({ ...formData, priority: REQUEST_PRIORITY.HIGH })}
        >
          <View style={[globalStyles.row, { paddingVertical: 8 }]}>
            <RadioButton value={REQUEST_PRIORITY.HIGH} />
            <Icon name="alert-circle" size={20} color={theme.colors.error} />
            <Text style={{ marginLeft: 8 }}>High - Urgent matter</Text>
          </View>
        </TouchableOpacity>
      </View>
    </RadioButton.Group>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={globalStyles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={globalStyles.contentContainer}>
          {/* Header */}
          <View style={[globalStyles.row, { marginBottom: 24 }]}>
            <IconButton
              icon="arrow-left"
              onPress={() => navigation.goBack()}
              style={{ marginLeft: -8 }}
            />
            <Text variant="headlineMedium" style={{ flex: 1 }}>
              New Access Request
            </Text>
          </View>

          {/* Form */}
          <Card style={{ marginBottom: 16 }}>
            <Card.Content>
              <Text variant="titleMedium" style={{ marginBottom: 16 }}>
                Contact Information
              </Text>
              
              <TextInput
                label="Your Name *"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                error={!!formErrors.name}
                left={<TextInput.Icon icon="account" />}
                style={{ marginBottom: 4 }}
              />
              <HelperText type="error" visible={!!formErrors.name}>
                {formErrors.name}
              </HelperText>
              
              <TextInput
                label="Phone Number *"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                error={!!formErrors.phone}
                left={<TextInput.Icon icon="phone" />}
                style={{ marginBottom: 4 }}
              />
              <HelperText type="error" visible={!!formErrors.phone}>
                {formErrors.phone}
              </HelperText>
            </Card.Content>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <Card.Content>
              <Text variant="titleMedium" style={{ marginBottom: 16 }}>
                Request Details
              </Text>
              
              <TextInput
                label="Reason for Access *"
                value={formData.reason}
                onChangeText={(text) => setFormData({ ...formData, reason: text })}
                multiline
                numberOfLines={4}
                error={!!formErrors.reason}
                left={<TextInput.Icon icon="text" />}
                style={{ marginBottom: 4 }}
              />
              <HelperText type="error" visible={!!formErrors.reason}>
                {formErrors.reason}
              </HelperText>
              
              <Divider style={{ marginVertical: 16 }} />
              
              <Text variant="titleSmall" style={{ marginBottom: 8 }}>
                Category
              </Text>
              {renderCategoryChips()}
              
              <Divider style={{ marginVertical: 16 }} />
              
              <Text variant="titleSmall" style={{ marginBottom: 8 }}>
                Priority Level
              </Text>
              {renderPrioritySelection()}
            </Card.Content>
          </Card>

          {/* Door Selection (Optional) */}
          {savedDoors.length > 0 && (
            <Card style={{ marginBottom: 16 }}>
              <Card.Content>
                <View style={[globalStyles.row, globalStyles.spaceBetween]}>
                  <Text variant="titleMedium">Door Selection (Optional)</Text>
                  <IconButton
                    icon={showDoorSelection ? 'chevron-up' : 'chevron-down'}
                    onPress={() => setShowDoorSelection(!showDoorSelection)}
                  />
                </View>
                
                {showDoorSelection && (
                  <View style={{ marginTop: 8 }}>
                    {savedDoors.map((door) => (
                      <TouchableOpacity
                        key={door.id}
                        onPress={() => setFormData({ ...formData, doorId: door.id })}
                      >
                        <Surface
                          style={[
                            globalStyles.listItem,
                            {
                              backgroundColor: formData.doorId === door.id
                                ? theme.colors.primaryContainer
                                : theme.colors.surface,
                              marginVertical: 4,
                              borderRadius: 8,
                            },
                          ]}
                        >
                          <Icon
                            name="door"
                            size={24}
                            color={
                              formData.doorId === door.id
                                ? theme.colors.primary
                                : theme.colors.onSurfaceVariant
                            }
                          />
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text variant="bodyMedium">{door.name}</Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                              {door.location}
                            </Text>
                          </View>
                          {formData.doorId === door.id && (
                            <Icon name="check" size={24} color={theme.colors.primary} />
                          )}
                        </Surface>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </Card.Content>
            </Card>
          )}

          {/* Submit Button */}
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            icon="send"
            style={{ marginTop: 16 }}
          >
            Submit Request
          </Button>
          
          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            disabled={isSubmitting}
            style={{ marginTop: 8 }}
          >
            Cancel
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default NewRequestScreen;