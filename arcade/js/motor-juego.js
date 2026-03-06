import { ConfiguracionJuego, ElementosFinancieros } from './elementos.js';

let estado = {
    jugando: false, mesActual: 1, carrilJugador: 1,
    sueldo: 0, gastosFijos: 0,
    banco: 0, billetera: 0, chanchito: 0, felicidad: 50,
    
    // Contadores de Desgaste (La trampa del tacaño)
    riesgos: { salud: 0, auto: 0, casa: 0, set: 0 },
    
    // Estadísticas
    interesesPagados: 0, tarjetas: 0, bingos: 0, bombasExplotadas: 0,
    sangradoTarjeta: 0
};

let loops = { juego: null, creador: null, meses: null };

const UI = {
    inicio: document.getElementById('pantallaInicio'), hud: document.getElementById('hud'),
    juego: document.getElementById('zonaJuego'), calle: document.getElementById('calle'),
    jugador: document.getElementById('jugador'), final: document.getElementById('pantallaFinal'),
    banco: document.getElementById('uiBanco'), billetera: document.getElementById('uiBilletera'),
    chanchito: document.getElementById('uiChanchito'), felicidad: document.getElementById('uiFelicidad'),
    mes: document.getElementById('uiMes'), alerta: document.getElementById('uiAlerta')
};

function arrancarJuego(e) {
    if(e) e.preventDefault(); // Evita que se dispare dos veces en celulares
    if(estado.jugando) return; 

    // Tomamos los valores (si están vacíos, ponemos 0 por defecto)
    estado.sueldo = parseInt(document.getElementById('inputSueldo').value) || 0;
    estado.gastosFijos = parseInt(document.getElementById('inputGastos').value) || 0;
    
    estado.banco = estado.sueldo;
    estado.billetera = estado.sueldo * 0.15; 
    
    actualizarMarcadores();
    UI.inicio.classList.add('hidden');
    UI.hud.classList.remove('hidden', 'opacity-0');
    UI.juego.classList.remove('hidden');
    
    estado.jugando = true;
    loops.juego = setInterval(actualizarFisicas, 1000 / 60);
    loops.creador = setInterval(crearElemento, 1300);
    loops.meses = setInterval(pasarMes, 1000);
}

// Le decimos al botón que escuche tanto "Clics" (PC) como "Toques" (Celular)
const btnEmpezar = document.getElementById('btnEmpezar');
btnEmpezar.addEventListener('click', arrancarJuego);
btnEmpezar.addEventListener('touchstart', arrancarJuego, { passive: false });

// Controles
function mover(dir) {
    if(!estado.jugando) return;
    if (dir === 'izq' && estado.carrilJugador > 0) estado.carrilJugador--;
    if (dir === 'der' && estado.carrilJugador < 2) estado.carrilJugador++;
    UI.jugador.style.left = ['16.6%', '50%', '83.3%'][estado.carrilJugador];
}
document.getElementById('btnIzq').addEventListener('touchstart', (e) => { e.preventDefault(); mover('izq'); });
document.getElementById('btnDer').addEventListener('touchstart', (e) => { e.preventDefault(); mover('der'); });
document.getElementById('btnIzq').addEventListener('mousedown', () => mover('izq'));
document.getElementById('btnDer').addEventListener('mousedown', () => mover('der'));
window.addEventListener('keydown', (e) => { if(e.key === 'ArrowLeft') mover('izq'); if(e.key === 'ArrowRight') mover('der'); });

let segundos = 0;
function pasarMes() {
    if(!estado.jugando) return;
    segundos++;
    
    if (estado.sangradoTarjeta > 0) {
        pagarDeuda(estado.sangradoTarjeta);
        estado.interesesPagados += estado.sangradoTarjeta;
    }

    if (segundos % ConfiguracionJuego.cicloMesSegundos === 0) {
        estado.mesActual++;
        if(estado.mesActual <= 12) {
            UI.mes.innerText = estado.mesActual;
            estado.banco += estado.sueldo;
            pagarDeuda(estado.gastosFijos);
            mostrarAlerta("¡Cobraste! Y te descontaron gastos fijos.", "bg-blue-500");
        }
    }

    // BURNOUT (Depresión por ser tacaño)
    if (estado.felicidad <= 0) {
        explotarBomba('burnout');
        estado.felicidad = 30; // Se recupera un poco tras ir al psicólogo
    }

    if (segundos >= ConfiguracionJuego.tiempoPartidaSegundos) terminarJuego();
}

function crearElemento() {
    if(!estado.jugando) return;
    const rng = Math.random();
    
    // 15% de chances de que salga una Decisión Binaria (Muro de dos opciones)
    if(rng > 0.85) {
        const decision = ElementosFinancieros.decisiones[Math.floor(Math.random() * ElementosFinancieros.decisiones.length)];
        crearDivCaida(decision.opcionA, 0, decision.id); // Izquierda
        crearDivCaida(decision.opcionB, 2, decision.id); // Derecha
        return;
    }

    // El resto del tiempo, elementos normales (Chanchito tiene más chances)
    let categorias = [...ElementosFinancieros.tentaciones, ...ElementosFinancieros.mantenimiento, ...ElementosFinancieros.ingresos, ...ElementosFinancieros.instrumentos];
    // Duplicamos el chanchito en el array para que caiga más seguido
    categorias.push(ElementosFinancieros.instrumentos.find(i => i.id === 'chanchito'));
    categorias.push(ElementosFinancieros.instrumentos.find(i => i.id === 'chanchito'));

    const item = categorias[Math.floor(Math.random() * categorias.length)];
    crearDivCaida(item, Math.floor(Math.random() * 3));
}

function crearDivCaida(item, carril, esDecisionId = null) {
    const div = document.createElement('div');
    div.className = 'elemento-cae bg-white/90 backdrop-blur shadow-xl border-2 border-slate-200';
    div.innerText = item.emoji;
    div.style.left = ['16.6%', '50%', '83.3%'][carril];
    div.style.top = '-60px';
    
    // Guardar datos
    div.dataset.tipo = item.tipo || "decision";
    div.dataset.riesgo = item.riesgo || "";
    div.dataset.costo = item.costo || 0;
    div.dataset.felicidad = item.felicidad || 0;
    div.dataset.carril = carril;
    
    if (item.id === 'tarjeta') div.dataset.interes = item.interesSeg;
    if (item.id === 'chanchito') div.dataset.porc = item.porcentaje;
    if (item.id === 'bingo') { div.dataset.prob = item.prob; div.dataset.premio = item.premio; }
    if (esDecisionId) div.dataset.groupId = esDecisionId;

    UI.calle.appendChild(div);
}

function actualizarFisicas() {
    const velocidad = 6; 
    const elementos = document.querySelectorAll('.elemento-cae');
    const posJugador = UI.calle.offsetHeight - 90;

    elementos.forEach(el => {
        let top = parseFloat(el.style.top);
        el.style.top = (top + velocidad) + 'px';

        // Colisión
        if (top > posJugador - 40 && top < posJugador + 40) {
            if (parseInt(el.dataset.carril) === estado.carrilJugador) {
                procesarChoque(el);
            }
        }

        // Si se escapa por abajo (Esquivaste)
        if (top > UI.calle.offsetHeight) {
            // CASTIGO POR TACAÑO (Si esquivas mantenimiento)
            if (el.dataset.riesgo !== "") {
                const tipoRiesgo = el.dataset.riesgo;
                estado.riesgos[tipoRiesgo]++;
                if (estado.riesgos[tipoRiesgo] >= 3) {
                    explotarBomba(tipoRiesgo);
                }
            }
            // Si era una decisión, y no la tocaste, asumimos la peor
            if (el.dataset.groupId) {
                const grupo = document.querySelectorAll(`[data-group-id="${el.dataset.groupId}"]`);
                grupo.forEach(g => g.remove());
            } else {
                el.remove();
            }
        }
    });
}

function procesarChoque(el) {
    const tipo = el.dataset.tipo;
    const costo = parseInt(el.dataset.costo);
    const fel = parseInt(el.dataset.felicidad);
    const riesgo = el.dataset.riesgo;

    UI.jugador.classList.remove('anim-dano', 'anim-ahorro');
    void UI.jugador.offsetWidth;

    // Afectar Felicidad
    if (fel) estado.felicidad += fel;

    if (tipo === 'gasto' || tipo === 'mantenimiento' || tipo === 'decision') {
        pagarDeuda(costo);
        if(costo > 0) {
            UI.jugador.classList.add('anim-dano');
            flotar(`-${formatearPYG(costo)}`, 'text-rose-500');
        } else {
             flotar(`¡Decisión!`, 'text-slate-500');
        }
        // Resetea el riesgo si hiciste el mantenimiento
        if (riesgo !== "") estado.riesgos[riesgo] = 0; 
    } 
    else if (tipo === 'ingreso') {
        estado.billetera += Math.abs(costo);
        UI.jugador.classList.add('anim-ahorro');
        flotar(`+${formatearPYG(Math.abs(costo))}`, 'text-emerald-500');
    }
    else if (tipo === 'salvavidas') { 
        // LÓGICA DEL CHANCHITO: Chupa de billetera. Si no hay, chupa del banco.
        let plataARobar = 0;
        const porc = parseFloat(el.dataset.porc);
        if (estado.billetera > 0) {
            plataARobar = estado.billetera * porc;
            estado.billetera -= plataARobar;
        } else if (estado.banco > 0) {
            plataARobar = estado.banco * porc;
            estado.banco -= plataARobar;
            flotar(`Saco del Banco!`, 'text-blue-500');
        }
        
        if(plataARobar > 0) {
            estado.chanchito += plataARobar;
            UI.jugador.classList.add('anim-ahorro');
            flotar(`+${formatearPYG(plataARobar)} 🐷`, 'text-primary');
        }
    }
    else if (tipo === 'deuda') { 
        estado.tarjetas++;
        estado.billetera += 500000;
        estado.sangradoTarjeta += parseInt(el.dataset.interes); 
        UI.juego.classList.add('pantalla-sangrando');
        flotar(`DEUDA TÓXICA!`, 'text-amber-500');
        setTimeout(() => { estado.sangradoTarjeta = 0; UI.juego.classList.remove('pantalla-sangrando'); }, 5000);
    }
    else if (tipo === 'apuesta') { 
        estado.bingos++;
        pagarDeuda(costo); 
        if (Math.random() <= parseFloat(el.dataset.prob)) {
            estado.billetera += parseInt(el.dataset.premio);
            flotar(`¡GANASTE!`, 'text-emerald-500');
            UI.jugador.classList.add('anim-ahorro');
        } else {
            flotar(`Perdiste el Bingo`, 'text-rose-500');
            UI.jugador.classList.add('anim-dano');
        }
    }

    // Limites de felicidad
    if(estado.felicidad > 100) estado.felicidad = 100;
    
    // Si era una decisión, borramos a su hermana
    if(el.dataset.groupId) {
        const grupo = document.querySelectorAll(`[data-group-id="${el.dataset.groupId}"]`);
        grupo.forEach(g => g.remove());
    } else {
        el.remove();
    }
    
    actualizarMarcadores();
}

function explotarBomba(tipoRiesgo) {
    const bomba = ElementosFinancieros.bombas[tipoRiesgo];
    estado.bombasExplotadas++;
    pagarDeuda(bomba.costo);
    estado.riesgos[tipoRiesgo] = 0; // Resetea
    
    mostrarAlerta(`${bomba.emoji} ${bomba.msj} (-${formatearPYG(bomba.costo)})`, "bg-rose-600");
    UI.jugador.classList.add('anim-dano');
    UI.juego.classList.add('pantalla-sangrando');
    setTimeout(() => UI.juego.classList.remove('pantalla-sangrando'), 1000);
}

function pagarDeuda(monto) {
    let deuda = monto;
    if (estado.billetera >= deuda) { estado.billetera -= deuda; } 
    else {
        deuda -= estado.billetera; estado.billetera = 0;
        if (estado.banco >= deuda) { estado.banco -= deuda; } 
        else {
            deuda -= estado.banco; estado.banco = 0;
            estado.chanchito -= deuda;
            if(estado.chanchito < 0) estado.chanchito = 0; 
        }
    }
}

function flotar(texto, color) {
    const txt = document.createElement('div');
    txt.className = `texto-flotante ${color}`;
    txt.innerText = texto;
    txt.style.left = UI.jugador.style.left;
    txt.style.bottom = '120px';
    UI.calle.appendChild(txt);
    setTimeout(() => txt.remove(), 1000);
}

function mostrarAlerta(msj, bgClass) {
    UI.alerta.innerText = msj;
    UI.alerta.className = `max-w-md mx-auto mt-2 text-white px-3 py-2 rounded-xl shadow-lg text-xs font-bold text-center transition-all ${bgClass}`;
    UI.alerta.classList.remove('hidden');
    setTimeout(() => UI.alerta.classList.add('hidden'), 3500);
}

const formatearPYG = (n) => new Intl.NumberFormat('es-PY').format(Math.round(n || 0)) + ' Gs';
function actualizarMarcadores() {
    UI.banco.innerText = formatearPYG(estado.banco);
    UI.billetera.innerText = formatearPYG(estado.billetera);
    UI.chanchito.innerText = formatearPYG(estado.chanchito);
    UI.felicidad.style.width = `${Math.max(0, estado.felicidad)}%`;
}

// ==========================================
// AUDITORÍA (Los 4 Finales Sarcásticos)
// ==========================================
function terminarJuego() {
    estado.jugando = false;
    clearInterval(loops.juego); clearInterval(loops.creador); clearInterval(loops.meses);
    
    UI.juego.classList.add('hidden'); UI.hud.classList.add('hidden');
    UI.final.classList.remove('hidden'); UI.final.classList.add('flex');

    const totalPlata = estado.banco + estado.billetera + estado.chanchito;
    
    document.getElementById('resChanchito').innerText = formatearPYG(estado.chanchito);
    document.getElementById('resEfectivo').innerText = formatearPYG(estado.banco + estado.billetera);
    document.getElementById('resIntereses').innerText = formatearPYG(estado.interesesPagados);

    const lista = document.getElementById('listaConsejos');
    lista.innerHTML = ''; 

    // EVALUACIÓN DE LOS 4 FINALES VIRALES
    let veredicto = "";
    if (totalPlata <= 0 && estado.felicidad < 40) {
        veredicto = "💔 <b>POBRE Y MISERABLE:</b> Terminaste comiendo hule. Te privaste de todo para 'ahorrar', pero como no hiciste mantenimiento, los imprevistos te comieron vivo. La pobreza te respiró en la nuca.";
    } else if (totalPlata <= 0 && estado.felicidad >= 40) {
        veredicto = "🥳 <b>POBRE PERO FELIZ (Modo YOLO):</b> Saliste de joda, tomaste café caro y viviste como rey. Llora tu cuenta bancaria en guaraníes porque terminaste el año quebrado. Así no se construye un imperio, rey.";
    } else if (totalPlata > estado.sueldo && estado.felicidad < 40) {
        veredicto = "🧟‍♂️ <b>RICO PERO MISERABLE (Tacaño Nivel Dios):</b> Felicidades, lograste juntar mucha plata, pero sos el más rico del cementerio. Tu salud mental está destruida. El dinero es para darte paz, no para esclavizarte.";
    } else {
        veredicto = "👑 <b>EL LOBO DE WALL STREET:</b> ¡Equilibrio perfecto! Ahorraste en tu chanchito, no te dejaste robar por los intereses y encima te diste los gustos necesarios para no volverte loco. Entendiste el juego del dinero.";
    }
    
    agregarConsejo(veredicto);

    // Burlas específicas
    if (estado.tarjetas > 0) agregarConsejo(`💳 Usaste la tarjeta para zafar y te robaron ${formatearPYG(estado.interesesPagados)} en intereses. El gerente del banco se compró un yate gracias a vos.`);
    if (estado.bombasExplotadas > 0) agregarConsejo(`💥 Te hiciste el vivo esquivando el mantenimiento ${estado.bombasExplotadas} veces y la vida te cobró el triple con los imprevistos. Lo barato sale carísimo.`);
    if (estado.bingos > 0) agregarConsejo(`🎰 El casino siempre gana. Jugaste al bingo esperando el milagro en vez de gestionar tu plata.`);
}

function agregarConsejo(texto) {
    const div = document.createElement('div');
    div.className = "bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-slate-700 leading-relaxed";
    div.innerHTML = texto;
    document.getElementById('listaConsejos').appendChild(div);
}
