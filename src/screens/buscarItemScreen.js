import { useState } from "react";
import {
    ActivityIndicator,
    Button,
    ScrollView,
    TextInput,
    View
} from "react-native";
import { buscarItemConIA, getMaletasConItems } from "../../firebase/iaService";
import ChatBubble from "./chatIAB";

export default function buscarItemScreen({ route }) {
  const { viajeId } = route.params; // Viaje seleccionado
  const [pregunta, setPregunta] = useState("");
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!pregunta.trim()) return;

    setMensajes((prev) => [...prev, { text: pregunta, isUser: true }]);
    setLoading(true);

    try {
      // 1. Traer maletas + items
      const maletas = await getMaletasConItems(viajeId);

      // 2. Usar IA
      const respuesta = await buscarItemConIA(pregunta, maletas);

      // 3. Añadir respuesta al chat
      setMensajes((prev) => [...prev, { text: respuesta, isUser: false }]);

    } catch (e) {
      setMensajes((prev) => [
        ...prev,
        { text: "Error al procesar la consulta.", isUser: false },
      ]);
    }

    setLoading(false);
    setPregunta("");
  };

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <ScrollView style={{ flex: 1 }}>
        {mensajes.map((msg, index) => (
          <ChatBubble key={index} text={msg.text} isUser={msg.isUser} />
        ))}

        {loading && <ActivityIndicator size="large" style={{ marginTop: 10 }} />}
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 10,
        }}
      >
        <TextInput
          placeholder="Pregúntame por un item..."
          value={pregunta}
          onChangeText={setPregunta}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            borderRadius: 10,
          }}
        />
        <Button title="Buscar" onPress={handleSearch} />
      </View>
    </View>
  );
}
