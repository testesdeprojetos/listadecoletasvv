// ===== URLs da planilha do Google Sheets =====
const URL_MOTORISTAS = "https://docs.google.com/spreadsheets/d/12WODF9lWXjb1SDYeWN1lG0v1mxK2R4g-z-aCVHb2NMo/gviz/tq?tqx=out:json&tq=SELECT+A&sheet=Motoristas";
const URL_AJUDANTES = "https://docs.google.com/spreadsheets/d/12WODF9lWXjb1SDYeWN1lG0v1mxK2R4g-z-aCVHb2NMo/gviz/tq?tqx=out:json&tq=SELECT+A&sheet=Ajudantes";

// ===== Variáveis globais =====
let motoristas = [];
let ajudantes = [];
let equipes = [];
let ajudanteSelecionado = null;
let dragData = null;
let editMode = false;
let editingIndex = null;

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
  const botaoEquipe = document.getElementById('botaoAdicionarEquipe');
  try {
    const [dadosMotoristas, dadosAjudantes] = await Promise.all([
      carregarLista(URL_MOTORISTAS),
      carregarLista(URL_AJUDANTES)
    ]);
    motoristas = dadosMotoristas;
    ajudantes = dadosAjudantes;
    if (motoristas.length === 0 || ajudantes.length === 0) {
      alert('Erro ao carregar dados da planilha. Verifique se os dados estão preenchidos corretamente.');
    } else {
      renderMotoristas();
      renderAjudantes();
    }
  } catch (error) {
    console.error("Erro ao carregar dados das planilhas:", error);
    alert('Falha ao carregar dados da planilha. Você pode digitar os nomes manualmente.');
  }
  if (botaoEquipe) botaoEquipe.style.display = 'inline-block';
}
carregarDados();

// ===== Render Motoristas =====
function renderMotoristas() {
  const select = document.getElementById('motorista');
  if (!select) return;
  select.innerHTML = '';
  motoristas.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    select.appendChild(opt);
  });
  const optOutro = document.createElement('option');
  optOutro.value = 'outro';
  optOutro.textContent = 'Outro (digitar manualmente)';
  select.appendChild(optOutro);

  select.onchange = () => {
    const outroInput = document.getElementById('motoristaOutro');
    if (outroInput) outroInput.style.display = select.value === 'outro' ? 'block' : 'none';
  };
}

// ===== Render Ajudantes =====
function renderAjudantes() {
  const div = document.getElementById('ajudantes');
  if (!div) return;
  div.innerHTML = '';
  ajudantes.forEach(a => {
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" value="${a}"> ${a}`;
    div.appendChild(label);
    div.appendChild(document.createElement('br'));
  });
  div.insertAdjacentHTML('beforeend', `
    <label><input type="checkbox" id="outroAjudanteCheck"> Outro (digitar manualmente)</label><br>
    <input type="text" id="outroAjudante" placeholder="Nome(s) do(s) ajudante(s), separados por vírgula" style="display:none;">
  `);
  const checkOutro = document.getElementById('outroAjudanteCheck');
  const inputOutro = document.getElementById('outroAjudante');
  if (checkOutro && inputOutro) {
    checkOutro.addEventListener('change', () => {
      inputOutro.style.display = checkOutro.checked ? 'block' : 'none';
    });
  }
}

// ===== Salvar (Adicionar/Editar) Equipe =====
function salvarEquipe() {
  const motoristaSelect = document.getElementById('motorista');
  const motoristaOutroInput = document.getElementById('motoristaOutro');

  let motorista = motoristaSelect.value;
  if (motorista === 'outro') {
    motorista = motoristaOutroInput.value.trim();
    if (!motorista) return alert("Digite o nome do motorista.");
  } else if (!motorista) {
    return alert("Selecione um motorista.");
  }

  // Ajudantes
  const checkboxes = document.querySelectorAll('#ajudantes input[type="checkbox"]:checked');
  let ajudantesSelecionados = Array.from(checkboxes)
    .filter(el => el.id !== 'outroAjudanteCheck')
    .map(el => el.value);

  const outroAjudanteCheck = document.getElementById('outroAjudanteCheck');
  const outroAjudanteInput = document.getElementById('outroAjudante');
  if (outroAjudanteCheck?.checked && outroAjudanteInput?.value.trim()) {
    const outros = outroAjudanteInput.value.split(',').map(v => v.trim()).filter(Boolean);
    ajudantesSelecionados = ajudantesSelecionados.concat(outros);
  }

  if (!motorista || ajudantesSelecionados.length === 0) {
    return alert("Selecione um motorista e pelo menos um ajudante.");
  }

  // Verifica duplicatas (ignora a própria equipe se for edição)
  const usados = equipes.flatMap((eq, idx) => idx === editingIndex ? [] : [eq.motorista, ...eq.ajudantes]);
  const duplicado = [motorista, ...ajudantesSelecionados].find(p => usados.includes(p));
  if (duplicado) return alert(`Pessoa já usada: ${duplicado}`);

  if (editMode && editingIndex !== null) {
    equipes[editingIndex].motorista = motorista;
    equipes[editingIndex].ajudantes = ajudantesSelecionados;
  } else {
    equipes.push({ motorista, ajudantes: ajudantesSelecionados, empresas: [] });
  }

  closeModal('teamModal');
  renderTeams();
  updateTeamSelect();
  saveToLocalStorage();
}

// ===== Renderizar Equipes =====
function renderTeams() {
  const div = document.getElementById('teams');
  div.innerHTML = '';
  equipes.forEach((equipe, i) => {
    const container = document.createElement('div');
    container.className = 'team';
    const header = document.createElement('div');
    header.innerHTML = `
      <h3>${equipe.motorista} - ${equipe.ajudantes.join(' - ')}</h3>
      <button onclick="abrirTrocaVisual(${i})">Alterar Equipes</button>
      <button onclick="abrirModalEquipe('editar', ${i})">Editar Integrantes</button>
      <button onclick="openConfirmDeleteModal(${i})">Excluir Equipe</button>
    `;
    const empresasDiv = document.createElement('div');
    empresasDiv.id = `empresas-${i}`;
    equipe.empresas.forEach((emp, j) => {
      let texto = `- ${emp.nomeEmpresa}`;
      if (emp.volumes) texto += ` ${emp.volumes}VL`;
      if (emp.peso) texto += ` ${emp.peso}KG`;
      if (emp.observacao) texto += ` (${emp.observacao})`;
      empresasDiv.innerHTML += `
        <div class="empresa" 
          draggable="true"
          ondragstart="dragStart(event, ${i}, ${j})" 
          ondragover="dragOver(event)" 
          ondragleave="dragLeave(event)"
          ondrop="drop(event, ${i}, ${j})">
        <p contenteditable="true">${texto}</p>
        <button onclick="deleteEmpresa(${i}, ${j})">Excluir</button>
      </div>
    `;
    });
    container.appendChild(header);
    container.appendChild(empresasDiv);
    div.appendChild(container);
  });
}

// ===== Drag & Drop =====
function dragStart(event, equipeIndex, empresaIndex) {
  dragData = { equipeIndex, empresaIndex };
  event.dataTransfer.effectAllowed = 'move';
  event.currentTarget.classList.add('dragging');
}
function dragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add('drag-over');
}
function dragLeave(event) {
  event.currentTarget.classList.remove('drag-over');
}
function drop(event, equipeIndex, empresaIndex) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');
  if (!dragData) return;
  const { equipeIndex: origemEquipe, empresaIndex: origemEmpresa } = dragData;
  const item = equipes[origemEquipe].empresas.splice(origemEmpresa, 1)[0];
  if (origemEquipe === equipeIndex && origemEmpresa < empresaIndex) empresaIndex--;
  equipes[equipeIndex].empresas.splice(empresaIndex, 0, item);
  dragData = null;
  renderTeams();
  saveToLocalStorage();
}

// ===== Modal Alterar Ajudantes =====
function abrirTrocaVisual() {
  const container = document.getElementById('equipesTrocaVisual');
  container.innerHTML = '';
  ajudanteSelecionado = null;
  equipes.forEach((equipe, index) => {
    const bloco = document.createElement('div');
    bloco.className = 'blocoEquipe';
    bloco.dataset.index = index;
    const titulo = document.createElement('h4');
    titulo.textContent = `Equipe ${index + 1}: ${equipe.motorista}`;
    bloco.appendChild(titulo);
    equipe.ajudantes.forEach(ajudante => {
      const btn = document.createElement('span');
      btn.className = 'ajudante-btn';
      btn.textContent = ajudante;
      btn.onclick = () => {
        document.querySelectorAll('.ajudante-btn').forEach(el => el.classList.remove('selecionado'));
        btn.classList.add('selecionado');
        ajudanteSelecionado = { nome: ajudante, equipeIndex: index };
      };
      bloco.appendChild(btn);
    });
    bloco.onclick = (e) => {
      if (e.target.classList.contains('ajudante-btn')) return;
      if (!ajudanteSelecionado) return alert("Selecione um ajudante para mover.");
      const { nome, equipeIndex: origem } = ajudanteSelecionado;
      const destino = index;
      if (origem === destino) return alert("Selecione uma equipe diferente.");
      equipes[origem].ajudantes = equipes[origem].ajudantes.filter(a => a !== nome);
      equipes[destino].ajudantes.push(nome);
      ajudanteSelecionado = null;
      closeModal('trocarModalVisual');
      renderTeams();
      saveToLocalStorage();
    };
    container.appendChild(bloco);
  });
  openModal('trocarModalVisual');
}

// ===== Abrir Modal Adicionar/Editar =====
function abrirModalEquipe(modo = 'novo', index = null) {
  editMode = (modo === 'editar');
  editingIndex = index;

  document.getElementById('teamModalTitle').textContent = editMode ? "Editar Equipe" : "Adicionar Nova Equipe";
  document.getElementById('teamModalSaveBtn').textContent = editMode ? "Salvar Alterações" : "Adicionar Equipe";

  // Resetar campos
  const motoristaSelect = document.getElementById('motorista');
  const motoristaOutro = document.getElementById('motoristaOutro');
  motoristaSelect.value = '';
  motoristaOutro.value = '';
  motoristaOutro.style.display = 'none';
  document.querySelectorAll('#ajudantes input[type="checkbox"]').forEach(cb => cb.checked = false);
  const outroAjudanteCheck = document.getElementById('outroAjudanteCheck');
  const outroAjudanteInput = document.getElementById('outroAjudante');
  outroAjudanteCheck.checked = false;
  outroAjudanteInput.value = '';
  outroAjudanteInput.style.display = 'none';

  // Se for edição, preencher
  if (editMode && index !== null) {
    const equipe = equipes[index];
    if (motoristas.includes(equipe.motorista)) {
      motoristaSelect.value = equipe.motorista;
    } else {
      motoristaSelect.value = 'outro';
      motoristaOutro.style.display = 'block';
      motoristaOutro.value = equipe.motorista;
    }
    let ajudantesNaoListados = [];
    equipe.ajudantes.forEach(a => {
      const cb = [...document.querySelectorAll('#ajudantes input[type="checkbox"]')].find(el => el.value === a);
      if (cb) cb.checked = true;
      else ajudantesNaoListados.push(a);
    });
    if (ajudantesNaoListados.length > 0) {
      outroAjudanteCheck.checked = true;
      outroAjudanteInput.style.display = 'block';
      outroAjudanteInput.value = ajudantesNaoListados.join(', ');
    }
  }

  openModal('teamModal');
}

// ===== Empresa - Campos =====
const camposEmpresa = ['nomeEmpresa', 'volumes', 'peso', 'observacao'];
camposEmpresa.forEach((id, index) => {
  const campo = document.getElementById(id);
  campo.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index === camposEmpresa.length - 1) saveEmpresa();
      else document.getElementById(camposEmpresa[index + 1]).focus();
    }
  });
});

function saveEmpresa() {
  const equipeIndex = +document.getElementById('teamSelect').value;
  const nomeEmpresa = document.getElementById('nomeEmpresa').value.trim();
  const volumes = document.getElementById('volumes').value.trim();
  const peso = document.getElementById('peso').value.trim();
  const observacao = document.getElementById('observacao').value.trim();
  if (!nomeEmpresa || isNaN(equipeIndex)) return alert('Preencha os campos corretamente.');
  equipes[equipeIndex].empresas.push({ nomeEmpresa, volumes, peso, observacao });
  renderTeams();
  saveToLocalStorage();
  camposEmpresa.forEach(id => document.getElementById(id).value = '');
  document.getElementById('nomeEmpresa').focus();
}

// ===== Utilidades =====
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function openConfirmDeleteModal(i) { window.equipeToDeleteIndex = i; openModal('confirmDeleteModal'); }
function deleteEquipe() { equipes.splice(window.equipeToDeleteIndex, 1); renderTeams(); closeModal('confirmDeleteModal'); saveToLocalStorage(); }
function deleteEmpresa(i, j) { equipes[i].empresas.splice(j, 1); renderTeams(); saveToLocalStorage(); }
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
function generateList() {
  const hoje = new Date().toLocaleDateString('pt-BR');
  let texto = `COLETAS DO DIA ${hoje} ATUALIZADAS:\n\n`;
  equipes.forEach(equipe => {
    texto += `${equipe.motorista} - ${equipe.ajudantes.join(' - ')}\n\n`;
    equipe.empresas.forEach(emp => {
      let linha = `- ${emp.nomeEmpresa}`;
      if (emp.volumes) linha += ` ${emp.volumes}VL`;
      if (emp.peso) linha += ` ${emp.peso}KG`;
      if (emp.observacao) linha += ` (${emp.observacao})`;
      texto += `${linha}\n`;
    });
    texto += `\n`;
  });
  document.getElementById('output').value = texto.toUpperCase();
}
function limparTudo() { if (confirm("Tem certeza que deseja apagar todos os dados?")) { localStorage.clear(); location.reload(); } }
function saveToLocalStorage() { localStorage.setItem('equipes', JSON.stringify(equipes)); }

// ===== Inicialização =====
if (localStorage.getItem('equipes')) {
  equipes = JSON.parse(localStorage.getItem('equipes'));
}
renderTeams();
updateTeamSelect();
