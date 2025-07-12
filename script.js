// ===== URLs da planilha do Google Sheets =====
const URL_MOTORISTAS = "https://docs.google.com/spreadsheets/d/12WODF9lWXjb1SDYeWN1lG0v1mxK2R4g-z-aCVHb2NMo/gviz/tq?tqx=out:json&tq=SELECT+A&sheet=Motoristas";
const URL_AJUDANTES = "https://docs.google.com/spreadsheets/d/12WODF9lWXjb1SDYeWN1lG0v1mxK2R4g-z-aCVHb2NMo/gviz/tq?tqx=out:json&tq=SELECT+A&sheet=Ajudantes";


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
  try {
    const [dadosMotoristas, dadosAjudantes] = await Promise.all([
      carregarLista(URL_MOTORISTAS),
      carregarLista(URL_AJUDANTES)
    ]);

    motoristas = dadosMotoristas;
    ajudantes = dadosAjudantes;

    if (motoristas.length === 0 || ajudantes.length === 0) {
      alert('Erro ao carregar dados da planilha. Verifique se os dados estão preenchidos corretamente.');
      return;
    }

    renderMotoristas();
    renderAjudantes();

    // Apenas mostrar o botão depois do carregamento
    const botaoEquipe = document.getElementById('botaoAdicionarEquipe');
    if (botaoEquipe) botaoEquipe.style.display = 'inline-block';

  } catch (error) {
    console.error("Erro ao carregar dados das planilhas:", error);
    alert('Erro ao carregar os dados dos motoristas e ajudantes.');
  }
}

carregarDados();

console.log("Motoristas carregados:", motoristas);
console.log("Ajudantes carregados:", ajudantes);


// ===== Renderização =====
function renderMotoristas() {
  const select = document.getElementById('motorista');
  select.innerHTML = '';

  motoristas.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    select.appendChild(opt);
  });
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
}

// ===== Adicionar Equipe =====
function addTeam() {
  const motoristaSelecionado = document.getElementById('motorista').value;
  const motoristaOutro = document.getElementById('outroMotorista').value.trim();
  const motorista = motoristaSelecionado === 'outro' ? motoristaOutro : motoristaSelecionado;

  const ajudantesSelecionados = Array.from(document.querySelectorAll('#ajudantes input[type="checkbox"]:checked')).map(el => el.value);
  if (document.getElementById('ajudanteOutroCheck').checked) {
    const nome = document.getElementById('ajudanteOutroInput').value.trim();
    if (nome) ajudantesSelecionados.push(nome);
  }

  if (!motorista || ajudantesSelecionados.length === 0) return alert("Selecione um motorista e pelo menos um ajudante.");

  const usados = equipes.flatMap(eq => [eq.motorista, ...eq.ajudantes]);
  const duplicado = [motorista, ...ajudantesSelecionados].find(p => usados.includes(p));
  if (duplicado) return alert(`Pessoa já usada: ${duplicado}`);

  equipes.push({ motorista, ajudantes: ajudantesSelecionados, empresas: [] });
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
      <button onclick="abrirTrocaVisual(${i})">Alterar Equipe</button>
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
        <div class="empresa">
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

// ===== Modal Visual: Trocar Ajudantes =====
function abrirTrocaVisual() {
  const modal = document.getElementById('trocarModalVisual');
  modal.innerHTML = '';
  ajudanteSelecionado = null;

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
    if (ajudanteSelecionado.equipeIndex === equipeIndex) return;

    const origem = ajudanteSelecionado.equipeIndex;
    const destino = equipeIndex;

    equipes[origem].ajudantes = equipes[origem].ajudantes.filter(a => a !== ajudanteSelecionado.nome);
    equipes[destino].ajudantes.push(ajudanteSelecionado.nome);

    ajudanteSelecionado = null;
    closeModal('trocarModalVisual');
    renderTeams();
    saveToLocalStorage();
  }
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
function openModal(id) {
  if (id === 'teamModal') {
    if (motoristas.length === 0 || ajudantes.length === 0) {
      alert('Carregando motoristas e ajudantes... aguarde um instante e tente novamente.');
      return;
    }
  }

  document.getElementById(id).style.display = 'flex';

  if (id === 'empresaModal') {
    setTimeout(() => document.getElementById('nomeEmpresa').focus(), 100);
  }

  if (id === 'teamModal') {
  if (motoristas.length === 0 || ajudantes.length === 0) {
    alert('Carregando motoristas e ajudantes... aguarde um instante e tente novamente.');
    return;
  }

  // Só adiciona o listener agora que os elementos estão garantidos no DOM
  const checkOutro = document.getElementById('ajudanteOutroCheck');
  const inputOutro = document.getElementById('ajudanteOutroInput');
  if (checkOutro && inputOutro) {
    checkOutro.addEventListener('change', (e) => {
      inputOutro.style.display = e.target.checked ? 'block' : 'none';
    });
  }
}

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
  renderTeams();
  closeModal('confirmDeleteModal');
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
function limparTudo() {
  if (confirm("Tem certeza que deseja apagar todos os dados?")) {
    localStorage.clear();
    location.reload();
  }
}
function saveToLocalStorage() {
  localStorage.setItem('equipes', JSON.stringify(equipes));
}

// ===== Inicialização =====
if (localStorage.getItem('equipes')) {
  equipes = JSON.parse(localStorage.getItem('equipes'));
}
renderTeams();
updateTeamSelect();
