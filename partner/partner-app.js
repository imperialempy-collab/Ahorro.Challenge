import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
        document.getElementById('sidebarUserEmail').innerText = user.email;
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
    btn.innerHTML = "Guardando... ⏳"; btn.disabled = true;

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
    
    // UI BÁSICA
    document.getElementById('partnerCodigoUI').innerText = perfil.codigo;
    document.getElementById('bancoActualUI').innerText = `${perfil.banco} • ${perfil.nombre}`;
    document.getElementById('cuentaActualUI').innerText = `Cuenta: ${perfil.cuenta} | CI/Alias: ${perfil.ci}`;
    document.getElementById('partnerHistoricoUI').innerText = formatGs(userData.partner_historico || 0);

    // LÓGICA DE SALDO Y BARRA DE PROGRESO
    const saldo = userData.partner_saldo || 0;
    document.getElementById('partnerSaldoUI').innerText = formatGs(saldo);
    
    const metaCobro = 20000;
    const porc = Math.min((saldo / metaCobro) * 100, 100);
    document.getElementById('partnerBarraProgreso').style.width = `${porc}%`;
    
    // TEXTO MOTIVACIONAL DINÁMICO
    const txtMotivacional = document.getElementById('partnerMensajeMotivacional');
    if (saldo === 0) {
        txtMotivacional.innerText = "";
    } else if (saldo >= 5000 && saldo < 10000) {
        txtMotivacional.innerText = "¡Buen inicio! 🚀";
        txtMotivacional.className = "text-center text-sm font-bold text-slate-500 mt-4 h-5 transition-all";
    } else if (saldo >= 10000 && saldo < 15000) {
        txtMotivacional.innerText = "Estás cerca de tu próxima acreditación 👀";
        txtMotivacional.className = "text-center text-sm font-bold text-amber-500 mt-4 h-5 transition-all";
    } else if (saldo >= 15000 && saldo < 20000) {
        txtMotivacional.innerText = "¡Un pasito más y lo lograste! 🔥";
        txtMotivacional.className = "text-center text-sm font-bold text-orange-500 mt-4 h-5 transition-all";
    } else if (saldo >= 20000) {
        txtMotivacional.innerText = "¡Felicidades! Recibirás tu incentivo a la brevedad posible 💸";
        txtMotivacional.className = "text-center text-sm font-bold text-primary mt-4 h-5 transition-all";
    }

    // CARGAR LISTA DE INVITADOS
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
                estadoHtml = `<span class="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-black shadow-sm">✅ Pagado (+5k)</span>`;
            } else if (refData.status === 'pendiente') {
                estadoHtml = `<span class="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-black shadow-sm">⏳ Verificando</span>`;
            } else {
                const start = new Date(refData.fechaInicio || new Date());
                const diffDays = Math.ceil(Math.abs(new Date() - start) / (1000 * 60 * 60 * 24));
                const quedan = Math.max(7 - diffDays, 0);
                if (quedan > 0) {
                    estadoHtml = `<span class="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded-lg font-black shadow-sm">⏳ Prueba (${quedan} d)</span>`;
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
        listUI.innerHTML = `<div class="text-xs text-rose-500 text-center py-4 font-bold">Error al cargar historial.</div>`;
    }
}

// BOTONES DE ACCIÓN
window.copiarDato = (tipo) => {
    const codigo = document.getElementById('partnerCodigoUI').innerText;
    let texto = (tipo === 'codigo') ? codigo : `https://imperialempy-collab.github.io/Ahorro.Challenge/activar.html?ref=${codigo}`;
    
    navigator.clipboard.writeText(texto).then(() => {
        window.mostrarAlerta("¡Copiado al portapapeles! 📄");
    });
};

window.compartirWhatsApp = () => {
    const codigo = document.getElementById('partnerCodigoUI').innerText;
    const urlApp = `https://imperialempy-collab.github.io/Ahorro.Challenge/activar.html?ref=${codigo}`;
    const texto = `¡Te regalo un descuento exclusivo! 🎁\n\nDescargá la app que uso para organizar mi dinero y activá tu cuenta con un descuento especial usando mi link:\n\n👉 ${urlApp}\n\nO ingresá este código al pagar: *${codigo}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
};
