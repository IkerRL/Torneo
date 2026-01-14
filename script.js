let equipos = [];

// Vista previa de la portada
function previewBanner(event) {
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('banner-view').innerHTML = `<img src="${e.target.result}">`;
    }
    reader.readAsDataURL(event.target.files[0]);
}

function addTeam() {
    const input = document.getElementById('teamName');
    const name = input.value.trim().toUpperCase();
    if (name && !equipos.includes(name)) {
        equipos.push(name);
        actualizarLista();
        input.value = "";
    }
}

function actualizarLista() {
    const list = document.getElementById('teamsList');
    list.innerHTML = equipos.map(t => `<li class="team-capsule">${t}</li>`).join('');
    new Sortable(list, { group: { name: 'shared', pull: true, put: false }, animation: 150 });
    
    new Sortable(document.getElementById('trash-bin'), {
        group: 'shared',
        onAdd: function (evt) {
            const nombre = evt.item.innerText;
            equipos = equipos.filter(e => e !== nombre);
            evt.item.remove();
        }
    });
}

function generarFaseGrupos() {
    if (equipos.length < 2) return alert("Registra equipos");
    document.getElementById('setup-section').style.display = 'none';
    document.getElementById('groups-section').style.display = 'block';
    
    const container = document.getElementById('groups-container');
    container.innerHTML = "";
    const num = parseInt(document.getElementById('numGrupos').value);
    let mezclados = [...equipos].sort(() => Math.random() - 0.5);

    for (let i = 0; i < num; i++) {
        container.innerHTML += `
            <div class="grupo-box">
                <h3 style="color:var(--v-neon); margin:0 0 15px 0;">GRUPO ${String.fromCharCode(65+i)}</h3>
                <ul id="g-${i}" style="min-height:100px; list-style:none; padding:0;"></ul>
            </div>`;
        setTimeout(() => { new Sortable(document.getElementById(`g-${i}`), { group: 'shared', animation: 150 }); }, 10);
    }

    mezclados.forEach((name, i) => {
        const li = document.createElement('li');
        li.className = "team-capsule"; li.style.margin = "8px 0";
        li.innerText = name;
        document.getElementById(`g-${i % num}`).appendChild(li);
    });
}

// LÓGICA DE PURGA: Elimina al último de cada grupo
function generarBracketFinal() {
    const grupos = document.querySelectorAll('.grupo-box ul');
    let clasificados = [];

    grupos.forEach(ul => {
        const items = Array.from(ul.querySelectorAll('li'));
        if (items.length > 1) {
            // Eliminamos el último de la lista del grupo
            const ganadores = items.slice(0, -1);
            ganadores.forEach(el => clasificados.push(el.innerText));
        } else if (items.length === 1) {
            clasificados.push(items[0].innerText);
        }
    });

    if (clasificados.length < 2) return alert("No hay suficientes supervivientes");

    document.getElementById('groups-section').style.display = 'none';
    const bracket = document.getElementById('dynamic-bracket');
    bracket.innerHTML = "";

    const niveles = Math.ceil(Math.log2(clasificados.length));
    const capacidad = Math.pow(2, niveles);
    while (clasificados.length < capacidad) clasificados.push("TBD");

    const mitad = clasificados.length / 2;
    const listaL = clasificados.slice(0, mitad);
    const listaR = clasificados.slice(mitad).reverse();

    // Renderizar Lado Izquierdo
    for (let i = niveles; i > 1; i--) {
        bracket.appendChild(crearColumna(Math.pow(2, i)/2, `L-${i}`, `L-${i-1}`, "left-side", i === niveles ? listaL : null));
    }

    // Centro
    const centro = document.createElement('div');
    centro.className = "center-stage";
    centro.innerHTML = `<h2 style="color:gold;">GRAND FINAL</h2>`;
    centro.appendChild(crearColumna(2, "final", "campeon", "center-column", null));
    bracket.appendChild(centro);

    // Renderizar Lado Derecho
    for (let i = 2; i <= niveles; i++) {
        bracket.appendChild(crearColumna(Math.pow(2, i)/2, `R-${i}`, `R-${i-1}`, "right-side", i === niveles ? listaR : null));
    }

    document.getElementById('bracket-section').style.display = 'flex';
}

function crearColumna(count, id, target, side, data) {
    const col = document.createElement('div');
    col.className = `bracket-column ${side}`;
    col.dataset.colId = id; col.dataset.target = target;
    for (let i = 0; i < count; i++) {
        const div = document.createElement('div');
        div.className = "team-capsule" + (data && data[i] !== "TBD" ? "" : " empty");
        div.innerText = data ? data[i] : "TBD";
        div.onclick = function() { avanzar(this); };
        col.appendChild(div);
    }
    return col;
}

function avanzar(el) {
    if (el.innerText === "TBD" || el.classList.contains('empty')) return;
    const targetId = el.parentElement.dataset.target;

    if (targetId === "campeon") {
        document.getElementById('champion-box').innerText = el.innerText;
        document.getElementById('winner-overlay').style.display = 'flex';
        confetti({ particleCount: 300, spread: 100, origin: { y: 0.7 } });
        return;
    }

    const targetCol = document.querySelector(`[data-col-id="${targetId}"]`);
    const index = Array.from(el.parentElement.children).indexOf(el);
    const nextSlot = targetCol.querySelectorAll('.team-capsule')[Math.floor(index / 2)];
    nextSlot.innerText = el.innerText;
    nextSlot.classList.remove('empty');
}
