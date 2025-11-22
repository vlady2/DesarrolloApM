import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const FloatingActionButton = ({ onNewTrip, onNewMove }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    
    Animated.spring(animation, {
      toValue,
      friction: 5,
      useNativeDriver: true,
    }).start();

    setIsOpen(!isOpen);
  };

  const tripStyle = {
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -80]
        })
      }
    ]
  };

  const moveStyle = {
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -160]
        })
      }
    ]
  };

  const rotation = {
    transform: [
      {
        rotate: animation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '45deg']
        })
      }
    ]
  };

  return (
    <View style={styles.container}>
      {/* Opción Mudanza */}
      <Animated.View style={[styles.option, moveStyle]}>
        <TouchableOpacity 
          style={[styles.optionButton, styles.moveButton]}
          onPress={() => {
            toggleMenu();
            onNewMove();
          }}
        >
          <Ionicons name="home" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.optionText}>Mudanza</Text>
      </Animated.View>

      {/* Opción Viaje */}
      <Animated.View style={[styles.option, tripStyle]}>
        <TouchableOpacity 
          style={[styles.optionButton, styles.tripButton]}
          onPress={() => {
            toggleMenu();
            onNewTrip();
          }}
        >
          <Ionicons name="airplane" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.optionText}>Viaje</Text>
      </Animated.View>

      {/* Botón Principal */}
      <TouchableOpacity 
        style={styles.mainButton}
        onPress={toggleMenu}
      >
        <Animated.View style={rotation}>
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    alignItems: 'center',
  },
  mainButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#BB86FC',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  option: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  tripButton: {
    backgroundColor: '#4CAF50',
  },
  moveButton: {
    backgroundColor: '#FF9800',
  },
  optionText: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default FloatingActionButton;