import { signOut } from 'firebase/auth';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth } from '../../firebase/auth';
import FloatingActionButton from '../components/FloatingActionButton';

const HomeScreen = ({ navigation }) => {
  const [userName, setUserName] = useState('Usuario');

  const menuItems = [
    {
      title: 'Mis Viajes',
      icon: 'airplane',
      color: '#4CAF50',
      onPress: () => navigation.navigate('MyTrips')
    },
    {
      title: 'Mis Mudanzas',
      icon: 'home',
      color: '#FF9800',
      onPress: () => console.log('Mis Mudanzas - En desarrollo')
    },
    {
      title: 'Artículos Prohibidos',
      icon: 'warning',
      color: '#F44336',
      onPress: () => console.log('Artículos Prohibidos - En desarrollo')
    },
    {
      title: 'Mis Maletas / Cajas',
      icon: 'briefcase',
      color: '#2196F3',
      onPress: () => navigation.navigate('ItemsInBox')
    },
    {
      title: 'Configuración',
      icon: 'settings',
      color: '#9C27B0',
      onPress: () => navigation.navigate('Config')
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

  const handleNewTrip = () => {
    navigation.navigate('NewTrip');
  };

  const handleNewMove = () => {
    console.log('Nueva Mudanza - En desarrollo');
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

  const renderMenuItem = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: item.color }]}
      onPress={item.onPress}
    >
      <Ionicons name={item.icon} size={32} color="#FFFFFF" />
      <Text style={styles.menuItemText}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={menuItems}
        renderItem={renderMenuItem}
        keyExtractor={(item, index) => index.toString()}
        numColumns={2}
        columnWrapperStyle={styles.menuGrid}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.menuContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <FloatingActionButton
        onNewTrip={handleNewTrip}
        onNewMove={handleNewMove}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    paddingTop: 40,
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
  menuContainer: {
    padding: 10,
    paddingBottom: 20,
  },
  menuGrid: {
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  menuItem: {
    width: '48%',
    height: 120,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
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