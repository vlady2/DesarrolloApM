// ProfileScreen.js - CON KEYBOARDAVOIDINGVIEW CORREGIDO
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  View
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth, db } from '../../firebase/auth';

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
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedField, setSelectedField] = useState('');
  const [editValue, setEditValue] = useState('');
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalMoves: 0,
    totalBoxes: 0,
    totalLuggage: 0,
    countriesVisited: 0,
    totalWeight: 0,
    savedSpace: 0,
    tripsCompleted: 0,
    tripsPlanned: 0,
    movesActive: 0,
    movesCompleted: 0,
  });

  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const modalInputRef = useRef(null);

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

  const onScroll = useCallback(
    Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      { useNativeDriver: false }
    ),
    []
  );

  const loadUserData = async (forceReload = false) => {
    try {
      if (forceReload) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const user = auth.currentUser;
      if (!user) {
        navigation.navigate('Login');
        return;
      }

      const basicData = {
        name: user.displayName || 'Viajero',
        email: user.email || '',
        memberSince: user.metadata.creationTime || new Date().toLocaleDateString(),
      };

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let userDocData = {};

      if (userDoc.exists()) {
        userDocData = userDoc.data();
      }

      const mergedData = {
        ...userData,
        ...basicData,
        phone: userDocData.phone || '',
        location: userDocData.location || '',
        bio: userDocData.bio || 'Apasionado viajero ✈️',
        travelStyle: userDocData.travelStyle || 'Aventurero',
        preferredAirline: userDocData.preferredAirline || 'No especificada',
        luggageCount: userDocData.boxes?.length || 0,
        tripsCount: userDocData.trips?.length || 0,
      };

      setUserData(mergedData);

      if (userDocData.settings) {
        setSettings(userDocData.settings);
      }

      await calculateRealStats(user.uid);

    } catch (error) {
      console.error('❌ Error cargando datos del usuario:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del perfil');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateRealStats = async (userId) => {
    try {
      const { getUserTrips } = require('../../firebase/tripService');
      const { getAllUserBoxes } = require('../../firebase/boxService');
      const { getUserMoves } = require('../../firebase/moveService');
      const { getAllUserLuggage } = require('../../firebase/luggageService');

      const [userTrips, userBoxes, userMoves, userLuggage] = await Promise.all([
        getUserTrips().catch(() => []),
        getAllUserBoxes().catch(() => []),
        getUserMoves().catch(() => []),
        getAllUserLuggage().catch(() => [])
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tripsCompleted = userTrips.filter(trip => {
        if (!trip.endDate) return false;

        let endDate;
        try {
          if (trip.endDate.includes('/')) {
            const [day, month, year] = trip.endDate.split('/');
            endDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else {
            endDate = new Date(trip.endDate);
          }
          endDate.setHours(0, 0, 0, 0);

          return endDate < today;
        } catch (error) {
          return false;
        }
      }).length;

      const currentDate = new Date();
      let movesActive = 0;
      let movesCompleted = 0;

      userMoves.forEach(move => {
        if (!move.moveDate) {
          movesActive++;
          return;
        }

        try {
          let moveDate;
          if (move.moveDate.includes('/')) {
            const [day, month, year] = move.moveDate.split('/');
            moveDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else {
            moveDate = new Date(move.moveDate);
          }
          moveDate.setHours(0, 0, 0, 0);

          if (moveDate < currentDate) {
            movesCompleted++;
          } else {
            movesActive++;
          }
        } catch (error) {
          console.log('❌ Error procesando fecha de mudanza:', error);
          movesActive++;
        }
      });

      let totalWeight = 0;
      userBoxes.forEach(box => {
        totalWeight += parseFloat(box.peso) || 0;
      });

      const countries = new Set();
      userTrips.forEach(trip => {
        if (trip.destination) {
          const country = trip.destination.split(',').pop()?.trim();
          if (country) countries.add(country);
        }
      });

      setStats({
        totalTrips: userTrips.length,
        totalMoves: userMoves.length,
        totalBoxes: userBoxes.length,
        totalLuggage: userLuggage.length,
        countriesVisited: countries.size,
        totalWeight: Math.round(totalWeight),
        savedSpace: Math.round(totalWeight * 0.3),
        tripsCompleted,
        tripsPlanned: userTrips.length - tripsCompleted,
        movesActive,
        movesCompleted,
      });

    } catch (error) {
      console.error('❌ Error calculando estadísticas:', error);
    }
  };

  const handleEditField = (field, value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedField(field);
    setEditValue(value || '');
    setEditModalVisible(true);
    
    setTimeout(() => {
      if (modalInputRef.current) {
        modalInputRef.current.focus();
      }
    }, 100);
  };

  const saveField = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Usuario no autenticado');
        return;
      }

      const fieldMap = {
        name: {
          firestoreField: 'displayName',
          authUpdate: true,
          label: 'Nombre'
        },
        bio: {
          firestoreField: 'bio',
          authUpdate: false,
          label: 'Bio'
        },
        travelStyle: {
          firestoreField: 'travelStyle',
          authUpdate: false,
          label: 'Estilo de viaje'
        },
      };

      const fieldConfig = fieldMap[selectedField];
      if (!fieldConfig) {
        console.error('Campo no reconocido:', selectedField);
        return;
      }

      if (fieldConfig.authUpdate && selectedField === 'name') {
        try {
          await updateProfile(user, { displayName: editValue });
        } catch (authError) {
          console.error('Error actualizando Auth:', authError);
        }
      }

      const updates = {};
      updates[fieldConfig.firestoreField] = editValue;
      updates.updatedAt = new Date();

      await updateDoc(doc(db, 'users', user.uid), updates);

      setUserData(prev => ({
        ...prev,
        [selectedField]: editValue
      }));

      setTimeout(() => {
        loadUserData(true);
      }, 500);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Guardado', 'Cambios actualizados correctamente');

      setEditModalVisible(false);
      Keyboard.dismiss();

    } catch (error) {
      console.error('❌ Error guardando cambios:', error);
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

  const StatCard = ({ icon, value, label, color, subLabel }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {subLabel && <Text style={styles.statSubLabel}>{subLabel}</Text>}
    </View>
  );

  const ProfileField = ({ icon, label, value, editable = false, fieldName = '' }) => (
    <TouchableOpacity
      style={styles.profileField}
      onPress={() => editable && handleEditField(fieldName, value)}
      activeOpacity={editable ? 0.7 : 1}
      disabled={!editable}
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
      <Text style={styles.fieldValue} numberOfLines={2}>
        {value || 'No especificado'}
      </Text>
    </TouchableOpacity>
  );

  const onRefresh = useCallback(() => {
    loadUserData(true);
  }, []);

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
                  <Text style={styles.badgeText}>
                    Miembro desde {new Date(userData.memberSince).getFullYear()}
                  </Text>
                </View>
              </View>
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#60A5FA']}
              tintColor="#60A5FA"
            />
          }
          contentContainerStyle={styles.scrollContent}
          bounces={true}
          overScrollMode="always"
          keyboardShouldPersistTaps="handled"
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
                <StatCard
                  icon="✈️"
                  value={stats.totalTrips}
                  label="Viajes"
                  color="#3B82F6"
                  subLabel={`${stats.tripsCompleted} completados`}
                />
                <StatCard
                  icon="📦"
                  value={stats.totalBoxes}
                  label="Cajas"
                  color="#10B981"
                />
                <StatCard
                  icon="🛄"
                  value={stats.totalLuggage}
                  label="Maletas"
                  color="#8B5CF6"
                />
                <StatCard
                  icon="🏠"
                  value={stats.totalMoves}
                  label="Mudanzas"
                  color="#F59E0B"
                  subLabel={`${stats.movesActive} activas`}
                />
                <StatCard
                  icon="⚖️"
                  value={`${stats.totalWeight}kg`}
                  label="Peso Total"
                  color="#EF4444"
                />
                <StatCard
                  icon="🌎"
                  value={stats.countriesVisited}
                  label="Países"
                  color="#EC4899"
                />
              </View>
            </View>

            {/* INFORMACIÓN PERSONAL */}
            <View style={styles.infoSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Información Personal</Text>
                <TouchableOpacity
                  style={styles.editAllButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setEditing(!editing);
                  }}
                >
                  <Ionicons
                    name={editing ? "checkmark" : "pencil"}
                    size={20}
                    color="#60A5FA"
                  />
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
              <Text style={styles.versionText}>Versión 2.5.1 • NextApp Labs</Text>
            </View>
          </Animated.View>
        </ScrollView>

        {/* MODAL PARA EDITAR CON LA MISMA LÓGICA QUE LOGINSCREEN */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={editModalVisible}
          onRequestClose={() => {
            setEditModalVisible(false);
            Keyboard.dismiss();
          }}
        >
          <KeyboardAvoidingView
            style={styles.modalKeyboardAvoiding}
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={() => {}}>
                  <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>
                        {selectedField === 'name' ? 'Editar Nombre' :
                          selectedField === 'bio' ? 'Editar Bio' :
                            selectedField === 'travelStyle' ? 'Editar Estilo de Viaje' :
                              'Editar Aerolínea Preferida'}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setEditModalVisible(false);
                          Keyboard.dismiss();
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="close" size={28} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>

                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.modalScrollContent}
                      keyboardShouldPersistTaps="handled"
                      bounces={false}
                    >
                      <TextInput
                        ref={modalInputRef}
                        style={[
                          styles.modalInput,
                          selectedField === 'bio' && styles.modalInputMultiline
                        ]}
                        value={editValue}
                        onChangeText={setEditValue}
                        multiline={selectedField === 'bio'}
                        numberOfLines={selectedField === 'bio' ? 4 : 1}
                        placeholder={`Ingresa tu ${selectedField === 'name' ? 'nombre' : selectedField === 'bio' ? 'descripción personal' : selectedField}`}
                        placeholderTextColor="#94A3B8"
                        autoFocus
                        autoCapitalize={selectedField === 'name' ? 'words' : 'sentences'}
                        returnKeyType="done"
                        blurOnSubmit={true}
                        onSubmitEditing={saveField}
                      />

                      <View style={styles.modalButtons}>
                        <TouchableOpacity
                          style={[styles.modalButton, styles.cancelButton]}
                          onPress={() => {
                            setEditModalVisible(false);
                            Keyboard.dismiss();
                          }}
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
                    </ScrollView>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
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
    gap: 12,
  },
  statCard: {
    width: '31%',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 2,
  },
  statSubLabel: {
    fontSize: 9,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
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
    gap: 12,
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
  // ESTILOS MODAL - MISMA CONFIGURACIÓN QUE LOGINSCREEN
  modalKeyboardAvoiding: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxHeight: '90%',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 40,
  },
  modalScrollContent: {
    flexGrow: 1,
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
    marginBottom: 20,
  },
  modalInputMultiline: {
    minHeight: 120,
    textAlignVertical: 'top',
    maxHeight: 200,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
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