
function openModal(id) {
  document.getElementById(id).style.display = 'flex';
  if (id === 'empresaModal') {
    setTimeout(() => document.getElementById('nomeEmpresa').focus(), 50);
  }
}
function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}
