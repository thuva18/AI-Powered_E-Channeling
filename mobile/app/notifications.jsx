import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import useTheme from '../hooks/useTheme';

const NotificationsScreen = () => {
  const { C, isDark } = useTheme();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchNotifications(); };

  const handleRead = async (id, link) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      if (link) {
        router.push(link);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'alert-circle';
      case 'warning': return 'warning';
      default: return 'notifications';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'success': return C.success;
      case 'error': return C.error;
      case 'warning': return C.warning;
      default: return C.primary;
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: isDark ? 'rgba(28, 36, 56, 0.6)' : C.bgCard, borderColor: isDark ? 'rgba(255,255,255,0.05)' : C.border },
        !item.isRead && { borderLeftWidth: 4, borderLeftColor: C.primary }
      ]}
      onPress={() => handleRead(item._id, item.link)}
    >
      <View style={styles.cardContent}>
        <View style={[styles.iconBox, { backgroundColor: getTypeColor(item.type) + '22' }]}>
          <Ionicons name={getTypeIcon(item.type)} size={20} color={getTypeColor(item.type)} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: C.textPrimary }]}>{item.title}</Text>
          <Text style={[styles.message, { color: C.textSecondary }]}>{item.message}</Text>
          <Text style={[styles.time, { color: C.textMuted }]}>{new Date(item.createdAt).toLocaleString()}</Text>
        </View>
        {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: C.primary }]} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={[styles.header, { backgroundColor: isDark ? 'rgba(19, 25, 41, 0.95)' : C.bgCard, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={[styles.markAll, { color: C.primary }]}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={60} color={C.textMuted} />
              <Text style={[styles.emptyText, { color: C.textMuted }]}>No notifications yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  markAll: { fontSize: 13, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1 },
  cardContent: { flexDirection: 'row', alignItems: 'flex-start' },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  textContainer: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  message: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  time: { fontSize: 11 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, marginLeft: 8 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { marginTop: 16, fontSize: 15, fontWeight: '600' }
});

export default NotificationsScreen;
