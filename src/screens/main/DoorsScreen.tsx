import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Chip, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../utils/theme';

const DoorsScreen: React.FC = () => {
  const [doors] = useState([
    {
      id: '1',
      name: 'Front Door',
      location: 'Main Entrance',
      status: 'locked',
      lastAccess: '2 min ago',
      accessLevel: 'admin',
    },
    {
      id: '2',
      name: 'Back Gate',
      location: 'Garden',
      status: 'unlocked',
      lastAccess: '5 min ago',
      accessLevel: 'user',
    },
    {
      id: '3',
      name: 'Garage Door',
      location: 'Garage',
      status: 'locked',
      lastAccess: '1 hour ago',
      accessLevel: 'admin',
    },
    {
      id: '4',
      name: 'Side Entrance',
      location: 'Side Yard',
      status: 'locked',
      lastAccess: '3 hours ago',
      accessLevel: 'guest',
    },
  ]);

  const getStatusColor = (status: string) => {
    return status === 'unlocked' ? '#4CAF50' : '#F44336';
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'admin':
        return '#F44336';
      case 'user':
        return '#2196F3';
      case 'guest':
        return '#FF9800';
      default:
        return '#757575';
    }
  };

  const handleDoorAction = (doorId: string, action: string) => {
    console.log(`${action} door ${doorId}`);
    // Handle door actions here
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Doors</Text>
          <Text style={styles.subtitle}>Manage your door access</Text>
        </View>

        <View style={styles.doorsList}>
          {doors.map((door) => (
            <Card key={door.id} style={styles.doorCard}>
              <Card.Content>
                <View style={styles.doorHeader}>
                  <View style={styles.doorInfo}>
                    <Text style={styles.doorName}>{door.name}</Text>
                    <Text style={styles.doorLocation}>{door.location}</Text>
                  </View>
                  <View style={styles.doorStatus}>
                    <Icon
                      name={door.status === 'unlocked' ? 'lock-open' : 'lock'}
                      size={24}
                      color={getStatusColor(door.status)}
                    />
                    <Chip
                      mode="outlined"
                      textStyle={{ color: getAccessLevelColor(door.accessLevel) }}
                      style={[styles.accessChip, { borderColor: getAccessLevelColor(door.accessLevel) }]}
                    >
                      {door.accessLevel}
                    </Chip>
                  </View>
                </View>

                <View style={styles.doorDetails}>
                  <Text style={styles.lastAccess}>Last access: {door.lastAccess}</Text>
                </View>

                <View style={styles.doorActions}>
                  <Button
                    mode="contained"
                    onPress={() => handleDoorAction(door.id, 'unlock')}
                    style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                    disabled={door.status === 'unlocked'}
                  >
                    Unlock
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => handleDoorAction(door.id, 'lock')}
                    style={styles.actionButton}
                    disabled={door.status === 'locked'}
                  >
                    Lock
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => handleDoorAction(door.id, 'details')}
                    style={styles.actionButton}
                  >
                    Details
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>

        <View style={styles.addDoorSection}>
          <Button
            mode="contained"
            icon="plus"
            onPress={() => console.log('Add new door')}
            style={styles.addButton}
          >
            Add New Door
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  doorsList: {
    paddingHorizontal: 24,
  },
  doorCard: {
    marginBottom: 16,
    elevation: 2,
  },
  doorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  doorInfo: {
    flex: 1,
  },
  doorName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onBackground,
    marginBottom: 4,
  },
  doorLocation: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  doorStatus: {
    alignItems: 'center',
  },
  accessChip: {
    marginTop: 8,
  },
  doorDetails: {
    marginBottom: 16,
  },
  lastAccess: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  doorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  addDoorSection: {
    padding: 24,
    paddingTop: 16,
  },
  addButton: {
    paddingVertical: 8,
  },
});

export default DoorsScreen;
