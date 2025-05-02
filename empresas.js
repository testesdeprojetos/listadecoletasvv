
function saveEmpresa() {
  const index = parseInt(document.getElementById('teamSelect').value);
  const nomeEmpresa = document.getElementById('nomeEmpresa').value.trim();
  const volumes = document.getElementById('volumes').value.trim();
  const peso = document.getElementById('peso').value.trim();
  const observacao = document.getElementById('observacao').value.trim();

  if (!nomeEmpresa || !volumes || !peso) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  const empresa = { nomeEmpresa, volumes, peso, observacao };
  equipes[index].empresas.push(empresa);

  closeModal('empresaModal');
  renderTeams();
}

function deleteEmpresa(i, j) {
  equipes[i].empresas.splice(j, 1);
  renderTeams();
}
