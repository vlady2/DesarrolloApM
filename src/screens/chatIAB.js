import { useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { callGroq } from "../utils/groqApi";
import { buscarItemEnFirebase } from "./buscarItemScreen";

const ChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const enviarMensaje = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    // 1. IA GROQ extrae el artículo
    const itemBuscado = await callGroq(input);

    // 2. Buscar en Firebase
    const resultado = await buscarItemEnFirebase(itemBuscado);

    let respuesta = "";

    if (resultado) {
      respuesta = `El artículo "${resultado.articulo}" está en la maleta "${resultado.maleta.nombre}" del viaje "${resultado.viaje.nombre}".`;
    } else {
      respuesta = "No encontré ese artículo en tus maletas 🧳.";
    }

    const botMsg = { role: "bot", text: respuesta };
    setMessages((prev) => [...prev, botMsg]);

    setInput("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        style={{ flex: 1 }}
        data={messages}
        renderItem={({ item }) => (
          <View
            style={{
              alignSelf: item.role === "user" ? "flex-end" : "flex-start",
              backgroundColor: item.role === "user" ? "#0084ff" : "#e6e6e6",
              padding: 10,
              borderRadius: 10,
              marginVertical: 5,
              maxWidth: "80%",
            }}
          >
            <Text style={{ color: item.role === "user" ? "#fff" : "#000" }}>
              {item.text}
            </Text>
          </View>
        )}
      />

      <View style={{ flexDirection: "row", gap: 10 }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Pregúntame por un artículo…"
          style={{
            flex: 1,
            backgroundColor: "#fff",
            padding: 10,
            borderRadius: 10,
          }}
        />
        <TouchableOpacity
          onPress={enviarMensaje}
          style={{
            backgroundColor: "#0084ff",
            padding: 10,
            borderRadius: 10,
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff" }}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
});

export default ChatScreen;