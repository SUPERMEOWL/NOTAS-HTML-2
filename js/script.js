import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { firebaseConfig } from './firebaseConfig.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const MATERIAS = ["Programación Estructurada", "Arquitectura de Hardware", "Introducción al Ingles", "Algebra y Estadisticas", "Base de Datos", "Lógica Matemática", "Fund. Analisis de Sistemas"];

const dashboard = document.getElementById('dashboard'), editor = document.getElementById('editor'), renderMaterias = document.getElementById('render-materias'), materiaTag = document.getElementById('current-materia-tag');
const inputId = document.getElementById('current-id'), inputTitulo = document.getElementById('note-title'), inputPistas = document.getElementById('t-pistas'), inputContenido = document.getElementById('t-contenido'), inputResumen = document.getElementById('t-resumen');

const limpiarID = (n) => n.toLowerCase().replace(/\s+/g, '-');

const toggleView = async (show = false) => {
    if (!show) await initApp();
    dashboard.style.display = show ? 'none' : 'flex';
    editor.style.display = show ? 'flex' : 'none';
};

const guardarNota = async () => {
    const materia = materiaTag.innerText.replace('MATERIA: ', '').trim();
    const data = { titulo: inputTitulo.value || "Sin Título", materia, pistas: inputPistas.value, contenido: inputContenido.value, resumen: inputResumen.value, updatedAt: new Date() };
    try {
        inputId.value ? await updateDoc(doc(db, "apuntes", inputId.value), data) : await addDoc(collection(db, "apuntes"), data);
        await toggleView(false);
    } catch (e) { console.error(e); }
};

window.eliminarNota = async (e, id) => {
    e.stopPropagation();
    if (confirm("¿Borrar apunte?")) {
        await deleteDoc(doc(db, "apuntes", id));
        await initApp();
    }
};

const initApp = async () => {
    renderMaterias.innerHTML = '';
    MATERIAS.forEach(m => {
        const id = limpiarID(m);
        const sec = document.createElement('section');
        sec.className = 'materia-section';
        sec.innerHTML = `<div class="materia-header"><span class="materia-title"> • ${m.toUpperCase()}</span></div>
                         <div class="carrusel" id="carrusel-${id}"><button class="btn-add-note" onclick="nuevaNota('${m}')">+</button></div>`;
        renderMaterias.appendChild(sec);
    });

    const snap = await getDocs(query(collection(db, "apuntes"), orderBy("updatedAt", "desc")));
    snap.forEach(d => {
        const n = d.data(), carrusel = document.getElementById(`carrusel-${limpiarID(n.materia)}`);
        if (!carrusel) return;
        const card = document.createElement('div');
        card.className = 'card-apunte';
        card.innerHTML = `<div class="card-header-flex"><strong>${n.titulo}</strong><button class="btn-delete" onclick="eliminarNota(event, '${d.id}')">🗑️</button></div>
                          <small><span>📅 ${n.updatedAt?.toDate ? n.updatedAt.toDate().toLocaleDateString() : 'Hoy'}</span></small>`;
        card.onclick = () => {
            Object.assign(inputId, {value: d.id}); Object.assign(inputTitulo, {value: n.titulo}); // etc...
            // O más simple como lo tenías, pero agrupado
            inputPistas.value = n.pistas; inputContenido.value = n.contenido; inputResumen.value = n.resumen;
            materiaTag.innerText = `MATERIA: ${n.materia}`;
            toggleView(true);
        };
        carrusel.appendChild(card);
    });
};

window.nuevaNota = (m) => {
    [inputId, inputTitulo, inputPistas, inputContenido, inputResumen].forEach(i => i.value = '');
    materiaTag.innerText = `MATERIA: ${m}`;
    toggleView(true);
};

document.getElementById('btn-back').onclick = () => toggleView(false);
document.getElementById('btn-save').onclick = guardarNota;
window.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 's' && editor.style.display === 'flex') { e.preventDefault(); guardarNota(); }});

initApp();