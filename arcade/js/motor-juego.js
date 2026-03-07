import { ConfiguracionJuego, ElementosFinancieros } from './elementos.js';

let estado = {
    jugando: false, mesActual: 1, carrilJugador: 1,
    sueldo: 0, gastosFijos: 0,
    banco: 0, billetera: 0, chanchito: 0, felicidad: 50,
    relojes: { salud: 9, auto: 15, casa: 18, set: 21 },
    interesesPagados: 0, tarjetas: 0, bingos: 0, bombasExplotadas: 0,
    sangradoTarjeta: 0, contadorSpawns: 0, viajesMostrados: 0
};

let loops = { creador: null, meses: null };
let lastTime = 0; // Para el nuevo motor gráfico fluido

const UI = {
    inicio: document.getElementById('pantallaInicio'), hud: document.getElementById('hud'),
    juego: document.getElementById('zonaJuego'), calle: document.getElementById('calle'),
    jugador: document.getElementById('jugador'), final: document.getElementById('pantallaFinal'),
    banco: document.getElementById('uiBanco'), billetera: document.getElementById('uiBilletera'),
    chanchito: document.getElementById('uiChanchito'), felicidad: document.getElementById('uiFelicidad'),
    mes: document.getElementById('uiMes'), alerta: document.getElementById('uiAlerta')
};

const formatoInput = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    e.target.value = val ? new Intl.NumberFormat('es-PY').format(val).replace(/,/g, '.') : '';
};
document.getElementById('inputSueldo').addEventListener('input', formatoInput);
document.getElementById('inputGastos').addEventListener('input', formatoInput);

function arrancarJuego(e) {
    if(e) e.preventDefault();
    if(estado.jugando) return;

    estado.sueldo = parseInt(document.getElementById('inputSueldo').value.replace(/\D/g, '')) || 0;
    estado.gastosFijos = parseInt(document.getElementById('inputGastos').value.replace(/\D/g, '')) || 0;
    
    estado.banco = estado.sueldo;
    estado.billetera = estado.sueldo * 0.10; 
    
    actualizarMarcadores();
    UI.inicio.classList.add('hidden');
    UI.hud.classList.remove('hidden', 'opacity-0');
    UI.juego.classList.remove('hidden');
    
    estado.jugando = true;
    
    // Inicia el nuevo Motor Gráfico Fluido (GPU)
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);

    loops.meses = setInterval(pasarMes, 1000);
    
    setTimeout(() => {
        crearElemento();
        loops.creador = setInterval(crearElemento, 800);
    }, 200);
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
    
    pagarDeuda(10000); 
    estado.felicidad -= 2; 

    if (estado.sangradoTarjeta > 0) {
        pagarDeuda(estado.sangradoTarjeta);
        estado.interesesPagados += estado.sangradoTarjeta;
    }

    if (segundos % ConfiguracionJuego.cicloMesSegundos === 0) {
        estado.mesActual++;
        if(estado.mesActual <= 12) {
            UI.mes.innerText = estado.mesActual;
            
            // Si el banco está en negativo, el sueldo primero cubre el agujero
            estado.banco += estado.sueldo;
            pagarDeuda(estado.gastosFijos);
            mostrarAlerta("¡Mes nuevo! Sueldo y deudas descontadas.", "bg-blue-600");
        }
    }

    estado.relojes.salud--; estado.relojes.auto--; estado.relojes.casa--; estado.relojes.set--;
    if (estado.relojes.salud <= 0) { explotarBomba('salud'); estado.relojes.salud = 9; }
    if (estado.relojes.auto <= 0) { explotarBomba('auto'); estado.relojes.auto = 15; }
    if (estado.relojes.casa <= 0) { explotarBomba('casa'); estado.relojes.casa = 18; }
    if (estado.relojes.set <= 0) { explotarBomba('set'); estado.relojes.set = 21; }

    if (estado.felicidad <= 0) {
        explotarBomba('burnout');
        estado.felicidad = 35; 
    }

    actualizarMarcadores();
    if (segundos >= ConfiguracionJuego.tiempoPartidaSegundos) terminarJuego();
}

function crearElemento() {
    if(!estado.jugando) return;
    estado.contadorSpawns++;

    if (estado.mesActual >= 8 && estado.viajesMostrados === 0) {
        estado.viajesMostrados++;
        crearDivCaida(ElementosFinancieros.tentaciones.find(t=>t.id==='viaje'), Math.floor(Math.random() * 3));
        return;
    }
    if (estado.mesActual >= 11 && estado.viajesMostrados === 1) {
        estado.viajesMostrados++;
        crearDivCaida(ElementosFinancieros.tentaciones.find(t=>t.id==='viaje'), Math.floor(Math.random() * 3));
        return;
    }
    if (estado.mesActual === 12 && estado.viajesMostrados === 2) {
        estado.viajesMostrados++;
        crearDivCaida(ElementosFinancieros.tentaciones.find(t=>t.id==='viaje'), Math.floor(Math.random() * 3));
        return;
    }

    if (estado.contadorSpawns % 7 === 0) { crearZigZag(); return; }
    if (estado.contadorSpawns % 5 === 0) { crearEncerrona(); return; }

    if(Math.random() > 0.85) {
        const decision = ElementosFinancieros.decisiones[Math.floor(Math.random() * ElementosFinancieros.decisiones.length)];
        crearDivCaida(decision.opcionA, 0, decision.id); 
        crearDivCaida(decision.opcionB, 2, decision.id); 
        return;
    }

    let categorias = [...ElementosFinancieros.tentaciones.filter(t=>t.id!=='viaje'), ...ElementosFinancieros.mantenimiento, ...ElementosFinancieros.ingresos, ...ElementosFinancieros.instrumentos];
    categorias.push(ElementosFinancieros.instrumentos.find(i => i.id === 'chanchito'));
    categorias.push(ElementosFinancieros.instrumentos.find(i => i.id === 'chanchito'));

    const item1 = categorias[Math.floor(Math.random() * categorias.length)];
    const item2 = categorias[Math.floor(Math.random() * categorias.length)];

    let carriles = [0, 1, 2];
    carriles.sort(() => Math.random() - 0.5);

    crearDivCaida(item1, carriles[0]);
    crearDivCaida(item2, carriles[1]); 
}

function crearEncerrona() {
    const tentacion = ElementosFinancieros.tentaciones[Math.floor(Math.random() * (ElementosFinancieros.tentaciones.length-1))]; 
    const obligacion = ElementosFinancieros.mantenimiento[Math.floor(Math.random() * ElementosFinancieros.mantenimiento.length)];
    const trampa = ElementosFinancieros.instrumentos.find(i => i.id === 'tarjeta'); 

    const items = [tentacion, obligacion, trampa];
    items.sort(() => Math.random() - 0.5); 

    crearDivCaida(items[0], 0);
    crearDivCaida(items[1], 1);
    crearDivCaida(items[2], 2);
}

function crearZigZag() {
    const randomItem = () => {
        let cats = [...ElementosFinancieros.tentaciones.filter(t=>t.id!=='viaje'), ...ElementosFinancieros.mantenimiento];
        return cats[Math.floor(Math.random() * cats.length)];
    };
    
    crearDivCaida(randomItem(), 1, null, -60);
    crearDivCaida(randomItem(), 2, null, -60);
    
    crearDivCaida(randomItem(), 0, null, -200);
    crearDivCaida(randomItem(), 1, null, -200);

    crearDivCaida(randomItem(), 1, null, -340);
    crearDivCaida(randomItem(), 2, null, -340);
}

function crearDivCaida(item, carril, esDecisionId = null, topOffset = -60) {
    const div = document.createElement('div');
    let estiloExtra = item.id === 'viaje' ? 'border-amber-400 shadow-amber-500/50 scale-110' : 'border-slate-200';
    
    // Se redujo el tamaño de text-4xl a text-3xl para mayor legibilidad
    div.className = `elemento-cae bg-white/90 backdrop-blur shadow-xl border-2 flex items-center justify-center text-3xl ${estiloExtra}`;
    div.innerText = item.emoji;
    
    // Posicionamiento horizontal y preparación para GPU
    div.style.left = ['16.6%', '50%', '83.3%'][carril];
    div.style.willChange = 'transform'; // Activa aceleración gráfica
    
    div.dataset.posY = topOffset; // Guardamos la posición Y real
    div.style.transform = `translate(-50%, ${topOffset}px)`;
    
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

// NUEVO MOTOR DE FÍSICAS FLUIDO (Acelerado por GPU)
function gameLoop(timestamp) {
    if (!estado.jugando) return;
    
    // Calculamos el tiempo transcurrido entre cuadros (Delta Time)
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    actualizarFisicas(dt);
    requestAnimationFrame(gameLoop);
}

function actualizarFisicas(dt) {
    // Velocidad base en pixeles por segundo + Aceleración progresiva
    const escalon = Math.floor(segundos / 3);
    const pixelesPorSegundo = 420 + (escalon * 30); 
    const avanceFisico = pixelesPorSegundo * dt;
    
    const elementos = document.querySelectorAll('.elemento-cae');
    const posJugador = UI.calle.offsetHeight - 90;

    elementos.forEach(el => {
        let posY = parseFloat(el.dataset.posY) + avanceFisico;
        el.dataset.posY = posY;
        
        // Mueve usando la tarjeta gráfica
        el.style.transform = `translate(-50%, ${posY}px)`;

        // Colisión precisa
        if (posY > posJugador - 40 && posY < posJugador + 40) {
            if (parseInt(el.dataset.carril) === estado.carrilJugador) {
                procesarChoque(el);
            }
        }

        if (posY > UI.calle.offsetHeight + 100) {
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
        
        if (riesgo !== "") {
            if(riesgo === 'salud') estado.relojes.salud = 9;
            if(riesgo === 'auto') estado.relojes.auto = 15;
            if(riesgo === 'casa') estado.relojes.casa = 18;
            if(riesgo === 'set') estado.relojes.set = 21;
        }
    } 
    else if (tipo === 'ingreso') {
        // Los ingresos entran limpios a la billetera, o cubren deudas bancarias
        if (estado.banco < 0) {
            estado.banco += Math.abs(costo);
            if (estado.banco > 0) {
                estado.billetera += estado.banco;
                estado.banco = 0;
            }
        } else {
            estado.billetera += Math.abs(costo);
        }
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
        estado.billetera += 500000; // Efectivo falso rápido
        estado.sangradoTarjeta += parseInt(el.dataset.interes); 
        UI.juego.classList.add('pantalla-sangrando');
        flotar(`DEUDA TÓXICA!`, 'text-amber-500');
        setTimeout(() => { estado.sangradoTarjeta = 0; UI.juego.classList.remove('pantalla-sangrando'); }, 5000);
    }
    else if (tipo === 'apuesta') { 
        estado.bingos++;
        pagarDeuda(costo); 
        if (Math.random() <= parseFloat(el.dataset.prob)) {
            if (estado.banco < 0) estado.banco += parseInt(el.dataset.premio);
            else estado.billetera += parseInt(el.dataset.premio);
            
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

// CASCADA FINANCIERA REALISTA
function pagarDeuda(monto) {
    let deuda = monto;

    // 1. Efectivo Paga primero
    if (estado.billetera >= deuda) {
        estado.billetera -= deuda;
        deuda = 0;
    } else {
        deuda -= estado.billetera;
        estado.billetera = 0;
    }

    // 2. Banco absorbe hasta quedar en cero
    if (deuda > 0) {
        if (estado.banco >= deuda) {
            estado.banco -= deuda;
            deuda = 0;
        } else {
            deuda -= Math.max(0, estado.banco); 
            estado.banco = Math.min(0, estado.banco); 
        }
    }

    // 3. Destruye tus Ahorros si el banco se quedó sin liquidez
    if (deuda > 0) {
        if (estado.chanchito >= deuda) {
            estado.chanchito -= deuda;
            deuda = 0;
        } else {
            deuda -= estado.chanchito;
            estado.chanchito = 0;
        }
    }

    // 4. Lo que no podés pagar, se convierte en saldo deudor
    if (deuda > 0) {
        estado.banco -= deuda; // Entra en números rojos
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
    UI.banco.className = estado.banco < 0 ? "text-xs font-black text-rose-600" : "text-xs font-black text-slate-800";
    
    UI.billetera.innerText = formatearPYG(estado.billetera);
    UI.chanchito.innerText = formatearPYG(estado.chanchito);
    UI.felicidad.style.width = `${Math.max(0, estado.felicidad)}%`;
}

function terminarJuego() {
    estado.jugando = false;
    cancelAnimationFrame(gameLoop);
    clearInterval(loops.creador); clearInterval(loops.meses);
    
    UI.juego.classList.add('hidden'); UI.hud.classList.add('hidden');
    UI.final.classList.remove('hidden'); UI.final.classList.add('flex');

    const totalPlata = estado.banco + estado.billetera + estado.chanchito;
    
    document.getElementById('resChanchito').innerText = formatearPYG(estado.chanchito);
    
    const resEfectivoUI = document.getElementById('resEfectivo');
    resEfectivoUI.innerText = formatearPYG(estado.banco + estado.billetera);
    resEfectivoUI.className = (estado.banco + estado.billetera) < 0 ? "text-sm font-black text-rose-600" : "text-sm font-bold text-slate-700";
    
    document.getElementById('resIntereses').innerText = formatearPYG(estado.interesesPagados);

    const lista = document.getElementById('listaConsejos');
    lista.innerHTML = ''; 

    let veredicto = "";
    if (totalPlata < 0) {
        veredicto = `💔 <b>QUEBRADO Y ENDEUDADO:</b> Cerraste el año con deudas por <span class="text-rose-600 font-bold">${formatearPYG(totalPlata)}</span>. Las tarjetas y los imprevistos te fundieron. Ahora le pertenecés al banco.`;
    } else if (totalPlata === 0 && estado.felicidad < 40) {
        veredicto = "💔 <b>POBRE Y MISERABLE:</b> Terminaste comiendo hule. Te privaste de todo para 'ahorrar', pero los imprevistos te comieron vivo y te deprimiste.";
    } else if (totalPlata <= 0 && estado.felicidad >= 40) {
        veredicto = "🥳 <b>POBRE PERO FELIZ (Modo YOLO):</b> Saliste de joda, fuiste de viaje y viviste como rey. Llora tu cuenta bancaria porque terminaste el año sin ahorros. Así no se construye un imperio, rey.";
    } else if (totalPlata > 0 && estado.felicidad < 40) {
        veredicto = "🧟‍♂️ <b>RICO PERO MISERABLE (Tacaño Nivel Dios):</b> Lograste juntar plata, pero sos el más rico del cementerio. Tu salud mental está destruida. El dinero es para darte paz, no para esclavizarte.";
    } else {
        veredicto = "👑 <b>EL LOBO DE WALL STREET:</b> ¡Equilibrio perfecto! Ahorraste en tu chanchito, sobreviviste a la vida y encima te diste los gustos para no volverte loco. Entendiste el juego del dinero.";
    }
    agregarConsejo(veredicto);

    if (estado.tarjetas > 0) agregarConsejo(`💳 Usaste la tarjeta para zafar y te robaron ${formatearPYG(estado.interesesPagados)} en intereses usureros.`);
    if (estado.bombasExplotadas > 0) agregarConsejo(`💥 Te hiciste el vivo esquivando el mantenimiento básico y la vida te cobró el triple con los imprevistos.`);
    if (estado.bingos > 0) agregarConsejo(`🎰 El casino siempre gana. Jugaste al bingo esperando el milagro en vez de gestionar tu plata.`);
}

function agregarConsejo(texto) {
    const div = document.createElement('div');
    div.className = "bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-slate-700 leading-relaxed text-left";
    div.innerHTML = texto;
    document.getElementById('listaConsejos').appendChild(div);
}
