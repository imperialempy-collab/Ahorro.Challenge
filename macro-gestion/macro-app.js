import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

window.ENABLE_MANUAL_SYNC = true;

const firebaseConfig = {
    apiKey: "AIzaSyByAQh5iPU5B8JWA4KrQOyphzW9sAgsxDg",
    authDomain: "ahorro-dinamico.firebaseapp.com",
    projectId: "ahorro-dinamico",
    storageBucket: "ahorro-dinamico.firebasestorage.app",
    messagingSenderId: "906931960122",
    appId: "1:906931960122:web:02b6d090d163c2c135f803"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

window.userAccessStatus = localStorage.getItem('local_user_status') || 'prueba';
window.logout = () => { localStorage.removeItem('local_user_status'); signOut(auth).then(() => { window.location.href = '../index.html'; }); };

// UI GENERALES
window.toggleSidebar = () => { const sb = document.getElementById('sidebar'); const ov = document.getElementById('sidebarOverlay'); if(sb.classList.contains('-translate-x-full')) { sb.classList.remove('-translate-x-full'); ov.classList.remove('hidden'); } else { sb.classList.add('-translate-x-full'); ov.classList.add('hidden'); } };
window.cerrarPaywall = () => {}; 
window.abrirPaywall = () => { window.location.href = '../activar.html'; };
window.toggleModal = (modalID) => { 
    const modal = document.getElementById(modalID); 
    modal.classList.toggle('hidden'); 
    if (modalID === 'modalInfo' && !modal.classList.contains('hidden')) {
        setTimeout(() => {
            const input = document.getElementById('inputIngresoPromedio');
            if(input) {
                const actual = parseInt(localStorage.getItem('mg_ingreso')) || 0;
                input.value = actual > 0 ? new Intl.NumberFormat('es-PY').format(actual).replace(/,/g, '.') : '';
                input.focus();
            }
        }, 10);
    }
};

// --- FUNCIONES PARA EL PAYWALL VIP ---
window.mostrarAlerta = (mensaje, esPaywall = false) => { 
    const alertMsg = document.getElementById('customAlertMessage');
    if(alertMsg) alertMsg.innerText = mensaje; 
    
    const btnActivar = document.getElementById('btnAlertActivar');
    const btnGratis = document.getElementById('btnProbarGratis');
    const btnOk = document.getElementById('btnAlertOk');
    
    if(esPaywall) {
        if(btnActivar) btnActivar.classList.remove('hidden');
        if(btnGratis) btnGratis.classList.remove('hidden');
        if(btnOk) btnOk.classList.add('hidden');
    } else {
        if(btnActivar) btnActivar.classList.add('hidden');
        if(btnGratis) btnGratis.classList.add('hidden');
        if(btnOk) btnOk.classList.remove('hidden');
    }
    
    const alertModal = document.getElementById('customAlert');
    if(alertModal) alertModal.classList.remove('hidden'); 
};

window.closeCustomAlert = () => { 
    const alertModal = document.getElementById('customAlert');
    if(alertModal) alertModal.classList.add('hidden'); 
};

window.actualizarUI_Pago = () => {
    const btnPagar = document.getElementById('btnSidebarPagar');
    if (!btnPagar) return;
    if(window.userAccessStatus === 'pagado') {
        btnPagar.innerHTML = '<span class="text-emerald-500 font-black">Acceso Ilimitado 👑</span>';
        btnPagar.onclick = null;
        btnPagar.classList.replace('bg-slate-900', 'bg-emerald-50');
        btnPagar.classList.replace('text-white', 'text-emerald-700');
    } else if (window.userAccessStatus === 'pendiente') {
        btnPagar.innerHTML = 'Ver mi Comprobante ⏳';
        btnPagar.onclick = () => window.location.href = '../activar.html';
        btnPagar.classList.replace('bg-slate-900', 'bg-amber-100');
        btnPagar.classList.replace('text-white', 'text-amber-700');
    } else {
        btnPagar.innerHTML = 'Activar Acceso Ilimitado 👑';
        btnPagar.onclick = () => window.location.href = '../activar.html';
    }
};

// --- MOTOR DE SINCRONIZACIÓN ---
window.sincronizarNube = async (manual = false) => {
    if (!auth.currentUser) return;
    if (manual && !window.ENABLE_MANUAL_SYNC) {
        window.interactuarApp('alert', 'Actualización Manual', 'La actualización manual está desactivada.');
        return;
    }

    try {
        document.querySelectorAll('.sync-dot').forEach(el => el.className = "sync-dot absolute top-0 right-0 w-2 h-2 bg-amber-400 border border-white rounded-full animate-ping");
        const userRef = doc(db, "usuarios_multimeta", auth.currentUser.email);

        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            const realStatus = docSnap.data().status;
            localStorage.setItem('local_user_status', realStatus);
            window.userAccessStatus = realStatus;

            if (realStatus === 'vencido' || realStatus === 'rechazado') {
                window.location.href = '../activar.html';
                return;
            }
        }

        const safeParse = (str) => { try { return (str && str !== "null" && str !== "undefined") ? JSON.parse(str) : null; } catch(e) { return null; } };
        const payload = {
            ahorro_data: safeParse(localStorage.getItem('ahorro_dinamico_LAB_TEST_MULTIMETA')),
            macro_data: { cuentas: safeParse(localStorage.getItem('mg_cuentas')), gastos: safeParse(localStorage.getItem('mg_gastos')), historial: safeParse(localStorage.getItem('mg_historial')), ingreso: localStorage.getItem('mg_ingreso') || 0 },
            last_sync: new Date().toISOString(),
            sync_count: increment(1)
        };

        await updateDoc(userRef, payload);

        localStorage.setItem('last_cloud_sync', new Date().getTime().toString());
        document.querySelectorAll('.sync-dot').forEach(el => el.className = "sync-dot absolute top-0 right-0 w-2 h-2 bg-emerald-500 border border-white rounded-full transition-colors");
        window.actualizarUI_Pago();
        
        if (manual) window.interactuarApp('alert', 'Nube Sincronizada', '✅ Sincronización exitosa. Tu progreso está 100% seguro en la nube.');
    } catch (error) {
        console.error("Error sincronizando:", error);
        if (manual) window.interactuarApp('alert', 'Error', '❌ Hubo un error al guardar en la nube.');
        document.querySelectorAll('.sync-dot').forEach(el => el.className = "sync-dot absolute top-0 right-0 w-2 h-2 bg-rose-500 border border-white rounded-full transition-colors");
    }
};

window.verificarAutoSync = () => {
    if (typeof window.sincronizarNube !== 'function') return;
    const lastSync = localStorage.getItem('last_cloud_sync');
    const now = new Date().getTime();
    if (!lastSync || (now - parseInt(lastSync)) > 86400000) { window.sincronizarNube(false); }
};

// --- AUTENTICACIÓN OPTIMISTA ---
onAuthStateChanged(auth, async (user) => {
    if (user) { 
        document.getElementById('sidebarUserEmail').innerText = user.email;
        
        const localStatus = localStorage.getItem('local_user_status');
        if (localStatus === 'pagado') {
            window.userAccessStatus = 'pagado';
            window.actualizarUI_Pago();
            document.querySelectorAll('.sync-dot').forEach(el => el.className = "sync-dot absolute top-0 right-0 w-2 h-2 bg-emerald-500 border border-white rounded-full");
            window.renderizarSelectorIconos(); 
            window.renderizarApp();
            window.verificarAutoSync(); 
            return; 
        }

        const userRef = doc(db, "usuarios_multimeta", user.email);
        try {
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                const userData = docSnap.data();
                window.userAccessStatus = userData.status || 'prueba';
                localStorage.setItem('local_user_status', window.userAccessStatus);
                
                const localCuentas = localStorage.getItem('mg_cuentas');
                const hasLocalMacro = localCuentas && localCuentas !== "null" && localCuentas !== "undefined" && localCuentas.length > 10;
                if (!hasLocalMacro) {
                    if (userData.macro_data) {
                        if(userData.macro_data.cuentas) localStorage.setItem('mg_cuentas', JSON.stringify(userData.macro_data.cuentas));
                        if(userData.macro_data.gastos) localStorage.setItem('mg_gastos', JSON.stringify(userData.macro_data.gastos));
                        if(userData.macro_data.historial) localStorage.setItem('mg_historial', JSON.stringify(userData.macro_data.historial));
                        if(userData.macro_data.ingreso) localStorage.setItem('mg_ingreso', userData.macro_data.ingreso.toString());
                    }
                }
                
                const localAhorro = localStorage.getItem('ahorro_dinamico_LAB_TEST_MULTIMETA');
                if (!localAhorro || localAhorro === "null" || localAhorro === "undefined") {
                    if (userData.ahorro_data && Object.keys(userData.ahorro_data).length > 0) { localStorage.setItem('ahorro_dinamico_LAB_TEST_MULTIMETA', JSON.stringify(userData.ahorro_data)); }
                }

                if (window.userAccessStatus === 'vencido' || window.userAccessStatus === 'rechazado') {
                    window.location.href = '../activar.html';
                    return;
                }

                document.querySelectorAll('.sync-dot').forEach(el => el.className = "sync-dot absolute top-0 right-0 w-2 h-2 bg-emerald-500 border border-white rounded-full");
            } else {
                await setDoc(userRef, { email: user.email, status: 'prueba', fechaInicio: new Date().toISOString() });
                window.userAccessStatus = 'prueba';
                localStorage.setItem('local_user_status', 'prueba');
            }
        } catch(e) { console.error("Modo local forzado.", e); }
        
        window.actualizarUI_Pago();
        window.renderizarSelectorIconos(); 
        window.renderizarApp();
        window.verificarAutoSync(); 
        
    } else { 
        localStorage.removeItem('local_user_status');
        window.location.href = '../index.html'; 
    }
});

// MACRO GESTION LOGIC
const descripcionesReportes = { 
    flujo: { tit: "📈 Flujo de Caja Mensual", desc: "El dinero que te queda Disponible este mes.\n\nSe calcula restando TODOS tus gastos (fijos y fugas) del Ingreso Promedio que anotaste en la (i). La gráfica te muestra cómo tu sueldo se va consumiendo día a día." }, 
    asfixia: { tit: "⚖️ Ratio de Asfixia", desc: "Compara tus gastos con el Ingreso Promedio que ingresaste manualmente en la (i) superior.\n\nSi tus gastos fijos (alquiler, deudas) y variables ocupan mucho de tu barra, estás asfixiado. Cualquier imprevisto te va a endeudar." }, 
    agujero: { tit: "🕳️ El Agujero Negro", desc: "Es la suma total de TODO tu dinero gastado este mes.\n\nIncluye tanto el dinero de las actualizaciones de tus cuentas (gastos variables) como los Gastos Fijos que ya tildaste como pagados." } 
};
window.infoReporte = (clave) => { window.interactuarApp('alert', descripcionesReportes[clave].tit, descripcionesReportes[clave].desc); };

let modalResolve = null;
window.formatoGs = (num) => new Intl.NumberFormat('es-PY').format(num) + " Gs";
window.obtenerFechaHoy = () => { const hoy = new Date(); return `${hoy.getDate().toString().padStart(2, '0')}/${(hoy.getMonth()+1).toString().padStart(2, '0')}/${hoy.getFullYear()}`; };

// Cursor Perfecto
window.formatoInputEnVivo = (e) => { 
    const el = e.target;
    let val = el.value.replace(/\D/g, '');
    let originalPos = el.selectionStart;
    let originalLength = el.value.length;
    let format = val ? new Intl.NumberFormat('es-PY').format(val).replace(/,/g, '.') : '';
    el.value = format;
    let newPos = originalPos + (format.length - originalLength);
    el.setSelectionRange(newPos, newPos);
};

const logosDisponibles = [ 'itau.png', 'ueno.png', 'familiar.png', 'continental.png', 'bnf.png', 'tigo.png', 'personal.png', 'mango.png', 'wally.png', 'zimple.png', 'iconotarjeta.png', 'tarjetas.png', 'efectivo1.png', 'efectivo2.png', 'efectivo3.png', 'efectivo4.png', 'efectivo5.png' ];
let iconoSeleccionado = '🏦';

window.reemplazarPorTexto = (imgElement, texto) => {
    if (!imgElement) return;
    const span = document.createElement('span');
    span.className = 'text-lg font-black text-primary tracking-widest';
    span.innerText = texto;
    if (imgElement.parentElement) {
        imgElement.parentElement.replaceChild(span, imgElement);
    }
};

window.renderizarSelectorIconos = () => { 
    const grilla = document.getElementById('grillaIconos'); 
    if(grilla){ 
        grilla.innerHTML = logosDisponibles.map(logo => { 
            const logoId = logo.replace('.png', ''); 
            const nombreCorto = logoId.substring(0, 2).toUpperCase();
            return `<div id="logo-${logoId}" onclick="seleccionarIcono('${logo}')" class="logo-opt w-14 h-14 shrink-0 bg-white border-2 border-slate-100 rounded-xl p-0.5 cursor-pointer hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm overflow-hidden">
                        <img src="logos/${logo}?v=2" onerror="window.reemplazarPorTexto(this, '${nombreCorto}')" class="w-full h-full object-contain scale-125 transform transition-transform" alt="${logo}">
                    </div>`; 
        }).join(''); 
    }
};

window.seleccionarIcono = (logo) => { iconoSeleccionado = logo; document.querySelectorAll('.logo-opt').forEach(el => { el.classList.remove('ring-2', 'ring-primary', 'border-primary'); el.classList.add('border-slate-100'); }); const elementId = 'logo-' + logo.replace('.png', ''); const seleccionado = document.getElementById(elementId); if (seleccionado) { seleccionado.classList.remove('border-slate-100'); seleccionado.classList.add('ring-2', 'ring-primary', 'border-primary'); seleccionado.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); } };
window.limpiarSeleccionIconos = () => { document.querySelectorAll('.logo-opt').forEach(el => { el.classList.remove('ring-2', 'ring-primary', 'border-primary'); el.classList.add('border-slate-100'); }); };

// --- SISTEMA DE COLORES PARA GASTOS ---
const coloresGastos = ['bg-rose-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500'];
let colorSeleccionado = '';

window.renderizarSelectorColores = () => { 
    const grilla = document.getElementById('grillaColores'); 
    if(grilla) { 
        // Botón "Sin Color" con una X adentro
        let html = `<div id="color-none" onclick="limpiarSeleccionColor()" class="color-opt w-8 h-8 shrink-0 bg-white border-2 border-slate-200 border-dashed rounded-full cursor-pointer hover:bg-slate-50 transition-all flex items-center justify-center m-1 text-slate-300" title="Sin color"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></div>`;
        
        // Resto de los colores
        html += coloresGastos.map(c => `<div id="color-${c}" onclick="seleccionarColor('${c}')" class="color-opt w-8 h-8 shrink-0 ${c} rounded-full cursor-pointer hover:opacity-80 transition-all shadow-sm border-2 border-transparent flex items-center justify-center m-1"></div>`).join(''); 
        
        grilla.innerHTML = html;
    } 
};

window.seleccionarColor = (color) => { 
    colorSeleccionado = color; 
    document.querySelectorAll('.color-opt').forEach(el => el.classList.remove('border-slate-800', 'scale-110', 'border-slate-400')); 
    const seleccionado = document.getElementById(`color-${color}`); 
    if (seleccionado) seleccionado.classList.add('border-slate-800', 'scale-110'); 
};

window.limpiarSeleccionColor = () => {
    colorSeleccionado = '';
    document.querySelectorAll('.color-opt').forEach(el => el.classList.remove('border-slate-800', 'scale-110', 'border-slate-400')); 
    const btnNone = document.getElementById('color-none');
    if (btnNone) btnNone.classList.add('border-slate-400', 'scale-110');
};

let cuentas = JSON.parse(localStorage.getItem('mg_cuentas')) || [];
let gastos = JSON.parse(localStorage.getItem('mg_gastos')) || [];
let historialMovimientos = JSON.parse(localStorage.getItem('mg_historial')) || [];

window.guardarDatos = () => { 
    localStorage.setItem('mg_cuentas', JSON.stringify(cuentas)); 
    localStorage.setItem('mg_gastos', JSON.stringify(gastos)); 
    localStorage.setItem('mg_historial', JSON.stringify(historialMovimientos)); 
    document.querySelectorAll('.sync-dot').forEach(el => el.className = "sync-dot absolute top-0 right-0 w-2 h-2 bg-rose-500 border border-white rounded-full transition-colors");
    window.verificarAutoSync();
    window.renderizarApp(); 
};

// Historial blindado por ID de cuenta
window.registrarMovimiento = (accion, detalle, monto = 0, cuentaId = null) => { 
    const f = new Date(); 
    const fechaHora = `${f.getDate().toString().padStart(2, '0')}/${(f.getMonth()+1).toString().padStart(2, '0')}/${f.getFullYear()} ${f.getHours()}:${f.getMinutes().toString().padStart(2, '0')}`; 
    historialMovimientos.unshift({ fecha: fechaHora, accion: accion, detalle: detalle, monto: monto, cuentaId: cuentaId }); 
};

window.guardarIngresoPromedio = () => {
    const input = document.getElementById('inputIngresoPromedio').value.replace(/\./g, '');
    if(!input || isNaN(input)) return;
    
    const modal = document.getElementById('modalInfo');
    if (modal) modal.classList.add('hidden');

    setTimeout(() => {
        localStorage.setItem('mg_ingreso', parseInt(input));
        window.renderizarReportes();
        window.renderizarCuentas(); 
        window.renderizarGastos();
        window.guardarDatos();
    }, 50);
};

window.dibujarGraficoFlujo = (ingresoBase, totalGastado, historial) => { if(ingresoBase <= 0) return `<div class="h-8 flex items-center text-[10px] text-slate-300">Configura tu ingreso ⚙️</div>`; let flujoActual = ingresoBase - totalGastado; let puntos = [flujoActual]; let saldoTemp = flujoActual; const mesStr = "/" + (new Date().getMonth() + 1).toString().padStart(2, '0') + "/"; const historialMes = historial.filter(h => h.fecha.includes(mesStr)); for(let i = 0; i < historialMes.length; i++) { if(puntos.length >= 6) break; let h = historialMes[i]; if (h.accion.includes("Saldo") || h.accion.includes("Gasto")) { saldoTemp = saldoTemp + Math.abs(h.monto); puntos.unshift(saldoTemp); } } while(puntos.length < 6) { puntos.unshift(ingresoBase); } let max = ingresoBase; let min = 0; let pathD = "M0 25 "; let xStep = 100 / 5; puntos.forEach((p, index) => { let x = index * xStep; let pNorm = Math.max(0, Math.min(p, max)); let y = 25 - ((pNorm - min) / (max - min)) * 20; pathD += `L${x} ${y} `; }); let colorLinea = flujoActual < (ingresoBase * 0.2) ? "text-rose-500" : "text-primary"; return `<svg class="w-full h-8 ${colorLinea}" preserveAspectRatio="none" viewBox="0 0 100 30" fill="none" stroke="currentColor"><path d="${pathD}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="${pathD} L100 30 L0 30 Z" fill="currentColor" fill-opacity="0.1" stroke="none"/></svg>`; };

window.renderizarReportes = () => {
    let ingresoTotal = parseInt(localStorage.getItem('mg_ingreso')) || 0; 
    const mesStr = "/" + (new Date().getMonth() + 1).toString().padStart(2, '0') + "/"; 
    const historialMes = historialMovimientos.filter(h => h.fecha.includes(mesStr));
    
    let agujeroNegro = 0; 
    
    historialMes.forEach(h => { 
        if (h.accion === "Actualización de Saldo" && h.monto < 0) { 
            agujeroNegro += Math.abs(h.monto); 
        } 
    });
    
    let fijosPagadosTotales = gastos.filter(g => g.pagado).reduce((acc, g) => acc + g.monto, 0); 
    let granTotalGastos = agujeroNegro + fijosPagadosTotales;
    
    document.getElementById('repAgujeroTotal').innerText = window.formatoGs(granTotalGastos).replace(' Gs', ''); 
    let porcAgujero = ingresoTotal > 0 ? Math.round((granTotalGastos / ingresoTotal) * 100) : 0; 
    document.getElementById('repAgujeroPorcentaje').innerText = `${porcAgujero}% DE TU INGRESO`;
    
    let flujoDeCajaActual = ingresoTotal - granTotalGastos; 
    document.getElementById('repFlujoCaja').innerText = window.formatoGs(flujoDeCajaActual).replace(' Gs', ''); 
    document.getElementById('graficoFlujo').innerHTML = window.dibujarGraficoFlujo(ingresoTotal, granTotalGastos, historialMovimientos);
    
    let porcFijos = ingresoTotal > 0 ? Math.min(Math.round((fijosPagadosTotales / ingresoTotal) * 100), 100) : 0; 
    let porcVar = ingresoTotal > 0 ? Math.min(Math.round((agujeroNegro / ingresoTotal) * 100), 100 - porcFijos) : 0; 
    let porcAhorro = Math.max(0, 100 - porcFijos - porcVar); 
    
    document.getElementById('barFijos').style.width = `${porcFijos}%`; 
    document.getElementById('barVar').style.width = `${porcVar}%`; 
    document.getElementById('barAhorro').style.width = `${porcAhorro}%`; 
    document.getElementById('txtFijos').innerText = `${porcFijos}% Fijo`; 
    document.getElementById('txtVar').innerText = `${porcVar}% Var`; 
    document.getElementById('txtAhorro').innerText = `${porcAhorro}% Libre`;
};

window.renderizarCuentas = () => { 
    const cont = document.getElementById('contenedorCuentas'); 
    cont.innerHTML = ''; 
    
    let ingresoTotal = parseInt(localStorage.getItem('mg_ingreso')) || 0; 
    const mesStr = "/" + (new Date().getMonth() + 1).toString().padStart(2, '0') + "/"; 
    const historialMes = historialMovimientos.filter(h => h.fecha.includes(mesStr));
    
    let granTotalVariables = 0;

    cuentas.forEach(c => { 
        let nombreCorto = '';
        if(c.icono && c.icono.includes('.png')){ 
            nombreCorto = c.icono.replace('.png', '').substring(0, 2).toUpperCase(); 
        }
        
        let iconoHtml = (c.icono && c.icono.includes('.png')) 
            ? `<img src="logos/${c.icono}?v=2" onerror="window.reemplazarPorTexto(this, '${nombreCorto}')" class="w-full h-full object-contain scale-125 transform" alt="${c.nombre}">` 
            : `<span class="text-xl">${c.icono || '💳'}</span>`; 
            
        let movimientosCuenta = historialMes.filter(h => (h.cuentaId === c.id) || (!h.cuentaId && h.detalle === c.nombre));
        
        let totalGastoCuenta = 0;
        let listaMovimientosHTML = '';
        
        let movimientosMostrar = movimientosCuenta.slice(0, 8);

        movimientosCuenta.forEach(h => {
            if (h.accion === "Actualización de Saldo" && h.monto < 0) {
                totalGastoCuenta += Math.abs(h.monto);
                granTotalVariables += Math.abs(h.monto);
            }
        });
        
        movimientosMostrar.forEach(h => {
            let esGasto = h.monto < 0;
            let signo = esGasto ? '-' : '+';
            let montoAbs = Math.abs(h.monto);
            let fechaCorta = h.fecha.substring(0, 5) + ' ' + h.fecha.split(' ')[1];
            
            if (h.accion === "Actualización de Saldo" || h.accion === "Nueva Cuenta Creada") {
                listaMovimientosHTML += `
                    <div class="flex justify-center items-center py-1.5 border-b border-slate-100/50 last:border-0 gap-3">
                        <span class="text-[10px] font-medium text-slate-500">${fechaCorta}</span>
                        <span class="text-xs font-bold text-slate-600">${signo}${window.formatoGs(montoAbs).replace(' Gs', '')}</span>
                    </div>
                `;
            }
        });

        if(listaMovimientosHTML === '') {
            listaMovimientosHTML = `<p class="text-[10px] text-slate-400 italic py-2 text-center">Sin actualizaciones este mes.</p>`;
        }

        let porcCuenta = ingresoTotal > 0 ? Math.min(Math.round((totalGastoCuenta / ingresoTotal) * 100), 100) : 0;

        cont.innerHTML += `
        <details class="group bg-surface rounded-2xl shadow-md border border-slate-100 overflow-hidden">
            <summary class="p-4 flex items-center justify-between cursor-pointer list-none relative transition-colors hover:bg-slate-50">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0 overflow-hidden text-primary">${iconoHtml}</div>
                    <div>
                        <h3 class="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            ${c.nombre}
                            <button onclick="event.preventDefault(); event.stopPropagation(); abrirModalForm('cuenta', ${c.id})" class="text-slate-400 hover:text-primary transition-colors" title="Editar">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </button>
                        </h3>
                        <p class="text-[10px] font-medium text-slate-500 leading-tight">${c.descripcion}</p>
                        <p class="text-[8px] text-slate-400 mt-0.5">Última act: ${c.ultimaAct}</p>
                    </div>
                </div>
                <div class="text-right flex flex-col justify-between items-end h-full min-h-[44px]">
                    <div class="text-right mb-1.5">
                        <p class="font-black text-sm text-slate-900 leading-none">${window.formatoGs(c.saldo).replace(' Gs', '')} <span class="text-[8px] text-slate-500">Gs</span></p>
                        <p class="text-[8px] text-slate-400 font-medium leading-none mt-1 uppercase tracking-wider">Saldo</p>
                    </div>
                    <button onclick="event.preventDefault(); event.stopPropagation(); abrirModalActualizar(${c.id})" class="text-[8px] bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-lg font-bold hover:bg-slate-200 transition-colors shadow-sm">ACTUALIZAR</button>
                </div>
            </summary>
            
            <div class="px-4 pb-4 border-t border-slate-50 bg-slate-50/50">
                <div class="flex justify-center items-center gap-3 py-2 border-b border-slate-200 mb-2">
                    <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Suma de Gastos</span>
                    <span class="text-xs font-black text-slate-600">${window.formatoGs(totalGastoCuenta).replace(' Gs', '')} <span class="text-[9px] font-medium text-slate-400">(${porcCuenta}%)</span></span>
                </div>
                <div class="space-y-0 mt-1 max-h-40 overflow-y-auto no-scrollbar pr-1">
                    ${listaMovimientosHTML}
                </div>
            </div>
        </details>`; 
    }); 
    
    let txtTotal = document.getElementById('txtTotalGastadoCuentas');
    let txtPorc = document.getElementById('txtPorcGastadoCuentas');
    if(txtTotal && txtPorc) {
        let porcTotalCuentas = ingresoTotal > 0 ? Math.min(Math.round((granTotalVariables / ingresoTotal) * 100), 100) : 0;
        txtTotal.innerText = window.formatoGs(granTotalVariables).replace(' Gs', '');
        txtPorc.innerText = `${porcTotalCuentas}%`;
    }
};

window.renderizarGastos = () => { 
    const cont = document.getElementById('contenedorGastos'); 
    cont.innerHTML = ''; 
    let totalSuma = 0; 
    gastos.forEach(g => { 
            if(g.pagado) totalSuma += g.monto; 
            const clasePagado = g.pagado ? "line-through text-slate-400" : "text-slate-800"; 
            
            // Si tiene color, dibuja la barrita. Si no, dibuja un espacio vacío para mantener el margen.
            const barraHtml = g.color ? `<div class="w-1.5 rounded-full ${g.color} shrink-0 mt-1 mb-1 shadow-sm"></div>` : `<div class="w-1.5 shrink-0"></div>`;
            
            cont.innerHTML += `<div class="py-2.5 border-b border-slate-100 flex items-stretch gap-3 hover:bg-slate-50 transition-colors" data-id="${g.id}">
                <input type="checkbox" ${g.pagado ? "checked" : ""} onchange="tildarGasto(${g.id})" class="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary bg-white cursor-pointer shrink-0">
                ${barraHtml}
                <div class="flex-grow"><div class="flex justify-between items-start"><div><h3 class="font-bold text-sm ${clasePagado} flex items-center gap-1.5">${g.nombre}<button onclick="abrirModalForm('gasto', ${g.id})" class="text-slate-400 hover:text-primary transition-colors"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button></h3><p class="text-[10px] text-slate-500">${g.cuenta}</p></div><div class="text-right"><p class="font-bold text-sm ${clasePagado}">${window.formatoGs(g.monto)}</p></div></div><div class="flex justify-${g.pagado ? 'between' : 'end'} items-center mt-0.5">${g.pagado ? `<p class="text-[9px] text-primary font-bold flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>Pagado el ${g.fechaPago}</p>` : ''}<button onclick="cambiarMontoGasto(${g.id})" class="text-[9px] text-primary hover:text-emerald-700 underline">Ingresar otro monto</button></div></div>
            </div>`; 
        });
    
    let ingresoTotal = parseInt(localStorage.getItem('mg_ingreso')) || 0;
    let porc = ingresoTotal > 0 ? Math.min(Math.round((totalSuma / ingresoTotal) * 100), 100) : 0;
    let elTotal = document.getElementById('totalPagado');
    if (elTotal) elTotal.innerText = window.formatoGs(totalSuma).replace(' Gs', '');
    let elPorc = document.getElementById('txtPorcFijosPagados');
    if (elPorc) elPorc.innerText = `${porc}%`;
};

window.renderizarApp = () => { 
    window.renderizarCuentas(); 
    window.renderizarGastos(); 
    window.renderizarReportes(); 
    
    const inputIngreso = document.getElementById('inputIngresoPromedio');
    if(inputIngreso) {
        const actual = parseInt(localStorage.getItem('mg_ingreso')) || 0;
        inputIngreso.value = actual > 0 ? new Intl.NumberFormat('es-PY').format(actual).replace(/,/g, '.') : '';
    }
};

window.interactuarApp = (tipo, titulo, mensaje, valorInicial = "", esNumero = false) => { return new Promise((resolve) => { modalResolve = resolve; document.getElementById('modalAccionTitulo').innerText = titulo; document.getElementById('modalAccionMensaje').innerText = mensaje; const inputContenedor = document.getElementById('modalAccionInputContenedor'); const input = document.getElementById('modalAccionInput'); const btnCancelar = document.getElementById('btnModalCancelar'); const modal = document.getElementById('modalAccion'); const cuerpo = document.getElementById('modalAccionCuerpo'); input.removeEventListener('input', window.formatoInputEnVivo); input.value = ""; if (tipo === 'prompt') { inputContenedor.classList.remove('hidden'); btnCancelar.classList.remove('hidden'); if (esNumero) { input.setAttribute('inputmode', 'numeric'); input.classList.add('text-center', 'text-2xl', 'font-black', 'text-primary'); input.classList.remove('text-sm', 'font-semibold'); input.addEventListener('input', window.formatoInputEnVivo); if (valorInicial) input.value = new Intl.NumberFormat('es-PY').format(valorInicial).replace(/,/g, '.'); } else { input.removeAttribute('inputmode'); input.classList.remove('text-center', 'text-2xl', 'font-black', 'text-primary'); input.classList.add('text-sm', 'font-semibold'); input.value = valorInicial; } } else if (tipo === 'confirm') { inputContenedor.classList.add('hidden'); btnCancelar.classList.remove('hidden'); } else { inputContenedor.classList.add('hidden'); btnCancelar.classList.add('hidden'); } modal.classList.remove('hidden'); setTimeout(() => { cuerpo.classList.remove('scale-95', 'opacity-0'); if (tipo === 'prompt') input.focus(); }, 10); }); };
window.cerrarModalAccion = (valorDevuelto) => { const modal = document.getElementById('modalAccion'); const cuerpo = document.getElementById('modalAccionCuerpo'); cuerpo.classList.add('scale-95', 'opacity-0'); setTimeout(() => { modal.classList.add('hidden'); if (modalResolve) { modalResolve(valorDevuelto); modalResolve = null; } }, 200); };

document.addEventListener('DOMContentLoaded', () => {
    const btnCancel = document.getElementById('btnModalCancelar');
    const btnConfirm = document.getElementById('btnModalConfirmar');
    if(btnCancel) btnCancel.addEventListener('click', () => window.cerrarModalAccion(null)); 
    if(btnConfirm) btnConfirm.addEventListener('click', () => { const inputContenedor = document.getElementById('modalAccionInputContenedor'); if (!inputContenedor.classList.contains('hidden')) { window.cerrarModalAccion(document.getElementById('modalAccionInput').value); } else { window.cerrarModalAccion(true); } });
});

let cuentaAActualizarId = null;

window.abrirModalActualizar = (id) => {
    cuentaAActualizarId = id;
    const c = cuentas.find(x => x.id === id);
    document.getElementById('lblCuentaActualizar').innerText = c.nombre;
    const input = document.getElementById('inputNuevoSaldo');
    input.value = new Intl.NumberFormat('es-PY').format(c.saldo).replace(/,/g, '.');
    document.getElementById('modalActualizarSaldo').classList.remove('hidden');
    
    setTimeout(() => { 
        document.getElementById('modalActualizarCuerpo').classList.remove('scale-95', 'opacity-0');
        input.focus(); // El secreto del lápiz
    }, 10);
};

window.cerrarModalActualizar = () => {
    const modal = document.getElementById('modalActualizarSaldo');
    const cuerpo = document.getElementById('modalActualizarCuerpo');
    if(cuerpo) cuerpo.classList.add('scale-95', 'opacity-0');
    setTimeout(() => { if(modal) modal.classList.add('hidden'); }, 200);
};

window.confirmarActualizacionSaldo = () => {
    const input = document.getElementById('inputNuevoSaldo').value.replace(/\./g, '');
    if(!input || isNaN(input)) return;
    
    const modal = document.getElementById('modalActualizarSaldo');
    if (modal) modal.classList.add('hidden');
    
    setTimeout(() => {
        const nuevoSaldo = parseInt(input);
        const c = cuentas.find(x => x.id === cuentaAActualizarId);
        const diff = nuevoSaldo - c.saldo;
        
        if(diff !== 0) {
            window.registrarMovimiento("Actualización de Saldo", c.nombre, diff, c.id);
            c.saldo = nuevoSaldo;
            const hoy = new Date(); c.ultimaAct = `Hoy, ${hoy.getHours()}:${hoy.getMinutes().toString().padStart(2, '0')} hs`;
            window.guardarDatos();
        }
        document.getElementById('modalActualizarCuerpo').classList.add('scale-95', 'opacity-0');
    }, 50);
};

let formActualTipo = ''; let formActualId = null;
window.abrirModalForm = (tipo, id = null) => { 
    formActualTipo = tipo; formActualId = id; 
    const modal = document.getElementById('modalFormulario'); 
    const cuerpo = document.getElementById('modalFormCuerpo'); 
    const i1 = document.getElementById('modalFormInput1'); 
    const i2 = document.getElementById('modalFormInput2'); 
    const i3 = document.getElementById('modalFormInput3'); 
    const btnEliminar = document.getElementById('btnEliminarItem'); 
    i1.value = ''; i2.value = ''; i3.value = ''; 
    
    if (tipo === 'cuenta') { 
        document.getElementById('selectorIconosContainer').classList.remove('hidden'); 
        document.getElementById('selectorColorContainer').classList.add('hidden'); 
        document.getElementById('lblInput1').innerText = 'Nombre de la Cuenta (Ej: Compras de la casa)'; 
        document.getElementById('lblInput2').innerText = 'Descripción (Ej: Ueno nro 6582)'; 
        document.getElementById('lblInput3').innerText = 'Saldo Actual'; 
        
        if (id) { 
            document.getElementById('modalFormTitulo').innerText = 'Editar Cuenta'; 
            const c = cuentas.find(x => x.id === id); 
            i1.value = c.nombre; i2.value = c.descripcion; i3.value = new Intl.NumberFormat('es-PY').format(c.saldo).replace(/,/g, '.'); 
            btnEliminar.classList.remove('hidden'); 
            iconoSeleccionado = c.icono || '🏦'; 
            if(iconoSeleccionado.includes('.png')){ setTimeout(() => window.seleccionarIcono(iconoSeleccionado), 50); } else { window.limpiarSeleccionIconos(); } 
        } else { 
            document.getElementById('modalFormTitulo').innerText = 'Nueva Cuenta'; 
            btnEliminar.classList.add('hidden'); 
            iconoSeleccionado = '🏦'; 
            window.limpiarSeleccionIconos(); 
        } 
    } else if (tipo === 'gasto') { 
        document.getElementById('selectorIconosContainer').classList.add('hidden'); 
        document.getElementById('selectorColorContainer').classList.remove('hidden'); 
        document.getElementById('lblInput1').innerText = 'Nombre del Gasto (Ej: Alquiler)'; 
        document.getElementById('lblInput2').innerText = 'Subtítulo (Ej: pagar de Itaú)'; 
        document.getElementById('lblInput3').innerText = 'Monto Mensual'; 
        
        window.renderizarSelectorColores();

        if (id) { 
            document.getElementById('modalFormTitulo').innerText = 'Editar Gasto Fijo'; 
            const g = gastos.find(x => x.id === id); 
            i1.value = g.nombre; i2.value = g.cuenta; i3.value = new Intl.NumberFormat('es-PY').format(g.monto).replace(/,/g, '.'); 
            btnEliminar.classList.remove('hidden'); 
            if (g.color) { window.seleccionarColor(g.color); } else { window.limpiarSeleccionColor(); }
        } else { 
            document.getElementById('modalFormTitulo').innerText = 'Nuevo Gasto Fijo'; 
            btnEliminar.classList.add('hidden'); 
            window.limpiarSeleccionColor();
        } 
    } 
    
    modal.classList.remove('hidden'); 
    setTimeout(() => { cuerpo.classList.remove('scale-95', 'opacity-0'); i1.focus(); }, 10); 
};

window.cerrarModalForm = () => { 
    const modal = document.getElementById('modalFormulario'); 
    const cuerpo = document.getElementById('modalFormCuerpo'); 
    if (cuerpo) cuerpo.classList.add('scale-95', 'opacity-0'); 
    setTimeout(() => { if (modal) modal.classList.add('hidden'); }, 200); 
};

let isSavingForm = false;

window.guardarFormulario = () => { 
    if (isSavingForm) return; 
    
    const v1 = document.getElementById('modalFormInput1').value.trim(); 
    const v2 = document.getElementById('modalFormInput2').value.trim(); 
    const v3 = document.getElementById('modalFormInput3').value.replace(/\./g, ''); 
    
    if(!v1 || !v3 || isNaN(v3)) { 
        window.interactuarApp('alert', 'Datos incompletos', 'Por favor completá al menos el nombre y el monto para guardar.'); 
        return; 
    } 
    
    isSavingForm = true; 
    
    try {
        if (formActualTipo === 'cuenta') { 
            if (formActualId) { 
                const c = cuentas.find(x => x.id === formActualId); 
                c.nombre = v1; c.descripcion = v2 || "Sin descripción"; c.icono = iconoSeleccionado; 
                if(c.saldo !== parseInt(v3)) { 
                    window.registrarMovimiento("Actualización de Saldo", c.nombre, parseInt(v3) - c.saldo, c.id); 
                    c.saldo = parseInt(v3); 
                    const hoy = new Date(); 
                    c.ultimaAct = `Hoy, ${hoy.getHours()}:${hoy.getMinutes().toString().padStart(2, '0')} hs`; 
                } 
            } else { 
                const newId = Date.now();
                cuentas.push({ id: newId, nombre: v1, descripcion: v2 || "Sin descripción", saldo: parseInt(v3), ultimaAct: "Recién creada", icono: iconoSeleccionado }); 
                window.registrarMovimiento("Nueva Cuenta Creada", v1, parseInt(v3), newId); 
            } 
        } else if (formActualTipo === 'gasto') { 
            if (formActualId) { 
                const g = gastos.find(x => x.id === formActualId); 
                g.nombre = v1; g.cuenta = v2 || "General"; g.monto = parseInt(v3); 
                g.color = colorSeleccionado; // GUARDAMOS EL COLOR ELEGIDO
            } else { 
                gastos.push({ id: Date.now(), nombre: v1, cuenta: v2 || "General", monto: parseInt(v3), pagado: false, fechaPago: "", color: colorSeleccionado }); 
                window.registrarMovimiento("Nuevo Gasto Fijo Añadido", v1, parseInt(v3)); 
            } 
        }
        
        const modal = document.getElementById('modalFormulario');
        if (modal) modal.classList.add('hidden');
        
        setTimeout(() => { 
            try {
                window.guardarDatos(); 
            } catch(e) {
                console.error("Error al guardar datos:", e);
            } finally {
                isSavingForm = false; 
            }
        }, 50);

    } catch (error) {
        console.error("Error en guardarFormulario:", error);
        const modal = document.getElementById('modalFormulario');
        if (modal) modal.classList.add('hidden');
        isSavingForm = false;
    }
};

window.eliminarItemActual = () => { window.cerrarModalForm(); setTimeout(async () => { const confirmacion = await window.interactuarApp('confirm', '⚠️ ¿Eliminar Definitivamente?', 'Esta acción no se puede deshacer. ¿Aceptás borrarlo?'); if (confirmacion) { let nombreBorrado = ""; if (formActualTipo === 'cuenta') { nombreBorrado = cuentas.find(x => x.id === formActualId).nombre; cuentas = cuentas.filter(x => x.id !== formActualId); } else { nombreBorrado = gastos.find(x => x.id === formActualId).nombre; gastos = gastos.filter(x => x.id !== formActualId); } window.registrarMovimiento(`Eliminación de ${formActualTipo}`, nombreBorrado, 0); window.guardarDatos(); } else { window.abrirModalForm(formActualTipo, formActualId); } }, 250);  };
window.cambiarMontoGasto = async (id) => { const gasto = gastos.find(g => g.id === id); const r = await window.interactuarApp('prompt', 'Cambiar Monto', `Ingresá el nuevo monto para ${gasto.nombre}.`, gasto.monto, true); if (r) { gasto.monto = parseInt(r.replace(/\./g, '')); window.guardarDatos(); } };
window.tildarGasto = (id) => { const gasto = gastos.find(g => g.id === id); gasto.pagado = !gasto.pagado; gasto.fechaPago = gasto.pagado ? window.obtenerFechaHoy() : ""; if(gasto.pagado) { window.registrarMovimiento("Gasto Tildado (Pagado)", `${gasto.nombre} desde ${gasto.cuenta}`, -gasto.monto); } else { window.registrarMovimiento("Gasto Destildado (Anulado)", `${gasto.nombre}`, gasto.monto); } window.guardarDatos(); };
window.cerrarMes = async () => { const r = await window.interactuarApp('confirm', 'Cerrar Mes', 'Esto destildará todos los gastos fijos para empezar de cero. (Tus saldos de cuentas no se borrarán).'); if (r) { gastos.forEach(g => { g.pagado = false; g.fechaPago = ""; }); window.registrarMovimiento("Cierre de Mes", "Se reinició la lista de gastos fijos", 0); window.guardarDatos(); window.interactuarApp('alert', '¡Éxito!', 'El mes se cerró correctamente. Todo listo para arrancar.'); } };
window.descargarDatosCSV = () => { if (historialMovimientos.length === 0) { window.interactuarApp('alert', 'Sin historial', 'No hay movimientos registrados para descargar todavía. Usá la app un poco más.'); return; } let csvContenido = "FECHA;ACCION;DETALLE;MONTO (Gs)\n"; historialMovimientos.forEach(h => { csvContenido += `"${h.fecha}";"${h.accion}";"${h.detalle}";"${h.monto}"\n`; }); const blob = new Blob(["\uFEFF" + csvContenido], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const btn = document.createElement("a"); btn.setAttribute("href", url); btn.setAttribute("download", `MacroGestion_Historial_${window.obtenerFechaHoy().replace(/\//g, '-')}.csv`); document.body.appendChild(btn); btn.click(); btn.remove(); };

// --- MAGIA UX: RENDERIZADO CON PANTALLA DE CARGA ---
const localEmail = localStorage.getItem('local_user_email');
const localStatus = localStorage.getItem('local_user_status');
if (localEmail && localStatus) {
    setTimeout(() => {
        const loader = document.getElementById('loadingScreen');
        if(loader) {
            loader.classList.add('hidden');
            loader.style.display = 'none';
        }
    }, 150);

    try {
        window.renderizarSelectorIconos();
        window.renderizarApp();
    } catch (error) {
        console.error("Error al renderizar los datos:", error);
    }
}
