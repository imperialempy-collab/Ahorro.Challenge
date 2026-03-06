// ==========================================
// ARCHIVO MAESTRO: ELEMENTOS FINANCIEROS
// ==========================================
// Aquí configuramos todos los obstáculos, ingresos y reglas del juego.
// Modificar estos valores cambia el juego automáticamente.

export const ConfiguracionJuego = {
    tiempoPartidaSegundos: 60, // Duración del "Año Financiero"
    cicloMesSegundos: 5        // Cada 5 segundos te cobra gastos fijos
};

export const ElementosFinancieros = {
    // 1. GASTOS HORMIGA Y TENTACIONES (Aparecen mucho, podés esquivarlos)
    tentaciones: [
        { id: "cafe", nombre: "Café Caro", emoji: "☕", costo: 20000, tipo: "gasto" },
        { id: "lomito", nombre: "Lomito de Viernes", emoji: "🍔", costo: 50000, tipo: "gasto" },
        { id: "zapatillas", nombre: "Zapatillas en Oferta", emoji: "👟", costo: 300000, tipo: "gasto" }
    ],

    // 2. GASTOS NECESARIOS (Aparecen en la calle. Si los esquivás, hay penalización)
    necesarios: [
        { id: "super", nombre: "Supermercado", emoji: "🛒", costo: 400000, tipo: "necesario" },
        { id: "mercado", nombre: "Mercado Abasto", emoji: "🍎", costo: 200000, tipo: "necesario" }
    ],

    // 3. IMPREVISTOS Y ACCIDENTES (Bloquean caminos, son difíciles de esquivar)
    imprevistos: [
        { id: "llanta", nombre: "Auto en Llanta", emoji: "🚗", costo: 250000, tipo: "accidente" },
        { id: "medico", nombre: "Atención Médica", emoji: "🚑", costo: 500000, tipo: "accidente" }
    ],

    // 4. INGRESOS EXTRAS (Aparecen poco, hay que atraparlos)
    ingresos: [
        { id: "changa", nombre: "Trabajo Extra", emoji: "💼", costo: -150000, tipo: "ingreso" }, // Es negativo porque en la resta del juego, restar un negativo = sumar plata.
        { id: "billete", nombre: "Plata Olvidada", emoji: "💵", costo: -50000, tipo: "ingreso" }
    ],

    // 5. INSTRUMENTOS FINANCIEROS ESPECIALES
    instrumentos: [
        { 
            id: "tarjeta", 
            nombre: "Tarjeta de Crédito", 
            emoji: "💳", 
            teDa: 500000, 
            interesPorSegundo: 20000, // Te desangra por 10 segundos
            tipo: "deuda_toxica" 
        },
        { 
            id: "bingo", 
            nombre: "Cartón de Bingo", 
            emoji: "🎰", 
            costoTicket: 50000,
            probabilidadGanar: 0.10, // 10% de chances de ganar
            premio: 500000,
            tipo: "apuesta" 
        },
        {
            id: "chanchito",
            nombre: "Ahorro Blindado",
            emoji: "🐷",
            porcentajeAhorro: 0.20, // Te guarda el 20% de lo que tengas en la billetera
            tipo: "salvavidas"
        }
    ]
};
