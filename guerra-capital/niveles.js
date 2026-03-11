// Archivo: niveles.js - Base de Datos de La Guerra del Capital

const BATTLES = [
    {
        id: 1,
        title: "El Golpe de Realidad",
        screens: [
            {
                type: "boolean",
                question: "Ganar 10.000 dólares al mes te convierte automáticamente en una persona rica.",
                correct: false, // Falso es la correcta
                feedback: "¡Exacto! Mike Tyson llegó a ganar $300 millones en su carrera y se declaró en bancarrota. La riqueza no es lo que ganas, es lo que NO gastas."
            },
            {
                type: "trivia",
                question: "Si ves a tu vecino manejando un Ferrari de $200.000, ¿cuál es el único dato financiero 100% real que sabes sobre él?",
                options: [
                    "A) Que es millonario.",
                    "B) Que sabe invertir muy bien.",
                    "C) Que ahora tiene $200.000 dólares menos en el banco."
                ],
                correct: 2, // La opción C (índice 2)
                feedback: "La riqueza es lo que no se ve. El auto es solo un gasto visible. Nunca confundas aparentar riqueza con tener riqueza."
            }
        ]
    },
    {
        id: 2,
        title: "El Misterio de la Cifra",
        screens: [
            {
                type: "trivia",
                question: "Te ofrezco dos opciones hoy. ¿Cuál eliges?",
                options: [
                    "A) 1 Millón de dólares en efectivo ahora mismo.",
                    "B) 1 simple centavo que duplica su valor cada día durante 30 días."
                ],
                correct: 1, // Opción B
                feedback: "Si elegiste el millón, perdiste. El centavo duplicado durante 30 días se convierte en $5.368.709 dólares. Esto se llama Interés Compuesto."
            },
            {
                type: "story",
                emoji: "🧠",
                title: "La 8va Maravilla",
                text: "«El interés compuesto es la fuerza más poderosa del universo. El que lo entiende, lo gana; el que no, lo paga.»\n\n— Atribuido a Albert Einstein."
            }
        ]
    }
];
