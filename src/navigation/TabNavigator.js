import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; //nuevo
import { TouchableOpacity } from 'react-native';

// import local screens
import GenresScreen from '../screens/GenerosScreen';
import StackNavigator from './StackNavigator';

const Tab = createBottomTabNavigator();//nuevo

const openDrawer = ({navigation}) => {
    return(
        <TouchableOpacity onPress={()=> navigation.openDrawer()}>
            <MaterialIcons name='menu' size={25} color={"blue"}/>
        </TouchableOpacity>
        
    )
}

export default function TabNavigator({navigation}) {//nueva: Pegar debajo de StackNavigator
    return (
        <Tab.Navigator
           screenOptions={{//definiendo colores para cuando el tab esté activo o inactivo
            tabBarActiveTintColor: 'blue',
            tabBarInactiveTintColor: 'gray',
           }}
        >
            <Tab.Screen name="Homes" component={StackNavigator}
               options={{
                headerShown: false,
                tabBarIcon: ({color}) => (<MaterialIcons name='home' size={25} color={color}/>)
                }}
            />
            <Tab.Screen name="Genres" component={GenresScreen} 
              options={{
                headerLeft: (() => (openDrawer({navigation}))),
                tabBarIcon: ({color}) => (<MaterialIcons name='music-note' size={25} color={color}/>)
               }}
            />
        </Tab.Navigator>
    );
}