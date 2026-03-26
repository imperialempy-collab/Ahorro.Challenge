import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, arrayUnion, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

window.currentPartnerPerfil = null; 
window.ENABLE_MANUAL_SYNC = true;

// --- EL GUARDAESPALDAS INSTANTÁNEO ---
if (localStorage.getItem('local_user_status') !== 'pagado') {
    window.location.href = '../activar.html';
}

window.mostrarAlerta = (mensaje) => { document.getElementById('customAlertMessage').innerText = mensaje; document.getElementById('customAlert').classList.remove('hidden'); };
window.closeCustomAlert = () => { document.getElementById('customAlert').classList.add('hidden'); };
window.mostrarLoaderSilencioso = () => { document.getElementById('silentLoader').classList.remove('hidden'); };
window.ocultarLoaderSilencioso = () => { document.getElementById('silentLoader').classList.add('hidden'); };
window.logout = async () => { localStorage.removeItem('local_user_status'); signOut(auth).then(() => { window.location.href = '../index.html'; }); };

onAuthStateChanged(auth, async (user) => {
    const loginScreen = document.getElementById('loginScreen'); const appContent = document.getElementById('appContent');
    if (user) {
        const sidebarEmail = document.querySelector('app-sidebar')?.querySelector('#sidebarUserEmail');
        if (sidebarEmail) sidebarEmail.innerText = user.email;

        const localStatus = localStorage.getItem('local_user_status');
        if (localStatus !== 'pagado') {
            window.location.href = '../activar.html';
            return;
        }

        const userRef = doc(db, "usuarios_multimeta", user.email);
        try {
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.status === 'pagado') {
                    loginScreen.classList.add('hidden'); 
                    appContent.classList.remove('hidden'); 
                    iniciarPortal(data);
                    window.verificarAutoSync(); 
                } else {
                    window.location.href = '../activar.html';
                }
            } else { window.location.href = '../index.html'; }
        } catch (error) { 
            window.location.href = '../index.html'; 
        }
    } else { 
        loginScreen.classList.remove('hidden'); appContent.classList.add('hidden'); 
    }
});

function iniciarPortal(userData) {
    if (userData.partner_perfil) {
        cargarDashboardPartner(userData);
    } else {
        document.getElementById('reglasPartnerModal').classList.remove('hidden');
    }
}

window.aceptarReglasYRegistrar = () => {
    document.getElementById('reglasPartnerModal').classList.add('hidden');
    document.getElementById('tituloRegistroPartner').innerText = "Datos de Recepción";
    document.getElementById('btnGuardarPartner').innerText = "Guardar Mis Datos";
    document.getElementById('partnerNombre').value = "";
    document.getElementById('partnerBanco').value = "";
    document.getElementById('partnerCI').value = "";
    document.getElementById('partnerCuenta').value = "";
    document.getElementById('registroPartnerModal').classList.remove('hidden');
};

window.abrirEdicionPartner = () => {
    if (!window.currentPartnerPerfil) return;
    document.getElementById('tituloRegistroPartner').innerText = "Editar Mis Datos";
    document.getElementById('btnGuardarPartner').innerText = "Guardar Cambios";
    document.getElementById('partnerNombre').value = window.currentPartnerPerfil.nombre || "";
    document.getElementById('partnerBanco').value = window.currentPartnerPerfil.banco || "";
    document.getElementById('partnerCI').value = window.currentPartnerPerfil.ci || "";
    document.getElementById('partnerCuenta').value = window.currentPartnerPerfil.cuenta || "";
    document.getElementById('registroPartnerModal').classList.remove('hidden');
};

window.cerrarRegistroPartner = () => { 
    if(window.currentPartnerPerfil) {
        document.getElementById('registroPartnerModal').classList.add('hidden'); 
    } else {
        window.location.href = '../index.html';
    }
};

window.guardarPerfilPartner = async () => {
    const nombre = document.getElementById('partnerNombre').value.trim();
    const banco = document.getElementById('partnerBanco').value.trim();
    const ci = document.getElementById('partnerCI').value.trim();
    const cuenta = document.getElementById('partnerCuenta').value.trim();

    if(!nombre || !banco || !ci || !cuenta) return window.mostrarAlerta("Completá todos tus datos para poder pagarte.");

    const btn = document.getElementById('btnGuardarPartner');
    const textoOriginal = btn.innerHTML;
    
    // Ícono de carga limpio SVG
    btn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Guardando...`; 
    btn.disabled = true;

    try {
        const userRef = doc(db, "usuarios_multimeta", auth.currentUser.email);
        const docSnap = await getDoc(userRef);
        const userData = docSnap.exists() ? docSnap.data() : {};

        if (userData.partner_perfil) {
            const perfilViejo = userData.partner_perfil;
            const registroHistorico = { ...perfilViejo, fecha_cambio: new Date().toISOString() };
            const perfilNuevo = { nombre, banco, ci, cuenta, codigo: perfilViejo.codigo };
            await updateDoc(userRef, { partner_perfil: perfilNuevo, partner_historial_cuentas: arrayUnion(registroHistorico) });
            userData.partner_perfil = perfilNuevo; 
        } else {
            const baseCode = nombre.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '');
            const rnd = Math.floor(1000 + Math.random() * 9000);
            const codigo = `${baseCode}${rnd}`;
            const perfilNuevo = { nombre, banco, ci, cuenta, codigo };
            await updateDoc(userRef, { partner_perfil: perfilNuevo, partner_saldo: 0, partner_historico: 0 });
            userData.partner_perfil = perfilNuevo;
            userData.partner_saldo = 0;
        }

        document.getElementById('registroPartnerModal').classList.add('hidden');
        cargarDashboardPartner(userData);
    } catch(e) {
        window.mostrarAlerta("Error al guardar tu perfil. Revisá tu conexión.");
    } finally {
        btn.innerHTML = textoOriginal; btn.disabled = false;
    }
};

async function cargarDashboardPartner(userData) {
    const perfil = userData.partner_perfil;
    window.currentPartnerPerfil = perfil; 
    const formatGs = (n) => new Intl.NumberFormat('es-PY').format(n) + ' Gs.';
    
    document.getElementById('partnerCodigoUI').innerText = perfil.codigo;
    document.getElementById('bancoActualUI').innerText = `${perfil.banco} • ${perfil.nombre}`;
    document.getElementById('cuentaActualUI').innerText = `Cuenta: ${perfil.cuenta} | CI/Alias: ${perfil.ci}`;
    document.getElementById('partnerHistoricoUI').innerText = formatGs(userData.partner_historico || 0);

    const saldo = userData.partner_saldo || 0;
    document.getElementById('partnerSaldoUI').innerText = formatGs(saldo);
    
    const metaCobro = 20000;
    const porc = Math.min((saldo / metaCobro) * 100, 100);
    document.getElementById('partnerBarraProgreso').style.width = `${porc}%`;
    
    // TEXTOS MOTIVACIONALES LIMPIOS (Sin Emojis)
    const txtMotivacional = document.getElementById('partnerMensajeMotivacional');
    if (saldo === 0) {
        txtMotivacional.innerText = "";
    } else if (saldo >= 5000 && saldo < 10000) {
        txtMotivacional.innerText = "¡Buen inicio!";
        txtMotivacional.className = "text-center text-sm font-bold text-slate-500 mt-4 h-5 transition-all";
    } else if (saldo >= 10000 && saldo < 15000) {
        txtMotivacional.innerText = "Estás cerca de tu próxima acreditación";
        txtMotivacional.className = "text-center text-sm font-bold text-amber-500 mt-4 h-5 transition-all";
    } else if (saldo >= 15000 && saldo < 20000) {
        txtMotivacional.innerText = "¡Un pasito más y lo lograste!";
        txtMotivacional.className = "text-center text-sm font-bold text-orange-500 mt-4 h-5 transition-all";
    } else if (saldo >= 20000) {
        txtMotivacional.innerText = "¡Felicidades! Recibirás tu incentivo a la brevedad posible.";
        txtMotivacional.className = "text-center text-sm font-bold text-primary mt-4 h-5 transition-all";
    }

    // CARGAR LISTA DE INVITADOS CON ICONOS SVG LIMPIOS
    const listUI = document.getElementById('listaReferidosUI');
    listUI.innerHTML = '<div class="text-center py-6"><span class="animate-pulse text-slate-400 text-xs">Buscando invitados...</span></div>';

    try {
        const q = query(collection(db, "usuarios_multimeta"), where("referido_por", "==", perfil.codigo));
        const snap = await getDocs(q);
        
        if (snap.empty) {
            listUI.innerHTML = `<div class="text-center py-6 px-4"><p class="text-xs text-slate-500 font-bold">Aún no tenés invitados registrados.</p><p class="text-[10px] text-slate-400 mt-1 leading-relaxed">Compartí tu link para empezar a sumar.</p></div>`;
            return;
        }

        let html = "";
        snap.forEach(doc => {
            const refData = doc.data();
            let estadoHtml = "";
            
            if (refData.status === 'pagado') {
                estadoHtml = `<span class="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-black shadow-sm flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg> Pagado (+5k)</span>`;
            } else if (refData.status === 'pendiente') {
                estadoHtml = `<span class="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-black shadow-sm flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Verificando</span>`;
            } else {
                const start = new Date(refData.fechaInicio || new Date());
                const diffDays = Math.ceil(Math.abs(new Date() - start) / (1000 * 60 * 60 * 24));
                const quedan = Math.max(7 - diffDays, 0);
                if (quedan > 0) {
                    estadoHtml = `<span class="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded-lg font-black shadow-sm flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Prueba (${quedan} d)</span>`;
                } else {
                    estadoHtml = `<span class="text-[10px] bg-rose-100 text-rose-700 px-2 py-1 rounded-lg font-black shadow-sm flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> Vencido</span>`;
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
        listUI.innerHTML = `<div class="text-xs text-rose-500 text-center py-4 font-bold">Error al cargar historial.</div>`;
    }
}

// BOTONES DE ACCIÓN (Alerta Limpia)
window.copiarDato = (tipo) => {
    const codigo = document.getElementById('partnerCodigoUI').innerText;
    let texto = (tipo === 'codigo') ? codigo : `https://imperialempy-collab.github.io/Ahorro.Challenge/activar.html?ref=${codigo}`;
    
    navigator.clipboard.writeText(texto).then(() => {
        window.mostrarAlerta("¡Copiado al portapapeles!");
    });
};

window.compartirWhatsApp = () => {
    const codigo = document.getElementById('partnerCodigoUI').innerText;
    const urlApp = `https://imperialempy-collab.github.io/Ahorro.Challenge/activar.html?ref=${codigo}`;
    const texto = `¡Te regalo un descuento exclusivo! 🎁\n\nDescargá la app que uso para organizar mi dinero y activá tu cuenta con un descuento especial usando mi link:\n\n👉 ${urlApp}\n\nO ingresá este código al pagar: *${codigo}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
};

// --- MOTOR DE SINCRONIZACIÓN (TOTALMENTE SILENCIOSO) ---
window.sincronizarNube = async (manual = false) => {
    if (!auth.currentUser) return;
    if (manual && !window.ENABLE_MANUAL_SYNC) return; 

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
        
        const sidebar = document.querySelector('app-sidebar');
        if (sidebar && typeof sidebar.actualizarUI === 'function') sidebar.actualizarUI();
        
    } catch (error) {
        console.error("Error nube:", error);
        document.querySelectorAll('.sync-dot').forEach(el => el.className = "sync-dot absolute top-0 right-0 w-2 h-2 bg-rose-500 border border-white rounded-full transition-colors");
    }
};

window.verificarAutoSync = () => {
    if (typeof window.sincronizarNube !== 'function') return;
    const lastSync = localStorage.getItem('last_cloud_sync');
    const now = new Date().getTime();
    if (!lastSync || (now - parseInt(lastSync)) > 86400000) { window.sincronizarNube(false); }
};
