import { ConfiguracionJuego, ElementosFinancieros } from './elementos.js';

let estado = {
    jugando: false, mesActual: 1, carrilJugador: 1,
    sueldo: 0, gastosFijos: 0,
    banco: 0, billetera: 0, chanchito: 0, felicidad: 50,
    
    // MECÁNICA 2: Relojes Biológicos (Tenés 15 seg para comer, 25 para arreglar la casa)
    relojes: { salud: 15, auto: 25, casa: 30, set: 35 },
    
    // Estadísticas y Contadores
    interesesPagados: 0, tarjetas: 0, bingos: 0, bombasExplotadas: 0,
    sangradoTarjeta: 0, contadorSpawns: 0
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

// Formateador en vivo para las casillas (Agrega los puntitos de miles solos)
const formatoInput = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    e.target.value = val ? new Intl.NumberFormat('es-PY').format(val).replace(/,/g, '.') : '';
};
document.getElementById('inputSueldo').addEventListener('input', formatoInput);
document.getElementById('inputGastos').addEventListener('input', formatoInput);

function arrancarJuego(e) {
    if(e) e.preventDefault();
    if(estado.jugando) return;

    // Lee los números quitando los puntos
    estado.sueldo = parseInt(document.getElementById('inputSueldo').value.replace(/\D/g, '')) || 0;
    estado.gastosFijos = parseInt(document.getElementById('inputGastos').value.replace(/\D/g, '')) || 0;
    
    estado.banco = estado.sueldo;
    estado.billetera = estado.sueldo * 0.10; // Arracás solo con un 10% en mano para emergencias
    
    actualizarMarcadores();
    UI.inicio.classList.add('hidden');
    UI.hud.classList.remove('hidden', 'opacity-0');
    UI.juego.classList.remove('hidden');
    
    estado.jugando = true;
    loops.juego = setInterval(actualizarFisicas, 1000 / 60);
    loops.creador = setInterval(crearElemento, 1300);
    loops.meses = setInterval(pasarMes, 1000);
}

const btnEmpezar = document.getElementById('btnEmpezar');
btnEmpezar.addEventListener('click', arrancarJuego);
btnEmpezar.addEventListener('touchstart', arrancarJuego, { passive: false });

function mover(dir) {
    if(!estado.jugando) return;
    if (dir === 'izq' && estado.carrilJugador > 0) estado.carrilJugador--;
    if (dir === 'der' && estado.carrilJugador < 2) estado.carrilJugador++;
    UI.jugador.style.left = ['16.6%', '50%', '83.3%'][estado.carrilJugador];
}
document.getElementById('btnIzq').addEventListener('touchstart', (e) => { e.preventDefault(); mover('izq'); });
document.getElementById('btnDer').addEventListener('touchstart', (e) => { e.preventDefault(); mover('der'); });
window.addEventListener('keydown', (e) => { if(e.key === 'ArrowLeft') mover('izq'); if(e.key === 'ArrowRight') mover('der'); });

let segundos = 0;
function pasarMes() {
    if(!estado.jugando) return;
    segundos++;
    
    // MECÁNICA 1: EL COSTO DE RESPIRAR (Pierdes 10.000 Gs por segundo invisiblemente)
    pagarDeuda(10000);

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
            mostrarAlerta("¡Mes nuevo! Sueldo y deudas descontadas.", "bg-blue-600");
        }
    }

    // MECÁNICA 2: GESTIÓN DE RELOJES BIOLÓGICOS (Se acaba el tiempo para hacer mantenimiento)
    estado.relojes.salud--;
    estado.relojes.auto--;
    estado.relojes.casa--;
    estado.relojes.set--;

    if (estado.relojes.salud <= 0) { explotarBomba('salud'); estado.relojes.salud = 15; }
    if (estado.relojes.auto <= 0) { explotarBomba('auto'); estado.relojes.auto = 25; }
    if (estado.relojes.casa <= 0) { explotarBomba('casa'); estado.relojes.casa = 30; }
    if (estado.relojes.set <= 0) { explotarBomba('set'); estado.relojes.set = 35; }

    if (estado.felicidad <= 0) {
        explotarBomba('burnout');
        estado.felicidad = 30; // Psicólogo
    }

    actualizarMarcadores();
    if (segundos >= ConfiguracionJuego.tiempoPartidaSegundos) terminarJuego();
}

function crearElemento() {
    if(!estado.jugando) return;
    estado.contadorSpawns++;

    // MECÁNICA 3: ENCERRONAS INEVITABLES (Cada 6 caídas, te bloquea la calle entera)
    if (estado.contadorSpawns % 6 === 0) {
        crearEncerrona();
        return;
    }

    // El resto de las veces (85%) cae normal
    const rng = Math.random();
    if(rng > 0.85) {
        const decision = ElementosFinancieros.decisiones[Math.floor(Math.random() * ElementosFinancieros.decisiones.length)];
        crearDivCaida(decision.opcionA, 0, decision.id); 
        crearDivCaida(decision.opcionB, 2, decision.id); 
        return;
    }

    let categorias = [...ElementosFinancieros.tentaciones, ...ElementosFinancieros.mantenimiento, ...ElementosFinancieros.ingresos, ...ElementosFinancieros.instrumentos];
    categorias.push(ElementosFinancieros.instrumentos.find(i => i.id === 'chanchito'));
    categorias.push(ElementosFinancieros.instrumentos.find(i => i.id === 'chanchito'));

    const item = categorias[Math.floor(Math.random() * categorias.length)];
    crearDivCaida(item, Math.floor(Math.random() * 3));
}

function crearEncerrona() {
    // Genera un muro de 3 cosas y tenés que chocar alguna. ¡Adrenalina pura!
    const tentacion = ElementosFinancieros.tentaciones[Math.floor(Math.random() * ElementosFinancieros.tentaciones.length)];
    const obligacion = ElementosFinancieros.mantenimiento[Math.floor(Math.random() * ElementosFinancieros.mantenimiento.length)];
    const trampa = ElementosFinancieros.instrumentos.find(i => i.id === 'tarjeta'); // El salvavidas venenoso

    const items = [tentacion, obligacion, trampa];
    items.sort(() => Math.random() - 0.5); // Mezcla aleatoria en qué carril salen

    crearDivCaida(items[0], 0);
    crearDivCaida(items[1], 1);
    crearDivCaida(items[2], 2);
}

function crearDivCaida(item, carril, esDecisionId = null) {
    const div = document.createElement('div');
    div.className = 'elemento-cae bg-white/90 backdrop-blur shadow-xl border-2 border-slate-200 flex items-center justify-center text-4xl';
    div.innerText = item.emoji;
    div.style.left = ['16.6%', '50%', '83.3%'][carril];
    div.style.top = '-60px';
    
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
    // MECÁNICA 4: INFLACIÓN DE VELOCIDAD (Arranca en 6, termina en 12 al final del año)
    const velocidad = 6 + (segundos / 10); 
    
    const elementos = document.querySelectorAll('.elemento-cae');
    const posJugador = UI.calle.offsetHeight - 90;

    elementos.forEach(el => {
        let top = parseFloat(el.style.top);
        el.style.top = (top + velocidad) + 'px';

        if (top > posJugador - 40 && top < posJugador + 40) {
            if (parseInt(el.dataset.carril) === estado.carrilJugador) {
                procesarChoque(el);
            }
        }

        if (top > UI.calle.offsetHeight) {
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

    if (fel) estado.felicidad += fel;

    if (tipo === 'gasto' || tipo === 'mantenimiento' || tipo === 'decision') {
        pagarDeuda(costo);
        if(costo > 0) {
            UI.jugador.classList.add('anim-dano');
            flotar(`-${formatearPYG(costo)}`, 'text-rose-500');
        } else {
             flotar(`¡Decisión!`, 'text-slate-500');
        }
        
        // MECÁNICA 2 (Reset): Si hiciste el mantenimiento, tu reloj biológico se reinicia
        if (riesgo !== "") {
            if(riesgo === 'salud') estado.relojes.salud = 15;
            if(riesgo === 'auto') estado.relojes.auto = 25;
            if(riesgo === 'casa') estado.relojes.casa = 30;
            if(riesgo === 'set') estado.relojes.set = 35;
        }
    } 
    else if (tipo === 'ingreso') {
        estado.billetera += Math.abs(costo);
        UI.jugador.classList.add('anim-ahorro');
        flotar(`+${formatearPYG(Math.abs(costo))}`, 'text-emerald-500');
    }
    else if (tipo === 'salvavidas') { 
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

    if(estado.felicidad > 100) estado.felicidad = 100;
    
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

    let veredicto = "";
    if (totalPlata <= 0 && estado.felicidad < 40) {
        veredicto = "💔 <b>POBRE Y MISERABLE:</b> Terminaste comiendo hule. Te privaste de todo para 'ahorrar', pero como no hiciste mantenimiento, los imprevistos te comieron vivo. La pobreza te respiró en la nuca.";
    } else if (totalPlata <= 0 && estado.felicidad >= 40) {
        veredicto = "🥳 <b>POBRE PERO FELIZ (Modo YOLO):</b> Saliste de joda, tomaste café caro y viviste como rey. Llora tu cuenta bancaria en guaraníes porque terminaste el año quebrado. Así no se construye un imperio, rey.";
    } else if (totalPlata > (estado.sueldo * 2) && estado.felicidad < 40) {
        veredicto = "🧟‍♂️ <b>RICO PERO MISERABLE (Tacaño Nivel Dios):</b> Felicidades, lograste juntar mucha plata, pero sos el más rico del cementerio. Tu salud mental está destruida. El dinero es para darte paz, no para esclavizarte.";
    } else {
        veredicto = "👑 <b>EL LOBO DE WALL STREET:</b> ¡Equilibrio perfecto! Ahorraste en tu chanchito, no te dejaste robar por los intereses y encima te diste los gustos necesarios para no volverte loco. Entendiste el juego del dinero.";
    }
    agregarConsejo(veredicto);

    if (estado.tarjetas > 0) agregarConsejo(`💳 Usaste la tarjeta para zafar y te robaron ${formatearPYG(estado.interesesPagados)} en intereses. El gerente del banco se compró un yate gracias a vos.`);
    if (estado.bombasExplotadas > 0) agregarConsejo(`💥 Te hiciste el vivo esquivando el mantenimiento básico y la vida te cobró el triple con los imprevistos médicos/hogar. Lo barato sale carísimo.`);
    if (estado.bingos > 0) agregarConsejo(`🎰 El casino siempre gana. Jugaste al bingo esperando el milagro en vez de gestionar tu plata.`);
}

function agregarConsejo(texto) {
    const div = document.createElement('div');
    div.className = "bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-slate-700 leading-relaxed text-left";
    div.innerHTML = texto;
    document.getElementById('listaConsejos').appendChild(div);
}
