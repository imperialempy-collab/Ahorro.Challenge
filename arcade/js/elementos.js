// ==========================================
// ARCHIVO MAESTRO: ELEMENTOS FINANCIEROS (V. FINAL)
// ==========================================

export const ConfiguracionJuego = {
    tiempoPartidaSegundos: 60, // 1 año entero
    cicloMesSegundos: 5        // Cada 5 seg cobra gastos fijos
};

export const ElementosFinancieros = {
    // 1. TENTACIONES (Dan felicidad, restan plata)
    tentaciones: [
        { id: "cafe", nombre: "Café de Estación", emoji: "☕", costo: 25000, felicidad: 5, tipo: "gasto" },
        { id: "lomito", nombre: "Lomito de Viernes", emoji: "🍔", costo: 50000, felicidad: 8, tipo: "gasto" },
        { id: "zapatillas", nombre: "Zapatillas en Oferta", emoji: "👟", costo: 300000, felicidad: 15, tipo: "gasto" },
        { id: "salida", nombre: "Salida con Amigos", emoji: "🍻", costo: 150000, felicidad: 12, tipo: "gasto" },
        { id: "viaje", nombre: "Viaje de Vacaciones", emoji: "✈️", costo: 5000000, felicidad: 45, tipo: "gasto" } // EL NUEVO GASTO GIGANTE
    ],

    // 2. MANTENIMIENTO
    mantenimiento: [
        { id: "super", nombre: "Supermercado", emoji: "🛒", costo: 400000, felicidad: 5, tipo: "mantenimiento", riesgo: "salud" },
        { id: "mercado", nombre: "Mercado Abasto", emoji: "🍎", costo: 200000, felicidad: 0, tipo: "mantenimiento", riesgo: "salud" },
        { id: "taller", nombre: "Mantenimiento Auto", emoji: "🛢️", costo: 200000, felicidad: 0, tipo: "mantenimiento", riesgo: "auto" },
        { id: "gotera", nombre: "Arreglar Gotera", emoji: "🔧", costo: 150000, felicidad: 0, tipo: "mantenimiento", riesgo: "casa" },
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
        { id: "billete", nombre: "Plata en el pantalón", emoji: "💵", costo: -50000, felicidad: 5, tipo: "ingreso" }
    ],

    // 5. HERRAMIENTAS Y DECISIONES
    instrumentos: [
        { id: "tarjeta", nombre: "Tarjeta de Crédito", emoji: "💳", teDa: 500000, interesSeg: 25000, tipo: "deuda" },
        { id: "bingo", nombre: "Bingo", emoji: "🎰", costo: 50000, prob: 0.10, premio: 500000, tipo: "apuesta" },
        { id: "chanchito", nombre: "Ahorro Blindado", emoji: "🐷", porcentaje: 0.20, tipo: "salvavidas" }
    ],
    
    decisiones: [
        { tipo: "decision", id: "netflix", opcionA: { emoji: "📺", nombre: "Netflix", costo: 50000, felicidad: 8, msj: "Netflix!" }, opcionB: { emoji: "✂️", nombre: "Cancelar", costo: 0, felicidad: -10, msj: "Aborrido" } },
        { tipo: "decision", id: "transporte", opcionA: { emoji: "🚖", nombre: "Ir en Bolt", costo: 35000, felicidad: 5, msj: "Viaje VIP" }, opcionB: { emoji: "🚌", nombre: "Ir en Bus", costo: 5000, felicidad: -12, msj: "Calor" } }
    ]
};
