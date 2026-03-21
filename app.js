import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, collection, query, where, getDocs, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const provider = new GoogleAuthProvider();

window.userAccessStatus = 'prueba';
window.currentPartnerPerfil = null; // Variable global para la edición

// --- UTILIDADES GLOBALES Y REDIRECCIONES ---
window.mostrarAlerta = (mensaje) => { 
    document.getElementById('customAlertMessage').innerText = mensaje; 
    document.getElementById('customAlert').classList.remove('hidden'); 
};
window.closeCustomAlert = () => { document.getElementById('customAlert').classList.add('hidden'); };

window.mostrarLoaderSilencioso = () => { document.getElementById('silentLoader').classList.remove('hidden'); };
window.ocultarLoaderSilencioso = () => { document.getElementById('silentLoader').classList.add('hidden'); };

window.mostrarConfirm = (mensaje) => { return new Promise((resolve) => { document.getElementById('customConfirmMessage').innerText = mensaje; const modal = document.getElementById('customConfirm'); const btnOk = document.getElementById('btnConfirmOk'); const btnCancel = document.getElementById('btnConfirmCancel'); const cleanUp = () => { modal.classList.add('hidden'); btnOk.onclick = null; btnCancel.onclick = null; }; btnOk.onclick = () => { cleanUp(); resolve(true); }; btnCancel.onclick = () => { cleanUp(); resolve(false); }; modal.classList.remove('hidden'); }); };
window.mostrarPrompt = (mensaje, valorPorDefecto = '', tipoInput = 'text') => { return new Promise((resolve) => { document.getElementById('customPromptMessage').innerText = mensaje; const input = document.getElementById('customPromptInput'); input.type = tipoInput === 'number' ? 'text' : tipoInput; input.inputMode = tipoInput === 'number' ? 'numeric' : 'text'; const formatNumber = (e) => { if (tipoInput === 'number') { let val = e.target.value.replace(/\D/g, ''); e.target.value = val ? new Intl.NumberFormat('es-PY').format(val) : ''; } }; input.oninput = formatNumber; if (tipoInput === 'number' && valorPorDefecto !== '') { let val = valorPorDefecto.toString().replace(/\D/g, ''); input.value = val ? new Intl.NumberFormat('es-PY').format(val) : ''; } else { input.value = valorPorDefecto; } const modal = document.getElementById('customPrompt'); const btnOk = document.getElementById('btnPromptOk'); const btnCancel = document.getElementById('btnPromptCancel'); const cleanUp = () => { modal.classList.add('hidden'); btnOk.onclick = null; btnCancel.onclick = null; }; btnOk.onclick = () => { cleanUp(); resolve(input.value); }; btnCancel.onclick = () => { cleanUp(); resolve(null); }; modal.classList.remove('hidden'); input.focus(); }); };

window.formatoEnVivo = (e) => { let val = e.target.value.replace(/\D/g, ''); e.target.value = val ? new Intl.NumberFormat('es-PY').format(val) : ''; };

window.login = () => { signInWithPopup(auth, provider).catch(error => { if (error.code === 'auth/user-disabled') { window.mostrarAlerta("⚠️ Tu acceso se encuentra suspendido."); } else { window.mostrarAlerta("Error al entrar: " + error.message); } }); };

window.logout = async () => { 
    if (auth.currentUser) {
        try {
            const safeParse = (str) => { try { return (str && str !== "null" && str !== "undefined") ? JSON.parse(str) : null; } catch(e) { return null; } };
            const payload = {
                ahorro_data: safeParse(localStorage.getItem('ahorro_dinamico_LAB_TEST_MULTIMETA')),
                macro_data: { 
                    cuentas: safeParse(localStorage.getItem('mg_cuentas')), 
                    gastos: safeParse(localStorage.getItem('mg_gastos')), 
                    historial: safeParse(localStorage.getItem('mg_historial')), 
                    ingreso: localStorage.getItem('mg_ingreso') || 0 
                },
                last_sync: new Date().toISOString()
            };
            const userRef = doc(db, "usuarios_multimeta", auth.currentUser.email);
            await setDoc(userRef, payload, { merge: true });
        } catch (e) {
            console.error("Error crítico al guardar antes de salir:", e);
        }
    }
    
    const keys = ['local_user_status', 'ahorro_dinamico_LAB_TEST_MULTIMETA', 'mg_cuentas', 'mg_gastos', 'mg_historial', 'mg_ingreso', 'last_cloud_sync'];
    keys.forEach(k => localStorage.removeItem(k));
    
    signOut(auth).then(() => location.reload()); 
};

// --- CONTROL DE UI Y BOTÓN PARTNER ---
window.actualizarUI_Pago = () => {
    const btnPagar = document.getElementById('btnSidebarPagar');
    const btnPartner = document.getElementById('btnSidebarPartner');
    
    if(window.userAccessStatus === 'pagado') { 
        if (btnPagar) { 
            btnPagar.innerHTML = '<span class="text-emerald-500 font-black">Acceso Ilimitado 👑</span>'; 
            btnPagar.onclick = null; 
            btnPagar.classList.replace('bg-slate-900', 'bg-emerald-50'); 
            btnPagar.classList.replace('text-white', 'text-emerald-700'); 
        }
        if (btnPartner) {
            btnPartner.classList.remove('hidden'); 
            btnPartner.classList.add('flex'); 
        }
    } 
    else if (window.userAccessStatus === 'pendiente') { 
        if (btnPagar) { 
            btnPagar.innerHTML = 'Ver mi Comprobante ⏳'; 
            btnPagar.onclick = () => window.location.href = 'activar.html'; 
            btnPagar.classList.replace('bg-slate-900', 'bg-amber-100'); 
            btnPagar.classList.replace('text-white', 'text-amber-700'); 
        }
        if (btnPartner) { 
            btnPartner.classList.add('hidden'); 
            btnPartner.classList.remove('flex'); 
        }
    } 
    else { 
        if (btnPagar) { 
            btnPagar.innerHTML = 'Activar Acceso Ilimitado 👑'; 
            btnPagar.onclick = () => window.location.href = 'activar.html'; 
            btnPagar.classList.replace('bg-emerald-50', 'bg-slate-900'); 
            btnPagar.classList.replace('text-emerald-700', 'text-white');
        }
        if (btnPartner) { 
            btnPartner.classList.add('hidden'); 
            btnPartner.classList.remove('flex'); 
        }
    }
};

// --- LÓGICA DEL PORTAL PARTNER ---
window.abrirPortalPartner = async () => {
    window.toggleSidebar();
    window.mostrarLoaderSilencioso();

    try {
        const userRef = doc(db, "usuarios_multimeta", auth.currentUser.email);
        const docSnap = await getDoc(userRef);
        
        window.ocultarLoaderSilencioso();
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            if (data.partner_perfil) {
                window.cargarDashboardPartner(data);
            } else {
                document.getElementById('reglasPartnerModal').classList.remove('hidden');
            }
        }
    } catch(e) {
        window.ocultarLoaderSilencioso();
        window.mostrarAlerta("Error de conexión al cargar tu portal.");
    }
};

window.cerrarReglasPartner = () => { document.getElementById('reglasPartnerModal').classList.add('hidden'); };

window.aceptarReglasYRegistrar = () => {
    window.cerrarReglasPartner();
    document.getElementById('tituloRegistroPartner').innerText = "Perfil de Cobro";
    document.getElementById('btnGuardarPartner').innerText = "Guardar Mis Datos";
    document.getElementById('partnerNombre').value = "";
    document.getElementById('partnerBanco').value = "";
    document.getElementById('partnerCI').value = "";
    document.getElementById('partnerCuenta').value = "";
    document.getElementById('registroPartnerModal').classList.remove('hidden');
};

// BOTÓN LÁPIZ: Para editar sin perder el código
window.abrirEdicionPartner = () => {
    if (!window.currentPartnerPerfil) return;
    
    document.getElementById('tituloRegistroPartner').innerText = "Editar Mis Datos";
    document.getElementById('btnGuardarPartner').innerText = "Guardar Cambios";
    
    // Carga los datos actuales en el formulario
    document.getElementById('partnerNombre').value = window.currentPartnerPerfil.nombre || "";
    document.getElementById('partnerBanco').value = window.currentPartnerPerfil.banco || "";
    document.getElementById('partnerCI').value = window.currentPartnerPerfil.ci || "";
    document.getElementById('partnerCuenta').value = window.currentPartnerPerfil.cuenta || "";
    
    document.getElementById('registroPartnerModal').classList.remove('hidden');
};

window.cerrarRegistroPartner = () => { document.getElementById('registroPartnerModal').classList.add('hidden'); };
window.cerrarDashboardPartner = () => { document.getElementById('dashboardPartnerModal').classList.add('hidden'); };

window.guardarPerfilPartner = async () => {
    const nombre = document.getElementById('partnerNombre').value.trim();
    const banco = document.getElementById('partnerBanco').value.trim();
    const ci = document.getElementById('partnerCI').value.trim();
    const cuenta = document.getElementById('partnerCuenta').value.trim();

    if(!nombre || !banco || !ci || !cuenta) return window.mostrarAlerta("Completá todos tus datos bancarios para poder pagarte.");

    const btn = document.getElementById('btnGuardarPartner');
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = "Guardando... ⏳"; btn.disabled = true;

    try {
        const userRef = doc(db, "usuarios_multimeta", auth.currentUser.email);
        const docSnap = await getDoc(userRef);
        const userData = docSnap.exists() ? docSnap.data() : {};

        if (userData.partner_perfil) {
            // ES UNA EDICIÓN: Guardamos el historial de la cuenta vieja por seguridad
            const perfilViejo = userData.partner_perfil;
            const registroHistorico = {
                ...perfilViejo,
                fecha_cambio: new Date().toISOString()
            };

            const perfilNuevo = {
                nombre, banco, ci, cuenta,
                codigo: perfilViejo.codigo // Mantiene su código de referido INTACTO
            };

            // Usamos arrayUnion para agregar la cuenta vieja al archivo histórico
            await updateDoc(userRef, {
                partner_perfil: perfilNuevo,
                partner_historial_cuentas: arrayUnion(registroHistorico)
            });

        } else {
            // ES PRIMERA VEZ: Se crea de cero
            const baseCode = nombre.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '');
            const rnd = Math.floor(1000 + Math.random() * 9000);
            const codigo = `${baseCode}${rnd}`;

            const perfilNuevo = { nombre, banco, ci, cuenta, codigo };

            await updateDoc(userRef, {
                partner_perfil: perfilNuevo,
                partner_saldo: 0,
                partner_historico: 0
            });
        }

        window.cerrarRegistroPartner();
        window.abrirPortalPartner(); // Vuelve a recargar el Dashboard
    } catch(e) {
        console.error(e);
        window.mostrarAlerta("Error al guardar tu perfil. Revisá tu conexión.");
    } finally {
        btn.innerHTML = textoOriginal; 
        btn.disabled = false;
    }
};

window.cargarDashboardPartner = async (userData) => {
    const perfil = userData.partner_perfil;
    window.currentPartnerPerfil = perfil; // Guardamos en global para poder editar después
    const formatGs = (n) => new Intl.NumberFormat('es-PY').format(n) + ' Gs.';
    
    document.getElementById('partnerCodigoUI').innerText = perfil.codigo;
    document.getElementById('partnerSaldoUI').innerText = formatGs(userData.partner_saldo || 0);
    document.getElementById('partnerHistoricoUI').innerText = formatGs(userData.partner_historico || 0);

    const saldo = userData.partner_saldo || 0;
    const metaCobro = 20000;
    const porc = Math.min((saldo / metaCobro) * 100, 100);
    document.getElementById('partnerBarraProgreso').style.width = `${porc}%`;
    
    if (saldo >= metaCobro) {
        document.getElementById('partnerMetaTexto').innerHTML = `<span class="text-emerald-400 font-bold">¡Meta lograda! Pago en proceso.</span>`;
        document.getElementById('partnerMetaTexto').classList.remove('text-white');
    } else {
        document.getElementById('partnerMetaTexto').innerText = `Te faltan ${formatGs(metaCobro - saldo)}`;
        document.getElementById('partnerMetaTexto').classList.add('text-white');
    }

    const listUI = document.getElementById('listaReferidosUI');
    listUI.innerHTML = '<div class="text-center py-6"><span class="animate-pulse text-slate-400 text-xs">Buscando referidos...</span></div>';
    document.getElementById('dashboardPartnerModal').classList.remove('hidden');

    try {
        const q = query(collection(db, "usuarios_multimeta"), where("referido_por", "==", perfil.codigo));
        const snap = await getDocs(q);
        
        if (snap.empty) {
            listUI.innerHTML = `<div class="text-center py-6 px-4"><p class="text-xs text-slate-500 font-bold">Aún no tenés referidos.</p><p class="text-[10px] text-slate-400 mt-1 leading-relaxed">¡Compartí tu link en WhatsApp para empezar a ganar dinero!</p></div>`;
            return;
        }

        let html = "";
        snap.forEach(doc => {
            const refData = doc.data();
            let estadoHtml = "";
            
            if (refData.status === 'pagado') {
                estadoHtml = `<span class="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-black shadow-sm">✅ Pagado (+5k)</span>`;
            } else if (refData.status === 'pendiente') {
                estadoHtml = `<span class="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-black shadow-sm">⏳ Verificando</span>`;
            } else {
                const start = new Date(refData.fechaInicio || new Date());
                const diffDays = Math.ceil(Math.abs(new Date() - start) / (1000 * 60 * 60 * 24));
                const quedan = Math.max(7 - diffDays, 0);
                if (quedan > 0) {
                    estadoHtml = `<span class="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-black shadow-sm">⏳ Prueba (${quedan} días)</span>`;
                } else {
                    estadoHtml = `<span class="text-[10px] bg-rose-100 text-rose-700 px-2 py-1 rounded-lg font-black shadow-sm">⚠️ Vencido</span>`;
                }
            }

            html += `
            <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl mb-2 border border-slate-100">
                <div class="truncate pr-2">
                    <p class="text-xs font-bold text-slate-800 truncate">${refData.email.split('@')[0]}</p>
                    <p class="text-[9px] text-slate-400 truncate">${refData.email}</p>
                </div>
                <div class="shrink-0 text-right">${estadoHtml}</div>
            </div>`;
        });
        listUI.innerHTML = html;

    } catch(e) {
        listUI.innerHTML = `<div class="text-xs text-rose-500 text-center py-4 font-bold">Error de conexión al cargar lista.</div>`;
    }
};

window.compartirLinkPartner = () => {
    const codigo = document.getElementById('partnerCodigoUI').innerText;
    const urlApp = `https://imperialempy-collab.github.io/Ahorro.Challenge/activar.html?ref=${codigo}`;
    const texto = `¡Te regalo un descuento exclusivo! 🎁\n\nDescargá la app que uso para organizar mi dinero y activá tu cuenta con un descuento especial usando mi link:\n\n👉 ${urlApp}\n\nO ingresá este código al pagar: *${codigo}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
};


// --- AUTENTICACIÓN OPTIMISTA Y RESTAURACIÓN ---
onAuthStateChanged(auth, async (user) => {
    const loginScreen = document.getElementById('loginScreen'); const appContent = document.getElementById('appContent'); const loadingSpinner = document.getElementById('loadingSpinner'); const googleLoginBtn = document.getElementById('googleLoginBtn'); const loginText = document.getElementById('loginText');
    
    if (user) {
        document.getElementById('sidebarUserEmail').innerText = user.email;
        const localStatus = localStorage.getItem('local_user_status');
        if (localStatus === 'pagado') {
            window.userAccessStatus = 'pagado'; window.actualizarUI_Pago(); document.querySelectorAll('.sync-dot').forEach(el => el.className = "sync-dot absolute top-0 right-0 w-2 h-2 bg-emerald-500 border border-white rounded-full");
            loginScreen.classList.add('hidden'); appContent.classList.remove('hidden'); window.initApp(); return; 
        }

        const userRef = doc(db, "usuarios_multimeta", user.email);
        try {
            const docSnap = await getDoc(userRef);
            if (!docSnap.exists()) {
                await setDoc(userRef, { email: user.email, status: 'prueba', fechaInicio: new Date().toISOString() });
                window.userAccessStatus = 'prueba'; window.actualizarUI_Pago(); loginScreen.classList.add('hidden'); appContent.classList.remove('hidden'); window.initApp(); 
            } else {
                const userData = docSnap.data(); window.userAccessStatus = userData.status || 'prueba'; localStorage.setItem('local_user_status', window.userAccessStatus);
                
                let isAhorroLocalEmpty = true;
                const localAhorro = localStorage.getItem('ahorro_dinamico_LAB_TEST_MULTIMETA');
                try {
                    if (localAhorro && localAhorro !== "null" && localAhorro !== "undefined") {
                        const p = JSON.parse(localAhorro);
                        if ((p.participants && p.participants.length > 0) || (p.goals && p.goals.length > 1)) {
                            isAhorroLocalEmpty = false;
                        }
                    }
                } catch(e) {}

                if (isAhorroLocalEmpty && userData.ahorro_data) {
                    localStorage.setItem('ahorro_dinamico_LAB_TEST_MULTIMETA', JSON.stringify(userData.ahorro_data)); 
                }

                let isMacroEmpty = true;
                const localCuentas = localStorage.getItem('mg_cuentas');
                try {
                    if (localCuentas && localCuentas !== "null" && localCuentas !== "undefined") {
                        const c = JSON.parse(localCuentas);
                        if (c.length > 0) isMacroEmpty = false;
                    }
                } catch(e) {}

                if (isMacroEmpty && userData.macro_data) {
                    if(userData.macro_data.cuentas) localStorage.setItem('mg_cuentas', JSON.stringify(userData.macro_data.cuentas));
                    if(userData.macro_data.gastos) localStorage.setItem('mg_gastos', JSON.stringify(userData.macro_data.gastos));
                    if(userData.macro_data.historial) localStorage.setItem('mg_historial', JSON.stringify(userData.macro_data.historial));
                    if(userData.macro_data.ingreso) localStorage.setItem('mg_ingreso', userData.macro_data.ingreso.toString());
                }

                window.actualizarUI_Pago(); document.querySelectorAll('.sync-dot').forEach(el => el.className = "sync-dot absolute top-0 right-0 w-2 h-2 bg-emerald-500 border border-white rounded-full");

                if (window.userAccessStatus === 'pagado') { loginScreen.classList.add('hidden'); appContent.classList.remove('hidden'); window.initApp(); 
                } else if (window.userAccessStatus === 'vencido' || window.userAccessStatus === 'rechazado') { window.location.href = 'activar.html';
                } else {
                    const start = new Date(userData.fechaInicio || new Date()); const now = new Date(); const diffDays = Math.ceil(Math.abs(now - start) / (1000 * 60 * 60 * 24));
                    if (diffDays > 7 && window.userAccessStatus !== 'pendiente') { window.userAccessStatus = 'vencido'; localStorage.setItem('local_user_status', 'vencido'); window.location.href = 'activar.html';
                    } else {
                        if (window.userAccessStatus !== 'pendiente') { document.getElementById('btnProbarGratis').classList.remove('hidden'); window.mostrarAlerta(`🎁 Estás en tu día ${diffDays} de 7 de prueba gratis.`); }
                        loginScreen.classList.add('hidden'); document.getElementById('upgradeScreen').classList.add('hidden'); appContent.classList.remove('hidden'); window.initApp();
                    }
                }
            }
        } catch (error) { console.error("Error nube:", error); loginScreen.classList.add('hidden'); appContent.classList.remove('hidden'); window.initApp(); }
    } else { loginScreen.classList.remove('hidden'); appContent.classList.add('hidden'); if (loadingSpinner) loadingSpinner.classList.add('hidden'); if (googleLoginBtn) googleLoginBtn.classList.remove('hidden'); if (loginText) loginText.classList.remove('hidden'); }
});

window.sincronizarNube = async (manual = false) => {
    if (!auth.currentUser) return;
    if (manual && !window.ENABLE_MANUAL_SYNC) { window.mostrarAlerta("La actualización manual está desactivada."); return; }
    try {
        document.querySelectorAll('.sync-dot').forEach(el => el.className = "sync-dot absolute top-0 right-0 w-2 h-2 bg-amber-400 border border-white rounded-full animate-ping");
        const userRef = doc(db, "usuarios_multimeta", auth.currentUser.email);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            const realStatus = docSnap.data().status; localStorage.setItem('local_user_status', realStatus); window.userAccessStatus = realStatus;
            if (realStatus === 'vencido' || realStatus === 'rechazado') { window.location.href = 'activar.html'; return; }
        }
        const safeParse = (str) => { try { return (str && str !== "null" && str !== "undefined") ? JSON.parse(str) : null; } catch(e) { return null; } };
        const payload = {
            ahorro_data: safeParse(localStorage.getItem('ahorro_dinamico_LAB_TEST_MULTIMETA')),
            macro_data: { cuentas: safeParse(localStorage.getItem('mg_cuentas')), gastos: safeParse(localStorage.getItem('mg_gastos')), historial: safeParse(localStorage.getItem('mg_historial')), ingreso: localStorage.getItem('mg_ingreso') || 0 },
            last_sync: new Date().toISOString(), sync_count: increment(1)
        };
        await updateDoc(userRef, payload);
        localStorage.setItem('last_cloud_sync', new Date().getTime().toString());
        document.querySelectorAll('.sync-dot').forEach(el => el.className = "sync-dot absolute top-0 right-0 w-2 h-2 bg-emerald-500 border border-white rounded-full transition-colors"); window.actualizarUI_Pago();
        if (manual) window.mostrarAlerta("✅ Sincronización exitosa. Tu progreso está 100% seguro.");
    } catch (error) { console.error("Error nube:", error); if (manual) window.mostrarAlerta("❌ Error al guardar en la nube."); document.querySelectorAll('.sync-dot').forEach(el => el.className = "sync-dot absolute top-0 right-0 w-2 h-2 bg-rose-500 border border-white rounded-full transition-colors"); }
};

window.verificarAutoSync = () => { if (typeof window.sincronizarNube !== 'function') return; const lastSync = localStorage.getItem('last_cloud_sync'); const now = new Date().getTime(); if (!lastSync || (now - parseInt(lastSync)) > 86400000) { window.sincronizarNube(false); } };

window.toggleSidebar = () => { const sb = document.getElementById('sidebar'); const ov = document.getElementById('sidebarOverlay'); if(sb.classList.contains('-translate-x-full')) { sb.classList.remove('-translate-x-full'); ov.classList.remove('hidden'); } else { sb.classList.add('-translate-x-full'); ov.classList.add('hidden'); } };

// ============================================================================
// --- LÓGICA DE AHORRO LOCAL (INTACTA) ---
// ============================================================================

const DB_KEY = 'ahorro_dinamico_LAB_TEST_MULTIMETA'; 
let goals = [{ id: 'default', name: 'Meta Principal', amount: 13780000, weeks: 52 }]; let participants = []; let participantGoals = {}; let userReminders = {}; let activeParticipant = ""; 
// --- CAMBIO UX: EMPIEZA EN INDIVIDUAL ---
let statsView = "INDIVIDUAL"; 
let userProgress = {}; let userSchedules = {}; 
const formatPYG = (n) => new Intl.NumberFormat('es-PY').format(Math.round(n || 0)) + ' Gs.';

window.save = () => { try { localStorage.setItem(DB_KEY, JSON.stringify({ goals, participants, participantGoals, userReminders, activeParticipant, statsView, userProgress, userSchedules })); document.querySelectorAll('.sync-dot').forEach(el => el.className = "sync-dot absolute top-0 right-0 w-2 h-2 bg-rose-500 border border-white rounded-full transition-colors"); if (typeof window.verificarAutoSync === 'function') window.verificarAutoSync(); } catch(e) { console.error(e); } };
window.load = () => { 
    try { 
        const saved = localStorage.getItem(DB_KEY); 
        if (saved && saved !== "null" && saved !== "undefined") { 
            const p = JSON.parse(saved); 
            if(p) { 
                if (p.config && (!p.goals || p.goals.length === 0)) { goals = [{ id: 'default', name: 'Meta Principal', amount: p.config.meta, weeks: p.config.semanas }]; participantGoals = {}; (p.participants || []).forEach(part => { participantGoals[part] = 'default'; }); } else { goals = p.goals || goals; participantGoals = p.participantGoals || {}; } 
                participants = p.participants || []; 
                userReminders = p.userReminders || {}; 
                activeParticipant = p.activeParticipant || ""; 
                // --- CAMBIO UX: SIEMPRE INDIVIDUAL SI NO ESTABA SETEADO ---
                statsView = p.statsView || "INDIVIDUAL"; 
                userProgress = p.userProgress || {}; 
                userSchedules = p.userSchedules || {}; 
            } 
        } 
    } catch(e) { console.error("Ignorando caché corrupto."); } 
    window.updateGoalDropdown(); 
};
window.openAddParticipantModal = () => { document.getElementById('newParticipantInput').value = ''; window.updateGoalDropdown(); document.getElementById('addParticipantModal').classList.remove('hidden'); setTimeout(() => document.getElementById('newParticipantInput').focus(), 100); };
window.closeAddParticipantModal = () => { document.getElementById('addParticipantModal').classList.add('hidden'); };
window.addParticipant = () => { const n = document.getElementById('newParticipantInput').value.trim().toUpperCase(); const goalId = document.getElementById('goalSelect').value; if (n && !participants.includes(n)) { participants.push(n); participantGoals[n] = goalId; userProgress[n] = []; window.generateSchedule(n); if (!activeParticipant) { activeParticipant = n; statsView = "INDIVIDUAL"; } window.save(); window.updateViewButtons(); window.renderParticipants(); window.renderGoals(); window.updateStats(); window.closeAddParticipantModal(); } else if (participants.includes(n)) { window.mostrarAlerta("Este participante ya existe."); } else { window.mostrarAlerta("Ingresá un nombre válido."); } };
window.openGoalsModal = () => { window.renderAdminGoals(); document.getElementById('goalsConfigModal').classList.remove('hidden'); };
window.closeGoalsModal = () => { document.getElementById('goalsConfigModal').classList.add('hidden'); };
window.updateGoalDropdown = () => { const select = document.getElementById('goalSelect'); if (select) { select.innerHTML = goals.map(g => `<option value="${g.id}">${g.name} (${formatPYG(g.amount)})</option>`).join(''); } };
window.renderAdminGoals = () => { const list = document.getElementById('goalsAdminList'); list.innerHTML = goals.map(g => { let count = 0; participants.forEach(p => { if(participantGoals[p] === g.id) count++; }); return `<div class="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center"><div><h4 class="font-bold text-slate-800 text-sm">${g.name}</h4><p class="text-[10px] text-slate-500 uppercase">${g.weeks} sem • ${formatPYG(g.amount)} • ${count} usuarios</p></div><div class="flex gap-2"><button onclick="editGoal('${g.id}')" class="p-1.5 text-slate-400 hover:text-secondary"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button><button onclick="deleteGoal('${g.id}')" class="p-1.5 text-slate-400 hover:text-rose-500"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></div></div>`; }).join(''); };
window.createNewGoal = async () => { const name = await window.mostrarPrompt("Nombre de la nueva meta:", "Nueva Meta", "text"); if (!name) return; const amount = await window.mostrarPrompt("Monto total a alcanzar:", "", "number"); if (!amount) return; const weeks = await window.mostrarPrompt("Cantidad de semanas:", "24", "number"); if (!weeks) return; const nAmount = parseInt(amount.toString().replace(/\D/g,'')); const nWeeks = parseInt(weeks.toString().replace(/\D/g,'')); if (nAmount > 0 && nWeeks > 0) { const newId = 'goal_' + Date.now(); goals.push({ id: newId, name: name, amount: nAmount, weeks: nWeeks }); window.save(); window.renderAdminGoals(); window.updateGoalDropdown(); window.renderGoals(); window.updateStats(); } };
window.editGoal = async (id) => { const goal = goals.find(g => g.id === id); if(!goal) return; const name = await window.mostrarPrompt("Editar Nombre:", goal.name, "text"); if (!name) return; const amount = await window.mostrarPrompt("Editar Monto total:", goal.amount, "number"); if (!amount) return; const weeks = await window.mostrarPrompt("Editar Semanas:", goal.weeks, "number"); if (!weeks) return; goal.name = name; goal.amount = parseInt(amount.toString().replace(/\D/g,'')); goal.weeks = parseInt(weeks.toString().replace(/\D/g,'')); participants.forEach(p => { if(participantGoals[p] === id) { window.generateSchedule(p); window.recalculateRemaining(p); } }); window.save(); window.renderAdminGoals(); window.updateGoalDropdown(); window.renderGoals(); window.updateStats(); };
window.deleteGoal = async (id) => { const inUse = participants.some(p => participantGoals[p] === id); if (inUse) return window.mostrarAlerta("Hay participantes usando esta meta."); if (goals.length === 1) return window.mostrarAlerta("Debe existir al menos una meta."); const seguro = await window.mostrarConfirm("¿Eliminar esta meta?"); if(seguro) { goals = goals.filter(g => g.id !== id); window.save(); window.renderAdminGoals(); window.updateGoalDropdown(); window.renderGoals(); window.updateStats(); } };
window.openReminderModal = () => { if (!activeParticipant) return window.mostrarAlerta("Seleccioná un participante."); const savedReminders = userReminders[activeParticipant] || { type: 'semanal', day: 'Lunes', date: '5', time: '10:00' }; document.getElementById('reminderType').value = savedReminders.type; document.getElementById('reminderDay').value = savedReminders.day; document.getElementById('reminderDate').value = savedReminders.date; document.getElementById('reminderTime').value = savedReminders.time; window.toggleReminderType(); document.getElementById('reminderModal').classList.remove('hidden'); };
window.closeReminderModal = () => { document.getElementById('reminderModal').classList.add('hidden'); };
window.toggleReminderType = () => { const type = document.getElementById('reminderType').value; if (type === 'semanal') { document.getElementById('weeklyOptions').classList.remove('hidden'); document.getElementById('monthlyOptions').classList.add('hidden'); } else { document.getElementById('weeklyOptions').classList.add('hidden'); document.getElementById('monthlyOptions').classList.remove('hidden'); } };
window.saveReminder = () => { const type = document.getElementById('reminderType').value; const day = document.getElementById('reminderDay').value; const date = document.getElementById('reminderDate').value; const time = document.getElementById('reminderTime').value; const userGoal = window.getGoalForUser(activeParticipant); const titulo = `🐷 Depósito de ${activeParticipant} 💰`; const descripcion = `¡Llegó el día! Te toca hacer el depósito para tu meta: ${userGoal.name}.\n\nEntrá a tu app para marcarlo como listo:\nhttps://imperialempy-collab.github.io/Ahorro.Challenge/`; let startDate = new Date(); const [hours, minutes] = time.split(':'); startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0); let gcalRecur = ''; let icalRecur = ''; if (type === 'semanal') { const diasICal = {'Lunes':'MO', 'Martes':'TU', 'Miércoles':'WE', 'Jueves':'TH', 'Viernes':'FR', 'Sábado':'SA', 'Domingo':'SU'}; const rday = diasICal[day]; icalRecur = `RRULE:FREQ=WEEKLY;BYDAY=${rday}`; gcalRecur = `RRULE:FREQ=WEEKLY;BYDAY=${rday}`; const dayMap = {'Domingo':0, 'Lunes':1, 'Martes':2, 'Miércoles':3, 'Jueves':4, 'Viernes':5, 'Sábado':6}; let distance = (dayMap[day] + 7 - startDate.getDay()) % 7; if (distance === 0) distance = 7; startDate.setDate(startDate.getDate() + distance); } else { icalRecur = `RRULE:FREQ=MONTHLY;BYMONTHDAY=${date}`; gcalRecur = `RRULE:FREQ=MONTHLY;BYMONTHDAY=${date}`; let targetDate = parseInt(date); if (startDate.getDate() >= targetDate) { startDate.setMonth(startDate.getMonth() + 1); } startDate.setDate(targetDate); } const formatICS = (d) => { return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'; }; const startStr = formatICS(startDate); const endDate = new Date(startDate.getTime() + 60*60*1000); const endStr = formatICS(endDate); const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); if (isIOS) { const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Ahorro Challenge//AppWeb//ES\nCALSCALE:GREGORIAN\nBEGIN:VEVENT\nSUMMARY:${titulo}\nDTSTART:${startStr}\nDTEND:${endStr}\n${icalRecur}\nDESCRIPTION:${descripcion.replace(/\n/g, '\\n')}\nEND:VEVENT\nEND:VCALENDAR`; window.location.href = 'data:text/calendar;charset=utf8,' + encodeURIComponent(icsContent); } else { const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titulo)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(descripcion)}&recur=${encodeURIComponent(gcalRecur)}`; window.open(gcalUrl, '_blank'); } userReminders[activeParticipant] = { type, day, date, time }; window.save(); window.closeReminderModal(); window.renderParticipants(); };
window.getGoalForUser = (nombreUser) => { const goalId = participantGoals[nombreUser] || goals[0].id; return goals.find(g => g.id === goalId) || goals[0]; };
window.calculateWeights = (totalWeeks) => { let weights = []; let currentWeight = 0; let habitWeeks = Math.floor(totalWeeks * 0.25); if (habitWeeks < 1) habitWeeks = 1; for (let i = 1; i <= totalWeeks; i++) { currentWeight += 1; if (i > habitWeeks && (i - habitWeeks - 1) % 4 === 0) { let jump = Math.floor(totalWeeks / 10); if (jump < 3) jump = 3; currentWeight += jump; } weights.push(currentWeight); } return weights; };
window.generateSchedule = (nombreUser) => { const userGoal = window.getGoalForUser(nombreUser); let schedule = []; let weights = window.calculateWeights(userGoal.weeks); let totalWeight = weights.reduce((a, b) => a + b, 0); let baseUnit = userGoal.amount / totalWeight; let currentSum = 0; for (let i = 0; i < userGoal.weeks; i++) { if (i === userGoal.weeks - 1) { schedule.push(userGoal.amount - currentSum); } else { let amount = Math.round((baseUnit * weights[i]) / 5000) * 5000; if (amount < 5000) amount = 5000; if (currentSum + amount >= userGoal.amount) { amount = Math.max(0, userGoal.amount - currentSum - 5000); } schedule.push(amount); currentSum += amount; } } userSchedules[nombreUser] = schedule; };
window.recalculateRemaining = (nombreUser) => { const userGoal = window.getGoalForUser(nombreUser); const misPagos = userProgress[nombreUser] || []; const yaPagado = misPagos.reduce((acc, p) => acc + p.pagado, 0); const restoDinero = userGoal.amount - yaPagado; let newSchedule = [...userSchedules[nombreUser]]; let weights = window.calculateWeights(userGoal.weeks); let unpaidIndices = []; for (let i = 0; i < userGoal.weeks; i++) { const yaEstaPaga = misPagos.some(p => p.semana === (i + 1)); if (!yaEstaPaga) unpaidIndices.push(i); } if (unpaidIndices.length === 0) return; if (restoDinero <= 0) { unpaidIndices.forEach(i => newSchedule[i] = 0); userSchedules[nombreUser] = newSchedule; return; } let remainingWeightSum = unpaidIndices.reduce((sum, idx) => sum + weights[idx], 0); let newBaseUnit = restoDinero / remainingWeightSum; let currentSum = 0; for (let j = 0; j < unpaidIndices.length; j++) { let idx = unpaidIndices[j]; if (j === unpaidIndices.length - 1) { newSchedule[idx] = restoDinero - currentSum; } else { let amount = Math.round((newBaseUnit * weights[idx]) / 5000) * 5000; if (amount < 5000 && restoDinero > 5000) amount = 5000; if (currentSum + amount >= restoDinero) { amount = Math.max(0, restoDinero - currentSum - 5000); } newSchedule[idx] = amount; currentSum += amount; } } userSchedules[nombreUser] = newSchedule; };
window.deleteParticipant = async (n) => { const seguro = await window.mostrarConfirm(`¿Seguro querés eliminar a ${n} y todo su progreso?`); if (seguro) { participants = participants.filter(p => p !== n); if (userProgress[n]) delete userProgress[n]; if (userSchedules[n]) delete userSchedules[n]; if (participantGoals[n]) delete participantGoals[n]; if (userReminders[n]) delete userReminders[n]; if (activeParticipant === n) { activeParticipant = participants.length > 0 ? participants[0] : ""; } window.save(); window.updateViewButtons(); window.renderParticipants(); window.renderGoals(); window.updateStats(); } };
window.setActiveParticipant = (n) => { activeParticipant = n; statsView = 'INDIVIDUAL'; window.save(); window.updateViewButtons(); window.renderParticipants(); window.renderGoals(); window.updateStats(); window.scrollToNext(); };
window.setStatsView = (v) => { statsView = v; window.updateStats(); window.updateViewButtons(); window.renderGoals(); };
window.updateViewButtons = () => { const colBtn = document.getElementById('btnViewCol'); const indBtn = document.getElementById('btnViewInd'); if (statsView === 'COLECTIVO') { colBtn.className = "px-3 py-1 text-[10px] rounded-full border transition-all btn-view-active"; indBtn.className = "px-3 py-1 text-[10px] rounded-full border transition-all btn-view-inactive"; } else { colBtn.className = "px-3 py-1 text-[10px] rounded-full border transition-all btn-view-inactive"; indBtn.className = "px-3 py-1 text-[10px] rounded-full border transition-all btn-view-active"; } };

window.toggle = (semanaNum) => { 
    if (window.userAccessStatus === 'vencido' || window.userAccessStatus === 'rechazado') return window.location.href = 'activar.html'; 
    if (!activeParticipant) return window.mostrarAlerta("Seleccioná un participante"); 
    const pIdx = userProgress[activeParticipant].findIndex(p => p.semana === semanaNum); if (pIdx > -1) { userProgress[activeParticipant].splice(pIdx, 1); window.recalculateRemaining(activeParticipant); } else { const montoOriginal = userSchedules[activeParticipant][semanaNum - 1]; const d = new Date().toLocaleDateString('es-PY', { day: 'numeric', month: 'short' }); userProgress[activeParticipant].push({ semana: semanaNum, pagado: montoOriginal, fecha: d }); } window.save(); window.renderGoals(); window.updateStats(); 
};
window.promptManual = async (semNum) => { 
    if (window.userAccessStatus === 'vencido' || window.userAccessStatus === 'rechazado') return window.location.href = 'activar.html'; 
    if (!activeParticipant) return window.mostrarAlerta("Seleccioná un participante"); 
    const previsto = userSchedules[activeParticipant][semNum - 1]; const val = await window.mostrarPrompt("Ingresá el monto real:", previsto, "number"); if (val !== null && val !== "") { const num = parseInt(val.toString().replace(/\D/g,'')); if (num > 0) { const pIdx = userProgress[activeParticipant].findIndex(p => p.semana === semNum); const d = new Date().toLocaleDateString('es-PY', { day: 'numeric', month: 'short' }); if (pIdx > -1) { userProgress[activeParticipant][pIdx].pagado = num; } else { userProgress[activeParticipant].push({ semana: semNum, pagado: num, fecha: d }); } window.recalculateRemaining(activeParticipant); window.save(); window.renderGoals(); window.updateStats(); } } 
};

window.updateStats = () => { let totalGeneral = 0; Object.values(userProgress).forEach(pagos => pagos.forEach(p => totalGeneral += p.pagado)); const strokeVal = 113; if (statsView === 'COLECTIVO') { document.getElementById('statsTitle').innerText = "Gran Total Colectivo"; document.getElementById('metaLabel').innerText = `Gestor de Múltiples Metas`; let totalObjetivoGlobal = 0; participants.forEach(p => { totalObjetivoGlobal += window.getGoalForUser(p).amount; }); const p = totalObjetivoGlobal > 0 ? (totalGeneral / totalObjetivoGlobal) * 100 : 0; document.getElementById('progressPercentage').innerText = Math.round(Math.min(p, 100)) + '%'; document.getElementById('globalProgressCircle').style.strokeDashoffset = strokeVal - (Math.min(p, 100) / 100 * strokeVal); document.getElementById('totalSavedCounter').innerText = formatPYG(totalGeneral); } else { if(!activeParticipant) { document.getElementById('statsTitle').innerText = "Ahorro de -"; document.getElementById('metaLabel').innerText = "Sin meta"; document.getElementById('progressPercentage').innerText = "0%"; document.getElementById('globalProgressCircle').style.strokeDashoffset = strokeVal; document.getElementById('totalSavedCounter').innerText = "0 Gs."; return; } const userGoal = window.getGoalForUser(activeParticipant); const miTotal = (userProgress[activeParticipant] || []).reduce((acc, p) => acc + p.pagado, 0); document.getElementById('statsTitle').innerText = `Ahorro de ${activeParticipant} (${userGoal.name})`; const falta = userGoal.amount - miTotal; document.getElementById('metaLabel').innerText = falta > 0 ? `Faltan: ${formatPYG(falta)}` : "¡META LOGRADA!"; const p = (miTotal / userGoal.amount) * 100; document.getElementById('progressPercentage').innerText = Math.round(Math.min(p, 100)) + '%'; document.getElementById('globalProgressCircle').style.strokeDashoffset = strokeVal - (Math.min(p, 100) / 100 * strokeVal); document.getElementById('totalSavedCounter').innerText = formatPYG(miTotal); } };

window.renderGoals = () => { 
    const container = document.getElementById('goalsList'); 
    let html = ""; 
    
    if (statsView === 'COLECTIVO') { 
        html += `<h2 class="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider pl-1">Resumen de Metas Activas</h2><div class="grid grid-cols-1 md:grid-cols-2 gap-4">`; 
        goals.forEach(g => { 
            let totalGoalSaved = 0; let peopleInGoal = 0; 
            participants.forEach(p => { 
                if (participantGoals[p] === g.id || (!participantGoals[p] && g.id === 'default')) { 
                    peopleInGoal++; 
                    const pagos = userProgress[p] || []; 
                    totalGoalSaved += pagos.reduce((acc, curr) => acc + curr.pagado, 0); 
                } 
            }); 
            if(peopleInGoal === 0) return; 
            let targetTotal = g.amount * peopleInGoal; 
            let progress = targetTotal > 0 ? (totalGoalSaved / targetTotal) * 100 : 0; 
            html += `<div class="glass-card rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden"><div class="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-[100px] -z-10"></div><h3 class="font-display font-bold text-slate-800 text-lg mb-1">${g.name}</h3><p class="text-[10px] font-bold text-slate-400 uppercase mb-4">${peopleInGoal} participantes • Meta: ${formatPYG(g.amount)} c/u</p><div class="flex justify-between items-end mb-2"><span class="text-2xl font-display font-bold text-slate-900">${formatPYG(totalGoalSaved)}</span><span class="text-sm font-bold text-primary">${Math.round(progress)}%</span></div><div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div class="bg-primary h-2.5 rounded-full transition-all duration-1000" style="width: ${Math.min(progress, 100)}%"></div></div></div>`; 
        }); 
        html += `</div>`; 
        container.innerHTML = html; 
    } else { 
        if (!activeParticipant) { 
            // --- CAMBIO UX: MENSAJE INSTRUCTIVO LIMPIO (SIN ÍCONO GIGANTE) ---
            container.innerHTML = `
                <div class="text-center p-10 flex flex-col items-center justify-center gap-3">
                    <p class="text-sm text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                        Configurá tu meta en el botón <svg class="inline w-4 h-4 -mt-0.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> y agregá un participante en el botón <span class="inline-block bg-emerald-50 text-primary px-1.5 py-0 rounded font-bold text-xs">+</span> para comenzar.
                    </p>
                </div>`; 
            return; 
        } 
        const userGoal = window.getGoalForUser(activeParticipant); 
        for (let i = 1; i <= userGoal.weeks; i++) { 
            const pago = (userProgress[activeParticipant] || []).find(up => up.semana === i); 
            const hechoPorMi = !!pago; 
            const montoMostrado = userSchedules[activeParticipant] ? userSchedules[activeParticipant][i-1] : (userGoal.amount / userGoal.weeks); 
            html += `<div id="goal-${i}" class="glass-card rounded-xl p-3 flex items-center gap-3 border-l-4 ${hechoPorMi ? 'border-l-primary shadow-md' : 'border-l-slate-200'}"><div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-bold shrink-0">${i}</div><div class="flex-grow"><div class="text-sm font-bold text-slate-800">${hechoPorMi ? 'COMPLETADO' : formatPYG(montoMostrado)}</div><div class="text-[8px] uppercase text-slate-400 font-bold">Depósito ${i}</div></div><div class="flex flex-col items-end gap-1 px-1">${hechoPorMi ? `<div class="flex items-center gap-1 bg-white rounded-full pl-1 pr-2 py-0.5 border border-slate-100 shadow-sm"><div class="h-4 w-4 rounded-full bg-primary text-[7px] flex items-center justify-center text-white font-black">${activeParticipant[0]}</div><span class="text-[7px] font-bold text-slate-600 uppercase">${pago.fecha} • ${formatPYG(pago.pagado)}</span></div>` : ''}</div><div class="flex gap-1"><button onclick="promptManual(${i})" class="p-2 rounded-lg text-slate-400 hover:text-primary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button><button onclick="toggle(${i})" class="px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${hechoPorMi ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}">${hechoPorMi ? 'LISTO' : 'MARCAR'}</button></div></div>`; 
        } 
        container.innerHTML = html; 
    } 
};

window.renderParticipants = () => { 
    const list = document.getElementById('participantList'); 
    // --- CAMBIO UX: ELIMINADO EL TEXTO DE 'AGREGÁ UN NOMBRE' ---
    if (!participants.length) { list.innerHTML = ``; return; } 
    list.innerHTML = participants.map(p => { 
        const goal = window.getGoalForUser(p); 
        const hasReminder = userReminders[p] ? '🔔' : ''; 
        return `<div class="flex items-center bg-white/50 rounded-lg p-1 mb-1"><button onclick="setActiveParticipant('${p}')" class="flex-grow text-left px-3 py-1.5 rounded-md ${p === activeParticipant ? 'badge-active' : 'text-slate-500'}"><div class="text-xs font-bold">${p} ${hasReminder}</div><div class="text-[9px] opacity-80 uppercase">${goal.name}</div></button><button onclick="deleteParticipant('${p}')" class="px-2 text-slate-300 hover:text-rose-500 font-bold text-lg">×</button></div>`; 
    }).join(''); 
};

window.scrollToNext = () => { if (!activeParticipant) return; const nextIndex = (userProgress[activeParticipant]?.length || 0) + 1; const userGoal = window.getGoalForUser(activeParticipant); if (nextIndex <= userGoal.weeks) { setTimeout(() => { const el = document.getElementById(`goal-${nextIndex}`); if (el) window.scrollTo({top: el.offsetTop - 180, behavior: 'smooth'}); }, 300); } };

window.initApp = () => { 
    window.load(); 
    window.updateViewButtons(); 
    window.renderParticipants(); 
    window.renderGoals(); 
    window.updateStats(); 
    if (typeof window.verificarAutoSync === 'function') window.verificarAutoSync();

    // MAGIA DE REDIRECCIÓN: Abre el portal partner al volver de otra sección
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('open') === 'partner') {
        window.abrirPortalPartner();
        window.history.replaceState({}, document.title, window.location.pathname); // Limpia la URL
    }
};

if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); }); }
