// src/components/ChatBubble.js
import { Text, View } from "react-native";

export default function chatIAB({ text, isUser }) {
  return (
    <View
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        backgroundColor: isUser ? "#007AFF" : "#E5E5EA",
        padding: 10,
        margin: 5,
        borderRadius: 15,
        maxWidth: "80%",
      }}
    >
      <Text style={{ color: isUser ? "white" : "black" }}>{text}</Text>
    </View>
  );
}