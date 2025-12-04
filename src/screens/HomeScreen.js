import { signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth } from '../../firebase/auth';

const HomeScreen = ({ navigation }) => {
  const [userName, setUserName] = useState('Usuario');
  const [userEmail, setUserEmail] = useState('');

  // ✅ Obtener información del usuario al cargar
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      // Intentar usar displayName, si no existe usar email
      const name = user.displayName || user.email?.split('@')[0] || 'Usuario';
      setUserName(name);
      setUserEmail(user.email || '');
      
      console.log('🏠 HomeScreen cargado para:', user.email);
    }
  }, []);

  // ✅ CORREGIDO: Manejar el botón físico de back en HomeScreen
  // ✅ CORREGIDO: Manejar el botón físico de back en HomeScreen
useEffect(() => {
  const backAction = () => {
    // En HomeScreen, el back físico debe cerrar sesión con confirmación
    if (navigation.isFocused()) {
      handleLogout(); // Esto ya usa replace('Login')
      return true; // Prevenir el comportamiento por defecto
    }
    return false;
  };

  const backHandler = BackHandler.addEventListener(
    'hardwareBackPress',
    backAction
  );

  return () => backHandler.remove();
}, [navigation, handleLogout]);

  // Definir los colores originales de cada botón
  const menuItems = [
    {
      title: 'Mis Viajes',
      icon: 'airplane',
      color: '#4CAF50',
      onPress: () => navigation.navigate('MyTrips')
    },
    {
      title: 'Artículos Prohibidos',
      icon: 'warning',
      color: '#F44336',
      onPress: () => navigation.navigate('ArticulosProhibidos')
    },
    {
      title: 'Configuración',
      icon: 'settings',
      color: '#9C27B0',
      onPress: () => navigation.navigate('Setting')
    },
    {
      title: 'Mis Maletas / Cajas',
      icon: 'briefcase',
      color: '#2196F3',
      onPress: () => navigation.navigate('Box')
    }
  ];

  // Función para cerrar sesión
  // En tu HomeScreen.js, en la función handleLogout
const handleLogout = () => {
  Alert.alert(
    'Cerrar Sesión',
    '¿Estás seguro de que quieres cerrar sesión?',
    [
      {
        text: 'Cancelar',
        style: 'cancel'
      },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('🔒 Cerrando sesión...');
            await signOut(auth);
            // ✅ CORREGIDO: Usar replace en lugar de reset
            navigation.replace('Login');
            console.log('✅ Sesión cerrada exitosamente');
          } catch (error) {
            console.error('❌ Error al cerrar sesión:', error);
            Alert.alert('Error', 'No se pudo cerrar sesión. Intenta de nuevo.');
          }
        }
      }
    ]
  );
};

  // ✅ CORREGIDO: Navegación con origen
  const handleNew = () => {
    // Mostrar opción para elegir entre Viaje o Mudanza
    Alert.alert(
      'Nuevo Movimiento',
      '¿Qué deseas crear?',
      [
        {
          text: 'Viaje',
          onPress: () => navigation.navigate('NewTrip', { 
            origin: 'Home' // 👈 PASAR ORIGEN A NEWTRIP
          })
        },
        {
          text: 'Mudanza',
          onPress: () => navigation.navigate('NewMove', {
            origin: 'Home' // 👈 PASAR ORIGEN A NEWMOVE
        })
        },
        {
          text: 'Cancelar',
          style: 'cancel'
        }
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        {/* Información del usuario a la izquierda */}
        <View style={styles.userInfoContainer}>
          <Text style={styles.greeting} numberOfLines={2} ellipsizeMode="tail">
            Hola, {userName}
          </Text>
          <Text style={styles.welcomeText}>
            ¿Qué deseas hacer hoy?
          </Text>
        </View>
        
        {/* Botón de cerrar sesión a la derecha */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#BB86FC" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMenuItem = (item, index) => (
    <TouchableOpacity
      key={index}
      style={[styles.menuItem, { backgroundColor: item.color }]}
      onPress={item.onPress}
    >
      <Ionicons name={item.icon} size={32} color="#FFFFFF" />
      <Text style={styles.menuItemText}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      {/* Botón NUEVO Grande */}
      <TouchableOpacity style={styles.newButton} onPress={handleNew}>
        <Ionicons name="add-circle" size={40} color="#FFFFFF" />
        <Text style={styles.newButtonText}>NUEVO</Text>
      </TouchableOpacity>

      {/* Grid de botones */}
      <View style={styles.menuGrid}>
        {/* Fila 1 */}
        <View style={styles.menuRow}>
          {renderMenuItem(menuItems[0], 0)}
          {renderMenuItem(menuItems[1], 1)}
        </View>

        {/* Fila 2 */}
        <View style={styles.menuRow}>
          {renderMenuItem(menuItems[2], 2)}
          {renderMenuItem(menuItems[3], 3)}
        </View>
        
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  userInfoContainer: {
    flex: 1,
    marginRight: 15,
  },
  greeting: {
    fontSize: 24, // Reducido de 28
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14, // Reducido de 16
    color: '#BB86FC',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  logoutButton: {
    padding: 10,
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  newButton: {
    backgroundColor: '#BB86FC',
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  newButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  menuGrid: {
    flex: 1,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  menuItem: {
    width: '48%',
    height: 120,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  menuItemText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default HomeScreen;