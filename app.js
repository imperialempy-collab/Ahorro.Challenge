// --- OPTIMISTIC UI: CARGA INSTANTÁNEA ---
// Antes de que Firebase siquiera responda, leemos la memoria local
const localStatus = localStorage.getItem('local_user_status');
const localEmail = localStorage.getItem('local_user_email');
if (localEmail && localStatus) {
    document.getElementById('loginScreen').classList.add('hidden'); 
    document.getElementById('appContent').classList.remove('hidden');
    
    // Regla: 1 vez al día para avisos de prueba
    if (localStatus === 'prueba') {
        const hoy = new Date().toLocaleDateString('es-PY');
        const ultimaAlerta = localStorage.getItem('last_prueba_alert');
        if (ultimaAlerta !== hoy) {
            const diffDays = localStorage.getItem('local_prueba_dias') || '1';
            window.mostrarAlerta(`🎁 Estás en tu día ${diffDays} de 7 de prueba gratis.`);
            localStorage.setItem('last_prueba_alert', hoy);
        }
    } else if (localStatus === 'vencido' || localStatus === 'rechazado') {
        window.location.href = 'activar.html';
    }
    
    window.initApp(); // Inicia la app al instante con datos locales
}

// --- VERIFICACIÓN SILENCIOSA EN LA NUBE ---
onAuthStateChanged(auth, async (user) => {
    const loginScreen = document.getElementById('loginScreen'); 
    const appContent = document.getElementById('appContent'); 
    
    if (user) {
        localStorage.setItem('local_user_email', user.email);
        const sidebarEmail = document.querySelector('app-sidebar')?.querySelector('#sidebarUserEmail');
        if (sidebarEmail) sidebarEmail.innerText = user.email;

        try {
            const userRef = doc(db, "usuarios_multimeta", user.email);
            const docSnap = await getDoc(userRef);
            
            if (!docSnap.exists()) {
                await setDoc(userRef, { email: user.email, status: 'prueba', fechaInicio: new Date().toISOString() });
                localStorage.setItem('local_user_status', 'prueba');
                localStorage.setItem('local_prueba_dias', '1');
                if(!localStatus) location.reload(); // Solo recarga si era usuario nuevo sin memoria
            } else {
                const userData = docSnap.data(); 
                const dbStatus = userData.status || 'prueba'; 
                localStorage.setItem('local_user_status', dbStatus);
                
                // Calcula y guarda los días reales para el próximo aviso local
                const start = new Date(userData.fechaInicio || new Date()); 
                const now = new Date(); 
                const diffDays = Math.ceil(Math.abs(now - start) / (1000 * 60 * 60 * 24));
                localStorage.setItem('local_prueba_dias', diffDays.toString());

                // Actualizamos datos locales si están vacíos
                if (!localStorage.getItem('ahorro_dinamico_LAB_TEST_MULTIMETA') && userData.ahorro_data) {
                    localStorage.setItem('ahorro_dinamico_LAB_TEST_MULTIMETA', JSON.stringify(userData.ahorro_data)); 
                }

                // Actualizamos el menú por si cambió el estado
                const sidebar = document.querySelector('app-sidebar');
                if (sidebar) sidebar.actualizarUI();

                // Intervenciones de Seguridad de Nube
                if (dbStatus === 'vencido' || dbStatus === 'rechazado' || (dbStatus === 'prueba' && diffDays > 7)) { 
                    localStorage.setItem('local_user_status', 'vencido'); 
                    window.location.href = 'activar.html';
                } 
                
                // Si la memoria estaba vacía (login fresco), encendemos la app
                if(!localStatus) {
                    loginScreen.classList.add('hidden'); 
                    appContent.classList.remove('hidden'); 
                    window.initApp();
                }
            }
        } catch (error) { 
            console.error("Control en la sombra falló, operando con memoria local."); 
        }
    } else { 
        loginScreen.classList.remove('hidden'); 
        appContent.classList.add('hidden'); 
    }
});
