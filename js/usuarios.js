document.addEventListener('DOMContentLoaded', () => {
  const list = document.querySelector('.user-list');
  if (!list) return;
  const items = [...list.querySelectorAll('.user-item')];
  const search = document.getElementById('search');
  const tabs = [...document.querySelectorAll('.status-tabs .tab-btn')];
  let filter = 'Todos';
  function applyFilters() {
    const term = (search?.value || '').toLocaleLowerCase('pt-BR');
    items.forEach(item => {
      const status = item.querySelector('.user-status')?.textContent.toLocaleLowerCase('pt-BR') || '';
      const statusMatch = filter === 'Todos' || (filter === 'Em atendimento' ? status.includes('atendimento') : status.includes('solicitação'));
      item.classList.toggle('is-hidden', !statusMatch || !item.innerText.toLocaleLowerCase('pt-BR').includes(term));
    });
  }
  search?.addEventListener('input', applyFilters);
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active')); tab.classList.add('active');
    filter = tab.textContent.trim().replace(/\s*\(.*\)/, ''); applyFilters();
  }));
  list.addEventListener('click', e => {
    const favorite = e.target.closest('.favorite');
    if (favorite) { e.stopPropagation(); favorite.classList.toggle('is-favorite'); favorite.setAttribute('aria-pressed', favorite.classList.contains('is-favorite')); return; }
    const item = e.target.closest('.user-item'); if (!item) return;
    items.forEach(row => row.classList.remove('selected')); item.classList.add('selected');
    const user = item.querySelector('.user-info b')?.textContent || 'Usuário';
    const initial = user[0].toUpperCase();
    document.querySelector('.conversation-user h3').innerHTML = `${user} <i aria-hidden="true" class="fa-solid fa-check"></i>`;
    document.querySelector('.conversation-user .avatar')?.replaceChildren(document.createTextNode(initial));
    document.querySelector('.message-input input')?.focus();
  });
  function dialog(title, fields, onSave) {
    const d = document.createElement('dialog'); d.className = 'user-action-dialog';
    d.innerHTML = `<form method="dialog"><h2>${title}</h2>${fields}<div class="actions"><button type="button" data-cancel>Cancelar</button><button type="submit">Salvar</button></div></form>`;
    if (!document.getElementById('user-action-style')) { const s=document.createElement('style'); s.id='user-action-style'; s.textContent='.user-action-dialog{border:0;border-radius:16px;padding:24px;width:min(480px,calc(100% - 32px));box-shadow:0 20px 60px #24183355}.user-action-dialog::backdrop{background:#24183388}.user-action-dialog form{display:grid;gap:12px}.user-action-dialog h2{margin:0 0 6px}.user-action-dialog label{display:grid;gap:5px}.user-action-dialog input,.user-action-dialog textarea,.user-action-dialog select{font:inherit;padding:10px;border:1px solid #ddd;border-radius:9px}.user-action-dialog textarea{min-height:80px}.user-action-dialog .actions{display:flex;justify-content:flex-end;gap:8px}.user-action-dialog button{border:0;border-radius:8px;padding:10px 15px;cursor:pointer}.user-action-dialog button[type=submit]{background:#7650a5;color:white}.favorite.is-favorite{color:#e34e83!important}.favorite.is-favorite i{font-weight:900}'; document.head.append(s); }
    document.body.append(d); d.showModal(); d.querySelector('[data-cancel]').onclick=()=>d.close(); d.addEventListener('click',e=>{if(e.target===d)d.close()});
    d.querySelector('form').addEventListener('submit',e=>{e.preventDefault();onSave(new FormData(e.currentTarget));d.close();d.remove()});
  }
  document.getElementById('btn-new-user')?.addEventListener('click', () => dialog('Adicionar usuário', '<label>Nome<input name="nome" required></label><label>Mensagem inicial<textarea name="mensagem" placeholder="Olá, gostaria de conversar..."></textarea></label>', data => {
    const name=data.get('nome').trim(); const el=document.createElement('div'); el.className='user-item'; el.innerHTML=`<span class="avatar purple"></span><div class="user-info"><b></b><small class="user-status request">Solicitação de conversa</small><p></p></div><em>agora</em><button class="favorite" aria-label="Favoritar"><i class="fa-solid fa-heart"></i></button><span class="chevron">›</span>`;
    el.querySelector('.avatar').textContent=name[0].toUpperCase();el.querySelector('b').textContent=name;el.querySelector('p').textContent=data.get('mensagem')||'Novo contato';list.prepend(el);items.unshift(el);applyFilters();
  }));
  document.querySelector('.search-row .btn-light')?.addEventListener('click', () => dialog('Filtros de usuários', '<label>Status<select name="status"><option>Todos</option><option>Em atendimento</option><option>Solicitações</option></select></label><label><input type="checkbox" name="favoritos"> Apenas favoritos</label>', data => {
    filter=data.get('status'); const tab=tabs.find(t=>t.textContent.trim().startsWith(filter)); if(tab){tabs.forEach(t=>t.classList.remove('active'));tab.classList.add('active')} applyFilters();
    if(data.has('favoritos')) items.forEach(item=>item.classList.toggle('is-hidden',item.classList.contains('is-hidden')||!item.querySelector('.favorite.is-favorite')));
  }));
  const messages=document.querySelector('.messages'); const composer=document.querySelector('.message-input input');
  function sendMessage() { const value=composer?.value.trim(); if(!value)return; const row=document.createElement('div');row.className='message sent';const bubble=document.createElement('div');bubble.className='bubble';const p=document.createElement('p');p.textContent=value;const time=document.createElement('time');time.textContent=new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(new Date());bubble.append(p,time);row.append(bubble);messages.append(row);composer.value='';messages.scrollTop=messages.scrollHeight; }
  document.querySelector('.message-input button')?.addEventListener('click',sendMessage); composer?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();sendMessage()}});
  document.querySelectorAll('.conversation-actions button').forEach(btn=>btn.addEventListener('click',()=>alert(`${btn.getAttribute('aria-label')} iniciado (demonstração).`)));
  document.querySelector('.details-title .link-action')?.addEventListener('click',()=>dialog('Editar dados do usuário','<label>Nome<input name="nome" value="Lucas Ferreira" required></label><label>Observações<textarea name="obs">Gosto de aprender coisas novas, sou curioso e sempre busco evoluir.</textarea></label>',data=>{document.querySelector('.profile-summary strong').childNodes[0].textContent=data.get('nome')+' ';document.querySelector('.details-title').dataset.observacoes=data.get('obs')}));
  document.querySelector('.notes-card .link-action')?.addEventListener('click',()=>dialog('Editar observações','<label>Observações<textarea name="obs" required>'+document.querySelector('.notes-card .about-text').textContent.trim()+'</textarea></label>',data=>document.querySelector('.notes-card .about-text').textContent=data.get('obs')));
  document.querySelector('.requests-body .btn')?.addEventListener('click',()=>{const request=items.find(item=>item.querySelector('.user-status.request'));if(request){request.querySelector('.user-status').textContent='Em atendimento';request.querySelector('.user-status').className='user-status busy';request.querySelector('.user-info p').textContent='Solicitação aceita — conversa iniciada';request.click()}else alert('Não há novas solicitações.')});
  document.querySelector('.details-column .btn-soft')?.addEventListener('click',()=>dialog('Questionário completo','<p><b>Objetivos:</b> Melhorar autoestima, lidar com ansiedade e construir relações saudáveis.</p><p><b>Interesses:</b> Relacionamentos, carreira e saúde mental.</p><p><b>Preferência:</b> Conversas online com materiais de apoio.</p><p>Questionário respondido: 8 de 10 perguntas.</p>',()=>{}));
  document.querySelectorAll('.history-card .history-item').forEach(row=>row.tabIndex=0);
});
