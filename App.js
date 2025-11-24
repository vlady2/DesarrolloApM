import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth Screens
import LoginScreen from './src/screens/auth_users/LogInScreen';
import RegisterScreen from './src/screens/auth_users/RegisterScreen';

// Main Screens
import HomeScreen from './src/screens/HomeScreen';
import ItemsInBoxScreen from './src/screens/ItemsInBoxScreen';
import MyTripsScreen from './src/screens/MyTripsScreen';
import NewMoveScreen from './src/screens/NewMoveScreen';
import NewTripScreen from './src/screens/NewTripScreen';
import SettingScreen from './src/screens/SettingScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {/* Auth Screens */}
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
        
        {/* Main Screens */}
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
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
          name="MyTrips" 
          component={MyTripsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ItemsInBox" 
          component={ItemsInBoxScreen}
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