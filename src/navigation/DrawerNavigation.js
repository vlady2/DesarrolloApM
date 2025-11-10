import { MaterialIcons } from '@expo/vector-icons';
import { createDrawerNavigator } from '@react-navigation/drawer';

// import local screens
import SettingScreen from '../screens/SettingScreen';
import TabNavigator from './TabNavigator';

const Drawer = createDrawerNavigator();

export default function DrawerNavigation({ navigation }) {
    return (
        <Drawer.Navigator>
            <Drawer.Screen name="Inicio" component={TabNavigator}
                options={{
                    headerShown: false,
                    drawerIcon: ({ color }) => (<MaterialIcons name='home' size={25} color={color} />)
                    }}
            />
            <Drawer.Screen name="Config" component={SettingScreen}
                options={{
                    // headerShown: false,
                    drawerIcon: ({ color }) => (<MaterialIcons name='settings' size={25} color={color} />)
                }}
            />
        </Drawer.Navigator>
    )
}