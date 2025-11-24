import { collection, getDocs } from "firebase/firestore";
import Groq from "groq-sdk";
import { db } from "./auth";

/* ========================================================
   1. Consultar todas las maletas + items desde Firebase
   ======================================================== */
export const getMaletasConItems = async (viajeId) => {
  const maletasRef = collection(db, `viajes/${viajeId}/maletas`);
  const snapMaletas = await getDocs(maletasRef);

  const maletas = [];

  for (const maletaDoc of snapMaletas.docs) {
    const itemsRef = collection(
      db,
      `viajes/${viajeId}/maletas/${maletaDoc.id}/items`
    );
    const snapItems = await getDocs(itemsRef);

    maletas.push({
      id: maletaDoc.id,
      ...maletaDoc.data(),
      items: snapItems.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })),
    });
  }

  return maletas;
};

/* ========================================================
   2. IA: Buscar item usando GROQ
   ======================================================== */
export const buscarItemConIA = async (pregunta, maletas) => {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY, //EXPO_PUBLIC_GROQ_KEY,
  });

  const systemMsg = `
Eres una IA que busca objetos dentro de maletas de viaje.
Basándote en la lista de maletas e items, identifica exactamente 
en qué maleta se encuentra el objeto consultado.
Si no existe, responde claramente.
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemMsg },
      {
        role: "user",
        content: `
Pregunta del usuario: "${pregunta}"
Datos: ${JSON.stringify(maletas)}
        `,
      },
    ],
    temperature: 0.2,
  });

  return response.choices[0].message.content;
};