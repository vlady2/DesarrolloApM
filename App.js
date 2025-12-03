import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import 'react-native-gesture-handler';
import LoginScreen from './src/screens/auth_users/LogInScreen';
import RegisterScreen from './src/screens/auth_users/RegisterScreen';


// Usa tu Drawer principal


// Main Screens
import AboutScreen from './src/screens/AboutScreen';
import ArticulosProhibidosScreen from './src/screens/ArticulosProhibidosScreen';
import EditMoveScreen from './src/screens/EditMoveScreen';
import EditTripScreen from './src/screens/EditTripScreen';
import HomeScreen from './src/screens/HomeScreen';
import MaletasScreen from './src/screens/Maletascreen';
import MoveDetailScreen from './src/screens/MoveDetailScreen';
import MyTripsScreen from './src/screens/MyTripsScreen';
import NewBoxScreen from './src/screens/NewBoxScreen';
import NewMaletaScreen from './src/screens/NewMaletaScreen';
import NewMoveScreen from './src/screens/NewMoveScreen';
import NewTripScreen from './src/screens/NewTripScreen';
import SettingScreen from './src/screens/SettingScreen';
import TripDetailScreen from './src/screens/TripDetailScreen';
import helpSoportScreen from './src/screens/helpSoportScreen';


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
        name="help"
        component={helpSoportScreen}
        options={{headerShown: false}}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
