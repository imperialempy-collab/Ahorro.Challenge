// ==========================================
// ARCHIVO MAESTRO: ELEMENTOS FINANCIEROS (V. 36 SEGUNDOS)
// ==========================================

export const ConfiguracionJuego = {
    tiempoPartidaSegundos: 36, // 1 año entero comprimido en pura adrenalina
    cicloMesSegundos: 3        // Cada 3 seg (1 mes) cobra gastos fijos
};

export const ElementosFinancieros = {
    // 1. TENTACIONES (Dan felicidad, restan plata)
    tentaciones: [
        { id: "cafe", nombre: "Café de Estación", emoji: "☕", costo: 25000, felicidad: 5, tipo: "gasto" },
        { id: "lomito", nombre: "Lomito de Viernes", emoji: "🍔", costo: 50000, felicidad: 8, tipo: "gasto" },
        { id: "zapatillas", nombre: "Zapatillas en Oferta", emoji: "👟", costo: 300000, felicidad: 15, tipo: "gasto" },
        { id: "salida", nombre: "Salida con Amigos", emoji: "🍻", costo: 300000, felicidad: 15, tipo: "gasto" }, // PRECIO ACTUALIZADO
        { id: "viaje", nombre: "Viaje de Vacaciones", emoji: "✈️", costo: 5000000, felicidad: 45, tipo: "gasto" } 
    ],

    // 2. MANTENIMIENTO
    mantenimiento: [
        { id: "super", nombre: "Supermercado", emoji: "🛒", costo: 500000, felicidad: 5, tipo: "mantenimiento", riesgo: "salud" }, // PRECIO ACTUALIZADO
        { id: "mercado", nombre: "Mercado Abasto", emoji: "🍎", costo: 350000, felicidad: 0, tipo: "mantenimiento", riesgo: "salud" }, // PRECIO ACTUALIZADO
        { id: "taller", nombre: "Mantenimiento Auto", emoji: "🛢️", costo: 350000, felicidad: 0, tipo: "mantenimiento", riesgo: "auto" }, // PRECIO ACTUALIZADO
        { id: "gotera", nombre: "Arreglar Gotera", emoji: "🔧", costo: 350000, felicidad: 0, tipo: "mantenimiento", riesgo: "casa" }, // PRECIO ACTUALIZADO
        { id: "iva", nombre: "Pagar Impuestos", emoji: "📝", costo: 100000, felicidad: -5, tipo: "mantenimiento", riesgo: "set" }
    ],

    // 3. LAS BOMBAS 
    bombas: {
        salud: { nombre: "Internación Médica", emoji: "🚑", costo: 1500000, msj: "Te hiciste el vivo no comiendo. Internado." },
        auto: { nombre: "Motor Fundido", emoji: "💥", costo: 1500000, msj: "Por ahorrar aceite, fundiste el motor." },
        casa: { nombre: "Heladera Quemada", emoji: "⚡", costo: 2000000, msj: "No arreglaste el corto circuito. Heladera frita." },
        set: { nombre: "Multa de la SET", emoji: "👮", costo: 1000000, msj: "Evadir impuestos sale caro. Multa y bloqueo." },
        burnout: { nombre: "Colapso Mental", emoji: "🧟‍♂️", costo: 1000000, msj: "Cero diversión. Colapso por estrés, pagá el psicólogo." }
    },

    // 4. INGRESOS EXTRAS 
    ingresos: [
        { id: "changa", nombre: "Trabajo Extra", emoji: "💼", costo: -150000, felicidad: -10, tipo: "ingreso" }, 
        { id: "billete", nombre: "Plata en el pantalón", emoji: "💵", costo: -20000, felicidad: 5, tipo: "ingreso" } // PRECIO ACTUALIZADO
    ],

    // 5. HERRAMIENTAS Y DECISIONES
    instrumentos: [
        { id: "tarjeta", nombre: "Tarjeta de Crédito", emoji: "💳", teDa: 500000, interesSeg: 50000, tipo: "deuda" }, // PRECIO ACTUALIZADO
        { id: "bingo", nombre: "Bingo", emoji: "🎰", costo: 50000, prob: 0.10, premio: 500000, tipo: "apuesta" },
        { id: "chanchito", nombre: "Ahorro Blindado", emoji: "🐷", porcentaje: 0.10, tipo: "salvavidas" } // PRECIO ACTUALIZADO (10%)
    ],
    
    decisiones: [
        { tipo: "decision", id: "netflix", opcionA: { emoji: "📺", nombre: "Netflix", costo: 50000, felicidad: 8, msj: "Netflix!" }, opcionB: { emoji: "✂️", nombre: "Cancelar", costo: 0, felicidad: -10, msj: "Aborrido" } },
        { tipo: "decision", id: "transporte", opcionA: { emoji: "🚖", nombre: "Ir en Bolt", costo: 40000, felicidad: 5, msj: "Viaje VIP" }, opcionB: { emoji: "🚌", nombre: "Ir en Bus", costo: 10000, felicidad: -12, msj: "Calor" } } // PRECIOS ACTUALIZADOS
    ]
};
