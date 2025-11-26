import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/auth_users/LogInScreen';
import RegisterScreen from './src/screens/auth_users/RegisterScreen';


// Usa tu Drawer principal
import DrawerNavigation from './src/navigation/DrawerNavigation';

// Main Screens
import EditTripScreen from './src/screens/EditTripScreen';
import NewMaletaScreen from './src/screens/NewMaletaScreen';
import TripDetailScreen from './src/screens/TripDetailScreen';


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        
        {/* Auth */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ headerShown: false }}
        />

        {/* Navegación principal */}
        <Stack.Screen 
          name="Main" 
          component={DrawerNavigation}
          options={{ headerShown: false }}
        />

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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
