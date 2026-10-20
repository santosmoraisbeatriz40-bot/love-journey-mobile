(() => {
  const storageKey = 'loveJourney.apoio';
  const readState = () => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); }
    catch { return {}; }
  };
  const state = readState();
  const saveState = () => localStorage.setItem(storageKey, JSON.stringify(state));
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  const dialog = document.createElement('dialog');
  dialog.className = 'support-dialog';
  dialog.innerHTML = '<form method="dialog" class="support-dialog-card"><header><div><p class="support-kicker">LOVE JOURNEY · APOIO</p><h2></h2></div><button type="button" class="support-close" aria-label="Fechar">×</button></header><div class="support-dialog-content"></div><footer class="support-dialog-actions"></footer></form>';
  document.body.append(dialog);
  const heading = dialog.querySelector('h2');
  const content = dialog.querySelector('.support-dialog-content');
  const actions = dialog.querySelector('.support-dialog-actions');
  const openDialog = (title, body, buttons = []) => {
    heading.textContent = title;
    content.innerHTML = body;
    actions.innerHTML = buttons.map((button) => `<button type="${button.submit ? 'submit' : 'button'}" class="${button.primary ? 'support-primary' : 'support-secondary'}" data-action="${escapeHtml(button.action || 'close')}">${escapeHtml(button.label)}</button>`).join('');
    dialog.showModal();
  };
  const closeDialog = () => dialog.close();
  dialog.querySelector('.support-close').addEventListener('click', closeDialog);
  dialog.addEventListener('click', (event) => { if (event.target === dialog) closeDialog(); });
  actions.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (button && !button.hasAttribute('type') || button?.dataset.action === 'close') closeDialog();
  });

  const addContact = (formData) => {
    state.contacts = state.contacts || [];
    state.contacts.push({ name: formData.get('name').trim(), relation: formData.get('relation'), phone: formData.get('phone').trim(), note: formData.get('note').trim() });
    saveState();
    openDialog('Contato salvo', '<p>Seu contato de apoio foi adicionado a este dispositivo.</p>', [{ label: 'Entendi', primary: true }]);
    renderContacts();
  };
  const renderContacts = () => {
    let section = document.querySelector('[data-contact-section]');
    if (!section || !state.contacts?.length) return;
    section.hidden = false;
    section.innerHTML = `<div class="card-header"><h3>Meus contatos de apoio</h3></div><div class="support-contact-list">${state.contacts.map((contact, index) => `<article class="support-contact"><div><strong>${escapeHtml(contact.name)}</strong><small>${escapeHtml(contact.relation)}${contact.phone ? ` · ${escapeHtml(contact.phone)}` : ''}</small>${contact.note ? `<p>${escapeHtml(contact.note)}</p>` : ''}</div><button type="button" class="support-remove" data-remove-contact="${index}" aria-label="Remover ${escapeHtml(contact.name)}">Remover</button></article>`).join('')}</div>`;
  };
  document.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-remove-contact]');
    if (remove) {
      state.contacts.splice(Number(remove.dataset.removeContact), 1); saveState(); renderContacts(); return;
    }
    const favorite = event.target.closest('.favorite');
    if (favorite) {
      const name = favorite.closest('.mentor-card')?.querySelector('.item-title')?.textContent.trim();
      state.favorites = state.favorites || [];
      const index = state.favorites.indexOf(name);
      if (index < 0) state.favorites.push(name); else state.favorites.splice(index, 1);
      favorite.setAttribute('aria-pressed', String(index < 0));
      favorite.classList.toggle('is-favorite', index < 0); saveState(); return;
    }
    const profile = event.target.closest('[data-mentor-profile]');
    if (profile) {
      const card = profile.closest('.mentor-card');
      const name = card.querySelector('.item-title').textContent.trim();
      const profession = card.querySelector('.item-text').textContent.trim();
      const focus = card.querySelector('.mentor-focus').textContent.trim();
      openDialog(name, `<p><strong>${escapeHtml(profession)}</strong> · foco em ${escapeHtml(focus.toLowerCase())}.</p><p>Este perfil faz parte da demonstração do Love Journey. Você pode registrar um pedido de conversa para experimentar o fluxo.</p>`, [{ label: 'Agendar conversa', primary: true, action: 'schedule' }, { label: 'Fechar' }]);
      actions.querySelector('[data-action="schedule"]').addEventListener('click', () => openSchedule(name)); return;
    }
    const showAll = event.target.closest('[data-show-all]');
    if (showAll) {
      const type = showAll.dataset.showAll;
      if (type === 'mentors') {
        const favorites = state.favorites || [];
        const cards = [...document.querySelectorAll('.mentor-card')];
        openDialog(favorites.length ? 'Mentores e favoritos' : 'Nossos mentores', `<p>${cards.map((card) => `${escapeHtml(card.querySelector('.item-title').textContent)} — ${escapeHtml(card.querySelector('.item-text').textContent)}${favorites.includes(card.querySelector('.item-title').textContent.trim()) ? ' · Favorito' : ''}`).join('<br>')}</p><p>Os mentores disponíveis nesta demonstração aparecem acima. Use o coração para guardar seus favoritos.</p>`);
      } else {
        openDialog('Recursos e conteúdos', `<div class="support-resource-list">${[...document.querySelectorAll('.resource-card')].map((card) => `<p><strong>${escapeHtml(card.querySelector('.item-title').textContent.trim())}</strong> · ${escapeHtml(card.querySelector('.resource-type').textContent.trim())}</p>`).join('')}</div><p>Selecione um conteúdo na página para abrir um resumo e uma sugestão prática.</p>`);
      }
      return;
    }
    const talk = event.target.closest('[data-talk]');
    if (talk) {
      if (talk.dataset.talk === 'mentor') openSchedule();
      if (talk.dataset.talk === 'partner') openDialog('Conversa com seu parceiro', '<p>Escolha um momento tranquilo e fale a partir do que você sente, sem presumir a intenção da outra pessoa.</p><div class="support-prompt"><strong>Você pode começar assim:</strong><p>“Quero conversar sobre algo importante para mim. Podemos separar um tempo para nos ouvir com calma?”</p></div>', [{ label: 'Copiar sugestão', primary: true, action: 'copy' }, { label: 'Fechar' }]);
      if (talk.dataset.talk === 'chat') openDialog('Chat de apoio', '<p>Este protótipo não está conectado a uma equipe de atendimento ao vivo. Você pode escrever o que gostaria de dizer e salvar uma anotação privada nesta demonstração.</p><label class="support-label">Sua mensagem<textarea name="support-message" rows="4" placeholder="Escreva no seu ritmo..."></textarea></label>', [{ label: 'Salvar anotação', primary: true, action: 'save-note' }, { label: 'Fechar' }]);
      return;
    }
    const help = event.target.closest('[data-help]');
    if (help) { const item = helpAnswers[help.dataset.help]; openDialog(item.title, item.body); return; }
    const resource = event.target.closest('[data-resource]');
    if (resource) { showResource(resource); return; }
  });
  document.addEventListener('keydown', (event) => {
    const resource = event.target.closest?.('[data-resource]');
    if (resource && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); showResource(resource); }
  });
  dialog.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (actions.querySelector('[data-action="save-contact"]')) addContact(new FormData(event.currentTarget));
  });
  actions.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'save-note') {
      const note = content.querySelector('[name="support-message"]').value.trim();
      if (!note) { content.querySelector('textarea').focus(); return; }
      state.notes = state.notes || []; state.notes.push({ text: note, date: new Date().toISOString() }); saveState();
      openDialog('Anotação salva', '<p>Sua anotação foi guardada neste dispositivo.</p>');
    }
    if (action === 'copy') {
      const text = content.querySelector('.support-prompt p')?.textContent || '';
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => openDialog('Sugestão copiada', '<p>Agora você pode colar a frase onde preferir.</p>')).catch(() => openDialog('Sugestão para copiar', `<div class="support-prompt"><p>${escapeHtml(text)}</p></div>`));
      else openDialog('Sugestão para copiar', `<div class="support-prompt"><p>${escapeHtml(text)}</p></div>`);
    }
  });

  function openContactForm() {
    openDialog('Novo contato de apoio', '<p>Adicione alguém de confiança para encontrar essas informações facilmente quando precisar.</p><label class="support-label">Nome<input name="name" required maxlength="80" placeholder="Nome da pessoa"></label><label class="support-label">Relação<select name="relation"><option>Amigo(a)</option><option>Familiar</option><option>Profissional</option><option>Outro</option></select></label><label class="support-label">Telefone (opcional)<input name="phone" type="tel" maxlength="30" placeholder="(00) 00000-0000"></label><label class="support-label">Observação (opcional)<textarea name="note" rows="2" maxlength="180" placeholder="Quando ou como essa pessoa pode ajudar"></textarea></label>', [{ label: 'Salvar contato', primary: true, action: 'save-contact' }, { label: 'Cancelar' }]);
    actions.querySelector('[data-action="save-contact"]').addEventListener('click', (event) => { event.preventDefault(); const form = dialog.querySelector('form'); if (form.reportValidity()) addContact(new FormData(form)); });
  }
  function openSchedule(mentor = '') {
    openDialog('Pedir uma conversa', `<p>Registre um pedido de conversa${mentor ? ` com <strong>${escapeHtml(mentor)}</strong>` : ' com um mentor'}. O pedido fica salvo neste dispositivo para você testar o fluxo.</p><label class="support-label">Mentor<select name="mentor">${[...document.querySelectorAll('.mentor-card .item-title')].map((el) => `<option ${el.textContent.trim() === mentor ? 'selected' : ''}>${escapeHtml(el.textContent.trim())}</option>`).join('')}</select></label><label class="support-label">Formato<select name="format"><option>Online</option><option>Presencial</option></select></label><label class="support-label">Melhor período<select name="period"><option>Manhã</option><option>Tarde</option><option>Noite</option></select></label><label class="support-label">O que gostaria de conversar? (opcional)<textarea name="topic" rows="3" maxlength="300" placeholder="Conte um pouco, se se sentir à vontade"></textarea></label>`, [{ label: 'Registrar pedido', primary: true, action: 'save-schedule' }, { label: 'Cancelar' }]);
    actions.querySelector('[data-action="save-schedule"]').addEventListener('click', (event) => {
      event.preventDefault(); const form = dialog.querySelector('form');
      const data = Object.fromEntries(new FormData(form));
      state.requests = state.requests || []; state.requests.push({ ...data, date: new Date().toISOString() }); saveState();
      openDialog('Pedido registrado', `<p>Seu pedido de conversa com <strong>${escapeHtml(data.mentor)}</strong> foi salvo nesta demonstração.</p><p>Formato: ${escapeHtml(data.format)} · Período: ${escapeHtml(data.period)}.</p>`);
    });
  }
  function showResource(card) {
    const title = card.querySelector('.item-title').textContent.trim();
    const resource = resourceContent[title] || { summary: 'Um material para apoiar conversas mais cuidadosas e o autoconhecimento.', prompt: 'Que pequeno passo posso experimentar hoje?' };
    openDialog(title, `<p>${escapeHtml(resource.summary)}</p><div class="support-prompt"><strong>Para refletir</strong><p>${escapeHtml(resource.prompt)}</p></div><p class="support-demo-note">Resumo demonstrativo · conteúdo completo não está conectado nesta versão.</p>`);
  }

  // Canais oficiais e gratuitos no Brasil (atendimento 24h)
  const helpChannels = '<div class="support-prompt"><strong>Canais gratuitos, 24 horas</strong><p>CVV (apoio emocional): 188 ou cvv.org.br<br>Central de Atendimento à Mulher: 180<br>Direitos Humanos, incluindo crianças e adolescentes: 100<br>SAMU: 192 · Polícia Militar: 190</p></div>';

  const helpAnswers = {
    jealousy: { title: 'Como lidar com ciúmes?', body: '<p>Ciúmes pode sinalizar insegurança, medo ou uma necessidade que merece atenção. Tente nomear o que sentiu e o que desencadeou isso antes de agir.</p><p>Converse usando exemplos concretos e pedidos claros, sem transformar a conversa em acusação. Se o sentimento estiver afetando sua rotina ou levando a controle, buscar apoio profissional pode ajudar.</p>' },
    conflict: { title: 'O que fazer em conflitos?', body: '<p>Se a conversa estiver muito intensa, proponha uma pausa e combine quando vão retomá-la. Na volta, foquem em um assunto por vez e descrevam o impacto da situação em vocês.</p><p>Procurem um acordo que respeite os limites de ambos. Se houver medo, ameaça ou violência, priorize sua segurança e procure alguém de confiança e serviços locais de apoio.</p>' + helpChannels },
    communication: { title: 'Como melhorar a comunicação?', body: '<p>Escolha um momento em que os dois possam prestar atenção. Fale em primeira pessoa sobre sentimentos e necessidades, e depois confirme o que entendeu do outro.</p><div class="support-prompt"><strong>Exemplo</strong><p>“Quando aconteceu…, eu me senti… e gostaria de…”</p></div>' },
    professional: { title: 'Quando pedir ajuda profissional?', body: '<p>Você pode buscar ajuda quando o sofrimento persistir, os conflitos se repetirem, a relação afetar sua saúde ou vocês sentirem dificuldade para conversar com segurança.</p><p>O apoio profissional não exige que a situação esteja no limite. Procure uma pessoa qualificada e, se houver risco imediato, acione serviços de emergência da sua região.</p>' + helpChannels }
  };
  const resourceContent = {
    'Como lidar com sentimentos difíceis': { summary: 'Reconhecer e nomear o que você sente pode ajudar a responder com mais cuidado. Não é preciso resolver tudo de uma vez.', prompt: 'O que estou sentindo agora e do que preciso neste momento?' },
    'Comunicação que aproxima': { summary: 'Escuta ativa, curiosidade e pedidos claros ajudam a criar conversas mais acolhedoras.', prompt: 'Como posso demonstrar que ouvi antes de responder?' },
    'É saudável pedir espaço?': { summary: 'Pedir uma pausa pode ser saudável quando há clareza sobre o motivo e quando a conversa será retomada.', prompt: 'Que limite me ajudaria a cuidar de mim sem interromper o diálogo?' },
    '5 hábitos para uma relação saudável': { summary: 'Pequenos hábitos de respeito, presença, reparação e reconhecimento ajudam a sustentar uma relação.', prompt: 'Qual gesto simples de cuidado posso praticar esta semana?' },
    'Hábitos para um relacionamento saudável': { summary: 'A qualidade de uma relação se constrói no cotidiano, com atenção às necessidades e aos limites de cada pessoa.', prompt: 'O que tem feito nossa relação se sentir segura e recíproca?' }
  };

  document.getElementById('btn-new-contact')?.addEventListener('click', openContactForm);
  document.querySelectorAll('.favorite').forEach((button) => {
    const name = button.closest('.mentor-card')?.querySelector('.item-title')?.textContent.trim();
    const active = (state.favorites || []).includes(name);
    button.setAttribute('aria-pressed', String(active)); button.classList.toggle('is-favorite', active);
  });
  renderContacts();
})();
