// Variáveis globais
let motoristas = ['Edvaldo', 'Josinaldo', 'Wilson', 'Filipe'];
let ajudantes = ['Roberto', 'Aldivânio', 'Gustavo', 'André', 'Tiago', 'Williams'];
let equipes = [];

// Tema
if (localStorage.getItem('theme')) {
  document.body.dataset.theme = localStorage.getItem('theme');
}
document.getElementById('toggleTheme').addEventListener('click', () => {
  const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = newTheme;
  localStorage.setItem('theme', newTheme);
});

function openModal(id) {
  document.getElementById(id).style.display = 'flex';
  if (id === 'empresaModal') {
    setTimeout(() => {
      document.getElementById('nomeEmpresa').focus();
    }, 100);
  }
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

function addMotorista() {
  const nome = document.getElementById('novoMotorista').value.trim();
  if (nome && !motoristas.includes(nome)) {
    motoristas.push(nome);
    renderMotoristas();
  }
  document.getElementById('novoMotorista').value = '';
  
  saveToLocalStorage();
}

function addAjudante() {
  const nome = document.getElementById('novoAjudante').value.trim();
  if (nome && !ajudantes.includes(nome)) {
    ajudantes.push(nome);
    renderAjudantes();
  }
  document.getElementById('novoAjudante').value = '';
  
  saveToLocalStorage();
}

function renderMotoristas() {
  const selectMotorista = document.getElementById('motorista');
  selectMotorista.innerHTML = '';
  motoristas.forEach(m => {
    const option = document.createElement('option');
    option.value = m;
    option.textContent = m;
    selectMotorista.appendChild(option);
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

function addTeam() {
  const motorista = document.getElementById('motorista').value;
  const ajudantesSelecionados = Array.from(document.querySelectorAll('#ajudantes input:checked')).map(el => el.value);

  const pessoas = [motorista, ...ajudantesSelecionados];
  const usados = equipes.flatMap(eq => [eq.motorista, ...eq.ajudantes]);
  const duplicados = pessoas.find(p => usados.includes(p));

  if (duplicados) {
    alert(`Pessoa já usada: ${duplicados}`);
    return;
  }

  equipes.push({ motorista, ajudantes: ajudantesSelecionados, empresas: [] });
  closeModal('teamModal');
  renderTeams();
  updateTeamSelect();
  saveToLocalStorage();
}

function updateTeamSelect() {
  const teamSelect = document.getElementById('teamSelect');
  teamSelect.innerHTML = '';
  equipes.forEach((equipe, i) => {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `${equipe.motorista} - ${equipe.ajudantes.join(' - ')}`;
    teamSelect.appendChild(option);
  });
}

function renderTeams() {
  const div = document.getElementById('teams');
  div.innerHTML = '';

  equipes.forEach((equipe, i) => {
    const container = document.createElement('div');
    container.className = 'team';

    const header = document.createElement('div');
    header.innerHTML = `
      <h3>${equipe.motorista} - ${equipe.ajudantes.join(' - ')}</h3>
      <button onclick="openTrocarModal(${i})">Alterar Equipe</button>
      <button onclick="openConfirmDeleteModal(${i})">Excluir Equipe</button>
    `;

    const empresasDiv = document.createElement('div');
    empresasDiv.id = `empresas-${i}`;
    equipe.empresas.forEach((emp, j) => {
      const empresa = document.createElement('div');
      empresa.className = 'empresa';
      
      let empresaTexto = `- ${emp.nomeEmpresa}`;
      
      // Adicionar volumes e peso apenas se existirem
      if (emp.volumes) {
        empresaTexto += ` ${emp.volumes}VL`;
      }
      if (emp.peso) {
        empresaTexto += ` ${emp.peso}KG`;
      }
      
      // Adicionar observação se existir
      if (emp.observacao) {
        empresaTexto += ` (${emp.observacao})`;
      }
      
      empresa.innerHTML = `
        <p>${empresaTexto}</p>
        <button id="deleteButton" onclick="deleteEmpresa(${i}, ${j})">Excluir</button>
      `;
      empresasDiv.appendChild(empresa);
    });

    container.appendChild(header);
    container.appendChild(empresasDiv);
    div.appendChild(container);
  });
}

function deleteEmpresa(equipeIndex, empresaIndex) {
  // Remover a empresa da lista de empresas da equipe
  equipes[equipeIndex].empresas.splice(empresaIndex, 1);
  renderTeams(); // Re-renderizar as equipes para atualizar a lista
  
  saveToLocalStorage();
}


function openTrocarModal(equipeIndex) {
  const selectPessoa = document.getElementById('pessoaTroca');
  selectPessoa.innerHTML = '';

  const ajudantesDisponiveis = equipes.flatMap(eq => eq.ajudantes);
  ajudantesDisponiveis.forEach(nome => {
    const option = document.createElement('option');
    option.value = nome;
    option.textContent = nome;
    selectPessoa.appendChild(option);
  });

  const selectEquipe = document.getElementById('novaEquipe');
  selectEquipe.innerHTML = '';
  equipes.forEach((equipe, i) => {
    if (i !== equipeIndex) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `${equipe.motorista} - ${equipe.ajudantes.join(' - ')}`;
      selectEquipe.appendChild(option);
    }
  });

  document.getElementById('pessoaTroca').dataset.fromEquipe = equipeIndex;
  openModal('trocarModal');
}

function moverIntegrante() {
  const pessoa = document.getElementById('pessoaTroca').value;
  const fromIndex = +document.getElementById('pessoaTroca').dataset.fromEquipe;
  const toIndex = +document.getElementById('novaEquipe').value;

  const equipeOrigem = equipes[fromIndex];
  const equipeDestino = equipes[toIndex];

  equipeOrigem.ajudantes = equipeOrigem.ajudantes.filter(a => a !== pessoa);
  equipeDestino.ajudantes.push(pessoa);

  closeModal('trocarModal');
  renderTeams();
  
  saveToLocalStorage();
}

function generateList() {
  const hoje = new Date().toLocaleDateString('pt-BR');
  let texto = `COLETAS DO DIA ${hoje} ATUALIZADAS:\n\n`;

  equipes.forEach(equipe => {
    texto += `${equipe.motorista} - ${equipe.ajudantes.join(' - ')}\n\n`;
    equipe.empresas.forEach(emp => {
      let linha = `- ${emp.nomeEmpresa}`;

      if (emp.volumes) {
        linha += ` ${emp.volumes}VL`;
      }

      if (emp.peso) {
        linha += ` ${emp.peso}KG`;
      }

      if (emp.observacao) {
        linha += ` (${emp.observacao})`;
      }

      texto += `${linha}\n`;
    });
    texto += '\n';
  });

  document.getElementById('output').value = texto.toUpperCase();
}


function openConfirmDeleteModal(equipeIndex) {
  window.equipeToDeleteIndex = equipeIndex;
  openModal('confirmDeleteModal');
}

function deleteEquipe() {
  equipes.splice(window.equipeToDeleteIndex, 1);
  renderTeams();
  closeModal('confirmDeleteModal');
  
  saveToLocalStorage();
}

const camposEmpresa = ['nomeEmpresa', 'volumes', 'peso', 'observacao'];

camposEmpresa.forEach((id, index) => {
  const campo = document.getElementById(id);
  campo.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();

      // Se for o último campo, salvar
      if (index === camposEmpresa.length - 1) {
        saveEmpresa();
      } else {
        // Ir para o próximo campo
        document.getElementById(camposEmpresa[index + 1]).focus();
      }
    }
  });
});


function saveEmpresa() {
  const equipeIndex = parseInt(document.getElementById('teamSelect').value);
  const nomeEmpresa = document.getElementById('nomeEmpresa').value.trim();
  const volumes = document.getElementById('volumes').value.trim();
  const peso = document.getElementById('peso').value.trim();
  const observacao = document.getElementById('observacao').value.trim();

  if (!nomeEmpresa || isNaN(equipeIndex)) {
    alert('Preencha todos os campos obrigatórios.');
    return;
  }

  // Verificar se volumes e peso estão preenchidos antes de adicionar "VL" e "KG"
  const novaEmpresa = {
    nomeEmpresa,
    volumes: volumes || null, // Se vazio, será null
    peso: peso || null, // Se vazio, será null
    observacao
  };

  equipes[equipeIndex].empresas.push(novaEmpresa);

  renderTeams(); // Atualizar a lista de equipes

  // Limpar campos
  document.getElementById('nomeEmpresa').value = '';
  document.getElementById('volumes').value = '';
  document.getElementById('peso').value = '';
  document.getElementById('observacao').value = '';

  // Voltar o foco para o campo nome da empresa
  document.getElementById('nomeEmpresa').focus();
  
  saveToLocalStorage();
}


// ======= Local Storage - Carregar dados =======
if (localStorage.getItem('motoristas')) {
  motoristas = JSON.parse(localStorage.getItem('motoristas'));
}
if (localStorage.getItem('ajudantes')) {
  ajudantes = JSON.parse(localStorage.getItem('ajudantes'));
}
if (localStorage.getItem('equipes')) {
  equipes = JSON.parse(localStorage.getItem('equipes'));
}

// ======= Local Storage - Função para salvar =======
function saveToLocalStorage() {
  localStorage.setItem('motoristas', JSON.stringify(motoristas));
  localStorage.setItem('ajudantes', JSON.stringify(ajudantes));
  localStorage.setItem('equipes', JSON.stringify(equipes));
}

// ======= Adicionar "Limpar Tudo" =======
function limparTudo() {
  if (confirm("Tem certeza que deseja apagar todos os dados?")) {
    localStorage.clear();
    location.reload();
  }
}

// Iniciar com dados salvos
renderMotoristas();
renderAjudantes();
updateTeamSelect();
renderTeams(); // <-- ESSA LINHA FALTAVA

