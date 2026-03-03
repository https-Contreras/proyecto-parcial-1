// ====== REFERENCIAS AL DOM ======
const mainScreen = document.querySelector('main');
const appContainer = document.getElementById('app-container');
const btnIniciar = document.getElementById('btn-iniciar');

// Elementos del Paso 1 (Organizador)
const step1 = document.getElementById('step-1');
const step2 = document.getElementById('step-2');
const btnNext1 = document.getElementById('btn-next-1');
const orgNombreInput = document.getElementById('organizador-nombre');
const orgParticipaInput = document.getElementById('organizador-participa');

// ====== ESTADO DE LA APLICACIÓN ======
// Este objeto guardará toda la info antes de mandarla al localStorage
let datosSorteo = {
    organizador: '',
    organizadorParticipa: true,
    participantes: [],
    exclusiones: {},
    evento: {
        motivo: '',
        fecha: '',
        presupuesto: ''
    }
};

// ====== EVENTOS ======

// 1. Iniciar Sorteo (Oculta portada, muestra formulario)
btnIniciar.addEventListener('click', () => {
    mainScreen.classList.add('hidden');
    appContainer.classList.remove('hidden');
});

// 2. Guardar Organizador y pasar al Paso 2
btnNext1.addEventListener('click', () => {
    const nombre = orgNombreInput.value.trim();
    
    // Validación con SweetAlert
    if (!nombre) {
        Swal.fire({
            icon: 'warning',
            title: 'Falta tu nombre',
            text: 'Por favor, ingresa tu nombre para organizar el intercambio.',
            confirmButtonText: 'Entendido',
            showClass: { popup: 'swal2-show' },
            hideClass: { popup: 'swal2-hide' }
        });
        return; // ¡ESTE RETURN ES LA CLAVE PARA QUE SE DETENGA Y NO AVANCE!
    }

    // Actualizamos nuestro objeto de estado
    datosSorteo.organizador = nombre;
    datosSorteo.organizadorParticipa = orgParticipaInput.checked;

    // Lógica para que el organizador participe (y evitar que se duplique si regresas de pantalla)
    if (datosSorteo.organizadorParticipa) {
        if (!datosSorteo.participantes.includes(nombre)) {
            datosSorteo.participantes.unshift(nombre); // unshift lo pone al inicio de la lista
        }
    } else {
        // Si se arrepiente y desmarca la casilla, lo sacamos de la lista
        datosSorteo.participantes = datosSorteo.participantes.filter(p => p !== nombre);
    }

    // ¡REQUISITO CLAVE! Guardamos el objeto en el localStorage 
    localStorage.setItem('datosSorteo', JSON.stringify(datosSorteo));

    // Renderizamos la lista de participantes y avanzamos de pantalla
    renderizarParticipantes();
    step1.classList.add('hidden');
    step2.classList.remove('hidden');
});
// ====== REFERENCIAS DEL PASO 2 ======
const inputNuevoParticipante = document.getElementById('nuevo-participante');
const btnAddParticipante = document.getElementById('btn-add-participante');
const listaParticipantesDOM = document.getElementById('lista-participantes');
const btnNext2 = document.getElementById('btn-next-2');
const btnBack2 = document.getElementById('btn-back-2');
const step3 = document.getElementById('step-3'); 

// ====== LÓGICA DEL PASO 2 ======

// Función que dibuja la lista de participantes en el HTML
// ====== LÓGICA DEL PASO 2 ======

// Variable para saber qué elemento estamos arrastrando
let draggedItemIndex = null;

// Función que dibuja la lista de participantes y configura el Drag and Drop
function renderizarParticipantes() {
    // Limpiamos el contenedor
    listaParticipantesDOM.innerHTML = '';
    
    // Recorremos el arreglo y creamos un elemento visual por cada uno
    datosSorteo.participantes.forEach((nombre, index) => {
        const div = document.createElement('div');
        
        // ¡Magia de Drag and Drop! Le decimos que es arrastrable y guardamos su índice
        div.draggable = true;
        div.dataset.index = index;
        
        // Clases de Tailwind (agregamos cursor-move para que salga la "manita" de arrastrar)
        div.className = 'flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200 cursor-move transition-all duration-200';
        
        // Le agregamos un iconito de "hamburguesa" (3 rayitas) para indicar que se puede arrastrar
        div.innerHTML = `
            <div class="flex items-center gap-3 pointer-events-none">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
                <span class="font-medium text-gray-700">${nombre}</span>
            </div>
            <button onclick="eliminarParticipante(${index})" class="text-gray-400 hover:text-red-500 font-bold px-3 text-lg transition-colors cursor-pointer">&times;</button>
        `;

        // === EVENTOS DEL DRAG AND DROP ===

        // 1. Cuando empezamos a arrastrar
        div.addEventListener('dragstart', function(e) {
            draggedItemIndex = Number(this.dataset.index);
            e.dataTransfer.effectAllowed = 'move';
            // Retraso mínimo para que la copia visual se genere bien antes de volver transparente el original
            setTimeout(() => this.classList.add('opacity-40', 'border-violet-400'), 0);
        });

        // 2. Cuando arrastramos por encima de otro elemento (necesario para permitir soltar)
        div.addEventListener('dragover', function(e) {
            e.preventDefault(); 
            e.dataTransfer.dropEffect = 'move';
            return false;
        });

        // 3. Cuando entramos al área de otro elemento (efecto visual de dónde va a caer)
        div.addEventListener('dragenter', function(e) {
            e.preventDefault();
            if (Number(this.dataset.index) !== draggedItemIndex) {
                this.classList.add('border-violet-500', 'bg-violet-100', 'scale-105');
            }
        });

        // 4. Cuando salimos del área de ese elemento (quitamos el efecto visual)
        div.addEventListener('dragleave', function(e) {
            this.classList.remove('border-violet-500', 'bg-violet-100', 'scale-105');
        });

        // 5. ¡Cuando lo soltamos! Aquí hacemos el cambio en el arreglo
        div.addEventListener('drop', function(e) {
            e.stopPropagation();
            const dropIndex = Number(this.dataset.index);

            // Si lo soltamos en una posición diferente a la original
            if (draggedItemIndex !== dropIndex && draggedItemIndex !== null) {
                // Sacamos el nombre de la posición vieja y lo metemos en la nueva
                const draggedName = datosSorteo.participantes.splice(draggedItemIndex, 1)[0];
                datosSorteo.participantes.splice(dropIndex, 0, draggedName);
                
                // Volvemos a dibujar la lista con el nuevo orden
                renderizarParticipantes();
            }
            return false;
        });

        // 6. Cuando terminamos de arrastrar (limpiamos todos los estilos)
        div.addEventListener('dragend', function(e) {
            this.classList.remove('opacity-40', 'border-violet-400');
            const items = listaParticipantesDOM.querySelectorAll('div');
            items.forEach(item => item.classList.remove('border-violet-500', 'bg-violet-100', 'scale-105'));
            draggedItemIndex = null;
        });

        // Metemos el div al contenedor HTML
        listaParticipantesDOM.appendChild(div);
    });

    // Guardamos la lista actualizada (y reordenada) en el localStorage
    localStorage.setItem('datosSorteo', JSON.stringify(datosSorteo));
}

// Función para agregar un nombre al arreglo
function agregarParticipante() {
    const nombre = inputNuevoParticipante.value.trim();
    
    if (nombre === '') return; // No agregamos vacíos
    
    // Evitamos nombres duplicados para no romper la lógica del sorteo después
    if (datosSorteo.participantes.includes(nombre)) {
        Swal.fire({
            icon: 'error',
            title: 'Nombre duplicado',
            text: 'Ese nombre ya está en la lista. Agrega una inicial o apellido para diferenciarlo.',
            confirmButtonText: 'Entendido',
            showClass: { popup: 'swal2-show' },
            hideClass: { popup: 'swal2-hide' }
        });
        return;
    }

    datosSorteo.participantes.push(nombre); // Lo metemos al arreglo 
    inputNuevoParticipante.value = ''; // Limpiamos el input
    renderizarParticipantes(); // Actualizamos la vista
    inputNuevoParticipante.focus(); // Regresamos el cursor al input por comodidad
}

// Función para eliminar un nombre (la declaramos global en window para que funcione el onclick del HTML)
window.eliminarParticipante = function(index) {
    datosSorteo.participantes.splice(index, 1); // Lo sacamos del arreglo
    renderizarParticipantes(); // Actualizamos la vista
};

// Eventos de los botones de agregar
btnAddParticipante.addEventListener('click', agregarParticipante);
inputNuevoParticipante.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') agregarParticipante(); // Permitir agregar presionando Enter
});

// Evento para regresar al paso 1
btnBack2.addEventListener('click', () => {
    step2.classList.add('hidden');
    step1.classList.remove('hidden');
});

// Evento para avanzar al paso 3
btnNext2.addEventListener('click', () => {
    // Validación: Un intercambio necesita al menos 3 personas para tener sentido
    if (datosSorteo.participantes.length < 3) {
        Swal.fire({
            icon: 'info',
            title: 'Faltan participantes',
            text: 'Agrega al menos 3 participantes para poder realizar el sorteo.',
            confirmButtonText: 'Entendido',
            showClass: { popup: 'swal2-show' },
            hideClass: { popup: 'swal2-hide' }
        });
        return;
    }
    
    step2.classList.add('hidden');
    step3.classList.remove('hidden');
});


// ====== REFERENCIAS DEL PASO 3 ======
const btnNoExclusiones = document.getElementById('btn-no-exclusiones');
const btnSiExclusiones = document.getElementById('btn-si-exclusiones');
const panelExclusiones = document.getElementById('panel-exclusiones');
const listaParaExcluirDOM = document.getElementById('lista-para-excluir');
const btnBack3 = document.getElementById('btn-back-3');
const btnNext3 = document.getElementById('btn-next-3');
const step4 = document.getElementById('step-4');

// ====== LÓGICA DEL PASO 3 ======

// Función para dibujar la lista de personas y sus posibles exclusiones
function renderizarPanelExclusiones() {
    listaParaExcluirDOM.innerHTML = '';
    
    // Inicializamos el objeto de exclusiones si no existe
    if (!datosSorteo.exclusiones) datosSorteo.exclusiones = {};

    datosSorteo.participantes.forEach(participante => {
        // Aseguramos que cada participante tenga su array de exclusiones
        if (!datosSorteo.exclusiones[participante]) {
            datosSorteo.exclusiones[participante] = [];
        }

        const div = document.createElement('div');
        div.className = 'bg-white border border-gray-200 rounded-lg overflow-hidden';
        
        // Creamos un botón tipo "Acordeón" para cada participante
        let htmlContent = `
            <button class="w-full text-left font-bold text-gray-700 bg-gray-50 p-3 hover:bg-gray-100 focus:outline-none flex justify-between items-center" onclick="toggleExclusionMenu('${participante}')">
                ${participante} no le regala a...
                <span class="text-xs bg-violet-100 text-violet-800 py-1 px-2 rounded-full" id="badge-${participante}">${datosSorteo.exclusiones[participante].length}</span>
            </button>
            <div id="menu-${participante}" class="hidden p-3 border-t border-gray-200 space-y-2 bg-white">
        `;

        // Llenamos las opciones (todos menos él mismo)
        datosSorteo.participantes.forEach(posibleExcluido => {
            if (participante !== posibleExcluido) {
                const isChecked = datosSorteo.exclusiones[participante].includes(posibleExcluido) ? 'checked' : '';
                htmlContent += `
                    <label class="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                        <input type="checkbox" class="w-4 h-4 text-violet-600 rounded" 
                            onchange="actualizarExclusion('${participante}', '${posibleExcluido}', this.checked)" ${isChecked}>
                        <span class="text-gray-600">${posibleExcluido}</span>
                    </label>
                `;
            }
        });

        htmlContent += `</div>`;
        div.innerHTML = htmlContent;
        listaParaExcluirDOM.appendChild(div);
    });
}

// Funciones globales para que funcionen los onclicks del HTML generado
window.toggleExclusionMenu = function(participante) {
    const menu = document.getElementById(`menu-${participante}`);
    menu.classList.toggle('hidden');
}

window.actualizarExclusion = function(quienRegala, quienRecibe, isChecked) {
    if (isChecked) {
        datosSorteo.exclusiones[quienRegala].push(quienRecibe);
    } else {
        datosSorteo.exclusiones[quienRegala] = datosSorteo.exclusiones[quienRegala].filter(p => p !== quienRecibe);
    }
    
    // Actualizamos el badge visual (el numerito)
    document.getElementById(`badge-${quienRegala}`).innerText = datosSorteo.exclusiones[quienRegala].length;
    
    // Guardamos en LocalStorage
    localStorage.setItem('datosSorteo', JSON.stringify(datosSorteo));
}

// Mostrar/Ocultar el panel
btnSiExclusiones.addEventListener('click', () => {
    panelExclusiones.classList.remove('hidden');
    btnSiExclusiones.classList.add('bg-violet-50'); // Resaltar el botón activo
    btnNoExclusiones.classList.remove('bg-gray-200');
    renderizarPanelExclusiones();
});

btnNoExclusiones.addEventListener('click', () => {
    panelExclusiones.classList.add('hidden');
    // Limpiamos las exclusiones por si se arrepintió
    datosSorteo.exclusiones = {};
    localStorage.setItem('datosSorteo', JSON.stringify(datosSorteo));
});

// Navegación
btnBack3.addEventListener('click', () => {
    step3.classList.add('hidden');
    step2.classList.remove('hidden');
});

btnNext3.addEventListener('click', () => {
    step3.classList.add('hidden');
    step4.classList.remove('hidden');
});

// ====== REFERENCIAS DEL PASO 4 ======
const botonesMotivo = document.querySelectorAll('.btn-motivo');
const inputMotivoPersonalizado = document.getElementById('motivo-personalizado');
const inputFecha = document.getElementById('fecha-evento');
const botonesPresupuesto = document.querySelectorAll('.btn-presupuesto');
const inputPresupuestoPersonalizado = document.getElementById('presupuesto-personalizado');
const btnBack4 = document.getElementById('btn-back-4');
const btnNext4 = document.getElementById('btn-next-4');
const step5 = document.getElementById('step-5');

// Variables para guardar la selección temporal
let seleccionMotivo = '';
let seleccionPresupuesto = '';

// ====== LÓGICA DEL PASO 4 ======

// Manejo de botones de Motivo
botonesMotivo.forEach(btn => {
    btn.addEventListener('click', () => {
        // Quitar estilos activos de todos
        botonesMotivo.forEach(b => {
            b.classList.remove('bg-violet-100', 'border-violet-500', 'text-violet-700');
            b.classList.add('bg-gray-100', 'border-transparent');
        });
        
        // Poner estilo activo al clickeado
        btn.classList.remove('bg-gray-100', 'border-transparent');
        btn.classList.add('bg-violet-100', 'border-violet-500', 'text-violet-700');
        
        seleccionMotivo = btn.getAttribute('data-value');
        
        // Mostrar u ocultar el input personalizado
        if (seleccionMotivo === 'Otro') {
            inputMotivoPersonalizado.classList.remove('hidden');
        } else {
            inputMotivoPersonalizado.classList.add('hidden');
        }
    });
});

// Manejo de botones de Presupuesto
botonesPresupuesto.forEach(btn => {
    btn.addEventListener('click', () => {
        // Quitar estilos activos de todos
        botonesPresupuesto.forEach(b => {
            b.classList.remove('bg-violet-100', 'border-violet-500', 'text-violet-700');
            b.classList.add('bg-gray-100', 'border-transparent');
        });
        
        // Poner estilo activo al clickeado
        btn.classList.remove('bg-gray-100', 'border-transparent');
        btn.classList.add('bg-violet-100', 'border-violet-500', 'text-violet-700');
        
        seleccionPresupuesto = btn.getAttribute('data-value');
        
        // Mostrar u ocultar el input personalizado
        if (seleccionPresupuesto === 'Otro') {
            inputPresupuestoPersonalizado.classList.remove('hidden');
        } else {
            inputPresupuestoPersonalizado.classList.add('hidden');
        }
    });
});

// Navegación
btnBack4.addEventListener('click', () => {
    document.getElementById('step-4').classList.add('hidden');
    document.getElementById('step-3').classList.remove('hidden');
});

// Finalizar captura y validar
btnNext4.addEventListener('click', () => {
    // 1. Validar Motivo
    let motivoFinal = seleccionMotivo;
    if (seleccionMotivo === 'Otro') {
        motivoFinal = inputMotivoPersonalizado.value.trim();
    }
    if (!motivoFinal) {
        Swal.fire({ icon: 'warning', title: 'Falta el motivo', text: 'Selecciona o escribe el motivo del intercambio.', confirmButtonColor: '#7c3aed' });
        return;
    }

    // 2. Validar Fecha
    const fechaFinal = inputFecha.value;
    if (!fechaFinal) {
        Swal.fire({ icon: 'warning', title: 'Falta la fecha', text: 'Por favor, elige la fecha en la que se entregarán los regalos.', confirmButtonColor: '#7c3aed' });
        return;
    }

    // 3. Validar Presupuesto
    let presupuestoFinal = seleccionPresupuesto;
    if (seleccionPresupuesto === 'Otro') {
        presupuestoFinal = inputPresupuestoPersonalizado.value.trim();
    }
    if (!presupuestoFinal) {
        Swal.fire({ icon: 'warning', title: 'Falta el presupuesto', text: 'Selecciona o escribe cuánto se debería gastar.', confirmButtonColor: '#7c3aed' });
        return;
    }

    // Guardar todo en nuestro objeto principal
    datosSorteo.evento = {
        motivo: motivoFinal,
        fecha: fechaFinal,
        presupuesto: presupuestoFinal
    };

    // ¡Guardamos la versión final en el LocalStorage!
    localStorage.setItem('datosSorteo', JSON.stringify(datosSorteo));

    // Cambiar a la última pantalla
    document.getElementById('step-4').classList.add('hidden');
    step5.classList.remove('hidden');
    
    // Aquí mandaremos a llamar a la función para pintar el resumen (la haremos en el siguiente paso)
    renderizarResumen(); 
});

// ====== REFERENCIAS DEL PASO 5 ======
const resOrganizador = document.getElementById('res-organizador');
const resMotivo = document.getElementById('res-motivo');
const resFecha = document.getElementById('res-fecha');
const resPresupuesto = document.getElementById('res-presupuesto');
const resParticipantes = document.getElementById('res-participantes');
const resTotalPart = document.getElementById('res-total-part');
const resExclusiones = document.getElementById('res-exclusiones');

const btnHacerSorteo = document.getElementById('btn-hacer-sorteo');
const panelResultados = document.getElementById('panel-resultados');
const listaResultadosDOM = document.getElementById('lista-resultados');
const btnReiniciar = document.getElementById('btn-reiniciar');
const btnBack5 = document.getElementById('btn-back-5');
const accionesPreSorteo = document.getElementById('acciones-pre-sorteo');
// ====== LÓGICA DEL PASO 5 ======

// 1. Función para leer de LocalStorage y pintar el resumen
window.renderizarResumen = function() {
    // REQUISITO: Leer de localstorage (No de datos en memoria RAM)
    const datosGuardados = JSON.parse(localStorage.getItem('datosSorteo'));
    
    if (!datosGuardados) return; // Por seguridad

    resOrganizador.innerText = datosGuardados.organizador;
    resMotivo.innerText = datosGuardados.evento.motivo;
    resFecha.innerText = datosGuardados.evento.fecha;
    resPresupuesto.innerText = datosGuardados.evento.presupuesto;
    resTotalPart.innerText = datosGuardados.participantes.length;

    // Pintar participantes como etiquetas (badges)
    resParticipantes.innerHTML = '';
    datosGuardados.participantes.forEach(p => {
        resParticipantes.innerHTML += `<span class="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm font-medium shadow-sm">${p}</span>`;
    });

    // Pintar exclusiones
    resExclusiones.innerHTML = '';
    let hayExclusiones = false;
    for (const [quienRegala, excluidos] of Object.entries(datosGuardados.exclusiones)) {
        if (excluidos.length > 0) {
            hayExclusiones = true;
            resExclusiones.innerHTML += `<li><strong>${quienRegala}</strong> no le regala a: ${excluidos.join(', ')}</li>`;
        }
    }
    if (!hayExclusiones) {
        resExclusiones.innerHTML = `<li class="text-gray-400 italic">No hay exclusiones configuradas.</li>`;
    }
}

// Para que se ejecute cuando pasemos del Paso 4 al Paso 5, busca en tu evento btnNext4.addEventListener 
// la línea comentada // renderizarResumen(); y quítale las diagonales para activarla.

// 2. Algoritmo del Sorteo
function generarParesSorteo(participantes, exclusiones) {
    let intentos = 0;
    const maxIntentos = 2000; // Límite para evitar un ciclo infinito si es matemáticamente imposible

    while (intentos < maxIntentos) {
        // Clonamos el arreglo para desordenarlo
        let receptores = [...participantes];
        
        // Mezclamos el arreglo aleatoriamente (Shuffle)
        receptores.sort(() => Math.random() - 0.5);

        let esValido = true;
        let resultados = [];

        for (let i = 0; i < participantes.length; i++) {
            let dador = participantes[i];
            let receptor = receptores[i];

            // Regla 1: No me puedo regalar a mí mismo
            if (dador === receptor) {
                esValido = false;
                break;
            }

            // Regla 2: Respetar exclusiones
            if (exclusiones && exclusiones[dador] && exclusiones[dador].includes(receptor)) {
                esValido = false;
                break;
            }

            // Si pasa las reglas, guardamos el par
            resultados.push({ dador, receptor });
        }

        // Si todos pasaron las reglas, tenemos un sorteo exitoso
        if (esValido) {
            return resultados;
        }

        intentos++; // Si falló, lo intentamos de nuevo
    }

    return null; // Si llegó a 2000 intentos y no pudo, es imposible con esas exclusiones
}


// Navegación para regresar al Paso 4
btnBack5.addEventListener('click', () => {
    document.getElementById('step-5').classList.add('hidden');
    document.getElementById('step-4').classList.remove('hidden');
});

// 3. Evento de Hacer el Sorteo
btnHacerSorteo.addEventListener('click', () => {
    // Volvemos a leer del localStorage para asegurar que usamos los datos más recientes
    const datos = JSON.parse(localStorage.getItem('datosSorteo'));
    
    // Mostramos un efecto de carga con SweetAlert2 para darle emoción
    Swal.fire({
        title: 'Mezclando nombres...',
        html: 'Preparando el sorteo perfecto 🎲',
        timer: 2000,
        timerProgressBar: true,
        didOpen: () => {
            Swal.showLoading();
        }
    }).then(() => {
        // Ejecutamos el algoritmo
        const pares = generarParesSorteo(datos.participantes, datos.exclusiones);

        if (!pares) {
            Swal.fire('¡Error!', 'Es imposible hacer el sorteo con tantas exclusiones cruzadas. Por favor, elimina algunas exclusiones y vuelve a intentarlo.', 'error');
            return;
        }

        // Si fue exitoso, guardamos los resultados en localStorage
        datos.resultados = pares;
        localStorage.setItem('datosSorteo', JSON.stringify(datos));

        // Ocultamos el botón principal, mostramos los resultados y el botón de reinicio
        accionesPreSorteo.classList.add('hidden');
        panelResultados.classList.remove('hidden');
        btnReiniciar.classList.remove('hidden');

        // Pintamos los resultados en el HTML
        listaResultadosDOM.innerHTML = '';
        pares.forEach((par, index) => {
            setTimeout(() => {
                const div = document.createElement('div');
                div.className = 'flex justify-between items-center bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-xl shadow-sm animate-fade-in-up';
                div.innerHTML = `
                    <div class="flex items-center gap-3">
                        <span class="bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-sm">${index + 1}</span>
                        <span class="font-bold text-gray-800 text-lg">${par.dador}</span>
                    </div>
                    <div class="text-amber-600 font-bold mx-2">→ regala a →</div>
                    <div class="font-bold text-gray-800 text-lg">${par.receptor}</div>
                `;
                listaResultadosDOM.appendChild(div);
            }, index * 300); // Pequeño retraso escalonado para que aparezcan uno por uno (efecto visual)
        });
    });
});

// Evento para reiniciar todo
btnReiniciar.addEventListener('click', () => {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "Se borrarán todos los datos y empezarás un nuevo intercambio.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#7c3aed',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, empezar de nuevo',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('datosSorteo'); // Limpiamos la memoria
            location.reload(); // Recargamos la página para volver al inicio
        }
    });
});


// ====== INICIALIZACIÓN (MANTENER SESIÓN AL RECARGAR) ======
window.addEventListener('DOMContentLoaded', () => {
    // 1. Buscamos si hay datos guardados de una sesión anterior
    const datosGuardados = localStorage.getItem('datosSorteo');
    
    if (datosGuardados) {
        // 2. Restauramos nuestra variable global con los datos guardados
        datosSorteo = JSON.parse(datosGuardados);
        
        // 3. Restauramos los datos en los inputs del Paso 1
        if (datosSorteo.organizador) {
            orgNombreInput.value = datosSorteo.organizador;
            orgParticipaInput.checked = datosSorteo.organizadorParticipa;
        }

        // 4. Lógica para saltar a la pantalla correcta según el avance
        
        // CASO A: Ya se había hecho el sorteo -> Vamos a los Resultados
        if (datosSorteo.resultados && datosSorteo.resultados.length > 0) {
            mainScreen.classList.add('hidden');
            appContainer.classList.remove('hidden');
            step1.classList.add('hidden');
            document.getElementById('step-5').classList.remove('hidden');
            
            renderizarResumen();
            
            // Ocultamos el botón de sortear y mostramos los resultados directamente
            btnHacerSorteo.classList.add('hidden');
            panelResultados.classList.remove('hidden');
            btnReiniciar.classList.remove('hidden');
            
            listaResultadosDOM.innerHTML = '';
            datosSorteo.resultados.forEach((par, index) => {
                const div = document.createElement('div');
                div.className = 'flex justify-between items-center bg-green-50 border border-green-200 p-4 rounded-xl shadow-sm';
                div.innerHTML = `
                    <div class="flex items-center gap-3">
                        <span class="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">${index + 1}</span>
                        <span class="font-bold text-gray-800 text-lg">${par.dador}</span>
                    </div>
                    <div class="text-green-600 font-bold mx-2">👉 regala a 👉</div>
                    <div class="font-bold text-gray-800 text-lg">${par.receptor}</div>
                `;
                listaResultadosDOM.appendChild(div);
            });
        } 
        // CASO B: Ya había configurado la fecha del evento -> Vamos al Resumen (Paso 5)
        else if (datosSorteo.evento && datosSorteo.evento.fecha) {
            mainScreen.classList.add('hidden');
            appContainer.classList.remove('hidden');
            step1.classList.add('hidden');
            document.getElementById('step-5').classList.remove('hidden');
            renderizarResumen();
        }
        // CASO C: Ya tenía participantes agregados -> Vamos a la lista (Paso 2)
        else if (datosSorteo.participantes && datosSorteo.participantes.length > 0) {
            mainScreen.classList.add('hidden');
            appContainer.classList.remove('hidden');
            step1.classList.add('hidden');
            step2.classList.remove('hidden');
            renderizarParticipantes();
        }
    }
});

