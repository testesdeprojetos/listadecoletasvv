
// ===== URLs da planilha do Google Sheets =====
const URL_MOTORISTAS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR3NUMEPqhTxi5kCMW6kDV4stJyqhMyni_mRTvGLEZHJJCO7BIJ0Hk_dcjljp9L_ZOwqy_XLxbuvg8m/gviz/tq?sheet=Motoristas&tq=select%20A";
const URL_AJUDANTES = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR3NUMEPqhTxi5kCMW6kDV4stJyqhMyni_mRTvGLEZHJJCO7BIJ0Hk_dcjljp9L_ZOwqy_XLxbuvg8m/gviz/tq?sheet=Ajudantes&tq=select%20A";

// ===== Variáveis globais =====
let motoristas = [];
let ajudantes = [];
let equipes = [];
let ajudanteSelecionado = null;

// ===== Tema =====
if (localStorage.getItem('theme')) {
  document.body.dataset.theme = localStorage.getItem('theme');
}
document.getElementById('toggleTheme').addEventListener('click', () => {
  const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = newTheme;
  localStorage.setItem('theme', newTheme);
});

// ===== Carregar dados da planilha =====
async function carregarLista(url) {
  const response = await fetch(url);
  const text = await response.text();
  const json = JSON.parse(text.substr(47).slice(0, -2));
  return json.table.rows.map(row => row.c[0]?.v).filter(Boolean);
}

async function carregarDados() {
  motoristas = await carregarLista(URL_MOTORISTAS);
  ajudantes = await carregarLista(URL_AJUDANTES);
  renderMotoristas();
  renderAjudantes();
}
carregarDados();

// ===== Renderização dinâmica =====
function renderMotoristas() {
  const select = document.getElementById('motorista');
  select.innerHTML = '';

  motoristas.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    select.appendChild(opt);
  });

  // Campo "Outro"
  const optOutro = document.createElement('option');
  optOutro.value = 'outro';
  optOutro.textContent = 'Outro';
  select.appendChild(optOutro);

  select.onchange = () => {
    document.getElementById('motoristaOutro').style.display = select.value === 'outro' ? 'block' : 'none';
  };
}

function renderAjudantes() {
  const div = document.getElementById('ajudantes');
  div.innerHTML = '';
  ajudantes.forEach(a => {
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" value="${a}"> ${a}`;
    div.appendChild(label);
    div.appendChild(document.createElement('br'));
  });

  // Campo "Outro"
  const outroHTML = `
    <label><input type="checkbox" id="ajudanteOutroCheck"> Outro</label><br>
    <input type="text" id="ajudanteOutroInput" placeholder="Nome do ajudante" style="display:none;">
  `;
  div.insertAdjacentHTML('beforeend', outroHTML);

  document.getElementById('ajudanteOutroCheck').addEventListener('change', (e) => {
    document.getElementById('ajudanteOutroInput').style.display = e.target.checked ? 'block' : 'none';
  });
}

// ===== Adicionar equipe =====
function addTeam() {
  const motoristaSelecionado = document.getElementById('motorista').value;
  const motoristaOutro = document.getElementById('motoristaOutro').value.trim();
  const motorista = motoristaSelecionado === 'outro' ? motoristaOutro : motoristaSelecionado;

  const ajudantesSelecionados = Array.from(document.querySelectorAll('#ajudantes input[type="checkbox"]:checked'))
    .map(el => el.value);

  const ajudanteOutroCheck = document.getElementById('ajudanteOutroCheck').checked;
  const ajudanteOutroNome = document.getElementById('ajudanteOutroInput').value.trim();
  if (ajudanteOutroCheck && ajudanteOutroNome) ajudantesSelecionados.push(ajudanteOutroNome);

  if (!motorista || ajudantesSelecionados.length === 0) {
    alert('Selecione um motorista e ao menos um ajudante.');
    return;
  }

  const usados = equipes.flatMap(eq => [eq.motorista, ...eq.ajudantes]);
  const todos = [motorista, ...ajudantesSelecionados];
  const duplicado = todos.find(p => usados.includes(p));
  if (duplicado) return alert(`Pessoa já usada: ${duplicado}`);

  equipes.push({ motorista, ajudantes: ajudantesSelecionados, empresas: [] });
  closeModal('teamModal');
  renderTeams();
  updateTeamSelect();
  saveToLocalStorage();
}

// ===== Renderizar equipes =====
function renderTeams() {
  const div = document.getElementById('teams');
  div.innerHTML = '';

  equipes.forEach((equipe, i) => {
    const container = document.createElement('div');
    container.className = 'team';

    const header = document.createElement('div');
    header.innerHTML = `
      <h3>${equipe.motorista} - ${equipe.ajudantes.join(' - ')}</h3>
      <button onclick="abrirTrocaVisual(${i})">Alterar Equipe</button>
      <button onclick="openConfirmDeleteModal(${i})">Excluir Equipe</button>
    `;

    const empresasDiv = document.createElement('div');
    empresasDiv.id = `empresas-${i}`;
    equipe.empresas.forEach((emp, j) => {
      const empresa = document.createElement('div');
      empresa.className = 'empresa';
      let texto = `- ${emp.nomeEmpresa}`;
      if (emp.volumes) texto += ` ${emp.volumes}VL`;
      if (emp.peso) texto += ` ${emp.peso}KG`;
      if (emp.observacao) texto += ` (${emp.observacao})`;
      empresa.innerHTML = `<p>${texto}</p><button onclick="deleteEmpresa(${i}, ${j})">Excluir</button>`;
      empresasDiv.appendChild(empresa);
    });

    container.appendChild(header);
    container.appendChild(empresasDiv);
    div.appendChild(container);
  });
}

// ===== Trocar ajudantes visualmente =====
function abrirTrocaVisual() {
  const modal = document.getElementById('trocarVisual');
  modal.innerHTML = '';
  equipes.forEach((equipe, index) => {
    const bloco = document.createElement('div');
    bloco.className = 'blocoEquipe';
    bloco.dataset.index = index;

    const titulo = document.createElement('h4');
    titulo.textContent = equipe.motorista;
    bloco.appendChild(titulo);

    equipe.ajudantes.forEach(aj => {
      const span = document.createElement('span');
      span.className = 'ajudante';
      span.textContent = aj;
      span.onclick = () => selecionarOuMoverAjudante(aj, index);
      bloco.appendChild(span);
    });

    modal.appendChild(bloco);
  });

  openModal('trocarModalVisual');
}

function selecionarOuMoverAjudante(nome, equipeIndex) {
  if (!ajudanteSelecionado) {
    ajudanteSelecionado = { nome, equipeIndex };
    document.querySelectorAll('.ajudante').forEach(el => {
      if (el.textContent === nome) el.style.opacity = 0.5;
    });
  } else {
    if (ajudanteSelecionado.nome === nome) return;
    const origem = ajudanteSelecionado.equipeIndex;
    const destino = equipeIndex;
    if (origem === destino) return;

    const aj = equipes[origem].ajudantes;
    equipes[origem].ajudantes = aj.filter(a => a !== ajudanteSelecionado.nome);
    equipes[destino].ajudantes.push(ajudanteSelecionado.nome);
    ajudanteSelecionado = null;

    closeModal('trocarModalVisual');
    renderTeams();
    saveToLocalStorage();
  }
}

// ===== Utilidades =====
function openModal(id) {
  document.getElementById(id).style.display = 'flex';
}
function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}
function openConfirmDeleteModal(i) {
  window.equipeToDeleteIndex = i;
  openModal('confirmDeleteModal');
}
function deleteEquipe() {
  equipes.splice(window.equipeToDeleteIndex, 1);
  closeModal('confirmDeleteModal');
  renderTeams();
  saveToLocalStorage();
}
function deleteEmpresa(i, j) {
  equipes[i].empresas.splice(j, 1);
  renderTeams();
  saveToLocalStorage();
}
function updateTeamSelect() {
  const sel = document.getElementById('teamSelect');
  sel.innerHTML = '';
  equipes.forEach((eq, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${eq.motorista} - ${eq.ajudantes.join(' - ')}`;
    sel.appendChild(opt);
  });
}
function saveToLocalStorage() {
  localStorage.setItem('equipes', JSON.stringify(equipes));
}
if (localStorage.getItem('equipes')) {
  equipes = JSON.parse(localStorage.getItem('equipes'));
  renderTeams();
  updateTeamSelect();
}

let ajudanteSelecionado = null;
let equipeOrigemIndex = null;

function openTrocarModalVisual() {
  const container = document.getElementById('trocarVisualContainer');
  container.innerHTML = ''; // limpa tudo

  equipes.forEach((equipe, index) => {
    const equipeDiv = document.createElement('div');
    equipeDiv.className = 'equipe-box';
    equipeDiv.dataset.index = index;

    const titulo = document.createElement('h3');
    titulo.textContent = equipe.motorista;
    equipeDiv.appendChild(titulo);

    equipe.ajudantes.forEach(ajudante => {
      const bloco = document.createElement('div');
      bloco.className = 'ajudante-bloco';
      bloco.textContent = ajudante;

      bloco.addEventListener('click', () => {
        // Se já selecionado, desmarca
        if (ajudanteSelecionado === ajudante) {
          ajudanteSelecionado = null;
          equipeOrigemIndex = null;
          document.querySelectorAll('.ajudante-bloco').forEach(b => b.classList.remove('selecionado'));
        } else {
          ajudanteSelecionado = ajudante;
          equipeOrigemIndex = index;
          document.querySelectorAll('.ajudante-bloco').forEach(b => b.classList.remove('selecionado'));
          bloco.classList.add('selecionado');
        }
      });

      equipeDiv.appendChild(bloco);
    });

    equipeDiv.addEventListener('click', () => {
      if (ajudanteSelecionado !== null && equipeOrigemIndex !== null && index !== equipeOrigemIndex) {
        const equipeOrigem = equipes[equipeOrigemIndex];
        const equipeDestino = equipes[index];

        // Remover da equipe de origem
        equipeOrigem.ajudantes = equipeOrigem.ajudantes.filter(a => a !== ajudanteSelecionado);
        // Adicionar à equipe de destino
        equipeDestino.ajudantes.push(ajudanteSelecionado);

        // Limpar seleção
        ajudanteSelecionado = null;
        equipeOrigemIndex = null;

        // Atualizar interface
        renderTeams();
        openTrocarModalVisual(); // recarrega o modal atualizado
        saveToLocalStorage();
      }
    });

    container.appendChild(equipeDiv);
  });

  openModal('trocarModalVisual');
}

