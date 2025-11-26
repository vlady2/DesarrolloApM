import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import 'react-native-gesture-handler';
import LoginScreen from './src/screens/auth_users/LogInScreen';
import RegisterScreen from './src/screens/auth_users/RegisterScreen';


// Usa tu Drawer principal


// Main Screens
import EditTripScreen from './src/screens/EditTripScreen';
import HomeScreen from './src/screens/HomeScreen';
import MyTripsScreen from './src/screens/MyTripsScreen';
import NewMaletaScreen from './src/screens/NewMaletaScreen';
import NewTripScreen from './src/screens/NewTripScreen';
import SettingScreen from './src/screens/SettingScreen';
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
          name="Home" 
          component={HomeScreen}
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
          name="Setting" 
          component={SettingScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
