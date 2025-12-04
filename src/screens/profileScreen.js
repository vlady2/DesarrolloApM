import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Modal,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth, db } from './../../firebase/auth';

const { width, height } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    travelStyle: '',
    preferredAirline: '',
    luggageCount: 0,
    tripsCount: 0,
    memberSince: '',
  });
  
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: true,
    autoSync: true,
    locationTracking: false,
    dataSaver: false,
    biometricLogin: false,
  });
  
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedField, setSelectedField] = useState('');
  const [editValue, setEditValue] = useState('');
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalMoves: 0,
    totalBoxes: 0,
    countriesVisited: 0,
    totalWeight: 0,
    savedSpace: 0,
  });

  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [300, 120],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    loadUserData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Datos básicos de Auth
        setUserData(prev => ({
          ...prev,
          name: user.displayName || 'Viajero',
          email: user.email || '',
          memberSince: user.metadata.creationTime || new Date().toLocaleDateString(),
        }));

        // Cargar datos adicionales de Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(prev => ({
            ...prev,
            phone: data.phone || '',
            location: data.location || '',
            bio: data.bio || 'Apasionado viajero ✈️',
            travelStyle: data.travelStyle || 'Aventurero',
            preferredAirline: data.preferredAirline || 'No especificada',
            luggageCount: data.boxes?.length || 0,
            tripsCount: data.trips?.length || 0,
          }));

          // Cargar configuración
          if (data.settings) {
            setSettings(data.settings);
          }

          // Calcular estadísticas
          calculateStats(data);
        }
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const trips = data.trips || [];
    const boxes = data.boxes || [];
    const moves = data.moves || [];
    
    let totalWeight = 0;
    let savedSpace = 0;
    let countries = new Set();
    
    boxes.forEach(box => {
      totalWeight += box.weight || 0;
      savedSpace += box.savedSpace || 0;
    });
    
    trips.forEach(trip => {
      if (trip.destination) countries.add(trip.destination);
    });
    
    setStats({
      totalTrips: trips.length,
      totalMoves: moves.length,
      totalBoxes: boxes.length,
      countriesVisited: countries.size,
      totalWeight: Math.round(totalWeight),
      savedSpace: Math.round(savedSpace),
    });
  };

  const handleEditField = (field, value) => {
    setSelectedField(field);
    setEditValue(value);
    setEditModalVisible(true);
  };

  const saveField = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const updates = {};
      const fieldMap = {
        name: 'displayName',
        phone: 'phone',
        location: 'location',
        bio: 'bio',
        travelStyle: 'travelStyle',
        preferredAirline: 'preferredAirline',
      };

      if (selectedField === 'name') {
        // Actualizar en Auth
        // Note: Para actualizar displayName necesitas importar updateProfile
        // y hacer: await updateProfile(user, { displayName: editValue });
      }

      // Actualizar en Firestore
      const firestoreField = fieldMap[selectedField];
      if (firestoreField) {
        updates[firestoreField] = editValue;
        await updateDoc(doc(db, 'users', user.uid), updates);
        
        // Actualizar estado local
        setUserData(prev => ({ ...prev, [selectedField]: editValue }));
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('✅ Guardado', 'Cambios actualizados correctamente');
      }

      setEditModalVisible(false);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('❌ Error', 'No se pudo guardar los cambios');
    }
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: async () => {
            try {
              await auth.signOut();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar sesión');
            }
          }
        }
      ]
    );
  };

  const toggleSetting = (setting) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const StatCard = ({ icon, value, label, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const SettingItem = ({ icon, title, description, value, onToggle, color }) => (
    <TouchableOpacity 
      style={styles.settingItem}
      onPress={() => onToggle && onToggle()}
      activeOpacity={0.7}
    >
      <View style={[styles.settingIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      {onToggle && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: '#475569', true: color }}
          thumbColor="#FFFFFF"
        />
      )}
    </TouchableOpacity>
  );

  const ProfileField = ({ icon, label, value, editable = false, fieldName = '' }) => (
    <TouchableOpacity
      style={styles.profileField}
      onPress={() => editable && handleEditField(fieldName, value)}
      activeOpacity={editable ? 0.7 : 1}
    >
      <View style={styles.fieldHeader}>
        <View style={styles.fieldIconContainer}>
          <Ionicons name={icon} size={20} color="#60A5FA" />
        </View>
        <Text style={styles.fieldLabel}>{label}</Text>
        {editable && (
          <Ionicons name="pencil" size={16} color="#94A3B8" style={styles.editIcon} />
        )}
      </View>
      <Text style={styles.fieldValue} numberOfLines={2}>{value || 'No especificado'}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#334155']}
        style={styles.gradientBackground}
      >
        {/* HEADER DINÁMICO */}
        <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
          <LinearGradient
            colors={['#1E40AF', '#3B82F6', '#60A5FA']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* BACK BUTTON */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.goBack();
              }}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            {/* AVATAR SIN FOTO */}
            <Animated.View style={[styles.avatarContainer, { opacity: headerOpacity }]}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {userData.name.charAt(0).toUpperCase()}
                </Text>
                <View style={styles.avatarGlow} />
              </View>
              <View style={styles.avatarBadge}>
                <Ionicons name="airplane" size={16} color="#FFFFFF" />
              </View>
            </Animated.View>

            {/* INFO BÁSICA */}
            <Animated.View style={[styles.userInfo, { opacity: headerOpacity }]}>
              <Text style={styles.userName}>{userData.name}</Text>
              <Text style={styles.userEmail}>{userData.email}</Text>
              <View style={styles.userBadges}>
                <View style={styles.badge}>
                  <Ionicons name="trophy" size={14} color="#FBBF24" />
                  <Text style={styles.badgeText}>Viajero {userData.travelStyle}</Text>
                </View>
                <View style={styles.badge}>
                  <Ionicons name="calendar" size={14} color="#60A5FA" />
                  <Text style={styles.badgeText}>Miembro desde {new Date(userData.memberSince).getFullYear()}</Text>
                </View>
              </View>
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        <Animated.ScrollView
          style={styles.scrollView}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
            
            {/* BIO CARD */}
            <View style={styles.bioCard}>
              <LinearGradient
                colors={['rgba(30, 64, 175, 0.2)', 'rgba(59, 130, 246, 0.1)']}
                style={styles.bioGradient}
              >
                <View style={styles.bioHeader}>
                  <Ionicons name="sparkles" size={24} color="#60A5FA" />
                  <Text style={styles.bioTitle}>Sobre Mí</Text>
                  <TouchableOpacity 
                    style={styles.editBioButton}
                    onPress={() => handleEditField('bio', userData.bio)}
                  >
                    <Ionicons name="create" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.bioText}>
                  {userData.bio || 'Apasionado viajero buscando nuevas aventuras alrededor del mundo ✈️'}
                </Text>
                <View style={styles.travelStyle}>
                  <Text style={styles.travelStyleLabel}>Estilo de viaje:</Text>
                  <Text style={styles.travelStyleValue}>{userData.travelStyle}</Text>
                </View>
              </LinearGradient>
            </View>

            {/* STATS GRID */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Mis Estadísticas</Text>
              <View style={styles.statsGrid}>
                <StatCard icon="✈️" value={stats.totalTrips} label="Viajes" color="#3B82F6" />
                <StatCard icon="📦" value={stats.totalBoxes} label="Maletas" color="#10B981" />
                <StatCard icon="🏠" value={stats.totalMoves} label="Mudanzas" color="#8B5CF6" />
                <StatCard icon="⚖️" value={`${stats.totalWeight}kg`} label="Peso Total" color="#EF4444" />
              </View>
            </View>

            {/* INFORMACIÓN PERSONAL */}
            <View style={styles.infoSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Información Personal</Text>
                <TouchableOpacity 
                  style={styles.editAllButton}
                  onPress={() => setEditing(!editing)}
                >
                  <Ionicons name={editing ? "checkmark" : "pencil"} size={20} color="#60A5FA" />
                  <Text style={styles.editAllText}>
                    {editing ? 'Listo' : 'Editar'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.profileGrid}>
                <ProfileField 
                  icon="person"
                  label="Nombre"
                  value={userData.name}
                  editable={editing}
                  fieldName="name"
                />
                <ProfileField 
                  icon="mail"
                  label="Email"
                  value={userData.email}
                  editable={false}
                  
                />
                
                <ProfileField 
                  icon="trail-sign"
                  label="Estilo de Viaje"
                  value={userData.travelStyle}
                  editable={editing}
                  fieldName="travelStyle"
                />
              </View>
            </View>

           


            {/* LOGOUT BUTTON */}
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#EF444420', '#DC262610']}
                style={styles.logoutGradient}
              >
                <Ionicons name="log-out" size={22} color="#EF4444" />
                <Text style={styles.logoutText}>Cerrar Sesión</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* FOOTER */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Cuenta verificada • Última actualización: Hoy
              </Text>
              <Text style={styles.versionText}>Versión 2.5.1 • TravelTech Labs</Text>
            </View>
          </Animated.View>
        </Animated.ScrollView>

        {/* MODAL PARA EDITAR */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={editModalVisible}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <LinearGradient
                colors={['#1E293B', '#0F172A']}
                style={styles.modalGradient}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    Editar {selectedField === 'name' ? 'Nombre'    :
                           'Aerolínea Preferida'}
                  </Text>
                  <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                    <Ionicons name="close" size={28} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                
                <TextInput
                  style={styles.modalInput}
                  value={editValue}
                  onChangeText={setEditValue}
                  multiline={selectedField === 'bio'}
                  numberOfLines={selectedField === 'bio' ? 4 : 1}
                  placeholder={`Ingresa tu ${selectedField}`}
                  placeholderTextColor="#94A3B8"
                  autoFocus
                />
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={saveField}
                  >
                    <LinearGradient
                      colors={['#3B82F6', '#1D4ED8']}
                      style={styles.saveButtonGradient}
                    >
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                      <Text style={styles.saveButtonText}>Guardar</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  gradientBackground: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#CBD5E1',
    marginTop: 20,
    fontSize: 16,
  },
  headerContainer: {
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 24,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 10,
  },
  avatarContainer: {
    marginTop: 20,
    alignItems: 'center',
    position: 'relative',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  avatarGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(96, 165, 250, 0.3)',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10B981',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0F172A',
  },
  userInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: '#E2E8F0',
    marginTop: 4,
  },
  userBadges: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 140,
    paddingBottom: 60,
  },
  bioCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 32,
  },
  bioGradient: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  bioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  bioTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  editBioButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#CBD5E1',
    marginBottom: 16,
  },
  travelStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  travelStyleLabel: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  travelStyleValue: {
    fontSize: 14,
    color: '#60A5FA',
    fontWeight: '700',
  },
  statsSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    width: '31%',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 20,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  infoSection: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  editAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  editAllText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '600',
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  profileField: {
    width: '48%',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  fieldIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    color: '#94A3B8',
    flex: 1,
    fontWeight: '500',
  },
  editIcon: {
    opacity: 0.7,
  },
  fieldValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    lineHeight: 20,
  },
  settingsSection: {
    marginBottom: 40,
  },
  settingsList: {
    gap: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
  actionsSection: {
    marginBottom: 40,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionCard: {
    width: '48%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionCount: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  logoutButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 40,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 10,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 8,
  },
  versionText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    maxHeight: height * 0.5,
  },
  modalGradient: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 50,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProfileScreen;