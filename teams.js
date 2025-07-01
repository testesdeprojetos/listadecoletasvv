
let motoristas = ['Edvaldo', 'Josinaldo', 'Wilson', 'Filipe'];
let ajudantes = ['Roberto', 'Aldivânio', 'Gustavo', 'André', 'Tiago', 'Williams'];
let equipes = [];

function renderMotoristas() {
  const sel = document.getElementById('motorista');
  sel.innerHTML = '';
  motoristas.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    sel.appendChild(opt);
  });
}

function renderAjudantes() {
  const div = document.getElementById('ajudantes');
  div.innerHTML = '';
  ajudantes.forEach(a => {
    div.innerHTML += `<label><input type="checkbox" value="${a}"> ${a}</label><br>`;
  });
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

function addTeam() {
  const motorista = document.getElementById('motorista').value;
  const ajudantesSelecionados = Array.from(document.querySelectorAll('#ajudantes input:checked')).map(el => el.value);

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
      empresa.innerHTML = `
        <p>- ${emp.nomeEmpresa} ${emp.volumes}VL ${emp.peso}KG${emp.observacao ? ' (' + emp.observacao + ')' : ''}</p>
        <button onclick="deleteEmpresa(${i}, ${j})">Excluir</button>
      `;
      empresasDiv.appendChild(empresa);
    });

    container.appendChild(header);
    container.appendChild(empresasDiv);
    div.appendChild(container);
  });
}

function openConfirmDeleteModal(i) {
  window.equipeToDeleteIndex = i;
  openModal('confirmDeleteModal');
}

function deleteEquipe() {
  equipes.splice(window.equipeToDeleteIndex, 1);
  closeModal('confirmDeleteModal');
  renderTeams();
}
