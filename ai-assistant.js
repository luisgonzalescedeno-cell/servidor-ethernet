/* =======================
   RESPUESTAS LOCALES
======================= */

const LOCAL_RESPONSES = [
  {
    keywords: ["t568a", "t568b", "diferencia"],
    answer: "La diferencia entre T568A y T568B está en el orden de los pares verde y naranja. Ambos estándares funcionan igual eléctricamente y cumplen con la norma TIA/EIA."
  },
  {
    keywords: ["cable directo", "directo"],
    answer: "Un cable directo utiliza el mismo estándar en ambos extremos (T568A-T568A o T568B-T568B). Se usa para conectar dispositivos diferentes, como una PC a un switch."
  },
  {
    keywords: ["cable cruzado", "cruzado"],
    answer: "El cable cruzado utiliza T568A en un extremo y T568B en el otro. Tradicionalmente se usaba para conectar dispositivos similares, como PC-PC o switch-switch."
  },
  {
    keywords: ["herramientas", "ponchar", "ponchadora", "tester"],
    answer: "Las herramientas principales para ponchar cables Ethernet son: ponchadora RJ45, pelacables, conectores RJ45 y un tester para verificar la conexión."
  },
  {
    keywords: ["orden t568b"],
    answer: "El orden T568B es: Blanco/Naranja, Naranja, Blanco/Verde, Azul, Blanco/Azul, Verde, Blanco/Café y Café."
  },
  {
    keywords: ["orden t568a"],
    answer: "El orden T568A es: Blanco/Verde, Verde, Blanco/Naranja, Azul, Blanco/Azul, Naranja, Blanco/Café y Café."
  }
];

function buscarRespuestaLocal(texto) {

  const pregunta = texto.toLowerCase();

  for (const item of LOCAL_RESPONSES) {

    const coincide = item.keywords.some(keyword =>
      pregunta.includes(keyword)
    );

    if (coincide) {
      return item.answer;
    }
  }

  return null;
}
