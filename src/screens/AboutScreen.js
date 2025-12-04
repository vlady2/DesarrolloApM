import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import {
  Animated,
  Dimensions,
  Linking,
  Platform,
  SafeAreaView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

const AboutScreen = ({ navigation }) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  React.useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [280, 120],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  });

  const handleShare = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: '¡Descubre Pack&Trip! La mejor app para organizar tus viajes ✈️\n\nDescarga ahora: https://expo.dev/accounts/bryanvaldy/projects/proyectoMAI/builds/313e8228-29d8-4b4c-802f-1696ffe8c583',
        title: 'Pack&Trip - Organizador de Viajes',
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleRateApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === 'ios') {
      Linking.openURL('itms-apps://itunes.apple.com/app/idYOUR_APP_ID');
    } else {
      Linking.openURL('market://details?id=com.yourapp.package');
    }
  };

  const features = [
    {
      icon: '📦',
      title: 'Gestión Inteligente',
      description: 'Organiza maletas con IA, calcula pesos y sugiere contenido',
      color: '#3B82F6',
    },
    {
      icon: '🤖',
      title: 'IA Viajera',
      description: 'Recomendaciones personalizadas basadas en tu destino y estilo',
      color: '#8B5CF6',
    },
    {
      icon: '⚠️',
      title: 'Alertas Prohibidas',
      description: 'Detecta automáticamente artículos restringidos por pais',
      color: '#EF4444',
    },
    {
      icon: '🌍',
      title: 'Destinos Globales',
      description: 'Información actualizada de 500+ destinos worldwide',
      color: '#F59E0B',
    },
    {
      icon: '🔄',
      title: 'Sincronización Cloud',
      description: 'Tus datos seguros y disponibles en todos tus dispositivos',
      color: '#EC4899',
    },
  ];

  const stats = [
    { value: '50K+', label: 'Viajeros' },
    { value: '250K+', label: 'Maletas' },
    { value: '1M+', label: 'Artículos' },
    { value: '4.9', label: 'Rating' },
  ];

  const team = [
    { name: 'Bryan Valdivieso', role: 'CEO', emoji: '👨‍💻' },
    { name: 'Nelson ', role: 'CTO', emoji: '👨‍💻' },
    { name: 'Cristel', role: 'Diseñadora UX/UI', emoji: '🎨' },
    { name: 'Kevin', role: 'AI Engineer', emoji: '🤖' },
    { name: 'Kevin', role: 'Developer', emoji: '👨‍💻' },
  ];

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

            {/* TÍTULO ANIMADO */}
            <Animated.View style={[
              styles.titleContainer,
              {
                opacity: headerOpacity,
                transform: [
                  { scale: titleScale },
                  { translateY: titleTranslateY }
                ]
              }
            ]}>
              <Text style={styles.mainTitle}>Pack&Trip</Text>
              <Text style={styles.subTitle}>Tu compañero de viaje inteligente</Text>
            </Animated.View>

            {/* LOGO ANIMADO */}
            <Animated.View style={[styles.logoContainer, { opacity: headerOpacity }]}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>✈️</Text>
                <View style={styles.logoGlow} />
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
          <Animated.View style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}>
            
            {/* MISSION CARD */}
            <View style={styles.missionCard}>
              <LinearGradient
                colors={['rgba(30, 64, 175, 0.2)', 'rgba(59, 130, 246, 0.1)']}
                style={styles.missionGradient}
              >
                <Text style={styles.missionTitle}>Nuestra Misión</Text>
                <Text style={styles.missionText}>
                  Transformamos la forma en que viajas. Con tecnología de punta e inteligencia artificial, 
                  hacemos que cada viaje sea organizado, seguro y memorable.
                </Text>
                <View style={styles.missionQuote}>
                  <Ionicons name="airplane" size={24} color="#60A5FA" />
                  <Text style={styles.quoteText}>
                    Viajar no debería ser complicado, solo emocionante
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* STATS SECTION */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>En Números</Text>
              <View style={styles.statsGrid}>
                {stats.map((stat, index) => (
                  <View key={index} style={styles.statCard}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* FEATURES SECTION */}
            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>Lo Que Ofrecemos</Text>
              <Text style={styles.sectionSubtitle}>
                Características diseñadas para viajeros modernos
              </Text>
              
              <View style={styles.featuresGrid}>
                {features.map((feature, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.featureCard}
                    activeOpacity={0.8}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  >
                    <LinearGradient
                      colors={[feature.color + '30', feature.color + '10']}
                      style={styles.featureGradient}
                    >
                      <View style={[styles.featureIconContainer, { backgroundColor: feature.color + '20' }]}>
                        <Text style={styles.featureIcon}>{feature.icon}</Text>
                      </View>
                      <Text style={styles.featureTitle}>{feature.title}</Text>
                      <Text style={styles.featureDescription}>{feature.description}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* TEAM SECTION */}
            <View style={styles.teamSection}>
              <Text style={styles.sectionTitle}>Nuestro Equipo</Text>
              <Text style={styles.sectionSubtitle}>
                Apasionados por los viajes y la tecnología
              </Text>
              
              <View style={styles.teamGrid}>
                {team.map((member, index) => (
                  <View key={index} style={styles.teamCard}>
                    <View style={styles.teamAvatar}>
                      <Text style={styles.teamEmoji}>{member.emoji}</Text>
                    </View>
                    <Text style={styles.teamName}>{member.name}</Text>
                    <Text style={styles.teamRole}>{member.role}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* VALUES SECTION */}
            <View style={styles.valuesSection}>
              <Text style={styles.sectionTitle}>Nuestros Valores</Text>
              <View style={styles.valuesList}>
                <View style={styles.valueItem}>
                  <Ionicons name="shield-checkmark" size={24} color="#10B981" />
                  <View style={styles.valueTextContainer}>
                    <Text style={styles.valueTitle}>Seguridad Primero</Text>
                    <Text style={styles.valueDescription}>
                      Tus datos están encriptados y protegidos con los más altos estándares
                    </Text>
                  </View>
                </View>
                
                <View style={styles.valueItem}>
                  <Ionicons name="rocket" size={24} color="#3B82F6" />
                  <View style={styles.valueTextContainer}>
                    <Text style={styles.valueTitle}>Innovación Constante</Text>
                    <Text style={styles.valueDescription}>
                      Siempre mejorando con las últimas tecnologías e IA
                    </Text>
                  </View>
                </View>
                
                <View style={styles.valueItem}>
                  <Ionicons name="heart" size={24} color="#EC4899" />
                  <View style={styles.valueTextContainer}>
                    <Text style={styles.valueTitle}>Pasión por el Viaje</Text>
                    <Text style={styles.valueDescription}>
                      Amamos viajar tanto como tú, y eso se refleja en cada función
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* APP INFO */}
            <View style={styles.appInfoCard}>
              <View style={styles.appInfoHeader}>
                <Ionicons name="information-circle" size={28} color="#60A5FA" />
                <Text style={styles.appInfoTitle}>Información de la App</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Versión</Text>
                <Text style={styles.infoValue}>1.0.0</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Última Actualización</Text>
                <Text style={styles.infoValue}>Diciembre 2024</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Desarrollado por</Text>
                <Text style={styles.infoValue}>NextApp ®</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Soporte</Text>
                <Text style={[styles.infoValue, styles.linkText]}>valdiviesobryan130@gmail.com</Text>
              </View>
            </View>

            {/* ACTION BUTTONS */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#3B82F6', '#1D4ED8']}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="share-social" size={22} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Compartir App</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.rateButton]}
                onPress={handleRateApp}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="star" size={22} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Calificar App</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* FOOTER */}
            <View style={styles.footer}>
              <Text style={styles.footerTitle}>Pack&Trip</Text>
              <Text style={styles.footerText}>
                Transformando experiencias de viaje desde 2024
              </Text>
              <Text style={styles.copyright}>
                © 2024 NextApp Labs. Todos los derechos reservados.
              </Text>
              <View style={styles.socialLinks}>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-twitter" size={20} color="#60A5FA" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-instagram" size={20} color="#EC4899" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-linkedin" size={20} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-github" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </Animated.ScrollView>
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
  titleContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subTitle: {
    fontSize: 16,
    color: '#E2E8F0',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  logoContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoText: {
    fontSize: 48,
  },
  logoGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 40,
    backgroundColor: 'rgba(96, 165, 250, 0.3)',
    blurRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 120,
    paddingBottom: 60,
  },
  missionCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 32,
  },
  missionGradient: {
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  missionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  missionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#CBD5E1',
    marginBottom: 20,
  },
  missionQuote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#60A5FA',
  },
  quoteText: {
    flex: 1,
    fontSize: 15,
    fontStyle: 'italic',
    color: '#E2E8F0',
    marginLeft: 12,
  },
  statsSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#60A5FA',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#CBD5E1',
    textAlign: 'center',
  },
  featuresSection: {
    marginBottom: 40,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  featureCard: {
    width: '47%',
    marginBottom: 16,
  },
  featureGradient: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 28,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  teamSection: {
    marginBottom: 40,
  },
  teamGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  teamCard: {
    width: '47%',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  teamAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamEmoji: {
    fontSize: 32,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  teamRole: {
    fontSize: 13,
    color: '#60A5FA',
    textAlign: 'center',
  },
  valuesSection: {
    marginBottom: 40,
  },
  valuesList: {
    gap: 16,
  },
  valueItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  valueTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  valueDescription: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
  },
  appInfoCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  appInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  appInfoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoLabel: {
    fontSize: 15,
    color: '#94A3B8',
  },
  infoValue: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  linkText: {
    color: '#60A5FA',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rateButton: {
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 1,
  },
  footerText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 8,
  },
  copyright: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 20,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default AboutScreen;