import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, query, where, getDocs, arrayUnion, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

window.userAccessStatus = 'prueba';
let retosDisponibles = [];
let retoActivoId = null;
let docDataActual = null;
let unsubscribeReto = null; 

window.formatoGs = (n) => new Intl.NumberFormat('es-PY').format(Math.round(n || 0)) + ' Gs.';
window.formatoEnVivo = (e) => { let val = e.target.value.replace(/\D/g, ''); e.target.value = val ? new Intl.NumberFormat('es-PY').format(val) : ''; };
window.toggleSidebar = () => { const sb = document.getElementById('sidebar'); const ov = document.getElementById('sidebarOverlay'); if(sb.classList.contains('-translate-x-full')) { sb.classList.remove('-translate-x-full'); ov.classList.remove('hidden'); } else { sb.classList.add('-translate-x-full'); ov.classList.add('hidden'); } };

window.mostrarAlerta = (mensaje) => { document.getElementById('customAlertMessage').innerText = mensaje; document.getElementById('customAlert').classList.remove('hidden'); };
window.closeCustomAlert = () => { document.getElementById('customAlert').classList.add('hidden'); };
window.mostrarConfirm = (mensaje) => { return new Promise((resolve) => { document.getElementById('customConfirmMessage').innerText = mensaje; const modal = document.getElementById('customConfirm'); const btnOk = document.getElementById('btnConfirmOk'); const btnCancel = document.getElementById('btnConfirmCancel'); const cleanUp = () => { modal.classList.add('hidden'); btnOk.onclick = null; btnCancel.onclick = null; }; btnOk.onclick = () => { cleanUp(); resolve(true); }; btnCancel.onclick = () => { cleanUp(); resolve(false); }; modal.classList.remove('hidden'); }); };

window.logout = async () => { localStorage.removeItem('local_user_status'); signOut(auth).then(() => { window.location.href = '../index.html'; }); };

onAuthStateChanged(auth, async (user) => {
    const loginScreen = document.getElementById('loginScreen'); const appContent = document.getElementById('appContent');
    if (user) {
        document.getElementById('sidebarUserEmail').innerText = user.email;
        const localStatus = localStorage.getItem('local_user_status');
        
        if (localStatus === 'pagado') {
            window.userAccessStatus = 'pagado';
            loginScreen.classList.add('hidden'); appContent.classList.remove('hidden'); 
            window.initRetos(); 
            return; 
        }

        const userRef = doc(db, "usuarios_multimeta", user.email);
        try {
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                const userData = docSnap.data(); window.userAccessStatus = userData.status || 'prueba'; 
                localStorage.setItem('local_user_status', window.userAccessStatus);
                
                if (window.userAccessStatus === 'pagado' || window.userAccessStatus === 'prueba') {
                    loginScreen.classList.add('hidden'); appContent.classList.remove('hidden'); 
                    window.initRetos();
                } else {
                    window.location.href = '../activar.html';
                }
            } else {
                window.location.href = '../index.html';
            }
        } catch (error) { 
            console.error("Modo local por error de red"); 
            loginScreen.classList.add('hidden'); appContent.classList.remove('hidden'); 
            window.initRetos(); 
        }
    } else { 
        loginScreen.classList.remove('hidden'); appContent.classList.add('hidden'); 
    }
});

window.openCreateRetoModal = () => { document.getElementById('crearRetoNombre').value=''; document.getElementById('crearRetoMonto').value=''; document.getElementById('crearRetoSemanas').value=''; document.getElementById('crearRetoApodo').value=''; document.getElementById('createRetoModal').classList.remove('hidden'); };
window.closeCreateRetoModal = () => { document.getElementById('createRetoModal').classList.add('hidden'); };
window.openJoinRetoModal = () => { document.getElementById('joinRetoCodigo').value=''; document.getElementById('joinRetoApodo').value=''; document.getElementById('joinRetoModal').classList.remove('hidden'); };
window.closeJoinRetoModal = () => { document.getElementById('joinRetoModal').classList.add('hidden'); };

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === 'visible') {
        if (retoActivoId) window.conectarTableroEnVivo(retoActivoId);
    } else {
        if (unsubscribeReto) { unsubscribeReto(); unsubscribeReto = null; }
    }
});

window.initRetos = async () => {
    await window.cargarMisRetos();
    const urlParams = new URLSearchParams(window.location.search);
    const retoCode = urlParams.get('reto');
    if (retoCode) {
        window.openJoinRetoModal();
        document.getElementById('joinRetoCodigo').value = retoCode;
        window.history.replaceState({}, document.title, window.location.pathname);
    }
};

window.cargarMisRetos = async () => {
    const list = document.getElementById('listaMisRetos');
    try {
        const q = query(collection(db, "retos_multijugador"), where("participantes_emails", "array-contains", auth.currentUser.email));
        const snapshot = await getDocs(q);
        
        retosDisponibles = [];
        snapshot.forEach(doc => { retosDisponibles.push({ id: doc.id, ...doc.data() }); });
        
        if (retosDisponibles.length === 0) {
            list.innerHTML = `<div class="text-center py-4 bg-white rounded-xl border border-slate-100"><p class="text-[11px] text-slate-400 font-bold mb-1">Aún no estás en la arena</p><p class="text-[9px] text-slate-400">Creá una sala o unite a una.</p></div>`;
            return;
        }

        list.innerHTML = retosDisponibles.map(r => `
            <button onclick="conectarTableroEnVivo('${r.id}')" class="w-full text-left bg-white p-3 rounded-xl border ${r.id === retoActivoId ? 'border-primary shadow-md ring-1 ring-primary' : 'border-slate-200 hover:border-emerald-300'} transition-all flex justify-between items-center group">
                <div class="truncate">
                    <h3 class="text-xs font-bold text-slate-800 truncate">${r.nombre}</h3>
                    <p class="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">${r.participantes.length} Jugadores</p>
                </div>
                <svg class="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7-7"></path></svg>
            </button>
        `).join('');

    } catch(e) {
        list.innerHTML = `<p class="text-[11px] text-rose-500 italic text-center py-2">Error al cargar</p>`;
    }
};

window.conectarTableroEnVivo = (id) => {
    if (unsubscribeReto) { unsubscribeReto(); unsubscribeReto = null; }
    
    retoActivoId = id;
    window.cargarMisRetos(); 
    
    document.getElementById('estadoTableroVacio').classList.add('hidden');
    document.getElementById('tableroActivo').classList.remove('hidden');
    document.getElementById('arenaProgresoContent').innerHTML = `<div class="text-center py-10"><svg class="animate-spin h-8 w-8 mx-auto text-primary mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>`;

    const retoRef = doc(db, "retos_multijugador", id);
    unsubscribeReto = onSnapshot(retoRef, (docSnap) => {
        if (docSnap.exists()) {
            docDataActual = docSnap.data();
            window.renderizarTablero();
        } else {
            window.mostrarAlerta("Este reto fue eliminado por el creador.");
            window.location.reload();
        }
    });
};

window.renderizarTablero = () => {
    if(!docDataActual) return;
    const d = docDataActual;

    document.getElementById('uiRetoNombre').innerText = d.nombre;
    document.getElementById('uiRetoTipo').innerText = d.tipo === 'competencia' ? '🏁 Carrera' : '🤝 Equipo';
    document.getElementById('uiRetoCodigo').innerText = d.codigo;
    document.getElementById('uiRetoSemanas').innerText = d.semanas;

    let granTotalPlata = d.participantes.reduce((acc, curr) => acc + curr.pagado, 0);
    let granMeta = d.tipo === 'competencia' ? (d.meta * d.participantes.length) : d.meta;
    let porcentajeGlobal = granMeta > 0 ? (granTotalPlata / granMeta) * 100 : 0;
    
    document.getElementById('statsTitle').innerHTML = `${d.nombre} <span class="flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded text-[8px] bg-rose-100 text-rose-600 font-black tracking-widest"><span class="animate-ping inline-flex h-1.5 w-1.5 rounded-full bg-rose-500 opacity-75"></span> EN VIVO</span>`;
    document.getElementById('totalSavedCounter').innerText = window.formatoGs(granTotalPlata);
    document.getElementById('progressPercentage').innerText = Math.round(Math.min(porcentajeGlobal, 100)) + '%';
    document.getElementById('globalProgressCircle').style.strokeDashoffset = 113 - (Math.min(porcentajeGlobal, 100) / 100 * 113);

    let partesOrdenados = [...d.participantes].sort((a,b) => b.pagado - a.pagado);
    let metaIndividual = d.tipo === 'competencia' ? d.meta : (d.meta / d.participantes.length);

    let htmlArena = partesOrdenados.map((p, index) => {
        let soyYo = p.email === auth.currentUser.email;
        let esGanador = index === 0 && p.pagado > 0 && p.pagado >= metaIndividual;
        let miPorc = metaIndividual > 0 ? (p.pagado / metaIndividual) * 100 : 0;
        
        return `
        <div class="relative p-3 rounded-xl border ${soyYo ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}">
            ${esGanador ? '<div class="absolute -top-2 -right-2 text-xl filter drop-shadow-md">👑</div>' : ''}
            <div class="flex justify-between items-end mb-1.5">
                <span class="text-xs font-black ${soyYo ? 'text-emerald-700' : 'text-slate-700'}">${p.apodo} ${soyYo ? '(Vos)' : ''}</span>
                <span class="text-sm font-black ${soyYo ? 'text-emerald-600' : 'text-slate-900'}">${window.formatoGs(p.pagado)} <span class="text-[10px] text-slate-500 font-bold ml-1">${Math.round(miPorc)}%</span></span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden shadow-inner">
                <div class="h-2 rounded-full transition-all duration-1000 ${soyYo ? 'bg-primary' : 'bg-slate-400'}" style="width: ${Math.min(miPorc, 100)}%"></div>
            </div>
        </div>`;
    }).join('');
    document.getElementById('arenaProgresoContent').innerHTML = htmlArena;

    let miJugador = d.participantes.find(p => p.email === auth.currentUser.email);
    let miFaltante = metaIndividual - miJugador.pagado;
    document.getElementById('uiFaltanteMiParte').innerText = miFaltante > 0 ? `Faltan: ${window.formatoGs(miFaltante)}` : '¡META ALCANZADA! 🎉';

    let schedule = window.generateSchedule(metaIndividual, d.semanas);
    let htmlCuotas = "";
    
    for (let i = 1; i <= d.semanas; i++) {
        let cuotaOriginal = schedule[i-1];
        let infoPago = miJugador.progreso.find(pr => pr.semana === i);
        let hecho = !!infoPago;
        let montoMostrado = hecho ? infoPago.pagado : cuotaOriginal;

        htmlCuotas += `
        <div class="glass-card rounded-xl p-3 flex items-center gap-3 border-l-4 ${hecho ? 'border-l-primary bg-white shadow-sm' : 'border-l-slate-200 bg-slate-50'}">
            <div class="w-8 h-8 rounded-lg ${hecho ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400 border border-slate-200'} flex items-center justify-center text-[10px] font-black shrink-0">${i}</div>
            <div class="flex-grow">
                <div class="text-sm font-bold ${hecho ? 'text-emerald-900' : 'text-slate-700'}">${hecho ? 'COMPLETADO' : window.formatoGs(montoMostrado)}</div>
                <div class="text-[8px] uppercase ${hecho ? 'text-emerald-500' : 'text-slate-400'} font-bold">Depósito ${i}</div>
            </div>
            ${hecho ? `<div class="text-[8px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md text-right">${infoPago.fecha}<br>${window.formatoGs(infoPago.pagado)}</div>` : ''}
            <div class="flex gap-1 pl-2 border-l border-slate-100">
                <button onclick="togglePago(${i}, ${cuotaOriginal})" class="px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${hecho ? 'bg-primary text-white shadow-md hover:bg-emerald-600' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100 hover:text-primary'}">${hecho ? 'LISTO' : 'MARCAR'}</button>
            </div>
        </div>`;
    }
    document.getElementById('misCuotasList').innerHTML = htmlCuotas;
};

window.calculateWeights = (totalWeeks) => { let weights = []; let currentWeight = 0; let habitWeeks = Math.floor(totalWeeks * 0.25); if (habitWeeks < 1) habitWeeks = 1; for (let i = 1; i <= totalWeeks; i++) { currentWeight += 1; if (i > habitWeeks && (i - habitWeeks - 1) % 4 === 0) { let jump = Math.floor(totalWeeks / 10); if (jump < 3) jump = 3; currentWeight += jump; } weights.push(currentWeight); } return weights; };
window.generateSchedule = (metaMonto, metaSemanas) => { let schedule = []; let weights = window.calculateWeights(metaSemanas); let totalWeight = weights.reduce((a, b) => a + b, 0); let baseUnit = metaMonto / totalWeight; let currentSum = 0; for (let i = 0; i < metaSemanas; i++) { if (i === metaSemanas - 1) { schedule.push(metaMonto - currentSum); } else { let amount = Math.round((baseUnit * weights[i]) / 5000) * 5000; if (amount < 5000) amount = 5000; if (currentSum + amount >= metaMonto) { amount = Math.max(0, metaMonto - currentSum - 5000); } schedule.push(amount); currentSum += amount; } } return schedule; };

window.togglePago = async (semanaNum, montoEsperado) => {
    if (window.userAccessStatus === 'vencido' || window.userAccessStatus === 'rechazado') return window.location.href = '../activar.html'; 
    if (!retoActivoId || !docDataActual) return;

    try {
        const retoRef = doc(db, 'retos_multijugador', retoActivoId);
        let parts = [...docDataActual.participantes];
        let miIdx = parts.findIndex(p => p.email === auth.currentUser.email);
        let miJug = parts[miIdx];

        const pIdx = miJug.progreso.findIndex(p => p.semana === semanaNum);
        if (pIdx > -1) {
            miJug.progreso.splice(pIdx, 1);
        } else {
            const d = new Date().toLocaleDateString('es-PY', { day: 'numeric', month: 'short' });
            miJug.progreso.push({ semana: semanaNum, pagado: montoEsperado, fecha: d });
        }

        miJug.pagado = miJug.progreso.reduce((acc, curr) => acc + curr.pagado, 0);
        parts[miIdx] = miJug;

        await updateDoc(retoRef, { participantes: parts });
    } catch(e) {
        window.mostrarAlerta("Error al sincronizar tu pago. Revisá tu conexión.");
    }
};

window.abandonarReto = async () => {
    const seguro = await window.mostrarConfirm("¿Seguro querés salir de este reto? Perderás todo el progreso en la arena y no podrás recuperarlo.");
    if (!seguro) return;

    try {
        const retoRef = doc(db, 'retos_multijugador', retoActivoId);
        let parts = [...docDataActual.participantes];
        let emails = [...docDataActual.participantes_emails];
        
        parts = parts.filter(p => p.email !== auth.currentUser.email);
        emails = emails.filter(e => e !== auth.currentUser.email);

        await updateDoc(retoRef, { 
            participantes: parts,
            participantes_emails: emails
        });

        if (unsubscribeReto) { unsubscribeReto(); unsubscribeReto = null; }
        retoActivoId = null;
        document.getElementById('tableroActivo').classList.add('hidden');
        document.getElementById('estadoTableroVacio').classList.remove('hidden');
        window.initRetos(); 
        
    } catch(e) {
        window.mostrarAlerta("Error al salir del reto.");
    }
};

window.crearRetoCloud = async () => {
    if (window.userAccessStatus === 'vencido') return window.location.href = '../activar.html'; 
    const nombre = document.getElementById('crearRetoNombre').value.trim(); const montoRaw = document.getElementById('crearRetoMonto').value.replace(/\D/g, ''); const semanasRaw = document.getElementById('crearRetoSemanas').value; const tipo = document.getElementById('crearRetoTipo').value; const apodo = document.getElementById('crearRetoApodo').value.trim();
    if (!nombre || !montoRaw || !semanasRaw || !apodo) return window.mostrarAlerta("Completá todos los campos.");
    const monto = parseInt(montoRaw); const semanas = parseInt(semanasRaw);
    document.getElementById('btnConfirmCrearReto').innerHTML = "Generando Sala... ⏳";
    
    try {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let rnd = ''; for (let i = 0; i < 4; i++) rnd += chars.charAt(Math.floor(Math.random() * chars.length)); const cod = `RETO-${rnd}`;
        const jug = { email: auth.currentUser.email, apodo: apodo, pagado: 0, progreso: [] };
        await addDoc(collection(db, "retos_multijugador"), { codigo: cod, nombre: nombre, meta: monto, semanas: semanas, tipo: tipo, creador: auth.currentUser.email, participantes: [jug], participantes_emails: [auth.currentUser.email], createdAt: serverTimestamp() });
        window.closeCreateRetoModal(); window.initRetos(); window.mostrarAlerta(`✅ Sala creada con éxito.\nCódigo: ${cod}`);
    } catch (e) { window.mostrarAlerta("Error al crear reto."); } finally { document.getElementById('btnConfirmCrearReto').innerHTML = "Crear Sala"; }
};

window.unirseRetoCloud = async () => {
    if (window.userAccessStatus === 'vencido') return window.location.href = '../activar.html'; 
    const codigoInput = document.getElementById('joinRetoCodigo').value.trim().toUpperCase(); const apodo = document.getElementById('joinRetoApodo').value.trim();
    if (!codigoInput || !apodo) return window.mostrarAlerta("Faltan datos.");
    document.getElementById('btnConfirmJoinReto').innerHTML = "Buscando... ⏳";
    
    try {
        const q = query(collection(db, "retos_multijugador"), where("codigo", "==", codigoInput)); const snap = await getDocs(q);
        if (snap.empty) { window.mostrarAlerta("Código no encontrado."); document.getElementById('btnConfirmJoinReto').innerHTML = "Validar y Unirme"; return; }
        const docSnap = snap.docs[0]; const data = docSnap.data();
        if (data.participantes.some(p => p.email === auth.currentUser.email)) { window.mostrarAlerta("Ya estás en este reto."); window.closeJoinRetoModal(); return; }
        await updateDoc(doc(db, "retos_multijugador", docSnap.id), { participantes: arrayUnion({ email: auth.currentUser.email, apodo: apodo, pagado: 0, progreso: [] }), participantes_emails: arrayUnion(auth.currentUser.email) });
        window.closeJoinRetoModal(); window.initRetos();
    } catch (e) { window.mostrarAlerta("Error al unirse."); } finally { document.getElementById('btnConfirmJoinReto').innerHTML = "Validar y Unirme"; }
};

window.compartirTablero = () => {
    const urlApp = `https://imperialempy-collab.github.io/Ahorro.Challenge/retos/retos.html?reto=${docDataActual.codigo}`;
    const texto = `¡Te reto a ahorrar! 💰\nSumate a mi tablero para competir:\n\n👉 ${urlApp}\n\nO ingresá este código: *${docDataActual.codigo}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
};
