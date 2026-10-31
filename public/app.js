const $ = id => document.getElementById(id);
let page = 1;
let search = '';
let generation = 0;
const providerNames = { email: 'Email', google: 'Google', facebook: 'Facebook' };
async function request(path, body) {
  const response = await fetch(`/api${path}`, body === undefined ? { cache: 'no-store' } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = response.status === 204 ? {} : await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'Não foi possível concluir o pedido.'), { status: response.status });
  return data;
}
function showSession(user) {
  $('login-panel').hidden = Boolean(user);
  $('denied-panel').hidden = !user || user.role === 'admin';
  $('users-panel').hidden = user?.role !== 'admin';
  if (user?.role === 'admin') { $('admin-name').textContent = user.name; loadUsers(); }
  else { generation++; $('users').replaceChildren(); $('total').textContent = '—'; }
}
async function loadUsers() {
  const current = ++generation;
  $('users-status').textContent = 'A carregar utilizadores…';
  $('previous').disabled = $('next').disabled = true;
  $('users').replaceChildren();
  $('empty').hidden = true;
  try {
    const data = await request(`/admin/users?page=${page}&search=${encodeURIComponent(search)}`);
    if (current !== generation) return;
    $('total').textContent = data.total;
    $('empty').hidden = data.users.length !== 0;
    const fragment = document.createDocumentFragment();
    for (const user of data.users) {
      const tr = document.createElement('tr');
      const date = new Intl.DateTimeFormat('pt-PT', { dateStyle: 'medium', timeZone: 'Europe/Lisbon' }).format(new Date(user.createdAt));
      for (const value of [user.name, user.email, providerNames[user.provider], user.role === 'admin' ? 'Administrador' : 'Membro', date]) {
        const td = document.createElement('td'); td.textContent = value; tr.append(td);
      }
      fragment.append(tr);
    }
    $('users').replaceChildren(fragment);
    $('page').textContent = `Página ${page} de ${Math.max(1, Math.ceil(data.total / data.pageSize))}`;
    $('previous').disabled = page <= 1;
    $('next').disabled = page * data.pageSize >= data.total;
    $('users-status').textContent = '';
  } catch (error) {
    if (current !== generation) return;
    if (error.status === 401 || error.status === 403) {
      try { const { user } = await request('/auth/me'); showSession(user); } catch { showSession(null); }
      $('login-status').textContent = 'A sessão expirou ou o acesso foi alterado. Inicie sessão novamente.';
    } else $('users-status').textContent = 'Não foi possível carregar os utilizadores. Use a pesquisa para tentar novamente.';
  }
}
$('login-form').addEventListener('submit', async event => {
  event.preventDefault(); $('login').disabled = true; $('login-status').textContent = '';
  try {
    const { user } = await request('/auth/login', { email: $('email').value, password: $('password').value });
    $('login-form').reset(); showSession(user);
  } catch (error) { $('login-status').textContent = error.status ? error.message : 'Sem ligação ao servidor. Tente novamente.'; }
  finally { $('login').disabled = false; }
});
for (const button of document.querySelectorAll('.logout')) button.addEventListener('click', async () => {
  button.disabled = true;
  for (const status of document.querySelectorAll('.logout-status')) status.textContent = '';
  try { await request('/auth/logout', {}); showSession(null); }
  catch { for (const status of document.querySelectorAll('.logout-status')) status.textContent = 'Não foi possível terminar sessão. Tente novamente.'; }
  finally { button.disabled = false; }
});
$('search-form').addEventListener('submit', event => { event.preventDefault(); search = $('search').value.trim(); page = 1; loadUsers(); });
$('previous').addEventListener('click', () => { page--; loadUsers(); });
$('next').addEventListener('click', () => { page++; loadUsers(); });
for (const id of ['google', 'facebook']) $(id).addEventListener('click', event => { if ($(id).getAttribute('aria-disabled') === 'true') event.preventDefault(); });
const result = new URLSearchParams(location.search).get('auth');
if (result) {
  $('login-status').textContent = result === 'existing_account' ? 'Inicie sessão pelo método usado no registo desta conta.' : 'Não foi possível concluir o acesso social. Tente novamente ou use email.';
  history.replaceState(null, '', '/be/');
}
await Promise.allSettled([
  request('/auth/me').then(({ user }) => showSession(user)).catch(() => { $('login-status').textContent = 'Não foi possível ligar ao servidor.'; }),
  request('/auth/providers').then(({ providers }) => { for (const { id, enabled } of providers) $(id).setAttribute('aria-disabled', String(!enabled)); }).catch(() => {})
]);
