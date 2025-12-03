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

  // ✅ CORREGIDO: Manejar el botón físico de back en HomeScreen
  useEffect(() => {
    const backAction = () => {
      // En HomeScreen, el back físico debe salir de la app
      if (navigation.isFocused()) {
        Alert.alert(
          'Salir',
          '¿Estás seguro de que quieres salir de la aplicación?',
          [
            {
              text: 'Cancelar',
              style: 'cancel',
              onPress: () => null
            },
            {
              text: 'Salir',
              style: 'destructive',
              // ✅ CORREGIDO: Navegar a Login en lugar de exitApp()
              onPress: () => {
                console.log('🟡 Usuario eligió salir - Navegando a Login');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            }
          ]
        );
        return true; // Prevenir el comportamiento por defecto
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation]);

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
              await signOut(auth);
              // Redirigir al login
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              Alert.alert('Error', 'No se pudo cerrar sesión');
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
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.greeting}>Hola, {userName}</Text>
          <Text style={styles.subtitle}>¿Qué deseas hacer hoy?</Text>
        </View>
        {/* Botón de cerrar sesión */}
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#BB86FC',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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