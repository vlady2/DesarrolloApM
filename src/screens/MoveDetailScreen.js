// MoveDetailScreen.js
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
import { getBoxesByMoveId } from '../../firebase/boxService';
import { deleteMove } from '../../firebase/moveService';

// ✅ FUNCIÓN: Verificar estado de la mudanza con permisos
const getMoveStatus = (move) => {
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

    if (todayStr === moveDateStr) {
        return {
            status: 'Hoy',
            color: '#F44336',
            icon: 'warning',
            canEdit: false,
            canDelete: false,
            canEditBoxes: false,
            canDeleteBoxes: false
        };
    }

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

    if (today > moveDate) {
        return {
            status: 'Completada',
            color: '#888',
            icon: 'checkmark-done',
            canEdit: false,
            canDelete: false,
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
    const { moveId, moveOrigin, moveDestination, moveType } = route.params;
    const [move, setMove] = useState({
        id: moveId,
        origin: moveOrigin,
        destination: moveDestination,
        moveType: moveType
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

    useEffect(() => {
        loadMoveDetails();
        loadBoxes();
    }, [moveId]);

    const loadMoveDetails = async () => {
        try {
            // TODO: Implementar función getMoveById en moveService
            // Por ahora usamos los datos del parámetro
            console.log('🟡 Cargando detalles de mudanza:', moveId);
        } catch (error) {
            console.log('❌ Error cargando detalles:', error);
        }
    };

    const loadBoxes = async () => {
        try {
            console.log('🟡 Buscando cajas para moveId:', moveId);
            const boxesList = await getBoxesByMoveId(moveId);
            console.log('🟢 Total cajas encontradas:', boxesList.length, 'para moveId:', moveId);
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
        return getMoveStatus(move);
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

        // ✅ Cerrar el modal primero
        closeActionsModal();

        // ✅ Esperar un momento para que el modal se cierre completamente
        setTimeout(() => {
            // ✅ Ahora mostrar la alerta de confirmación
            Alert.alert(
                'Eliminar Mudanza',
                `¿Estás seguro de eliminar la mudanza "${moveOrigin || 'Origen'} → ${moveDestination || 'Destino'}"?`,
                [
                    {
                        text: 'Cancelar',
                        style: 'cancel',
                        onPress: () => {
                            console.log('✅ Eliminación de mudanza cancelada por el usuario');
                            // NO hacer nada - el usuario canceló
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
                // ✅ IMPORTANTE: Evitar que la alerta se cierre al tocar fuera
                { cancelable: false }
            );
        }, 100); // Esperar 300ms para que el modal se cierre
    };

    const performDeleteMove = async () => {
        try {
            console.log('🟡 Eliminando mudanza:', moveId);
            await deleteMove(moveId);

            // ✅ Navegar después de eliminar
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

        // ✅ Cerrar el modal primero
        closeBoxModal();

        // ✅ Esperar un momento para que el modal se cierre completamente
        setTimeout(() => {
            // ✅ Ahora mostrar la alerta de confirmación
            Alert.alert(
                'Eliminar Caja',
                `¿Estás seguro de eliminar "${boxItem.nombre || 'esta caja'}"?`,
                [
                    {
                        text: 'Cancelar',
                        style: 'cancel',
                        onPress: () => {
                            console.log('✅ Eliminación de caja cancelada por el usuario');
                            // NO hacer nada - el usuario canceló
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
                // ✅ IMPORTANTE: Evitar que la alerta se cierre al tocar fuera
                { cancelable: false }
            );
        }, 100); // Esperar 300ms para que el modal se cierre
    };

    const performDeleteBox = async (boxItem) => {
        try {
            console.log('🟡 Eliminando caja:', boxItem.id, 'de mudanza:', moveId);
            await deleteBox(moveId, boxItem.id);

            // ✅ Actualizar la lista después de eliminar
            setBoxes(prevBoxes => prevBoxes.filter(item => item.id !== boxItem.id));

            // ✅ Mostrar confirmación
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
            origin: moveOrigin,
            destination: moveDestination,
            moveType: moveType,
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
            moveOrigin: moveOrigin,
            moveDestination: moveDestination,
            moveType: moveType,
            origin: 'MoveDetail'
        });
    };

    const navigateToNewBox = () => {
        const moveStatus = getMoveStatusForMove();

        if (!moveStatus.canEditBoxes) {
            Alert.alert(
                `Mudanza ${moveStatus.status}`,
                `No puedes agregar cajas a mudanzas que están ${moveStatus.status.toLowerCase()}.`,
                [{ text: 'Entendido' }]
            );
            return;
        }

        navigation.navigate('NewBox', {
            moveId: moveId,
            origin: moveOrigin,
            destination: moveDestination,
            moveType: moveType,
            originScreen: 'MoveDetail'
        });
    };

    const getMoveTypeLabel = () => {
        switch (moveType) {
            case 'residential': return '🚚 Mudanza Residencial';
            case 'office': return '🏢 Mudanza de Oficina';
            case 'student': return '🎓 Mudanza Estudiantil';
            case 'international': return '🌎 Mudanza Internacional';
            case 'storage': return '📦 Solo Almacenamiento';
            case 'other': return '🏠 Otro tipo';
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

    const moveStatus = getMoveStatusForMove();
    const totalItems = getTotalItems();
    const totalWeight = getTotalWeight();
    const fragileBoxes = getFragileBoxesCount();
    const boxesByRoom = getBoxesByRoom();

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
                    <TouchableOpacity onPress={navigateToEditMove} style={styles.headerButton}>
                        <Ionicons name="create" size={24} color="#2196F3" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={openActionsModal} style={styles.headerButton}>
                        <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.content}>
                {/* Título Principal */}
                <View style={styles.mainTitleSection}>
                    <Text style={styles.mainTitle}>
                        {moveOrigin} → {moveDestination}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: moveStatus.color }]}>
                        <Text style={styles.statusText}>{moveStatus.status}</Text>
                    </View>
                </View>

                {/* Estadísticas */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Ionicons name="cube" size={24} color="#FF6B6B" />
                        <Text style={styles.statNumber}>{boxes.length}</Text>
                        <Text style={styles.statLabel}>Cajas</Text>
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

                {/* Información de la Mudanza */}
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
                        <View style={styles.infoRow}>
                            <Ionicons name="location" size={20} color="#2196F3" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Origen</Text>
                                <Text style={styles.infoValue}>{moveOrigin || 'No especificado'}</Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="flag" size={20} color="#4CAF50" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Destino</Text>
                                <Text style={styles.infoValue}>{moveDestination || 'No especificado'}</Text>
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
                                {boxes.length} cajas en total
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
                                    <Text style={styles.roomCount}>{roomBoxes.length} caja{roomBoxes.length !== 1 ? 's' : ''}</Text>
                                </View>

                                {roomBoxes.map((box, index) => (
                                    <TouchableOpacity
                                        key={box.id || index}
                                        style={[styles.boxCard, box.isFragile && styles.fragileBox]}
                                        onPress={() => openBoxModal(box)}
                                    >
                                        <View style={styles.boxHeader}>
                                            <Text style={styles.boxName}>
                                                {box.nombre || 'Caja sin nombre'}
                                                {box.isFragile && ' 🚨'}
                                            </Text>
                                            <View style={styles.boxIcons}>
                                                {box.peso && (
                                                    <View style={styles.boxStat}>
                                                        <Ionicons name="scale" size={12} color="#888" />
                                                        <Text style={styles.boxStatText}>{box.peso} kg</Text>
                                                    </View>
                                                )}
                                                <Text style={styles.boxItemCount}>
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
                                        {box.items?.slice(0, 2).map((item, itemIndex) => (
                                            <View key={itemIndex} style={styles.itemRow}>
                                                <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                                                <Text style={styles.itemText}>{item}</Text>
                                            </View>
                                        ))}

                                        {box.items?.length > 2 && (
                                            <View style={styles.moreItemsContainer}>
                                                <Ionicons name="ellipsis-horizontal" size={14} color="#BB86FC" />
                                                <Text style={styles.moreItems}>
                                                    Ver {box.items.length - 2} artículo{box.items.length - 2 !== 1 ? 's' : ''} más...
                                                </Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
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

                {/* Información adicional */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📝 Notas Adicionales</Text>
                    <View style={styles.infoCard}>
                        <Text style={styles.notesText}>
                            {move.notes || 'No hay notas adicionales para esta mudanza.'}
                        </Text>
                    </View>
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
                                            <Ionicons name="alert-circle" size={40} color="#666" />
                                            <Text style={styles.modalEmptyText}>No hay artículos en esta caja</Text>
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
    },
    headerButton: {
        padding: 4,
        marginLeft: 12,
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
    statLabel: {
        fontSize: 12,
        color: '#BB86FC',
        marginTop: 4,
        textAlign: 'center',
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
    boxDescription: {
        fontSize: 14,
        color: '#BB86FC',
        marginBottom: 12,
        fontStyle: 'italic',
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
    notesText: {
        fontSize: 14,
        color: '#FFFFFF',
        lineHeight: 20,
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
        color: '#888',
        fontSize: 16,
        marginTop: 12,
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