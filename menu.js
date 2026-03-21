class AppSidebar extends HTMLElement {
    connectedCallback() {
        const basePath = this.getAttribute('base-path') || '';
        
        // El HTML del Menú
        this.innerHTML = `
        <div id="sidebarOverlay" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] hidden transition-opacity" onclick="window.toggleSidebar()"></div>
        <div id="sidebar" class="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl transform -translate-x-full transition-transform duration-300 z-[100] flex flex-col border-r border-slate-100">
            <div class="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div><h2 class="font-display font-black text-sm text-slate-400 uppercase tracking-widest">Cuenta</h2><p id="sidebarUserEmail" class="text-xs text-slate-800 font-bold truncate max-w-[150px]">Cargando...</p></div>
                <div class="flex items-center gap-2">
                    <button onclick="if(window.sincronizarNube) window.sincronizarNube(true)" class="relative p-1.5 bg-white rounded-full text-slate-400 shadow-sm border border-slate-200 hover:text-primary transition-colors" title="Sincronización a la nube"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"></path></svg><span class="sync-dot absolute top-0 right-0 w-2 h-2 bg-emerald-500 border border-white rounded-full transition-colors"></span></button>
                    <button onclick="window.toggleSidebar()" class="text-slate-400 hover:text-rose-500 bg-white p-1 rounded-lg border border-slate-200"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                </div>
            </div>
            
            <div class="flex-grow p-4 space-y-2 overflow-y-auto">
                <a href="${basePath}index.html" class="menu-link flex items-center gap-3 w-full p-3 rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg>Ahorro Challenge</a>
                <a href="${basePath}retos/retos.html" class="menu-link flex items-center gap-3 w-full p-3 rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>Retos en Equipo</a>
                <a href="${basePath}macro-gestion/macro-gestion.html" class="menu-link flex items-center gap-3 w-full p-3 rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>Macro Gestión</a>
                <a href="${basePath}arcade/index.html" class="menu-link flex items-center gap-3 w-full p-3 rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>Gimnasio Financiero</a>
                
                <hr class="border-slate-100 my-4">
                
                <button id="btnSidebarPagar" onclick="window.location.href='${basePath}activar.html'" class="w-full p-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors shadow-md">Activar Acceso Ilimitado 👑</button>
                <button id="btnSidebarPartner" onclick="window.checkPartnerAccess('${basePath}')" class="w-full p-3 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors items-center gap-3 mb-2 flex"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>Programa Partner</button>
            </div>
            
            <div class="p-4 border-t border-slate-100 bg-slate-50"><button onclick="if(window.logout) window.logout();" class="flex items-center justify-center gap-2 w-full p-3 rounded-xl text-rose-500 hover:bg-rose-50 font-bold transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>Cerrar Sesión</button></div>
        </div>
        `;

        // 1. Resaltar la página activa en verde
        const currentPath = window.location.pathname;
        this.querySelectorAll('.menu-link').forEach(link => {
            const href = link.getAttribute('href').replace('../', '');
            if(currentPath.includes(href) && href !== '') {
                link.classList.replace('text-slate-600', 'text-primary');
                link.classList.replace('hover:bg-slate-50', 'bg-emerald-50');
            }
        });

        // 2. Colocar el email desde la memoria al instante
        const email = localStorage.getItem('local_user_email');
        if (email) this.querySelector('#sidebarUserEmail').innerText = email;

        // 3. Pintar botones de Pago/VIP según estado local
        this.actualizarUI();
    }

    actualizarUI() {
        const status = localStorage.getItem('local_user_status') || 'prueba';
        const btnPagar = this.querySelector('#btnSidebarPagar');
        const basePath = this.getAttribute('base-path') || '';

        if(status === 'pagado') {
            if(btnPagar) { btnPagar.innerHTML = '<span class="text-emerald-500 font-black">Acceso Ilimitado 👑</span>'; btnPagar.onclick = null; btnPagar.classList.replace('bg-slate-900', 'bg-emerald-50'); btnPagar.classList.replace('text-white', 'text-emerald-700'); btnPagar.classList.remove('shadow-md'); }
        } else if (status === 'pendiente') {
            if(btnPagar) { btnPagar.innerHTML = 'Ver mi Comprobante ⏳'; btnPagar.onclick = () => window.location.href = basePath + 'activar.html'; btnPagar.classList.replace('bg-slate-900', 'bg-amber-100'); btnPagar.classList.replace('text-white', 'text-amber-700'); }
        } else {
            if(btnPagar) { btnPagar.innerHTML = 'Activar Acceso Ilimitado 👑'; btnPagar.onclick = () => window.location.href = basePath + 'activar.html'; }
        }
    }
}
customElements.define('app-sidebar', AppSidebar);

// Funciones globales vinculadas al Menú Maestro
window.toggleSidebar = () => { 
    const sb = document.querySelector('app-sidebar').querySelector('#sidebar'); 
    const ov = document.querySelector('app-sidebar').querySelector('#sidebarOverlay'); 
    if(sb && ov) { 
        if(sb.classList.contains('-translate-x-full')) { 
            sb.classList.remove('-translate-x-full'); ov.classList.remove('hidden'); 
        } else { 
            sb.classList.add('-translate-x-full'); ov.classList.add('hidden'); 
        } 
    } 
};

window.checkPartnerAccess = (basePath) => {
    const status = localStorage.getItem('local_user_status');
    if(status === 'pagado') {
        window.location.href = basePath + 'partner/partner.html';
    } else {
        alert("Esta zona es exclusiva para miembros con Acceso Ilimitado. ¡Activá el tuyo para ser partner!");
        window.location.href = basePath + 'activar.html';
    }
};
