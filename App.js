import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import 'react-native-gesture-handler';

// Firebase
import { auth } from './firebase/auth';

// Loading
import LoadingScreen from './src/components/LoadingScreen';

// Auth Screens
import LoginScreen from './src/screens/auth_users/LogInScreen';
import RegisterScreen from './src/screens/auth_users/RegisterScreen';

// Main Screens
import AboutScreen from './src/screens/AboutScreen';
import ArticulosProhibidosScreen from './src/screens/ArticulosProhibidosScreen';
import EditMoveScreen from './src/screens/EditMoveScreen';
import EditTripScreen from './src/screens/EditTripScreen';
import HelpSoportScreen from './src/screens/HelpSoportScreen';
import HomeScreen from './src/screens/HomeScreen';
import MaletasScreen from './src/screens/Maletascreen';
import MapPickerMoveScreen from './src/screens/MapPickerMoveScreen';
import MapPickerScreen from './src/screens/MapPickerScreen';
import MoveDetailScreen from './src/screens/MoveDetailScreen';
import MyTripsScreen from './src/screens/MyTripsScreen';
import NewBoxScreen from './src/screens/NewBoxScreen';
import NewMaletaScreen from './src/screens/NewMaletaScreen';
import NewMoveScreen from './src/screens/NewMoveScreen';
import NewTripScreen from './src/screens/NewTripScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingScreen from './src/screens/SettingScreen';
import TripDetailScreen from './src/screens/TripDetailScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Suscribirse a cambios en el estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('🔄 Estado de autenticación:', 
        currentUser ? `Usuario: ${currentUser.email}` : 'No autenticado'
      );
      setUser(currentUser);
      setLoading(false);
    });

    // Limpiar suscripción al desmontar
    return unsubscribe;
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Define TODAS las pantallas */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ 
            headerShown: false,
            // Si el usuario está autenticado, ocultar Login del stack
            ...(user && { gestureEnabled: false, animationEnabled: false })
          }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ 
            headerShown: false,
            // Si NO hay usuario, ocultar Home del stack
            ...(!user && { gestureEnabled: false, animationEnabled: false })
          }}
        />
        
        {/* Todas las demás pantallas */}
        <Stack.Screen 
          name="NewMaleta" 
          component={NewMaletaScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="EditTrip" 
          component={EditTripScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="TripDetail" 
          component={TripDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MyTrips" 
          component={MyTripsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="NewTrip" 
          component={NewTripScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="NewMove"
          component={NewMoveScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Setting" 
          component={SettingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ArticulosProhibidos" 
          component={ArticulosProhibidosScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Box" 
          component={MaletasScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="NewBox" 
          component={NewBoxScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MoveDetail" 
          component={MoveDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="EditMove" 
          component={EditMoveScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Help"
          component={HelpSoportScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="MapPicker"
          component={MapPickerScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MapPickerMove"
          component={MapPickerMoveScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}