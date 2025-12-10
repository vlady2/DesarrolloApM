export const callGroq = async (pregunta) => {
  const prompt = `
    Devuelve únicamente el nombre del artículo mencionado. 
    No agregues texto adicional, solo el nombre limpio.
    Ejemplo de salida: "cepillo azul"

    Texto: "${pregunta}"
    Artículo:
  `;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer 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`
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1
    })
  });

  const data = await res.json();
  return data.choices[0].message.content.trim();
};