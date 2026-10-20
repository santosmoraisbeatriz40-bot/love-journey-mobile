(() => {
  const storageKey = 'loveJourney.desafiosCasal';
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const readStore = () => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || { progress: {}, custom: [] }; }
    catch { return { progress: {}, custom: [] }; }
  };
  const ideas = {
    Amor: [
      ['Uma semana de elogios','Compartilhem um elogio sincero por dia.',7],
      ['Recriar o primeiro encontro','Planejem juntos uma noite inspirada no início da relação.',1],
      ['Cartas de carinho','Escrevam uma carta um para o outro.',2]
    ],
    'Saúde e bem-estar': [
      ['Caminhada a dois','Façam uma caminhada juntos três vezes nesta semana.',3],
      ['Pausa para respirar','Reservem dez minutos por dia para relaxar juntos.',5],
      ['Cozinhar algo saudável','Escolham uma receita e preparem juntos.',1]
    ],
    Diversão: [
      ['Noite de jogos','Escolham um jogo novo e joguem juntos.',1],
      ['Explorar um lugar novo','Visitem um lugar que nenhum dos dois conhece.',1],
      ['Playlist do casal','Criem juntos uma playlist com músicas especiais.',1]
    ],
    'Crescimento pessoal': [
      ['Leitura compartilhada','Leiam um capítulo por semana e conversem sobre ele.',4],
      ['Conversa sem distrações','Façam três conversas deixando os celulares de lado.',3],
      ['Aprender algo novo','Escolham uma habilidade e pratiquem juntos.',4]
    ]
  };

  document.addEventListener('DOMContentLoaded', () => {
    const state = readStore();
    state.progress ||= {}; state.custom ||= [];
    const activeCard = document.querySelector('.challenges-card');
    const activeContainer = activeCard;
    const completedGrid = document.querySelector('.completed-grid');
    const upcomingCard = document.querySelector('.upcoming-card');
    const modal = document.createElement('dialog'); modal.className = 'challenge-dialog'; document.body.append(modal);
    const style = document.createElement('style');
    style.textContent = `.challenge-dialog{position:fixed;inset:50% auto auto 50%;transform:translate(-50%,-50%);margin:0;border:0;border-radius:18px;padding:0;width:min(560px,calc(100% - 28px));max-height:88vh;max-height:88dvh;color:#333;box-shadow:0 22px 70px #28163244}.challenge-dialog::backdrop{background:#21142c88;backdrop-filter:blur(3px)}.challenge-dialog .dialog-content{padding:24px;max-height:88vh;max-height:88dvh;overflow:auto;font-family:Poppins,sans-serif}.challenge-dialog header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}.challenge-dialog h2{font-size:1.2rem;line-height:1.4;color:#49344f}.challenge-dialog .close{border:0;background:transparent;font-size:26px;cursor:pointer}.challenge-dialog p{color:#666;line-height:1.55;margin:8px 0}.challenge-dialog label{display:grid;gap:6px;margin:12px 0;font-size:.9rem;font-weight:600}.challenge-dialog input,.challenge-dialog textarea,.challenge-dialog select{box-sizing:border-box;width:100%;padding:10px;border:1px solid #dfd5e3;border-radius:10px;font:inherit}.challenge-dialog textarea{min-height:80px;resize:vertical}.challenge-dialog .actions{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:8px;margin-top:16px}.challenge-dialog .actions button,.challenge-dialog .idea-button{border:0;border-radius:9px;padding:10px 14px;cursor:pointer;font:inherit}.challenge-dialog .primary{background:#f25287;color:white}.challenge-dialog .secondary{background:#f1edf3;color:#49344f}.challenge-dialog .idea-button{display:block;width:100%;text-align:left;background:#fff5f8;margin:8px 0;color:#49344f}.challenge-dialog .idea-button small{display:block;color:#777;margin-top:4px}.challenge-row-button{cursor:pointer}.challenge-row-button:focus-visible,.category-item:focus-visible{outline:3px solid #f25287;outline-offset:3px}.challenge-dialog .empty-state{padding:16px;background:#fff5f8;border-radius:10px}`;
    document.head.append(style);

    const save = () => localStorage.setItem(storageKey, JSON.stringify(state));
    const show = (title, html, ready) => {
      modal.innerHTML = `<div class="dialog-content"><header><h2>${title}</h2><button class="close" type="button" aria-label="Fechar">&times;</button></header><div class="dialog-body">${html}</div></div>`;
      modal.querySelector('.close').onclick = () => modal.close();
      modal.onclick = event => { if (event.target === modal) modal.close(); };
      ready?.(modal.querySelector('.dialog-body')); modal.showModal();
    };

    const getProgress = row => {
      const title = row.querySelector('.info h4').textContent.trim();
      if (state.progress[title]) return state.progress[title];
      const statusText = row.querySelector('.status').textContent;
      const match = statusText.match(/(\d+)\s*\/\s*(\d+)/);
      const progress = { done: match ? Number(match[1]) : 0, total: match ? Number(match[2]) : 1, completed: row.querySelector('.status').classList.contains('done'), category: 'Amor' };
      state.progress[title] = progress; return progress;
    };
    const updateProgressUI = row => {
      const title = row.querySelector('.info h4').textContent.trim(); const progress = getProgress(row);
      const fill = row.querySelector('.progress-fill');
      if (fill) fill.style.width = `${Math.min(100, Math.round(progress.done / Math.max(1, progress.total) * 100))}%`;
      const status = row.querySelector('.status'); status.classList.toggle('done', progress.completed);
      if (progress.completed) status.innerHTML = '<i aria-hidden="true" class="fa-solid fa-check"></i> Concluído<span class="count">' + escapeHtml(progress.completedAt || 'Finalizado') + '</span>';
      else status.innerHTML = `${progress.done}/${progress.total}<span class="count"><i aria-hidden="true" class="fa-solid fa-calendar-days"></i> ${escapeHtml(progress.dueLabel || 'Em andamento')}</span>`;
      row.dataset.challengeTitle = title;
      row.setAttribute('role', 'button'); row.setAttribute('tabindex', '0'); row.classList.add('challenge-row-button');
      row.setAttribute('aria-label', `${title}, ${progress.done} de ${progress.total} etapas. Abrir detalhes.`);
    };
    const buildActiveRow = challenge => {
      const row = document.createElement('div'); row.className = 'challenge';
      const theme = challenge.theme || 'fill-pink'; const icon = challenge.icon || 'fa-heart';
      row.innerHTML = `<span class="icon-circle theme-pink"><i aria-hidden="true" class="fa-solid ${icon}"></i></span><div class="info"><h4></h4><p></p><div class="progress-bar"><div class="progress-fill ${theme}" style="width:0%"></div></div></div><div class="status"></div><span class="chevron">›</span>`;
      row.querySelector('h4').textContent = challenge.title; row.querySelector('.info p').textContent = challenge.description;
      return row;
    };
    const buildCompletedCard = challenge => {
      const article = document.createElement('article'); article.className = 'completed-item theme-pink-light'; article.dataset.customChallenge = challenge.title;
      article.innerHTML = '<h4 class="item-title"></h4><span class="item-date"></span><span class="badge-done"><i aria-hidden="true" class="fa-solid fa-check"></i> Concluído</span>';
      article.querySelector('h4').textContent = challenge.title; article.querySelector('.item-date').textContent = challenge.completedAt || new Intl.DateTimeFormat('pt-BR').format(new Date());
      return article;
    };
    const addCustomToPage = challenge => {
      if (activeCard.querySelector(`[data-challenge-title="${CSS.escape(challenge.title)}"]`)) return;
      state.progress[challenge.title] ||= { done: challenge.done || 0, total: challenge.total, completed: Boolean(challenge.completed), category: challenge.category, dueLabel: `Prazo: ${challenge.due}` };
      if (state.progress[challenge.title].completed) completedGrid.prepend(buildCompletedCard({ ...challenge, completedAt: state.progress[challenge.title].completedAt }));
      else {
        const row = buildActiveRow(challenge); activeContainer.append(row); updateProgressUI(row);
        const upcoming = document.createElement('div'); upcoming.className = 'upcoming';
        upcoming.innerHTML = `<span class="icon-circle icon-sm theme-pink"><i aria-hidden="true" class="fa-solid fa-heart"></i></span><div class="info"><h4></h4><p></p></div><span class="date"></span>`;
        upcoming.querySelector('h4').textContent = challenge.title; upcoming.querySelector('p').textContent = challenge.description; upcoming.querySelector('.date').textContent = new Intl.DateTimeFormat('pt-BR').format(new Date(`${challenge.due}T12:00:00`)); upcomingCard.append(upcoming);
      }
    };
    const refreshSummary = () => {
      const customTotal = state.custom.length; const customDone = state.custom.filter(item => item.completed).length;
      const total = 15 + customTotal; const done = 15 + customDone; const percent = Math.round(done / Math.max(1, total) * 100);
      document.querySelector('.progress-card .ring').style.setProperty('--porcentagem', percent);
      document.querySelector('.progress-card .ring span').textContent = `${percent}%`;
      document.querySelector('.progress-text').textContent = `Vocês já completaram ${done} de ${total} desafios.`;
    };

    // Ativa progresso e detalhes nos desafios estáticos da página.
    activeCard.querySelectorAll('.challenge').forEach(updateProgressUI);
    activeCard.addEventListener('click', event => {
      const row = event.target.closest('.challenge'); if (!row) return;
      openChallenge(row);
    });
    activeCard.addEventListener('keydown', event => {
      const row = event.target.closest('.challenge');
      if (row && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); openChallenge(row); }
    });
    function openChallenge(row) {
      const title = row.querySelector('.info h4').textContent.trim(); const description = row.querySelector('.info p').textContent.trim(); const progress = getProgress(row);
      show(escapeHtml(title), `<p>${escapeHtml(description)}</p><p><strong>Progresso:</strong> ${progress.done} de ${progress.total} etapas</p><div class="actions"><button type="button" class="secondary" data-close>Fechar</button>${progress.completed ? '<span class="empty-state">Este desafio já foi concluído.</span>' : '<button type="button" class="secondary" data-step>Registrar etapa</button><button type="button" class="primary" data-complete>Concluir desafio</button>'}</div>`, body => {
        body.querySelector('[data-close]').onclick = () => modal.close();
        body.querySelector('[data-step]')?.addEventListener('click', () => {
          progress.done = Math.min(progress.total, progress.done + 1);
          if (progress.done >= progress.total) { progress.completed = true; progress.completedAt = new Intl.DateTimeFormat('pt-BR').format(new Date()); }
          save(); updateProgressUI(row); modal.close();
          if (progress.completed) addCompletedFromRow(row, progress);
        });
        body.querySelector('[data-complete]')?.addEventListener('click', () => {
          progress.done = progress.total; progress.completed = true; progress.completedAt = new Intl.DateTimeFormat('pt-BR').format(new Date()); save(); updateProgressUI(row); modal.close(); addCompletedFromRow(row, progress);
        });
      });
    }
    function addCompletedFromRow(row, progress) {
      const title = row.querySelector('.info h4').textContent.trim();
      row.hidden = true;
      const custom = state.custom.find(item => item.title === title);
      if (custom) Object.assign(custom, { done: progress.done, completed: true, completedAt: progress.completedAt });
      if (!completedGrid.querySelector(`[data-custom-challenge="${CSS.escape(title)}"]`) && ![...completedGrid.querySelectorAll('.item-title')].some(el => el.textContent.trim() === title)) {
        completedGrid.prepend(buildCompletedCard({ title, completedAt: progress.completedAt }));
      }
      upcomingCard.querySelectorAll('.upcoming').forEach(item => { if (item.querySelector('h4')?.textContent.trim() === title) item.remove(); });
      save(); renderCarousel();
      refreshSummary();
    }

    // Criação de desafios definidos pelo casal, com prazo, categoria e meta.
    document.getElementById('btn-new-challenge')?.addEventListener('click', () => show('Criar novo desafio', `<form id="challenge-form"><label>Nome do desafio<input name="title" required maxlength="70" placeholder="Ex.: Preparar um jantar juntos"></label><label>Descrição<textarea name="description" required maxlength="240" placeholder="O que vocês vão fazer?"></textarea></label><label>Categoria<select name="category">${Object.keys(ideas).map(category => `<option>${escapeHtml(category)}</option>`).join('')}</select></label><label>Etapas para concluir<input name="total" type="number" min="1" max="60" value="1" required></label><label>Data limite<input name="due" type="date" min="${new Date().toISOString().slice(0,10)}" required></label><div class="actions"><button type="button" class="secondary" data-cancel>Cancelar</button><button type="submit" class="primary">Criar desafio</button></div></form>`, body => {
      const form = body.querySelector('form'); body.querySelector('[data-cancel]').onclick = () => modal.close();
      const due = form.elements.due; const defaultDate = new Date(); defaultDate.setDate(defaultDate.getDate() + 7); due.value = defaultDate.toISOString().slice(0,10);
      form.addEventListener('submit', event => {
        event.preventDefault(); const data = new FormData(form);
        const challenge = { title: data.get('title').trim(), description: data.get('description').trim(), category: data.get('category'), total: Number(data.get('total')), due: data.get('due'), icon: categoryIcons[data.get('category')], theme: categoryThemes[data.get('category')] };
        if (!challenge.title || !challenge.description || !challenge.total) return;
        if (state.custom.some(item => item.title.toLocaleLowerCase('pt-BR') === challenge.title.toLocaleLowerCase('pt-BR'))) { form.elements.title.setCustomValidity('Já existe um desafio com esse nome.'); form.reportValidity(); return; }
        state.custom.unshift(challenge); save(); addCustomToPage(challenge); refreshSummary(); modal.close();
      });
    }));

    // Os botões de listagem apresentam os desafios do casal em uma janela acessível.
    const openList = (completedOnly = false) => {
      const activeRows = [...activeCard.querySelectorAll('.challenge')].filter(row => !getProgress(row).completed);
      const completed = [...completedGrid.querySelectorAll('.completed-item')];
      const items = completedOnly ? completed.map(card => ({ title: card.querySelector('.item-title').textContent.trim(), description: 'Desafio concluído', status: card.querySelector('.item-date').textContent })) : activeRows.map(row => ({ title: row.querySelector('h4').textContent.trim(), description: row.querySelector('p').textContent.trim(), status: `${getProgress(row).done}/${getProgress(row).total} etapas` }));
      show(completedOnly ? 'Desafios concluídos' : 'Desafios em andamento', items.length ? items.map(item => `<div class="idea-button"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.description)} · ${escapeHtml(item.status)}</small></div>`).join('') : '<p class="empty-state">Nenhum desafio nesta lista por enquanto.</p>');
    };
    document.querySelector('.challenges-card .card-header .btn')?.addEventListener('click', () => openList(false));
    document.querySelector('.completed-card .card-header .btn')?.addEventListener('click', () => openList(true));

    // Categorias abrem sugestões prontas e podem iniciar uma delas com um clique.
    const categoryIcons = { Amor: 'fa-heart', 'Saúde e bem-estar': 'fa-dumbbell', Diversão: 'fa-star', 'Crescimento pessoal': 'fa-book-open' };
    const categoryThemes = { Amor: 'fill-pink', 'Saúde e bem-estar': 'fill-purple', Diversão: 'fill-yellow', 'Crescimento pessoal': 'fill-teal' };
    document.querySelectorAll('.category-item').forEach(item => {
      item.setAttribute('role', 'button'); item.tabIndex = 0;
      const openCategory = () => {
        const category = item.querySelector('.cat-name').textContent.trim();
        show(`Ideias de ${escapeHtml(category)}`, `<p>Escolham uma ideia para adicionar aos desafios em andamento.</p><div class="ideas"></div>`, body => {
          (ideas[category] || []).forEach(([title, description, total]) => {
            const button = document.createElement('button'); button.type = 'button'; button.className = 'idea-button';
            const strong = document.createElement('strong'); strong.textContent = title; const small = document.createElement('small'); small.textContent = `${description} · ${total} ${total === 1 ? 'etapa' : 'etapas'}`;
            button.append(strong, small); button.onclick = () => {
              if (state.custom.some(entry => entry.title === title)) { modal.close(); show('Desafio já adicionado', '<p>Esse desafio já está na lista do casal.</p>'); return; }
              const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 7);
              const challenge = { title, description, total, category, due: dueDate.toISOString().slice(0,10), icon: categoryIcons[category], theme: categoryThemes[category] };
              state.custom.unshift(challenge); save(); addCustomToPage(challenge); refreshSummary(); modal.close();
            };
            body.querySelector('.ideas').append(button);
          });
        });
      };
      item.addEventListener('click', openCategory); item.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openCategory(); } });
    });

    // Carrossel paginado para rever os desafios concluídos.
    let page = 0;
    const dotsContainer = document.querySelector('.completed-card .carousel-dots');
    const prev = document.querySelector('.completed-card .nav-arrow:first-child');
    const next = document.querySelector('.completed-card .nav-arrow:last-child');
    const renderCarousel = () => {
      const cards = [...completedGrid.querySelectorAll('.completed-item')]; const pageSize = 3; const pageCount = Math.max(1, Math.ceil(cards.length / pageSize));
      page = Math.max(0, Math.min(page, pageCount - 1));
      cards.forEach((card, index) => { card.hidden = Math.floor(index / pageSize) !== page; });
      dotsContainer.innerHTML = '';
      for (let i = 0; i < pageCount; i++) { const dot = document.createElement('button'); dot.type = 'button'; dot.className = `dot-nav${i === page ? ' active' : ''}`; dot.setAttribute('aria-label', `Página ${i + 1} de desafios concluídos`); dot.onclick = () => { page = i; renderCarousel(); }; dotsContainer.append(dot); }
      prev.disabled = page === 0; next.disabled = page >= pageCount - 1;
    };
    prev?.addEventListener('click', () => { page--; renderCarousel(); }); next?.addEventListener('click', () => { page++; renderCarousel(); });

    state.custom.forEach(addCustomToPage);
    activeCard.querySelectorAll('.challenge').forEach(updateProgressUI);
    refreshSummary(); renderCarousel();
  });
})();
