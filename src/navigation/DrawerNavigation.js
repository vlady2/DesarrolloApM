import { createDrawerNavigator } from '@react-navigation/drawer';
import SettingScreen from '../screens/SettingScreen';
import TabNavigator from './TabNavigator';

const Drawer = createDrawerNavigator();

export default function DrawerNavigation() {
    return (
        <Drawer.Navigator
            screenOptions={{
                headerShown: false,
                drawerStyle: {
                    backgroundColor: '#121212',
                    width: 240,
                },
                drawerLabelStyle: {
                    color: '#FFFFFF',
                },
                drawerActiveTintColor: '#BB86FC',
                drawerInactiveTintColor: '#888888',
            }}
        >
            <Drawer.Screen 
                name="Inicio" 
                component={TabNavigator}
                options={{
                    title: 'Inicio',
                }}
            />
            <Drawer.Screen 
                name="Configuración" 
                component={SettingScreen}
                options={{
                    title: 'Configuración',
                }}
            />
        </Drawer.Navigator>
    );
}