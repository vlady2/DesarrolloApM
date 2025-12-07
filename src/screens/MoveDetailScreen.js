// MoveDetailScreen.js - VERSIÓN CORREGIDA
import { useEffect, useState } from 'react';
import {
    Alert,
    BackHandler,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { deleteBox, getBoxesByMoveId } from '../../firebase/boxService';
import { deleteMove, getMoveById } from '../../firebase/moveService';

// ✅ FUNCIÓN AUXILIAR: Verificar si una caja tiene items válidos
const hasBoxValidItems = (box) => {
    const items = box.items;
    if (!items) return false;
    
    if (Array.isArray(items) && items.length > 0) {
        return true;
    } else if (typeof items === 'string' && items.trim() !== '') {
        return true;
    } else if (typeof items === 'object' && items !== null) {
        return Object.keys(items).length > 0;
    }
    return false;
};

// ✅ FUNCIÓN CENTRAL MEJORADA: Verificar estado de la mudanza con permisos
const getMoveStatus = (move, boxes = []) => {
    // Si no hay fecha de mudanza, está planificada
    if (!move.moveDate) {
        return {
            status: 'Planificada',
            color: '#FFA500',
            icon: 'calendar-outline',
            canEdit: true,
            canDelete: true,
            canEditBoxes: true,
            canDeleteBoxes: true
        };
    }

    const today = new Date();
    let moveDate;

    try {
        if (move.moveDate.includes('/')) {
            const [day, month, year] = move.moveDate.split('/');
            moveDate = new Date(year, month - 1, day);
        } else {
            moveDate = new Date(move.moveDate);
        }
    } catch (error) {
        return {
            status: 'Planificada',
            color: '#FFA500',
            icon: 'calendar-outline',
            canEdit: true,
            canDelete: true,
            canEditBoxes: true,
            canDeleteBoxes: true
        };
    }

    if (isNaN(moveDate.getTime())) {
        return {
            status: 'Planificada',
            color: '#FFA500',
            icon: 'calendar-outline',
            canEdit: true,
            canDelete: true,
            canEditBoxes: true,
            canDeleteBoxes: true
        };
    }

    const todayStr = today.toDateString();
    const moveDateStr = moveDate.toDateString();

    // ✅ Verificar si hay cajas con items
    const boxesWithItems = boxes.filter(box => hasBoxValidItems(box)).length;
    const totalBoxes = boxes.length;
    
    // Si no hay cajas o todas están vacías
    const hasNoBoxesAtAll = totalBoxes === 0;
    const hasEmptyBoxes = totalBoxes > 0 && boxesWithItems === 0;
    
    // 🟡 HOY: Mudanza en curso
    if (todayStr === moveDateStr) {
        if (hasNoBoxesAtAll || hasEmptyBoxes) {
            return {
                status: 'Fallida',
                color: hasEmptyBoxes ? '#FF9800' : '#DC3545',
                icon: hasEmptyBoxes ? 'alert-circle' : 'close-circle',
                canEdit: false,
                canDelete: false,
                canEditBoxes: true, // Puede agregar cajas para intentar recuperar
                canDeleteBoxes: true
            };
        }
        return {
            status: 'En curso',
            color: '#4CAF50',
            icon: 'business',
            canEdit: false,
            canDelete: false,
            canEditBoxes: false,
            canDeleteBoxes: false
        };
    }

    // 📅 FECHA FUTURA: Pendiente
    if (today < moveDate) {
        return {
            status: 'Pendiente',
            color: '#FFA500',
            icon: 'time-outline',
            canEdit: true,
            canDelete: true,
            canEditBoxes: true,
            canDeleteBoxes: true
        };
    }

    // ✅ FECHA PASADA: Completada o Fallida
    if (today > moveDate) {
        if (hasNoBoxesAtAll || hasEmptyBoxes) {
            return {
                status: 'Fallida',
                color: hasEmptyBoxes ? '#FF9800' : '#DC3545',
                icon: hasEmptyBoxes ? 'alert-circle' : 'close-circle',
                canEdit: false,
                canDelete: true, // Puede eliminar si ya pasó
                canEditBoxes: false,
                canDeleteBoxes: false
            };
        }
        return {
            status: 'Completada',
            color: '#888',
            icon: 'checkmark-done',
            canEdit: false,
            canDelete: true,
            canEditBoxes: false,
            canDeleteBoxes: false
        };
    }

    return {
        status: 'Planificada',
        color: '#FFA500',
        icon: 'calendar-outline',
        canEdit: true,
        canDelete: true,
        canEditBoxes: true,
        canDeleteBoxes: true
    };
};

const MoveDetailScreen = ({ route, navigation }) => {
    const { moveId, moveOrigin, moveDestination, moveType, moveDate: paramMoveDate } = route.params;
    
    // ✅ CORREGIDO: Inicializar estado con datos de parámetros
    const [move, setMove] = useState({
        id: moveId,
        origin: moveOrigin || '',
        destination: moveDestination || '',
        moveType: moveType || 'residential',
        moveDate: paramMoveDate || null,
        notes: ''
    });
    
    const [boxes, setBoxes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBox, setSelectedBox] = useState(null);
    const [showBoxModal, setShowBoxModal] = useState(false);
    const [showActionsModal, setShowActionsModal] = useState(false);

    const insets = useSafeAreaInsets();

    useEffect(() => {
        const backAction = () => {
            if (navigation.isFocused()) {
                navigation.navigate('MyTrips');
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove();
    }, [navigation]);

    // ✅ CORREGIDO: Cargar datos siempre
    useEffect(() => {
        const loadData = async () => {
            await loadMoveDetails();
            await loadBoxes();
        };
        
        loadData();
    }, [moveId]);

    // ✅ Listener para cuando la pantalla recibe foco
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            console.log('🎯 MoveDetailScreen enfocada - recargando datos');
            loadMoveDetails();
            loadBoxes();
        });

        return unsubscribe;
    }, [navigation, moveId]);

    const loadMoveDetails = async () => {
        try {
            console.log('🟡 Cargando detalles de mudanza desde Firebase:', moveId);
            
            const moveData = await getMoveById(moveId);
            
            if (moveData) {
                console.log('✅ Datos cargados de Firebase:', {
                    origin: moveData.origin,
                    destination: moveData.destination,
                    moveType: moveData.moveType,
                    moveDate: moveData.moveDate
                });
                
                // ✅ Actualizar estado con TODOS los datos de Firebase
                setMove({
                    id: moveId,
                    origin: moveData.origin || '',
                    destination: moveData.destination || '',
                    moveType: moveData.moveType || 'residential',
                    moveDate: moveData.moveDate || null,
                    notes: moveData.notes || ''
                });
            } else {
                console.log('⚠️ No se encontraron datos en Firebase');
            }
            
        } catch (error) {
            console.log('❌ Error cargando detalles:', error);
        }
    };

    const loadBoxes = async () => {
        try {
            console.log('🟡 Buscando cajas para moveId:', moveId);
            const boxesList = await getBoxesByMoveId(moveId);
            console.log('🟢 Total cajas encontradas:', boxesList.length);
            setBoxes(boxesList);
        } catch (error) {
            console.log('❌ Error cargando cajas:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        console.log('📅 Fecha recibida en formatDate:', dateString);

        if (!dateString || dateString === 'undefined' || dateString === 'null') {
            return 'No especificada';
        }

        try {
            let date;

            if (dateString.includes('/') && dateString.split('/').length === 3) {
                const [day, month, year] = dateString.split('/');
                if (day && month && year && !isNaN(day) && !isNaN(month) && !isNaN(year)) {
                    date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                } else {
                    return 'Fecha inválida';
                }
            } else {
                date = new Date(dateString);
            }

            if (isNaN(date.getTime())) {
                return 'Fecha inválida';
            }

            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch (error) {
            console.error('❌ Error formateando fecha:', error, 'Fecha:', dateString);
            return 'Fecha inválida';
        }
    };

    const getMoveStatusForMove = () => {
        return getMoveStatus(move, boxes);
    };

    const getTotalItems = () => {
        return boxes.reduce((total, box) => {
            return total + (box.items?.length || 0);
        }, 0);
    };

    const getTotalWeight = () => {
        return boxes.reduce((total, box) => {
            return total + (parseFloat(box.peso) || 0);
        }, 0);
    };

    const getFragileBoxesCount = () => {
        return boxes.filter(box => box.isFragile).length;
    };

    const getBoxesWithItemsCount = () => {
        return boxes.filter(box => hasBoxValidItems(box)).length;
    };

    const getBoxesByRoom = () => {
        const rooms = {};
        boxes.forEach(box => {
            const room = box.habitacion || 'other';
            if (!rooms[room]) rooms[room] = [];
            rooms[room].push(box);
        });
        return rooms;
    };

    const openBoxModal = (boxItem) => {
        setSelectedBox(boxItem);
        setShowBoxModal(true);
    };

    const closeBoxModal = () => {
        setShowBoxModal(false);
        setSelectedBox(null);
    };

    const openActionsModal = () => {
        setShowActionsModal(true);
    };

    const closeActionsModal = () => {
        setShowActionsModal(false);
    };

    const handleDeleteMove = () => {
        const moveStatus = getMoveStatusForMove();

        if (!moveStatus.canDelete) {
            Alert.alert(
                `Mudanza ${moveStatus.status}`,
                `No puedes eliminar mudanzas que están ${moveStatus.status.toLowerCase()}.`,
                [{ text: 'Entendido' }]
            );
            closeActionsModal();
            return;
        }

        closeActionsModal();

        setTimeout(() => {
            Alert.alert(
                'Eliminar Mudanza',
                `¿Estás seguro de eliminar la mudanza "${move.origin || 'Origen'} → ${move.destination || 'Destino'}"?`,
                [
                    {
                        text: 'Cancelar',
                        style: 'cancel',
                        onPress: () => {
                            console.log('✅ Eliminación de mudanza cancelada');
                        }
                    },
                    {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: async () => {
                            console.log('✅ Usuario confirmó eliminación de mudanza');
                            await performDeleteMove();
                        }
                    }
                ],
                { cancelable: false }
            );
        }, 100);
    };

    const performDeleteMove = async () => {
        try {
            console.log('🟡 Eliminando mudanza:', moveId);
            await deleteMove(moveId);
            navigation.navigate('MyTrips');

        } catch (error) {
            console.error('❌ Error eliminando mudanza:', error);
            Alert.alert('Error', 'No se pudo eliminar la mudanza');
        }
    };

    const handleDeleteBox = (boxItem) => {
        const moveStatus = getMoveStatusForMove();

        if (!moveStatus.canDeleteBoxes) {
            Alert.alert(
                `Mudanza ${moveStatus.status}`,
                `No puedes eliminar cajas de mudanzas que están ${moveStatus.status.toLowerCase()}.`,
                [{ text: 'Entendido' }]
            );
            return;
        }

        closeBoxModal();

        setTimeout(() => {
            Alert.alert(
                'Eliminar Caja',
                `¿Estás seguro de eliminar "${boxItem.nombre || 'esta caja'}"?`,
                [
                    {
                        text: 'Cancelar',
                        style: 'cancel',
                        onPress: () => {
                            console.log('✅ Eliminación de caja cancelada');
                        }
                    },
                    {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: async () => {
                            console.log('✅ Usuario confirmó eliminación de caja');
                            await performDeleteBox(boxItem);
                        }
                    }
                ],
                { cancelable: false }
            );
        }, 100);
    };

    const performDeleteBox = async (boxItem) => {
        try {
            console.log('🟡 Eliminando caja:', boxItem.id, 'de mudanza:', moveId);
            await deleteBox(moveId, boxItem.id);
            setBoxes(prevBoxes => prevBoxes.filter(item => item.id !== boxItem.id));
            Alert.alert('✅', 'Caja eliminada correctamente');

        } catch (error) {
            console.error('❌ Error eliminando caja:', error);
            Alert.alert('Error', 'No se pudo eliminar la caja');
        }
    };

    const handleEditBox = (boxItem) => {
        const moveStatus = getMoveStatusForMove();

        if (!moveStatus.canEditBoxes) {
            Alert.alert(
                `Mudanza ${moveStatus.status}`,
                `No puedes editar cajas de mudanzas que están ${moveStatus.status.toLowerCase()}.`,
                [{ text: 'Entendido' }]
            );
            return;
        }

        closeBoxModal();
        navigation.navigate('NewBox', {
            moveId: moveId,
            origin: move.origin, // ✅ Usar datos del estado, no parámetros
            destination: move.destination,
            moveType: move.moveType,
            originScreen: 'MoveDetail',
            boxToEdit: boxItem,
            mode: 'edit'
        });
    };

    const goBack = () => {
        navigation.navigate('MyTrips');
    };

    const navigateToEditMove = () => {
        const moveStatus = getMoveStatusForMove();

        if (!moveStatus.canEdit) {
            Alert.alert(
                `Mudanza ${moveStatus.status}`,
                `No puedes editar mudanzas que están ${moveStatus.status.toLowerCase()}.`,
                [{ text: 'Entendido' }]
            );
            return;
        }

        navigation.navigate('EditMove', {
            moveId: moveId,
            moveOrigin: move.origin, // ✅ Usar datos del estado
            moveDestination: move.destination,
            moveType: move.moveType,
            origin: 'MoveDetail',
            moveDate: move.moveDate,
            notes: move.notes
        });
    };

    const navigateToNewBox = () => {
        const moveStatus = getMoveStatusForMove();

        if (!moveStatus.canEditBoxes) {
            if (moveStatus.status === 'Fallida' && moveStatus.canEditBoxes) {
                Alert.alert(
                    'Mudanza Fallida',
                    `Esta mudanza no tiene cajas con items. ¿Deseas agregar cajas ahora para recuperarla?`,
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                            text: 'Agregar Cajas',
                            onPress: () => {
                                navigation.navigate('NewBox', {
                                    moveId: moveId,
                                    origin: move.origin, // ✅ Usar datos del estado
                                    destination: move.destination,
                                    moveType: move.moveType,
                                    originScreen: 'MoveDetail',
                                    forceBoxes: true
                                });
                            }
                        }
                    ]
                );
                return;
            }
            
            Alert.alert(
                `Mudanza ${moveStatus.status}`,
                `No puedes agregar cajas a mudanzas que están ${moveStatus.status.toLowerCase()}.`,
                [{ text: 'Entendido' }]
            );
            return;
        }

        navigation.navigate('NewBox', {
            moveId: moveId,
            origin: move.origin, // ✅ Usar datos del estado
            destination: move.destination,
            moveType: move.moveType,
            originScreen: 'MoveDetail'
        });
    };

    const getMoveTypeLabel = () => {
        switch (move.moveType) { // ✅ Usar move.moveType del estado
            case 'residential': return '🏠 Mudanza residencial';
            case 'office': return '🏢 Mudanza para oficina';
            case 'personal': return '👤 Mudanza particular';
            case 'company': return '🏭 Mudanza para empresa';
            case 'other': return '🚚 Otro tipo de mudanza';
            default: return 'Tipo de mudanza';
        }
    };

    const getRoomLabel = (roomId) => {
        switch (roomId) {
            case 'living': return '🏠 Sala de Estar';
            case 'kitchen': return '🍳 Cocina';
            case 'bedroom': return '🛏️ Dormitorio';
            case 'bathroom': return '🚽 Baño';
            case 'office': return '💼 Oficina';
            case 'garage': return '🚗 Garaje';
            case 'other': return '📦 Otra Habitación';
            default: return roomId;
        }
    };

    // ✅ Agregar botón de recarga
    const handleRefresh = () => {
        loadMoveDetails();
        loadBoxes();
        Alert.alert('✅', 'Datos actualizados');
    };

    const moveStatus = getMoveStatusForMove();
    const totalItems = getTotalItems();
    const totalWeight = getTotalWeight();
    const fragileBoxes = getFragileBoxesCount();
    const boxesWithItems = getBoxesWithItemsCount();
    const boxesByRoom = getBoxesByRoom();
    
    const hasEmptyBoxes = boxes.length > 0 && boxesWithItems === 0;
    const hasNoBoxesAtAll = boxes.length === 0;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar backgroundColor="#121212" barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={goBack}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalle de Mudanza</Text>
                <View style={styles.headerActions}>
                    {/* Botón de actualizar */}
                    <TouchableOpacity 
                        onPress={handleRefresh} 
                        style={styles.headerButton}
                    >
                        <Ionicons name="refresh" size={22} color="#4CAF50" />
                    </TouchableOpacity>
                    
                    {/* Botón de editar */}
                    <TouchableOpacity 
                        onPress={navigateToEditMove} 
                        style={styles.headerButton}
                        disabled={!moveStatus.canEdit}
                    >
                        <Ionicons 
                            name="create" 
                            size={22} 
                            color={!moveStatus.canEdit ? "#666" : "#2196F3"} 
                        />
                    </TouchableOpacity>
                    
                    {/* Botón de acciones */}
                    <TouchableOpacity onPress={openActionsModal} style={styles.headerButton}>
                        <Ionicons name="ellipsis-vertical" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Título Principal - ✅ Usar move.origin y move.destination del estado */}
                <View style={styles.mainTitleSection}>
                    <Text style={styles.mainTitle}>
                        {move.origin || 'Origen no especificado'} → {move.destination || 'Destino no especificado'}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: moveStatus.color }]}>
                        <Text style={styles.statusText}>{moveStatus.status}</Text>
                    </View>
                </View>

                {/* Mensaje si está fallida */}
                {(moveStatus.status === 'Fallida' && (hasEmptyBoxes || hasNoBoxesAtAll)) && (
                    <View style={[
                        styles.failedMessageContainer,
                        hasEmptyBoxes ? styles.emptyItemsMessageContainer : styles.noItemsMessageContainer
                    ]}>
                        <Ionicons 
                            name={hasEmptyBoxes ? "alert-circle" : "warning"} 
                            size={20} 
                            color={hasEmptyBoxes ? "#FF9800" : "#DC3545"} 
                        />
                        <View style={styles.failedMessageContent}>
                            <Text style={[
                                styles.failedMessageTitle,
                                hasEmptyBoxes ? styles.emptyItemsMessage : styles.noItemsMessage
                            ]}>
                                {hasNoBoxesAtAll ? '¡Mudanza sin cajas!' : '¡Cajas vacías!'}
                            </Text>
                            <Text style={styles.failedMessageText}>
                                {hasNoBoxesAtAll 
                                    ? 'No hay cajas agregadas a esta mudanza.' 
                                    : `${boxes.length} caja${boxes.length !== 1 ? 's' : ''} pero ninguna tiene items.`
                                }
                            </Text>
                            {moveStatus.canEditBoxes && (
                                <TouchableOpacity
                                    style={[
                                        styles.recoveryButton,
                                        hasEmptyBoxes ? styles.emptyItemsButton : styles.noItemsButton
                                    ]}
                                    onPress={navigateToNewBox}
                                >
                                    <Ionicons name="add" size={18} color="#FFFFFF" />
                                    <Text style={styles.recoveryButtonText}>
                                        Agregar {hasNoBoxesAtAll ? 'Cajas' : 'Items'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {/* Estadísticas */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Ionicons 
                            name="cube" 
                            size={24} 
                            color={boxesWithItems > 0 ? "#FF6B6B" : (hasEmptyBoxes ? "#FF9800" : "#DC3545")} 
                        />
                        <Text style={[
                            styles.statNumber,
                            hasEmptyBoxes && styles.emptyItemsCount,
                            hasNoBoxesAtAll && styles.noItemsCount
                        ]}>
                            {boxes.length}
                        </Text>
                        <Text style={styles.statLabel}>Cajas</Text>
                        <Text style={[
                            styles.statSubtext,
                            hasEmptyBoxes && styles.emptyItemsSubtext,
                            hasNoBoxesAtAll && styles.noItemsSubtext
                        ]}>
                            {boxesWithItems} con items
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="list" size={24} color="#4CAF50" />
                        <Text style={styles.statNumber}>{totalItems}</Text>
                        <Text style={styles.statLabel}>Artículos</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="scale" size={24} color="#2196F3" />
                        <Text style={styles.statNumber}>{totalWeight} kg</Text>
                        <Text style={styles.statLabel}>Peso total</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="warning" size={24} color="#FFA500" />
                        <Text style={styles.statNumber}>{fragileBoxes}</Text>
                        <Text style={styles.statLabel}>Frágiles</Text>
                    </View>
                </View>

                {/* Información de la Mudanza - ✅ Usar datos del estado move */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📋 Información de la Mudanza</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Ionicons name="business" size={20} color="#BB86FC" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Tipo</Text>
                                <Text style={styles.infoValue}>{getMoveTypeLabel()}</Text>
                            </View>
                        </View>
                        {move.moveDate && (
                            <View style={styles.infoRow}>
                                <Ionicons name="calendar" size={20} color="#4CAF50" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Fecha</Text>
                                    <Text style={styles.infoValue}>{formatDate(move.moveDate)}</Text>
                                </View>
                            </View>
                        )}
                        <View style={styles.infoRow}>
                            <Ionicons name="location" size={20} color="#2196F3" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Origen</Text>
                                <Text style={styles.infoValue}>{move.origin || 'No especificado'}</Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="flag" size={20} color="#4CAF50" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Destino</Text>
                                <Text style={styles.infoValue}>{move.destination || 'No especificado'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Cajas por Habitación */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>
                                📦 Cajas por Habitación
                            </Text>
                            <Text style={styles.totalItems}>
                                {boxes.length} cajas en total • {boxesWithItems} con items
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.addButton,
                                !moveStatus.canEditBoxes && styles.disabledButton
                            ]}
                            onPress={navigateToNewBox}
                            disabled={!moveStatus.canEditBoxes}
                        >
                            <Ionicons
                                name="add"
                                size={20}
                                color={!moveStatus.canEditBoxes ? "#666" : "#FFFFFF"}
                            />
                            <Text style={[
                                styles.addButtonText,
                                !moveStatus.canEditBoxes && styles.disabledText
                            ]}>
                                Agregar
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {Object.keys(boxesByRoom).length > 0 ? (
                        Object.entries(boxesByRoom).map(([roomId, roomBoxes]) => (
                            <View key={roomId} style={styles.roomSection}>
                                <View style={styles.roomHeader}>
                                    <Text style={styles.roomTitle}>{getRoomLabel(roomId)}</Text>
                                    <Text style={styles.roomCount}>
                                        {roomBoxes.length} caja{roomBoxes.length !== 1 ? 's' : ''}
                                    </Text>
                                </View>

                                {roomBoxes.map((box, index) => {
                                    const hasItems = hasBoxValidItems(box);
                                    return (
                                        <TouchableOpacity
                                            key={box.id || index}
                                            style={[
                                                styles.boxCard, 
                                                box.isFragile && styles.fragileBox,
                                                !hasItems && styles.emptyBox
                                            ]}
                                            onPress={() => openBoxModal(box)}
                                        >
                                            <View style={styles.boxHeader}>
                                                <Text style={[
                                                    styles.boxName,
                                                    !hasItems && styles.emptyBoxName
                                                ]}>
                                                    {box.nombre || 'Caja sin nombre'}
                                                    {box.isFragile && ' 🚨'}
                                                    {!hasItems && ' (vacía)'}
                                                </Text>
                                                <View style={styles.boxIcons}>
                                                    {box.peso && (
                                                        <View style={styles.boxStat}>
                                                            <Ionicons name="scale" size={12} color="#888" />
                                                            <Text style={styles.boxStatText}>{box.peso} kg</Text>
                                                        </View>
                                                    )}
                                                    <Text style={[
                                                        styles.boxItemCount,
                                                        !hasItems && styles.emptyBoxCount
                                                    ]}>
                                                        {box.items?.length || 0} artículos
                                                    </Text>
                                                </View>
                                            </View>

                                            {box.descripcion && (
                                                <Text style={styles.boxDescription} numberOfLines={2}>
                                                    {box.descripcion}
                                                </Text>
                                            )}

                                            {/* Vista previa de artículos */}
                                            {hasItems && box.items?.slice(0, 2).map((item, itemIndex) => (
                                                <View key={itemIndex} style={styles.itemRow}>
                                                    <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                                                    <Text style={styles.itemText}>{item}</Text>
                                                </View>
                                            ))}

                                            {!hasItems && (
                                                <View style={styles.emptyBoxWarning}>
                                                    <Ionicons name="alert-circle" size={14} color="#FF9800" />
                                                    <Text style={styles.emptyBoxWarningText}>
                                                        Esta caja no tiene artículos
                                                    </Text>
                                                </View>
                                            )}

                                            {hasItems && box.items?.length > 2 && (
                                                <View style={styles.moreItemsContainer}>
                                                    <Ionicons name="ellipsis-horizontal" size={14} color="#BB86FC" />
                                                    <Text style={styles.moreItems}>
                                                        Ver {box.items.length - 2} artículo{box.items.length - 2 !== 1 ? 's' : ''} más...
                                                    </Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="cube-outline" size={50} color="#666" />
                            <Text style={styles.emptyStateText}>No hay cajas agregadas</Text>
                            <Text style={styles.emptyStateSubtext}>
                                {!moveStatus.canEditBoxes
                                    ? `No puedes agregar cajas a mudanzas ${moveStatus.status.toLowerCase()}`
                                    : 'Agrega cajas para organizar tus artículos por habitación'
                                }
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Modal para ver todos los artículos de una caja */}
            <Modal
                visible={showBoxModal}
                transparent
                animationType="slide"
                onRequestClose={closeBoxModal}
            >
                <TouchableWithoutFeedback onPress={closeBoxModal}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <View style={styles.modalTitleContainer}>
                                        <Text style={styles.modalTitle}>
                                            {selectedBox?.nombre || 'Caja'}
                                            {selectedBox?.isFragile && ' 🚨 FRÁGIL'}
                                        </Text>
                                        <Text style={styles.modalSubtitle}>
                                            {getRoomLabel(selectedBox?.habitacion)} • {selectedBox?.items?.length || 0} artículos
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.modalCloseButton}
                                        onPress={closeBoxModal}
                                    >
                                        <Ionicons name="close" size={24} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>

                                {/* Información de la caja */}
                                <View style={styles.modalInfo}>
                                    <View style={styles.modalInfoRow}>
                                        <Text style={styles.modalInfoLabel}>Tipo:</Text>
                                        <Text style={styles.modalInfoValue}>
                                            {selectedBox?.tipo === 'fragile' ? 'Caja Frágil' :
                                                selectedBox?.tipo === 'small' ? 'Caja Pequeña' :
                                                    selectedBox?.tipo === 'medium' ? 'Caja Mediana' :
                                                        selectedBox?.tipo === 'large' ? 'Caja Grande' :
                                                            selectedBox?.tipo === 'extra_large' ? 'Caja Extra Grande' :
                                                                selectedBox?.tipo === 'wardrobe' ? 'Caja Ropero' : 'Caja'}
                                        </Text>
                                    </View>
                                    {selectedBox?.peso && (
                                        <View style={styles.modalInfoRow}>
                                            <Text style={styles.modalInfoLabel}>Peso:</Text>
                                            <Text style={styles.modalInfoValue}>{selectedBox.peso} kg</Text>
                                        </View>
                                    )}
                                    {selectedBox?.descripcion && (
                                        <View style={styles.modalInfoRow}>
                                            <Text style={styles.modalInfoLabel}>Descripción:</Text>
                                            <Text style={styles.modalInfoValue}>{selectedBox.descripcion}</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Lista de todos los artículos */}
                                <ScrollView style={styles.modalList}>
                                    {selectedBox?.items?.map((item, index) => (
                                        <View key={index} style={styles.modalItem}>
                                            <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                                            <Text style={styles.modalItemText}>{item}</Text>
                                        </View>
                                    ))}

                                    {(!selectedBox?.items || selectedBox.items.length === 0) && (
                                        <View style={styles.modalEmpty}>
                                            <Ionicons name="alert-circle" size={40} color="#FF9800" />
                                            <Text style={styles.modalEmptyText}>¡Esta caja está vacía!</Text>
                                            <Text style={styles.modalEmptySubtext}>
                                                No hay artículos en esta caja
                                            </Text>
                                        </View>
                                    )}
                                </ScrollView>

                                {/* Footer del Modal con acciones */}
                                <View style={styles.modalFooter}>
                                    <TouchableOpacity
                                        style={[
                                            styles.modalActionButton,
                                            styles.editButton,
                                            !moveStatus.canEditBoxes && styles.disabledButton
                                        ]}
                                        onPress={() => {
                                            console.log('✏️ Editando caja:', selectedBox?.id);
                                            handleEditBox(selectedBox);
                                        }}
                                        disabled={!moveStatus.canEditBoxes}
                                    >
                                        <Ionicons
                                            name="create"
                                            size={20}
                                            color={!moveStatus.canEditBoxes ? "#666" : "#FFFFFF"}
                                        />
                                        <Text style={[
                                            styles.modalActionText,
                                            !moveStatus.canEditBoxes && styles.disabledText
                                        ]}>
                                            Editar
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.modalActionButton,
                                            styles.deleteButton,
                                            !moveStatus.canDeleteBoxes && styles.disabledButton
                                        ]}
                                        onPress={() => {
                                            console.log('🗑️ Solicitando eliminación de caja:', selectedBox?.id);
                                            handleDeleteBox(selectedBox);
                                        }}
                                        disabled={!moveStatus.canDeleteBoxes}
                                    >
                                        <Ionicons
                                            name="trash"
                                            size={20}
                                            color={!moveStatus.canDeleteBoxes ? "#666" : "#FFFFFF"}
                                        />
                                        <Text style={[
                                            styles.modalActionText,
                                            !moveStatus.canDeleteBoxes && styles.disabledText
                                        ]}>
                                            Eliminar
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Modal de Acciones de la Mudanza */}
            <Modal
                visible={showActionsModal}
                transparent
                animationType="slide"
                onRequestClose={closeActionsModal}
            >
                <TouchableWithoutFeedback onPress={closeActionsModal}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Acciones de la Mudanza</Text>
                                    <TouchableOpacity
                                        style={styles.modalCloseButton}
                                        onPress={closeActionsModal}
                                    >
                                        <Ionicons name="close" size={24} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.actionsList}>
                                    <TouchableOpacity
                                        style={[
                                            styles.actionItem,
                                            !moveStatus.canDelete && styles.disabledAction
                                        ]}
                                        onPress={() => {
                                            console.log('🗑️ Solicitando eliminación de mudanza:', moveId);
                                            handleDeleteMove();
                                        }}
                                        disabled={!moveStatus.canDelete}
                                    >
                                        <Ionicons
                                            name="trash"
                                            size={24}
                                            color={!moveStatus.canDelete ? "#666" : "#F44336"}
                                        />
                                        <View style={styles.actionTextContainer}>
                                            <Text style={[
                                                styles.actionTitle,
                                                !moveStatus.canDelete && styles.disabledText
                                            ]}>
                                                Eliminar Mudanza
                                            </Text>
                                            <Text style={styles.actionSubtitle}>
                                                {!moveStatus.canDelete
                                                    ? `No disponible - Mudanza ${moveStatus.status}`
                                                    : 'Eliminar esta mudanza permanentemente'
                                                }
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalFooter}>
                                    <TouchableOpacity
                                        style={styles.modalActionButton}
                                        onPress={closeActionsModal}
                                    >
                                        <Text style={styles.modalActionText}>Cancelar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10, // ✅ Espacio entre botones
    },
    headerButton: {
        padding: 4,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    mainTitleSection: {
        alignItems: 'center',
        marginBottom: 25,
        paddingVertical: 15,
    },
    mainTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 10,
    },
    statusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    // Mensaje de fallido
    failedMessageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
        gap: 12,
    },
    emptyItemsMessageContainer: {
        backgroundColor: 'rgba(255, 152, 0, 0.15)',
        borderLeftWidth: 4,
        borderLeftColor: '#FF9800',
    },
    noItemsMessageContainer: {
        backgroundColor: 'rgba(220, 53, 69, 0.15)',
        borderLeftWidth: 4,
        borderLeftColor: '#DC3545',
    },
    failedMessageContent: {
        flex: 1,
    },
    failedMessageTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    emptyItemsMessage: {
        color: '#FF9800',
    },
    noItemsMessage: {
        color: '#DC3545',
    },
    failedMessageText: {
        fontSize: 14,
        color: '#FFFFFF',
        marginBottom: 10,
    },
    recoveryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    emptyItemsButton: {
        backgroundColor: '#FF9800',
    },
    noItemsButton: {
        backgroundColor: '#DC3545',
    },
    recoveryButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    // Estadísticas
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#1E1E1E',
        borderRadius: 15,
        padding: 20,
        marginBottom: 25,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 8,
    },
    emptyItemsCount: {
        color: '#FF9800',
    },
    noItemsCount: {
        color: '#DC3545',
    },
    statLabel: {
        fontSize: 12,
        color: '#BB86FC',
        marginTop: 4,
        textAlign: 'center',
    },
    statSubtext: {
        fontSize: 10,
        color: '#888',
        marginTop: 2,
    },
    emptyItemsSubtext: {
        color: '#FF9800',
    },
    noItemsSubtext: {
        color: '#DC3545',
    },
    section: {
        marginBottom: 30,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    totalItems: {
        fontSize: 14,
        color: '#BB86FC',
        marginTop: 4,
    },
    infoCard: {
        backgroundColor: '#1E1E1E',
        padding: 20,
        borderRadius: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#FF6B6B',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    infoContent: {
        marginLeft: 12,
        flex: 1,
    },
    infoLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    roomSection: {
        marginBottom: 20,
    },
    roomHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    roomTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    roomCount: {
        fontSize: 14,
        color: '#888',
    },
    boxCard: {
        backgroundColor: '#1E1E1E',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    fragileBox: {
        borderLeftColor: '#FFA500',
        backgroundColor: 'rgba(255, 165, 0, 0.05)',
    },
    emptyBox: {
        borderLeftColor: '#FF9800',
        backgroundColor: 'rgba(255, 152, 0, 0.05)',
    },
    boxHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    boxName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        flex: 1,
    },
    emptyBoxName: {
        color: '#FF9800',
    },
    boxIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    boxStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    boxStatText: {
        fontSize: 12,
        color: '#888',
    },
    boxItemCount: {
        fontSize: 14,
        color: '#888',
    },
    emptyBoxCount: {
        color: '#FF9800',
    },
    boxDescription: {
        fontSize: 14,
        color: '#BB86FC',
        marginBottom: 12,
        fontStyle: 'italic',
    },
    emptyBoxWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        borderRadius: 6,
        marginBottom: 10,
        gap: 8,
    },
    emptyBoxWarningText: {
        color: '#FF9800',
        fontSize: 12,
        fontWeight: '500',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingLeft: 4,
    },
    itemText: {
        color: '#FFFFFF',
        fontSize: 14,
        marginLeft: 10,
        flex: 1,
    },
    moreItemsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        padding: 8,
        backgroundColor: 'rgba(187, 134, 252, 0.1)',
        borderRadius: 8,
    },
    moreItems: {
        color: '#BB86FC',
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 6,
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
    },
    emptyStateText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 16,
    },
    emptyStateSubtext: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginLeft: 4,
    },
    // Estilos del Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#1E1E1E',
        borderRadius: 15,
        width: '90%',
        maxHeight: '80%',
        overflow: 'hidden',
    },
    modalHeader: {
        backgroundColor: '#2A2A2A',
        padding: 20,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        position: 'relative',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    modalTitleContainer: {
        flex: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#BB86FC',
        marginTop: 4,
    },
    modalInfo: {
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    modalInfoRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    modalInfoLabel: {
        fontSize: 14,
        color: '#888',
        width: 100,
    },
    modalInfoValue: {
        fontSize: 14,
        color: '#FFFFFF',
        flex: 1,
    },
    modalCloseButton: {
        padding: 4,
    },
    modalList: {
        maxHeight: 350,
        padding: 16,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    modalItemText: {
        color: '#FFFFFF',
        fontSize: 16,
        marginLeft: 12,
        flex: 1,
    },
    modalEmpty: {
        alignItems: 'center',
        padding: 40,
    },
    modalEmptyText: {
        color: '#FF9800',
        fontSize: 16,
        marginTop: 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalEmptySubtext: {
        color: '#888',
        fontSize: 14,
        marginTop: 4,
        textAlign: 'center',
    },
    modalFooter: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#333',
        flexDirection: 'row',
        gap: 12,
    },
    modalActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 10,
        gap: 8,
    },
    editButton: {
        backgroundColor: '#2196F3',
    },
    deleteButton: {
        backgroundColor: '#F44336',
    },
    modalActionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    actionsList: {
        padding: 16,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 10,
        backgroundColor: '#2A2A2A',
    },
    disabledAction: {
        opacity: 0.5,
    },
    actionTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    actionSubtitle: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    disabledButton: {
        backgroundColor: '#666',
    },
    disabledText: {
        color: '#999',
    },
});

export default MoveDetailScreen;