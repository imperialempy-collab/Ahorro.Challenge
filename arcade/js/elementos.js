// ==========================================
// ARCHIVO MAESTRO: ELEMENTOS FINANCIEROS (V. FINAL ESTABLE)
// ==========================================

export const ConfiguracionJuego = {
    tiempoPartidaSegundos: 36, 
    cicloMesSegundos: 3        
};

export const ElementosFinancieros = {
    // 1. TENTACIONES Y PRESIÓN SOCIAL
    tentaciones: [
        { id: "cafe", nombre: "Café de Estación", emoji: "☕", costo: 25000, felicidad: 5, tipo: "gasto" },
        { id: "lomito", nombre: "Lomito de Viernes", emoji: "🍔", costo: 50000, felicidad: 8, tipo: "gasto" },
        { id: "zapatillas", nombre: "Zapatillas", emoji: "👟", costo: 300000, felicidad: 15, tipo: "gasto" },
        { id: "salida", nombre: "Salida con Amigos", emoji: "🍻", costo: 300000, felicidad: 15, tipo: "gasto" },
        { id: "viaje", nombre: "Viaje de Vacaciones", emoji: "✈️", costo: 5000000, felicidad: 45, tipo: "gasto" },
        { id: "pollada", nombre: "Pollada del Socio", emoji: "🍗", costo: 150000, felicidad: 0, tipo: "social", penalizacion: 15 }
    ],

    // 2. EVENTOS ESTACIONALES
    estacionales: [
        { id: "mama", nombre: "Regalo a Mamá", emoji: "💐", costo: 300000, felicidad: 10, tipo: "gasto" },
        { id: "blackfriday", nombre: "Black Friday", emoji: "🛍️", costo: 600000, felicidad: 20, tipo: "gasto" }
    ],

    // 3. MANTENIMIENTO
    mantenimiento: [
        { id: "super", nombre: "Supermercado", emoji: "🛒", costo: 500000, felicidad: 5, tipo: "mantenimiento", riesgo: "salud" }, 
        { id: "mercado", nombre: "Mercado Abasto", emoji: "🍎", costo: 350000, felicidad: 0, tipo: "mantenimiento", riesgo: "salud" }, 
        { id: "taller", nombre: "Mantenimiento Auto", emoji: "🛢️", costo: 350000, felicidad: 0, tipo: "mantenimiento", riesgo: "auto" }, 
        { id: "gotera", nombre: "Arreglar Gotera", emoji: "🔧", costo: 350000, felicidad: 0, tipo: "mantenimiento", riesgo: "casa" }, 
        { id: "iva", nombre: "Pagar Impuestos", emoji: "📝", costo: 100000, felicidad: -5, tipo: "mantenimiento", riesgo: "set" }
    ],

    // 4. LAS BOMBAS 
    bombas: {
        salud: { nombre: "Internación Médica", emoji: "🚑", costo: 1500000, msj: "Te hiciste el vivo no comiendo. Internado." },
        auto: { nombre: "Motor Fundido", emoji: "💥", costo: 1500000, msj: "Por ahorrar aceite, fundiste el motor." },
        casa: { nombre: "Heladera Quemada", emoji: "⚡", costo: 2000000, msj: "No arreglaste el corto circuito. Heladera frita." },
        set: { nombre: "Multa de la SET", emoji: "👮", costo: 1000000, msj: "Evadir impuestos sale caro. Multa y bloqueo." },
        burnout: { nombre: "Colapso Mental", emoji: "🧟‍♂️", costo: 1000000, msj: "Cero diversión. Colapso por estrés, pagá el psicólogo." }
    },

    // 5. INGRESOS EXTRAS 
    ingresos: [
        { id: "changa", nombre: "Trabajo Extra", emoji: "💼", costo: -150000, felicidad: -10, tipo: "ingreso" } 
    ],

    // 6. HERRAMIENTAS Y DECISIONES
    instrumentos: [
        { id: "tarjeta", nombre: "Tarjeta de Crédito", emoji: "💳", teDa: 500000, interesSeg: 50000, tipo: "deuda" }, 
        { id: "bingo", nombre: "Bingo", emoji: "🎰", costo: 50000, prob: 0.10, premio: 500000, tipo: "apuesta" },
        { id: "chanchito", nombre: "Ahorro Blindado", emoji: "🐷", porcentaje: 0.10, tipo: "salvavidas" } 
    ],
    
    decisiones: [
        { tipo: "decision", id: "netflix", opcionA: { emoji: "🍿", nombre: "Suscripciones", costo: 50000, felicidad: 8, msj: "Netflix!" }, opcionB: { emoji: "✂️", nombre: "Cancelar", costo: 0, felicidad: -10, msj: "Aburrido" } },
        { tipo: "decision", id: "transporte", opcionA: { emoji: "🚕", nombre: "Ir en Bolt", costo: 40000, felicidad: 5, msj: "Viaje VIP" }, opcionB: { emoji: "🚌", nombre: "Ir en Bus", costo: 10000, felicidad: -12, msj: "Calor" } } 
    ]
};
