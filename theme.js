
if (localStorage.getItem('theme')) {
  document.body.dataset.theme = localStorage.getItem('theme');
}
document.getElementById('toggleTheme').addEventListener('click', () => {
  const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = newTheme;
  localStorage.setItem('theme', newTheme);
});
