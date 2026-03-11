// Archivo: niveles.js - Base de Datos de La Guerra del Capital

const BATTLES = [
    {
        id: 1,
        title: "El Golpe de Realidad",
        screens: [
            {
                type: "boolean",
                question: "Ganar 10.000 dólares al mes te convierte automáticamente en una persona rica.",
                correct: false,
                feedback: "¡Exacto! Mike Tyson ganó $300 millones en su carrera y quebró. La riqueza no es lo que ganas, es lo que NO gastas."
            },
            {
                type: "story",
                emoji: "🧹",
                title: "El Conserje Millonario",
                text: "En 2014, Ronald Read, un conserje de gasolinera, murió dejando $8 millones. Ese mismo año, Richard, un ejecutivo de finanzas de Harvard, se declaró en bancarrota.\n\nEl éxito financiero es comportamiento, no inteligencia."
            },
            {
                type: "trivia",
                question: "Si ves a tu vecino manejando un Ferrari nuevo de $200.000, ¿cuál es el único dato financiero 100% real que sabes sobre él?",
                options: [
                    "A) Que es millonario.",
                    "B) Que sabe invertir muy bien.",
                    "C) Que ahora tiene $200.000 dólares menos."
                ],
                correct: 2,
                feedback: "La riqueza es lo que no se ve. El auto es solo un gasto visible. Nunca confundas aparentar riqueza con tener riqueza."
            },
            {
                type: "quote",
                emoji: "📖",
                title: "Regla de Oro",
                text: "«Gastar dinero para demostrarle a la gente cuánto dinero tienes es la forma más rápida de tener menos dinero.»\n\n- Morgan Housel (La Psicología del Dinero)"
            }
        ]
    },
    {
        id: 2,
        title: "La 8va Maravilla",
        screens: [
            {
                type: "story",
                emoji: "🎩",
                title: "El Truco del Mago",
                text: "Warren Buffett es considerado el mejor inversor de la historia. Tiene una fortuna de más de $100 mil millones.\n\nPero aquí está el secreto: El 99% de esa fortuna la ganó DESPUÉS de cumplir los 65 años."
            },
            {
                type: "trivia",
                question: "¿Qué nos enseña el secreto de la fortuna de Warren Buffett?",
                options: [
                    "A) Que solo los ancianos pueden ser ricos.",
                    "B) Que el TIEMPO es el factor más importante para multiplicar dinero.",
                    "C) Que hay que invertir solo en bolsa."
                ],
                correct: 1,
                feedback: "Buffett empezó a invertir a los 10 años. Su secreto no es solo ser inteligente, sino haber dejado que el 'Interés Compuesto' trabajara por 80 años."
            },
            {
                type: "boolean",
                question: "Si inviertes dinero hoy, el 'Interés Compuesto' significa que ganarás intereses no solo sobre tu dinero, sino también sobre los intereses pasados.",
                correct: true,
                feedback: "¡Correcto! Es como una bola de nieve rodando cuesta abajo. Cada vuelta se hace más grande por sí sola."
            },
            {
                type: "trivia",
                question: "¿Qué elegirías si quieres terminar con más dinero?",
                options: [
                    "A) 1 Millón de dólares en efectivo HOY.",
                    "B) 1 centavo que duplica su valor cada día durante 30 días."
                ],
                correct: 1,
                feedback: "Si elegiste el millón, perdiste. El centavo duplicado por 30 días se convierte en ¡$5.368.709 dólares! La magia del efecto compuesto."
            },
            {
                type: "quote",
                emoji: "🧠",
                title: "Albert Einstein dijo:",
                text: "«El interés compuesto es la fuerza más poderosa del universo. El que lo entiende, lo gana; el que no, lo paga.»"
            }
        ]
    },
    {
        id: 3,
        title: "El Ladrón Invisible",
        screens: [
            {
                type: "story",
                emoji: "🥤",
                title: "El Misterio de la Coca-Cola",
                text: "En 1913, una botella de Coca-Cola costaba 5 centavos. Hoy cuesta cerca de $2 dólares.\n\nEl líquido es el mismo, lo que cambió fue que tu billete perdió su poder de compra."
            },
            {
                type: "boolean",
                question: "Guardar tus ahorros en el cajón de tu ropa interior es la forma más segura de proteger tu dinero a largo plazo.",
                correct: false,
                feedback: "¡Peligro! Eso es suicidio financiero. La inflación (el aumento de precios) hace que el dinero guardado bajo el colchón pierda valor cada año."
            },
            {
                type: "trivia",
                question: "Si la inflación de tu país es del 5% anual, y tu banco te paga 2% anual en una caja de ahorro... ¿Qué pasa con tu plata?",
                options: [
                    "A) Ganas un 2% de riqueza.",
                    "B) Pierdes un 3% de poder adquisitivo real.",
                    "C) El banco te protege del 5%."
                ],
                correct: 1,
                feedback: "Matemática simple: Si las cosas suben 5 y tú ganas 2, te estás volviendo un 3% más pobre sin darte cuenta."
            },
            {
                type: "order",
                question: "Es día de cobro. Ordena cronológicamente (1 al 3) qué debes hacer con tu sueldo según 'El Hombre más Rico de Babilonia':",
                options: [
                    "Pagar obligaciones (Alquiler, Luz, etc).",
                    "Gastar en gustos (Salidas, Ropa).",
                    "Transferir el 10% a una cuenta de ahorro/inversión (Pagarte a ti primero)."
                ],
                correctOrder: [2, 0, 1], // El índice 2 es el paso 1, el 0 es el paso 2, el 1 es el paso 3.
                feedback: "¡Excelente! Los ricos se pagan a sí mismos PRIMERO y adaptan su vida al dinero que queda. La clase media paga a los demás y ahorra 'si le sobra'."
            }
        ]
    },
    {
        id: 4,
        title: "Deuda: Cadenas y Palancas",
        screens: [
            {
                type: "story",
                emoji: "💳",
                title: "La Ilusión de la Tarjeta",
                text: "Cuando pagas el 'Pago Mínimo' de tu tarjeta de crédito, el banco hace una fiesta.\n\nEstás pagando casi exclusivamente intereses (ganancia para el banco) y tu deuda original apenas baja."
            },
            {
                type: "boolean",
                question: "Toda deuda es mala y debes evitar pedir préstamos a toda costa.",
                correct: false,
                feedback: "¡Falso! Existe Deuda Mala (comprar ropa o viajes con tarjeta) y Deuda Buena (un préstamo a tasa baja para comprar un activo que te da dinero mensual)."
            },
            {
                type: "trivia",
                question: "¿Cuál de estos es un ejemplo de 'Deuda Buena'?",
                options: [
                    "A) Un préstamo para un auto último modelo.",
                    "B) Pagar un TV gigante a 24 cuotas.",
                    "C) Hipoteca para comprar un local que vas a alquilar."
                ],
                correct: 2,
                feedback: "La deuda buena pone dinero en tu bolsillo. El local alquilado se paga a sí mismo con el dinero del inquilino."
            },
            {
                type: "order",
                question: "Para salir de deudas rápido usa el método 'Avalancha'. Ordena qué debes pagar primero:",
                options: [
                    "Deuda a tus padres (Sin interés).",
                    "Deuda de tarjeta de crédito (50% de interés anual).",
                    "Préstamo personal (15% de interés anual)."
                ],
                correctOrder: [1, 2, 0],
                feedback: "¡Correcto! En el método Avalancha, siempre atacas primero a la deuda que te cobra la Tasa de Interés más alta."
            }
        ]
    },
    {
        id: 5,
        title: "Activos vs Pasivos",
        screens: [
            {
                type: "quote",
                emoji: "📚",
                title: "Padre Rico, Padre Pobre",
                text: "«La regla número uno: Debes conocer la diferencia entre un activo y un pasivo, y comprar activos.\n\nLos ricos adquieren activos. Los pobres y la clase media adquieren pasivos creyendo que son activos.»"
            },
            {
                type: "trivia",
                question: "¿Cuál es la definición más simple de un Activo?",
                options: [
                    "A) Algo que vale mucho dinero, como una casa grande donde vives.",
                    "B) Algo que pone dinero en tu bolsillo todos los meses.",
                    "C) Un artículo de lujo."
                ],
                correct: 1,
                feedback: "Si la casa donde vives te saca dinero en impuestos, luz y mantenimiento, es un Pasivo. Si la alquilas y te da ingresos, es un Activo."
            },
            {
                type: "boolean",
                question: "Tu auto de uso personal es tu mayor activo financiero.",
                correct: false,
                feedback: "Falso. Un auto pierde entre el 10% y el 20% de su valor el día que sale del concesionario, y requiere combustible y mantenimiento. Es un Pasivo."
            },
            {
                type: "story",
                emoji: "🌱",
                title: "Planta tu árbol",
                text: "Comprar un activo es como plantar un árbol de manzanas. Al principio requiere agua y cuidados (dinero y tiempo).\n\nPero con los años, echará raíces profundas y te dará manzanas (dividendos/rentas) mientras duermes."
            }
        ]
    }
];
