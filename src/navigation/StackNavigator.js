import { MaterialIcons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';

// import local screens
import PlayListDetailScreen from '../screens/PlayListDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SongDetailScreen from '../screens/SongDetailScreen';

const Stack = createNativeStackNavigator();

const openDrawer = ({navigation}) => {
    return(
        <TouchableOpacity onPress={()=> navigation.openDrawer()}>
            <MaterialIcons name='menu' size={25} color={"blue"}/>
        </TouchableOpacity>
        
    )
}

export default function StackNavigator({navigation}) {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Perfil" component={ProfileScreen} 
               options={{
                headerLeft: (() => (openDrawer({navigation})))
               }}
            />
            <Stack.Screen name="DetallePlayList" component={PlayListDetailScreen} />
            <Stack.Screen name="SongDetailScreen" component={SongDetailScreen} />
        </Stack.Navigator>
    );
}