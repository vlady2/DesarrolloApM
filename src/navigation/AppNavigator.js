import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// import local screens

//----------------------------------
// import LoginScreen from '../screens/auth_old_withNode/LoginScreen';
// import RegisterScreen from '../screens/auth_old_withNode/RegisterScreen';
//----------------------------------------------
import LoginScreen from '../screens/auth_users/LogInScreen';
import RegisterScreen from '../screens/auth_users/RegisterScreen';
//------------------------------------------------

import DrawerNavigation from './DrawerNavigation';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name='Login' component={LoginScreen} />
                <Stack.Screen name='Register' component={RegisterScreen} />
                <Stack.Screen name='MainApp' component={DrawerNavigation} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}