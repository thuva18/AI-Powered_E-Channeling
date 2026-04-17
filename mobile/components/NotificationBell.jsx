import { useEffect, useState } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import useTheme from '../hooks/useTheme';

export default function NotificationBell({ size = 38 }) {
  const { C } = useTheme();
  const router = useRouter();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/notifications');
        const count = data.filter(n => !n.isRead).length;
        setUnread(count);
      } catch (e) {
        // ignore
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // 30s polling
    return () => clearInterval(interval);
  }, []);

  return (
    <TouchableOpacity
      style={{
        width: size, height: size, borderRadius: 12,
        backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border,
        justifyContent: 'center', alignItems: 'center',
      }}
      onPress={() => router.push('/notifications')}
    >
      <Ionicons name="notifications-outline" size={20} color={C.textPrimary} />
      {unread > 0 && (
        <View style={{
          position: 'absolute', top: -4, right: -4,
          backgroundColor: C.error, minWidth: 18, height: 18, borderRadius: 9,
          justifyContent: 'center', alignItems: 'center',
          borderWidth: 2, borderColor: C.bgCard,
        }}>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>
            {unread > 9 ? '9+' : unread}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
