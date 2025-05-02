
function openTrocarModal(equipeOrigemIndex) {
  const selectPessoa = document.getElementById('pessoaTroca');
  selectPessoa.innerHTML = '';

  const ajudantesNaEquipe = equipes[equipeOrigemIndex].ajudantes;
  ajudantesNaEquipe.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a;
    opt.textContent = a;
    selectPessoa.appendChild(opt);
  });

  const selectEquipe = document.getElementById('novaEquipe');
  selectEquipe.innerHTML = '';
  equipes.forEach((equipe, i) => {
    if (i !== equipeOrigemIndex) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${equipe.motorista} - ${equipe.ajudantes.join(' - ')}`;
      selectEquipe.appendChild(opt);
    }
  });

  document.getElementById('equipeOrigemIndex').value = equipeOrigemIndex;
  openModal('trocarModal');
}

function moverIntegrante() {
  const pessoa = document.getElementById('pessoaTroca').value;
  const novaEquipeIndex = parseInt(document.getElementById('novaEquipe').value);
  const equipeOrigemIndex = parseInt(document.getElementById('equipeOrigemIndex').value);

  if (!pessoa || isNaN(novaEquipeIndex) || isNaN(equipeOrigemIndex)) return;

  const equipeOrigem = equipes[equipeOrigemIndex];
  const equipeDestino = equipes[novaEquipeIndex];

  equipeOrigem.ajudantes = equipeOrigem.ajudantes.filter(a => a !== pessoa);
  equipeDestino.ajudantes.push(pessoa);

  closeModal('trocarModal');
  renderTeams();
}

function generateList() {
  const hoje = new Date().toLocaleDateString('pt-BR');
  let texto = `COLETAS DO DIA ${hoje} ATUALIZADAS:

`;

  equipes.forEach(e => {
    texto += `${e.motorista} - ${e.ajudantes.join(' - ')}
`;
    e.empresas.forEach(emp => {
      texto += `- ${emp.nomeEmpresa} ${emp.volumes}VL ${emp.peso}KG${emp.observacao ? ` (${emp.observacao})` : ''}
`;
    });
    texto += '
';
  });

  document.getElementById('output').value = texto.toUpperCase();
}

renderMotoristas();
renderAjudantes();
updateTeamSelect();
