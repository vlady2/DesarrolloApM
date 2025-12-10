import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/auth";

export const buscarItemEnFirebase = async (nombreBuscado) => {

  const viajesSnap = await getDocs(collection(db, "trips"));

  for (let viajeDoc of viajesSnap.docs) {
    const viajeId = viajeDoc.id;
    const viajeData = viajeDoc.data();

    const maletasRef = collection(db, `trips/${viajeId}/maletas`);
    const maletasSnap = await getDocs(maletasRef);

    for (let maletaDoc of maletasSnap.docs) {
      const maletaData = maletaDoc.data();

      if (Array.isArray(maletaData.articulos)) {
        
        const encontrado = maletaData.articulos.some(item =>
          item.toLowerCase().includes(nombreBuscado.toLowerCase())
        );

        if (encontrado) {
          return {
            viaje: {
              nombre: viajeData.nombre || "Viaje sin nombre",
              direccion: viajeData.direccion || "",
            },
            maleta: {
              nombre: maletaData.nombre,
            },
            articulo: nombreBuscado
          };
        }
      }
    }
  }

  return null;
};