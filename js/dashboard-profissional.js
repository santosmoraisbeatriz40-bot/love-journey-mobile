(() => {
  const key = 'loveJourney.profissional';
  const defaults = {
    nome: 'Gabriel Queiroz', cargo: 'Psicólogo | Saúde Mental • Acolhimento • Desenvolvimento Humano',
    especialidades: 'Aconselhamento, Saúde emocional, Inteligência emocional',
    publico: 'Jovens em relacionamentos, Casais, Pessoas buscando autoconhecimento',
    temas: 'Comunicação no relacionamento, Tecnologia, Emoções e sentimentos, Saúde mental, Relacionamentos',
    sobre: 'Acredito no poder da educação, da empatia e da criatividade para transformar vidas. Gosto de compartilhar conteúdos que possam ajudar pessoas a compreender melhor seus sentimentos e relações.',
    jornada: 'Formação em Psicologia — 11/2024\nEstudos sobre relacionamentos — 11/2024\nInteresse em saúde emocional — 11/2024\nApoio a jovens e casais — 11/2024\nEscrita e orientação psicológica — 11/2024\nDesenvolvimento contínuo — 11/2024'
  };
  let data = { ...defaults };
  try { data = { ...data, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch {}
  document.addEventListener('DOMContentLoaded', () => {
    const name = document.querySelector('.profile-name');
    const role = document.querySelector('.profile-role');
    const about = document.querySelector('.about-text');
    const sections = [...document.querySelectorAll('.dashboard-grid .col-main > .card')];
    const renderTags = (card, value) => {
      const group = card?.querySelector('.tag-group'); if (!group) return;
      const colors = ['pink', 'green', 'purple', 'yellow'];
      group.innerHTML = value.split(',').map((v, i) => `<span class="tag ${colors[i % colors.length]}">${escapeHtml(v.trim())}</span>`).join('');
    };
    const render = () => {
      if (name) name.textContent = data.nome;
      if (role) role.textContent = data.cargo;
      if (about) about.textContent = data.sobre;
      renderTags(sections[1], data.especialidades); renderTags(sections[2], data.publico); renderTags(sections[3], data.temas);
      const timeline = document.querySelector('.timeline');
      if (timeline) timeline.innerHTML = data.jornada.split('\n').filter(Boolean).map(line => {
        const [title, date] = line.split(' — '); return `<div class="timeline-item"><span class="dot-point"></span><div><strong>${escapeHtml(title)}</strong><small>${escapeHtml(date || '')}</small></div></div>`;
      }).join('');
    };
    const modal = document.createElement('dialog'); modal.className = 'profile-editor';
    modal.innerHTML = `<form method="dialog" class="profile-editor-card"><header><h2>Editar perfil profissional</h2><button type="button" class="close" aria-label="Fechar">×</button></header><div class="editor-fields"></div><footer><button type="button" class="cancel">Cancelar</button><button type="submit" class="save">Salvar alterações</button></footer></form>`;
    document.body.append(modal);
    const style = document.createElement('style'); style.textContent = `.profile-editor{border:0;border-radius:20px;padding:0;margin:auto;width:min(620px,calc(100% - 28px));max-height:90vh;color:#302a39;box-shadow:0 20px 70px #25143544}.profile-editor::backdrop{background:#24183388;backdrop-filter:blur(3px)}.profile-editor-card{padding:24px;max-height:90vh;overflow:auto;font-family:inherit}.profile-editor header,.profile-editor footer{display:flex;align-items:center;justify-content:space-between;gap:12px}.profile-editor h2{font-size:1.25rem;margin:0 0 18px}.profile-editor header button{border:0;background:none;font-size:28px;cursor:pointer}.profile-editor label{display:block;font-size:.9rem;font-weight:600;margin:12px 0}.profile-editor input,.profile-editor textarea{box-sizing:border-box;display:block;width:100%;padding:11px;border:1px solid #ddd5e5;border-radius:10px;font:inherit;margin-top:5px}.profile-editor textarea{min-height:84px;resize:vertical}.profile-editor footer{justify-content:flex-end;margin-top:18px}.profile-editor footer button{border:0;border-radius:10px;padding:11px 16px;cursor:pointer}.profile-editor .save{background:#7545a5;color:white}.profile-editor .cancel{background:#f1edf5;color:#46394e}`;
    document.head.append(style);
    const definitions = { perfil: [['nome','Nome'],['cargo','Título profissional']], especialidades:[['especialidades','Separe as especialidades por vírgula']], publico:[['publico','Separe os públicos por vírgula']], temas:[['temas','Separe os temas por vírgula']], sobre:[['sobre','Sobre mim']], jornada:[['jornada','Uma etapa por linha (título — data)']] };
    const fields = modal.querySelector('.editor-fields');
    function openEditor(type='perfil') {
      const formFields = definitions[type] || definitions.perfil;
      fields.innerHTML = formFields.map(([field,label]) => `<label>${label}${field === 'sobre' || field === 'jornada' ? `<textarea name="${field}">${escapeHtml(data[field])}</textarea>` : `<input name="${field}" value="${escapeHtml(data[field])}" required>`}</label>`).join('');
      modal.querySelector('h2').textContent = type === 'perfil' ? 'Editar perfil profissional' : `Editar ${({especialidades:'especialidades',publico:'público atendido',temas:'temas de interesse',sobre:'sobre mim',jornada:'minha jornada'})[type]}`;
      modal.showModal();
    }
    document.getElementById('btn-edit-profile')?.addEventListener('click', () => openEditor());
    document.querySelectorAll('.col-main .icon-btn').forEach((button, i) => button.addEventListener('click', () => openEditor(['especialidades','publico','temas','sobre'][i])));
    document.querySelector('.timeline-card .icon-btn')?.addEventListener('click', () => openEditor('jornada'));
    modal.querySelector('.close').onclick = modal.querySelector('.cancel').onclick = () => modal.close();
    modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });
    modal.querySelector('form').addEventListener('submit', e => {
      e.preventDefault(); new FormData(e.currentTarget).forEach((value, field) => data[field] = value.trim());
      localStorage.setItem(key, JSON.stringify(data)); render(); modal.close();
    });
    document.querySelector('.profile-card .btn-block')?.addEventListener('click', () => {
      const content = `${data.nome}\n${data.cargo}\n\n${data.sobre}\n\nEspecialidades: ${data.especialidades}`;
      const file = new Blob([content], {type:'text/plain'}); const link = Object.assign(document.createElement('a'), {href:URL.createObjectURL(file),download:'curriculo-profissional.txt'}); link.click(); URL.revokeObjectURL(link.href);
    });
    render();
  });
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
})();
