import { ConfiguracionJuego, ElementosFinancieros } from './elementos.js';

// ==========================================
// 1. VARIABLES DE ESTADO DEL JUEGO
// ==========================================
let estado = {
    jugando: false,
    tiempoRestante: ConfiguracionJuego.tiempoPartidaSegundos,
    mesActual: 1,
    carrilJugador: 1, // 0: Izq, 1: Centro, 2: Der
    
    // Finanzas
    sueldo: 0,
    gastosFijos: 0,
    banco: 0,
    billetera: 0,
    chanchito: 0,
    
    // Estadísticas para el reporte final
    interesesPagados: 0,
    gastosHormigaTocados: 0,
    tarjetasTocadas: 0,
    bingosJugados: 0,
    
    // Efectos activos
    sangradoTarjeta: 0 // Cuánto te descuenta por segundo
};

let loops = {
    juego: null,
    creadorElementos: null,
    meses: null
};

// ==========================================
// 2. REFERENCIAS AL DOM (Pantalla)
// ==========================================
const UI = {
    pantallaInicio: document.getElementById('pantallaInicio'),
    hud: document.getElementById('hud'),
    zonaJuego: document.getElementById('zonaJuego'),
    calle: document.getElementById('calle'),
    jugador: document.getElementById('jugador'),
    pantallaFinal: document.getElementById('pantallaFinal'),
    
    // Textos
    banco: document.getElementById('uiBanco'),
    billetera: document.getElementById('uiBilletera'),
    chanchito: document.getElementById('uiChanchito'),
    mes: document.getElementById('uiMes'),
    alerta: document.getElementById('uiAlerta')
};

// ==========================================
// 3. INICIO DEL JUEGO
// ==========================================
document.getElementById('btnEmpezar').addEventListener('click', () => {
    // Leer configuración del usuario
    estado.sueldo = parseInt(document.getElementById('inputSueldo').value);
    estado.gastosFijos = parseInt(document.getElementById('inputGastos').value);
    
    // El juego arranca dándote tu primer sueldo en el banco
    estado.banco = estado.sueldo;
    // Te damos un "vuelto" en la billetera para arrancar a jugar
    estado.billetera = estado.sueldo * 0.10; 
    
    actualizarMarcadores();

    // Cambiar pantallas
    UI.pantallaInicio.classList.add('hidden');
    UI.hud.classList.remove('hidden');
    UI.hud.classList.remove('opacity-0');
    UI.zonaJuego.classList.remove('hidden');
    
    iniciarMotores();
});

function iniciarMotores() {
    estado.jugando = true;
    
    // Bucle Principal (Mueve los objetos a 60fps)
    loops.juego = setInterval(actualizarFisicas, 1000 / 60);
    
    // Bucle Creador (Lanza un objeto cada 1.5 segundos)
    loops.creadorElementos = setInterval(lanzarElementoAleatorio, 1500);
    
    // Bucle de Meses (El Reloj que cobra gastos)
    loops.meses = setInterval(pasarMes, 1000);
}

// ==========================================
// 4. CONTROLES DEL JUGADOR
// ==========================================
function moverJugador(direccion) {
    if(!estado.jugando) return;
    
    if (direccion === 'izq' && estado.carrilJugador > 0) estado.carrilJugador--;
    if (direccion === 'der' && estado.carrilJugador < 2) estado.carrilJugador++;
    
    // Posiciones: 16.6% (Izq), 50% (Centro), 83.3% (Der)
    const posiciones = ['16.6%', '50%', '83.3%'];
    UI.jugador.style.left = posiciones[estado.carrilJugador];
}

// Botones táctiles invisibles
document.getElementById('btnIzq').addEventListener('touchstart', (e) => { e.preventDefault(); moverJugador('izq'); });
document.getElementById('btnDer').addEventListener('touchstart', (e) => { e.preventDefault(); moverJugador('der'); });
document.getElementById('btnIzq').addEventListener('mousedown', () => moverJugador('izq'));
document.getElementById('btnDer').addEventListener('mousedown', () => moverJugador('der'));

// Teclado para PC
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') moverJugador('izq');
    if (e.key === 'ArrowRight') moverJugador('der');
});

// ==========================================
// 5. LÓGICA DE TIEMPO Y GASTOS FIJOS
// ==========================================
let segundosTranscurridos = 0;
function pasarMes() {
    segundosTranscurridos++;
    
    // Sangrado de tarjeta (Intereses por segundo)
    if (estado.sangradoTarjeta > 0) {
        modificarDinero(-estado.sangradoTarjeta, 'billetera');
        estado.interesesPagados += estado.sangradoTarjeta;
    }

    // Cada X segundos = 1 Mes (Cobro de sueldo y pago de gastos fijos)
    if (segundosTranscurridos % ConfiguracionJuego.cicloMesSegundos === 0) {
        estado.mesActual++;
        
        if(estado.mesActual <= 12) {
            UI.mes.innerText = estado.mesActual;
            estado.banco += estado.sueldo;
            modificarDinero(-estado.gastosFijos, 'banco');
            
            // Mostrar alerta visual
            UI.alerta.classList.remove('hidden');
            setTimeout(() => UI.alerta.classList.add('hidden'), 2000);
        }
    }

    // Fin del Juego (Llegamos a los 60 seg / 12 meses)
    if (segundosTranscurridos >= ConfiguracionJuego.tiempoPartidaSegundos) {
        terminarJuego();
    }
}

// ==========================================
// 6. MOTOR GRÁFICO (Caída y Choques)
// ==========================================
function lanzarElementoAleatorio() {
    if(!estado.jugando) return;

    // Juntar todos los elementos posibles en una bolsa
    const categorias = [
        ...ElementosFinancieros.tentaciones,
        ...ElementosFinancieros.necesarios,
        ...ElementosFinancieros.imprevistos,
        ...ElementosFinancieros.ingresos,
        ...ElementosFinancieros.instrumentos
    ];
    
    // Elegir uno al azar
    const elemento = categorias[Math.floor(Math.random() * categorias.length)];
    const carrilRandom = Math.floor(Math.random() * 3);
    const posicionesIzq = ['16.6%', '50%', '83.3%'];

    // Crear el div en HTML
    const div = document.createElement('div');
    div.className = 'elemento-cae bg-white/80 backdrop-blur shadow-md border border-slate-200';
    div.innerText = elemento.emoji;
    div.style.left = posicionesIzq[carrilRandom];
    div.style.top = '-50px';
    
    // Guardarle los datos al div para usarlos al chocar
    div.dataset.id = elemento.id;
    div.dataset.tipo = elemento.tipo;
    div.dataset.costo = elemento.costo || 0;
    div.dataset.carril = carrilRandom;
    if(elemento.tipo === 'deuda_toxica') div.dataset.interes = elemento.interesPorSegundo;

    UI.calle.appendChild(div);
}

function actualizarFisicas() {
    const velocidad = 5; // Píxeles por frame
    const elementos = document.querySelectorAll('.elemento-cae');
    const posYJugador = UI.calle.offsetHeight - 90; // Donde está el chanchito

    elementos.forEach(el => {
        let topActual = parseFloat(el.style.top);
        el.style.top = (topActual + velocidad) + 'px';

        // Detectar colisión
        if (topActual > posYJugador - 40 && topActual < posYJugador + 40) {
            if (parseInt(el.dataset.carril) === estado.carrilJugador) {
                procesarChoque(el);
            }
        }

        // Borrar si sale de la pantalla
        if (topActual > UI.calle.offsetHeight) {
            el.remove();
        }
    });
}

// ==========================================
// 7. LÓGICA DE COLISIONES FINANCIERAS
// ==========================================
function procesarChoque(elementoHtml) {
    const tipo = elementoHtml.dataset.tipo;
    const costo = parseInt(elementoHtml.dataset.costo);
    
    // Efecto visual de choque
    UI.jugador.classList.remove('anim-dano', 'anim-ahorro');
    void UI.jugador.offsetWidth; // Truco para reiniciar animación

    if (tipo === 'gasto' || tipo === 'necesario' || tipo === 'accidente') {
        // Nos saca plata
        modificarDinero(-costo, 'billetera');
        UI.jugador.classList.add('anim-dano');
        mostrarTextoFlotante(`-${formatearPYG(costo)}`, 'text-rose-500');
        if (tipo === 'gasto') estado.gastosHormigaTocados++;
    } 
    else if (tipo === 'ingreso') {
        // El costo es negativo en la BD, así que restarlo lo suma
        modificarDinero(Math.abs(costo), 'billetera');
        UI.jugador.classList.add('anim-ahorro');
        mostrarTextoFlotante(`+${formatearPYG(Math.abs(costo))}`, 'text-emerald-500');
    }
    else if (tipo === 'salvavidas') { // El Chanchito
        const aGuardar = estado.billetera * 0.20;
        if(aGuardar > 0) {
            estado.billetera -= aGuardar;
            estado.chanchito += aGuardar;
            UI.jugador.classList.add('anim-ahorro');
            mostrarTextoFlotante(`Ahorrado!`, 'text-primary');
        }
    }
    else if (tipo === 'deuda_toxica') { // Tarjeta
        estado.tarjetasTocadas++;
        modificarDinero(500000, 'billetera'); // Te salva dándote 500mil
        estado.sangradoTarjeta = parseInt(elementoHtml.dataset.interes); // Pero te empieza a cobrar
        UI.zonaJuego.classList.add('pantalla-sangrando');
        mostrarTextoFlotante(`+500.000 (DEUDA!)`, 'text-amber-500');
        
        // El sangrado dura 5 segundos
        setTimeout(() => {
            estado.sangradoTarjeta = 0;
            UI.zonaJuego.classList.remove('pantalla-sangrando');
        }, 5000);
    }
    else if (tipo === 'apuesta') { // Bingo
        estado.bingosJugados++;
        modificarDinero(-50000, 'billetera'); // Paga el ticket
        // Probabilidad Real (10% de ganar)
        if (Math.random() <= 0.10) {
            modificarDinero(500000, 'billetera');
            mostrarTextoFlotante(`¡GANASTE BINGO!`, 'text-emerald-500');
            UI.jugador.classList.add('anim-ahorro');
        } else {
            mostrarTextoFlotante(`Perdiste 50mil`, 'text-rose-500');
            UI.jugador.classList.add('anim-dano');
        }
    }

    elementoHtml.remove();
    actualizarMarcadores();
}

// Función inteligente que saca plata de donde haya
function modificarDinero(monto, prioridad) {
    if (monto > 0) {
        estado[prioridad] += monto;
    } else {
        let deuda = Math.abs(monto);
        
        // Intenta sacar de Billetera
        if (estado.billetera >= deuda) {
            estado.billetera -= deuda;
        } else {
            // No alcanzó la billetera, vaciamos billetera y pasamos al Banco
            deuda -= estado.billetera;
            estado.billetera = 0;
            
            if (estado.banco >= deuda) {
                estado.banco -= deuda;
            } else {
                // No alcanzó el banco, rompe el chanchito de los ahorros!
                deuda -= estado.banco;
                estado.banco = 0;
                estado.chanchito -= deuda;
                if(estado.chanchito < 0) estado.chanchito = 0; // Quiebra total
            }
        }
    }
    actualizarMarcadores();
}

function mostrarTextoFlotante(texto, colorClass) {
    const txt = document.createElement('div');
    txt.className = `texto-flotante ${colorClass}`;
    txt.innerText = texto;
    // Aparece arriba del jugador
    txt.style.left = UI.jugador.style.left;
    txt.style.bottom = '120px';
    UI.calle.appendChild(txt);
    
    setTimeout(() => txt.remove(), 1000);
}

// ==========================================
// 8. AUDITORÍA FINAL (El Entrenador)
// ==========================================
function terminarJuego() {
    estado.jugando = false;
    clearInterval(loops.juego);
    clearInterval(loops.creadorElementos);
    clearInterval(loops.meses);
    
    UI.zonaJuego.classList.add('hidden');
    UI.hud.classList.add('hidden');
    UI.pantallaFinal.classList.remove('hidden');
    UI.pantallaFinal.classList.add('flex'); // Se necesita para centrar

    // Llenar resultados puros
    document.getElementById('resChanchito').innerText = formatearPYG(estado.chanchito);
    document.getElementById('resEfectivo').innerText = formatearPYG(estado.banco + estado.billetera);
    document.getElementById('resIntereses').innerText = formatearPYG(estado.interesesPagados);

    // Generar el Feedback Psicológico
    const lista = document.getElementById('listaConsejos');
    lista.innerHTML = ''; // Limpiar anteriores

    if (estado.chanchito > estado.sueldo * 0.5) {
        agregarConsejo("🏆", "¡Impecable! Protegiste tu capital usando el chanchito. Pagarte a vos mismo primero es la regla N°1 de la riqueza.");
    } else {
        agregarConsejo("⚠️", "Ahorraste muy poco. En la vida real, si no separás el ahorro apenas cobrás, te lo terminás gastando todo.");
    }

    if (estado.gastosHormigaTocados > 3) {
        agregarConsejo("☕", "Atrapaste muchos 'gastos por gusto' (cafés, comidas). Ese es tu dinero escurriéndose en cosas que no recordás al día siguiente.");
    }

    if (estado.tarjetasTocadas > 0) {
        agregarConsejo("💳", `Usaste el pago mínimo y perdiste ${formatearPYG(estado.interesesPagados)} en intereses usureros. Los bancos se hacen millonarios con esa trampa. ¡Cortá esa tarjeta!`);
    }

    if (estado.bingosJugados > 0) {
        agregarConsejo("🎰", "Apostaste tu dinero. La esperanza matemática siempre beneficia al casino, no a vos. ¡El dinero se gana trabajando e invirtiendo, no apostando!");
    }

    if (estado.banco === 0 && estado.billetera === 0) {
        agregarConsejo("🛑", "Te quedaste en la quiebra total. Necesitás revisar urgente tus gastos fijos, están consumiendo todo tu oxígeno financiero.");
    }
}

function agregarConsejo(icono, texto) {
    const div = document.createElement('div');
    div.className = "flex gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm";
    div.innerHTML = `<span class="text-2xl">${icono}</span><p>${texto}</p>`;
    document.getElementById('listaConsejos').appendChild(div);
}

// Utilidad para formatear plata
const formatearPYG = (n) => new Intl.NumberFormat('es-PY').format(Math.round(n || 0)) + ' Gs';
function actualizarMarcadores() {
    UI.banco.innerText = formatearPYG(estado.banco);
    UI.billetera.innerText = formatearPYG(estado.billetera);
    UI.chanchito.innerText = formatearPYG(estado.chanchito);
}
