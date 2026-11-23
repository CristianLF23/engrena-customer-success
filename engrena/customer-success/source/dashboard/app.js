const workspace = document.querySelector('#workspace');
const main = document.querySelector('#main');
const dialog = document.querySelector('#dialog');
const dialogContent = document.querySelector('#dialog-content');
const storeKey = 'engrena-customer-success-demo-v1';
const number = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat('pt-BR');
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const longDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'UTC' });
const searchKey = value => String(value).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const n = value => value == null ? 'Indisponível' : whole.format(value);
const decimal = value => value == null ? 'Sem base' : number.format(value);
const reais = value => value == null ? 'Indisponível' : money.format(value);
const date = value => value ? longDate.format(new Date(`${value}T12:00:00Z`)) : '';
const weekLabel = index => `${CS.weeks[index][2]} de 2026`;
const moods = { 'Saudável': 'green', 'Baixo': 'green', 'Resolvido': 'green', 'Normalizado': 'green', 'Atenção': 'amber', 'Média': 'amber', 'Em andamento': 'amber', 'Crítico': 'red', 'Alto': 'red', 'Alta': 'red', 'Crítica': 'red', 'Não se aplica': 'muted' };
const tag = label => `<span class="tag ${moods[label] || 'neutral'}"><i aria-hidden="true"></i>${escapeHtml(label)}</span>`;
const option = (value, text, selected) => `<option value="${escapeHtml(value)}"${String(value) === String(selected) ? ' selected' : ''}>${escapeHtml(text)}</option>`;
const choices = (values, selected) => values.map(item => Array.isArray(item) ? option(item[0], item[1], selected) : option(item, item, selected)).join('');
const button = (type, text, value = '', extra = 'button secondary') => `<button type="button" class="${extra}" data-action="${type}" data-value="${escapeHtml(value)}">${escapeHtml(text)}</button>`;
const catalog = Object.fromEntries(CS.clients.map(client => [client.id, client]));
const persistent = loadStorage();
let { edits, interventions, seen } = persistent;
let index = CS.latest;
let currentView = 'overview';
let clientId = '';
let priorView = 'clients';
let noticeTimer;
let modalSource;
const defaultFilters = { search: '', label: '', plan: '', risk: '', sort: 'risk', tenure: '', action: '', priority: '', alertClient: '', alertType: '', alertState: 'Ativos' };
let filters = { ...defaultFilters };

function loadStorage() {
  const empty = { edits: {}, interventions: structuredClone(CS.firstActions), seen: {} };
  try {
    const raw = JSON.parse(localStorage.getItem(storeKey));
    return raw && Array.isArray(raw.interventions) && raw.edits && raw.seen ? raw : empty;
  } catch {
    return empty;
  }
}

function notify(message) {
  const notice = document.querySelector('#notice');
  notice.textContent = message;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { notice.textContent = ''; }, 5200);
}

function save(message) {
  try {
    localStorage.setItem(storeKey, JSON.stringify({ edits, interventions, seen }));
    notify(message);
  } catch {
    notify('Alteração aplicada nesta sessão. O navegador bloqueou o armazenamento local.');
  }
}

function portfolio() { return CS.portfolio(index, edits, seen); }
function listAlerts() { return CS.alertList(index, edits, seen).sort((a, b) => CS.priorities[a.priority] - CS.priorities[b.priority]); }

function alertStatus(alert) {
  if (alert.cleared) return 'Normalizado';
  if (alert.unverified) return 'A verificar';
  const linked = interventions.filter(item => item.alert === alert.id);
  return linked.some(item => item.status !== 'Resolvido') ? 'Em andamento' : 'Em aberto';
}

function interval() {
  return `<label class="period no-print">Semana de acompanhamento<select data-period>${choices(CS.weeks.map((item, i) => [i, item[2]]).reverse(), index)}</select></label>`;
}

function page(title, description, actions = interval()) {
  return `<div class="pagehead"><div><h1>${title}</h1><p class="lead">${description}</p></div>${actions}</div>`;
}

function panelHead(title, description = '', actions = '') {
  return `<div class="panel-head"><div><h2>${title}</h2>${description ? `<p>${description}</p>` : ''}</div>${actions}</div>`;
}

function kpi(label, value, detail, kind = '') {
  return `<div class="kpi ${kind}"><p>${label}</p><strong>${value}</strong><small>${detail}</small></div>`;
}

function chart(id, values, kind = 'portfolio') {
  const width = 674;
  const left = 42;
  const right = 610;
  const top = 19;
  const bottom = 149;
  const x = i => left + (right - left) * i / (CS.weeks.length - 1);
  const y = value => bottom - value / 10 * (bottom - top);
  const points = values.flatMap((value, i) => value === null ? [] : [{ value, i, x: x(i), y: y(value) }]);
  const contiguous = points.length > 1 && points[points.length - 1].i - points[0].i + 1 === points.length;
  let d = '';
  points.forEach((point, i) => {
    d += `${i > 0 && points[i - 1].i === point.i - 1 ? 'L' : 'M'} ${point.x} ${point.y} `;
  });
  const selected = points.find(point => point.i === index);
  const grid = [10, 7.5, 5, 2.5, 0].map(value => `<line class="grid" x1="${left}" x2="${right}" y1="${y(value)}" y2="${y(value)}"/><text x="${left - 10}" y="${y(value) + 4}" text-anchor="end">${value.toLocaleString('pt-BR')}</text>`).join('');
  const controls = points.map(point => {
    const active = point.i === index;
    return `<g class="chart-trigger ${active ? 'current' : ''}" role="button" tabindex="0" aria-pressed="${active}" aria-label="Semana ${CS.weeks[point.i][2]}, nota ${decimal(point.value)}" data-action="week" data-value="${point.i}">
      <title>${CS.weeks[point.i][2]} · ${decimal(point.value)}</title>
      <circle cx="${point.x}" cy="${point.y}" r="20" fill="transparent"/>
      <circle class="point-halo" cx="${point.x}" cy="${point.y}" r="11"/>
      <circle class="point" cx="${point.x}" cy="${point.y}" r="5.5"/>
    </g>`;
  }).join('');
  return `<div class="chart-wrap">
    ${points.length ? `<svg viewBox="0 0 ${width} 181" class="chart" role="group" aria-labelledby="${id}">
      <title id="${id}">Histórico ${kind === 'portfolio' ? 'da média da carteira' : 'da nota da oficina'} por semana</title>
      <g aria-hidden="true">${grid}
      ${contiguous ? `<path class="chart-area" d="${d}L ${points.at(-1).x} ${bottom} L ${points[0].x} ${bottom} Z"/>` : ''}
      ${selected ? `<line class="selection" x1="${selected.x}" x2="${selected.x}" y1="${top}" y2="${bottom}"/>` : ''}
      <path class="chart-line" d="${d}"/>
      ${CS.weeks.map((w, i) => {
        const short = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
          .format(new Date(`${w[0]}T12:00:00Z`)).replace(' de ', ' ').replace('.', '');
        const selectedClass = i === index ? ' selected-label' : '';
        return `<text x="${x(i)}" y="174" text-anchor="middle" class="chart-long${selectedClass}">${w[2]}</text>
          <text x="${x(i)}" y="174" text-anchor="middle" class="chart-short${selectedClass}">${short}</text>`;
      }).join('')}</g>
      ${controls}</svg>` : '<p class="empty">A série ainda não tem notas calculáveis.</p>'}
    <div class="chart-foot"><span>${weekLabel(index)}</span><strong>${values[index] === null ? 'Sem base na semana' : `Nota ${decimal(values[index])} de 10`}</strong></div>
  </div>`;
}

function distribution(total) {
  const groups = [['Saudável', total.healthy], ['Atenção', total.attention], ['Crítico', total.critical], ['Sem base', total.pending], ['Não se aplica', total.na]];
  return `<div class="distribution">
    <div class="segments" aria-hidden="true">${groups.filter(([, count]) => count).map(([label, count]) => `<span class="${moods[label] || 'neutral'}" style="width:${count * 100 / total.count}%"></span>`).join('')}</div>
    ${groups.map(([label, count]) => `<div class="dist-row">${tag(label)}<strong>${count}</strong></div>`).join('')}
  </div>`;
}

function overview() {
  const totals = CS.aggregate(portfolio());
  const history = CS.weeks.map((_, i) => CS.aggregate(CS.portfolio(i, edits, seen)).avg);
  const delta = index > 0 && history[index] != null && history[index - 1] != null ? Math.round((history[index] - history[index - 1]) * 10) / 10 : null;
  const deltaCopy = delta === null ? 'Sem comparação anterior' : `${delta > 0 ? '+' : ''}${number.format(delta)} em relação à semana anterior`;
  const active = listAlerts().filter(entry => !entry.cleared);
  const shortlist = active.slice(0, 4);
  const overdue = interventions.filter(item => item.date <= CS.weeks[index][1] && item.due < CS.weeks[index][1] && (!item.closed || item.closed > CS.weeks[index][1])).length;
  return `${page('Visão geral', 'Acompanhe a carteira e priorize as próximas intervenções.')}
  <div class="kpis">
    ${kpi('Clientes ativos', totals.count, `${totals.rated} com nota de adoção`)}
    ${kpi('Adoção média', decimal(totals.avg), deltaCopy)}
    ${kpi('Alertas pendentes', totals.alerts, `${active.filter(item => item.priority === 'Crítica').length} de prioridade crítica`)}
    ${kpi('Receita mensal em risco', reais(totals.monthly), `${totals.atRisk} contratos com risco alto`, 'risk')}
  </div>
  <div class="pair">
    <section class="panel">${panelHead('Evolução da adoção', 'Média das oficinas com nota calculável.')}${chart('portfolio-chart', history)}</section>
    <section class="panel">${panelHead('Saúde da carteira', totals.rated ? `${Math.round(totals.healthy * 100 / totals.rated)}% saudáveis entre as ${totals.rated} oficinas com nota.` : 'Sem oficinas com nota na semana.')}${distribution(totals)}</section>
  </div>
  <div class="overview-bottom">
    <section class="panel mobile-priority">${panelHead('Prioridades da semana', '', button('view', 'Ver alertas', 'alerts', 'quiet'))}
      ${shortlist.length ? `<ul class="action-list">${shortlist.map(item => `<li>${tag(item.priority)}<div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(catalog[item.client].name)}</small></div><small>${escapeHtml(item.action)}</small>${button('alert-focus', 'Abrir', item.id, 'link-button')}</li>`).join('')}</ul>` : '<p class="empty">Nenhum alerta ativo nesta semana.</p>'}
    </section>
    <section class="panel next-panel">
      <h2>Intervenções</h2>
      <div class="summary-line"><strong>${overdue} com prazo vencido</strong><p>Revise as ações em aberto na semana selecionada.</p></div>
      <p>A satisfação média foi de <strong>${decimal(totals.csat)}${totals.csat === null ? '' : ' de 5'}</strong> entre ${totals.surveyed} oficinas que responderam.</p>
      ${button('view', 'Abrir relatório semanal', 'reports', 'quiet')}
    </section>
  </div>`;
}

function selectFilter(key, label, values) {
  return `<label class="field">${label}<select data-filter="${key}">${choices(values, filters[key])}</select></label>`;
}

function filteredClients() {
  const risks = { Alto: 0, Atenção: 1, 'Em avaliação': 2, Baixo: 3 };
  return portfolio().filter(client => {
    const period = CS.weeks[index][1];
    const openAction = interventions.some(item => item.client === client.id && item.date <= period && (!item.closed || item.closed > period));
    const age = (Date.parse(period) - Date.parse(client.since)) / 86400000;
    return searchKey(client.name).includes(searchKey(filters.search)) &&
      (!filters.label || client.adoption.label === filters.label) &&
      (!filters.plan || client.plan === filters.plan) &&
      (!filters.risk || client.risk === filters.risk) &&
      (!filters.tenure || (filters.tenure === 'initial' ? age < 30 : age >= 30)) &&
      (!filters.action || (filters.action === 'alerts' ? client.alerts.length > 0 : openAction));
  }).sort((a, b) => {
    if (filters.sort === 'name') return a.name.localeCompare(b.name, 'pt-BR');
    if (filters.sort === 'low') return (a.adoption.value ?? Infinity) - (b.adoption.value ?? Infinity);
    if (filters.sort === 'high') return (b.adoption.value ?? -Infinity) - (a.adoption.value ?? -Infinity);
    return risks[a.risk] - risks[b.risk] || b.alerts.length - a.alerts.length;
  });
}

function clientTable() {
  const list = filteredClients();
  const numericSort = ['low', 'high'].includes(filters.sort) ? (filters.sort === 'low' ? 'ascending' : 'descending') : 'none';
  const riskSort = filters.sort === 'risk' ? 'other' : 'none';
  const nameSort = filters.sort === 'name' ? 'ascending' : 'none';
  return list.length ? `<div class="table-wrap" role="region" tabindex="0" aria-label="Tabela da carteira com rolagem horizontal se necessário"><table aria-label="Oficinas monitoradas">
      <thead><tr><th scope="col" aria-sort="${nameSort}">Oficina</th><th scope="col" aria-sort="${numericSort}">Adoção</th><th scope="col">Saúde</th><th scope="col">Satisfação</th><th scope="col" aria-sort="${riskSort}">Risco</th><th scope="col">Alertas</th><th scope="col">Próxima ação</th></tr></thead><tbody>
      ${list.map(client => {
        const pending = interventions.filter(item => item.client === client.id && item.date <= CS.weeks[index][1] && (!item.closed || item.closed > CS.weeks[index][1])).sort((a, b) => a.due.localeCompare(b.due))[0];
        const next = pending?.text || client.alerts[0]?.action || client.next;
        return `<tr><td>${button('client', client.name, client.id, 'client-link')}<small>${escapeHtml(client.plan)} · ${escapeHtml(client.owner)}</small><small>Desde ${date(client.since)}</small></td>
         <td><strong>${client.adoption.value == null ? 'n/d' : decimal(client.adoption.value)}</strong>${client.adoption.coverage !== null ? `<small>${Math.round(client.adoption.coverage)}% de cobertura</small>` : ''}</td>
         <td>${tag(client.adoption.label)}</td><td>${client.row?.scoreFeedback == null ? 'n/d' : `${client.row.scoreFeedback} de 5`}</td>
         <td>${tag(client.risk)}</td><td>${client.alerts.length}</td><td>${escapeHtml(next)}<small>${escapeHtml(client.row?.lastNote || 'Semana sem dados')}</small></td></tr>`;
      }).join('')}</tbody></table></div><div class="table-result" role="status">${list.length} oficinas com os filtros atuais</div>` :
    `<p class="empty" role="status">Nenhuma oficina corresponde aos filtros. ${button('clear', 'Limpar filtros', '', 'quiet')}</p>`;
}

function clientsView() {
  return `${page('Carteira de clientes', 'Revise a operação por oficina e acompanhe as ações em aberto.')}
  <section class="panel">${panelHead('Oficinas monitoradas')}
    <div class="filter-row">
      <label class="field search">Buscar oficina<input type="search" data-filter="search" value="${escapeHtml(filters.search)}" placeholder="Digite o nome da oficina"></label>
      ${selectFilter('label', 'Saúde', [['', 'Todas'], 'Saudável', 'Atenção', 'Crítico', 'Sem base', 'Não se aplica'])}
      ${selectFilter('plan', 'Serviço', [['', 'Todos'], 'Pacote completo', 'ChatEngrena', 'Assessoria'])}
      ${selectFilter('risk', 'Risco', [['', 'Todos'], 'Alto', 'Atenção', 'Em avaliação', 'Baixo'])}
      ${selectFilter('tenure', 'Tempo de carteira', [['', 'Qualquer'], ['initial', 'Menos de 30 dias'], ['mature', '30 dias ou mais']])}
      ${selectFilter('action', 'Acompanhamento', [['', 'Todos'], ['alerts', 'Com alertas'], ['pending', 'Com ações em aberto']])}
      ${selectFilter('sort', 'Ordenar por', [['risk', 'Risco e alertas'], ['name', 'Nome da oficina'], ['low', 'Menor nota'], ['high', 'Maior nota']])}
      ${button('clear', 'Limpar filtros', '', 'quiet')}
    </div><div id="client-table">${clientTable()}</div>
  </section>`;
}

function alertCard(alert) {
  const status = alertStatus(alert);
  const linked = interventions.filter(item => item.alert === alert.id);
  const owner = linked.find(item => item.status !== 'Resolvido');
  return `<li class="alert-card" data-alert-id="${escapeHtml(alert.id)}" tabindex="-1">
    <div class="row">${tag(alert.priority)}${tag(status)}</div>
    <h3>${escapeHtml(alert.title)}</h3>
    <p><strong>${escapeHtml(catalog[alert.client].name)}</strong> · Semana até ${date(alert.date)} · ${escapeHtml(alert.metric)}</p>
    <p>${escapeHtml(alert.cleared ? 'A atualização da base da demonstração normalizou este sinal.' : alert.evidence)}</p>
    ${alert.unverified ? '<p>A base atual não permite confirmar a resolução. Confira a fonte antes de concluir.</p>' : ''}
    ${!alert.cleared ? `<p><strong>Ação sugerida</strong> ${escapeHtml(alert.action)}</p>` : ''}
    ${owner ? `<p><strong>${escapeHtml(owner.role)}</strong> · Prazo ${date(owner.due)}</p>` : ''}
    <footer>
       ${button('client', 'Abrir oficina', alert.client, 'quiet')}
       ${index === CS.latest && !alert.cleared ? button(owner ? 'edit-intervention' : 'register-alert', owner ? 'Acompanhar ação' : 'Registrar ação', owner ? owner.id : alert.id) : ''}
    </footer></li>`;
}

function alertsView() {
  const available = listAlerts().filter(alert =>
    (!filters.priority || filters.priority === alert.priority) &&
    (!filters.alertClient || filters.alertClient === alert.client) &&
    (!filters.alertType || filters.alertType === alert.key) &&
    (!filters.alertState || (filters.alertState === 'Ativos' ? !alert.cleared : alertStatus(alert) === filters.alertState)));
  return `${page('Central de alertas', 'Confira o que disparou cada alerta e encaminhe a ação para a função responsável.')}
  <section class="panel">${panelHead('Alertas da semana')}
    <div class="filter-row">
    ${selectFilter('priority', 'Prioridade', [['', 'Todas'], 'Crítica', 'Alta', 'Média'])}
    ${selectFilter('alertClient', 'Oficina', [['', 'Todas'], ...portfolio().map(c => [c.id, c.name])])}
    ${selectFilter('alertType', 'Tipo de alerta', [['', 'Todos'], ...Object.entries(CS.cause).map(([key, item]) => [key, item.title])])}
    ${selectFilter('alertState', 'Situação', [['Ativos', 'Ativos'], ['', 'Todos'], 'Em aberto', 'Em andamento', 'A verificar', 'Normalizado'])}
    </div>
    <div class="inside">${available.length ? `<ul class="alert-list">${available.map(alertCard).join('')}</ul>` : '<p class="empty">Não há alertas para os filtros escolhidos.</p>'}</div>
  </section>`;
}

function interventionCard(item) {
  const status = item.closed && item.closed > CS.weeks[index][1] ? 'Em andamento' : item.status;
  const late = status !== 'Resolvido' && item.due < CS.weeks[index][1];
  return `<li class="intervention-card"><div class="row">${tag(status)}${late ? '<span class="tag red">Prazo vencido</span>' : ''}</div>
    <h3>${escapeHtml(item.text)}</h3><p>${escapeHtml(item.role)} · Registro ${date(item.date)} · Prazo ${date(item.due)}</p>
    ${item.diagnosis ? `<p><strong>Problema</strong> ${escapeHtml(item.diagnosis)}</p>` : ''}
    ${status === 'Resolvido' ? `<p><strong>Evidência de conclusão</strong> ${escapeHtml(item.evidence)}</p>` : ''}
    ${index === CS.latest ? `<footer>${button('edit-intervention', status === 'Resolvido' ? 'Ver registro' : 'Atualizar ação', item.id)}</footer>` : ''}
  </li>`;
}

function metricTable(adoption) {
  if (!adoption.details.length) return '<p class="empty">A pontuação de adoção é calculada para oficinas com ChatEngrena e base disponível.</p>';
  return `<div class="table-wrap" role="region" tabindex="0" aria-label="Tabela de indicadores de adoção"><table class="metrics-table">
    <thead><tr><th scope="col">Indicador</th><th scope="col">Observado</th><th scope="col">Meta</th><th scope="col">Peso</th><th scope="col">Pontos</th></tr></thead>
    <tbody>${adoption.details.map(item => `<tr>
      <td><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.meaning)}</small></td>
      <td>${item.state === 'missing' ? 'Indisponível' : item.total === 0 ? 'Sem oportunidade' : `${item.done} de ${item.total}<small>${Math.round(item.rate)}%${!item.valid ? ' · Amostra pequena' : item.rate < item.goal ? ' · Abaixo da meta' : ''}</small>`}</td>
      <td>${item.goal}%</td><td>${item.weight}%</td><td>${item.points !== null ? decimal(item.points) : 'n/d'}</td></tr>`).join('')}
    </tbody></table></div>`;
}

function statList(rows) {
  return `<dl class="summary-metrics">${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
}

function detailView() {
  const client = portfolio().find(item => item.id === clientId);
  if (!client) return `${page('Oficina sem dados no período', 'Selecione uma semana posterior à entrada da oficina.')}${button('view', 'Voltar à carteira', 'clients')}`;
  const row = client.row;
  const score = client.adoption;
  const records = interventions.filter(item => item.client === client.id && item.date <= CS.weeks[index][1]).sort((a, b) => b.date.localeCompare(a.date));
  const alerts = listAlerts().filter(item => item.client === client.id);
  const history = CS.weeks.map((_, i) => CS.score(client, CS.baseline(client, i, edits)).value);
  const feedback = CS.weeks.slice(0, index + 1).map((week, i) => [week[2], CS.baseline(client, i, edits)?.scoreFeedback]).filter(([, rating]) => rating != null);
  const count = row?.channels.reduce((sum, amount) => sum + amount, 0);
  const stats = row ? [
    ['Contatos recebidos', n(count)],
    ['Google', n(row.channels[0])], ['Meta', n(row.channels[1])], ['Outros e origem desconhecida', n(row.channels[2])],
    ['Ligações recebidas', n(row.calls?.[0])], ['Ligações atendidas', n(row.calls?.[1])],
    ['Ligações não atendidas', n(row.calls ? row.calls[0] - row.calls[1] : null)], ['Ligações feitas', n(row.calls?.[2])],
    ...(client.plan === 'Assessoria' ? [] : [
      ['Atendimento efetivo', n(row.measures.service.state === 'count' ? row.measures.service.done : null)],
      ['Tempo médio de resposta', row.speedAvg == null ? 'Indisponível' : `${n(row.speedAvg)} min`],
      ['Orçamentos enviados', n(row.quotes)], ['Agendamentos criados', n(row.booked)],
      ['Contatos da semana que agendaram', row.linkedBookings == null || count === 0 ? 'Indisponível' : `${row.linkedBookings} de ${count} (${Math.round(row.linkedBookings * 100 / count)}%)`],
      ['Serviços com registro e valor', n(row.measures.record.state === 'count' ? row.measures.record.done : null)],
      ['Valor registrado pela oficina', reais(row.value)],
    ]),
  ] : [];
  return `
    <div class="row no-print">${button('view', priorView === 'alerts' ? 'Voltar aos alertas' : 'Voltar à carteira', priorView, 'quiet')}</div>
    <div class="pagehead">
      <div class="detail-top"><div><p class="eyebrow">${escapeHtml(client.plan)} · ${escapeHtml(client.phase)}</p><h1>${escapeHtml(client.name)}</h1>
      <p class="lead">${escapeHtml(client.owner)} · Cliente desde ${date(client.since)}</p>
      <p class="help">Contato de demonstração · ${client.id}@exemplo.invalid</p></div></div>${interval()}
    </div>
    <div class="kpis">
      ${kpi('Nota de adoção', score.value == null ? 'n/d' : decimal(score.value), score.label)}
      ${kpi('Cobertura da base', score.coverage == null ? 'n/d' : `${Math.round(score.coverage)}%`, 'Peso dos indicadores válidos')}
      ${kpi('Satisfação', row?.scoreFeedback == null ? 'n/d' : `${row.scoreFeedback} de 5`, 'Avaliação da oficina')}
      ${kpi('Risco de cancelamento', client.risk, `${client.alerts.length} alertas ativos na semana`, client.risk === 'Alto' ? 'risk' : '')}
    </div>
    <div class="pair">
      <section class="panel">${panelHead('Indicadores de adoção', 'Confira a base usada em cada indicador.', index === CS.latest ? button('edit-data', 'Editar simulação', client.id) : '')}${metricTable(score)}</section>
      <section class="panel">${panelHead('Histórico de adoção')}${chart('detail-chart', history, 'client')}</section>
    </div>
    <div class="pair">
      <section class="panel panel-pad"><h2>Demanda e resultados</h2><p>Contatos por origem identificada. Ligações ficam em uma contagem própria. Valores refletem os registros da oficina.</p>${stats.length ? statList(stats) : '<p>Semana sem dados.</p>'}</section>
      <section class="panel panel-pad"><h2>Satisfação e contexto</h2><p>${escapeHtml(row?.feedbackNote || 'Sem comentário registrado na semana.')}</p>
       ${feedback.length ? statList(feedback.map(([period, rating]) => [period, `${rating} de 5`])) : '<p>Sem avaliação registrada até esta semana.</p>'}
       <details class="details-box"><summary>Responsáveis e próxima ação</summary><p>Engrena: função de Customer Success. Oficina: ${escapeHtml(client.owner)}.</p><p>${escapeHtml(client.alerts[0]?.action || client.next)}</p></details>
      </section>
    </div>
    <div class="pair">
      <section class="panel">${panelHead('Intervenções registradas', '', index === CS.latest ? button('register', 'Nova intervenção', client.id, 'button') : '')}
        <div class="inside">${records.length ? `<ul class="intervention-list">${records.map(interventionCard).join('')}</ul>` : '<p class="empty">Nenhuma intervenção registrada até esta semana.</p>'}</div>
      </section>
      <section class="panel">${panelHead('Alertas da oficina')}<div class="inside">
        ${alerts.length ? `<ul class="alert-list">${alerts.map(alertCard).join('')}</ul>` : '<p class="empty">Nenhum alerta acionado nesta semana.</p>'}</div>
      </section>
    </div>`;
}

function reportData() {
  const list = portfolio();
  const curr = CS.aggregate(list);
  const previous = index ? Object.fromEntries(CS.portfolio(index - 1, edits).map(entry => [entry.id, entry])) : {};
  const back = index ? CS.aggregate(Object.values(previous)) : null;
  const scores = list.flatMap(client => {
    const now = client.adoption.value;
    const prior = previous[client.id]?.adoption.value;
    return now == null || prior == null ? [] : [{
      name: client.name, delta: Math.round((now - prior) * 10) / 10, now, prior,
      recovered: client.adoption.label === 'Saudável' && previous[client.id].adoption.label !== 'Saudável',
    }];
  });
  const activeAlerts = listAlerts().filter(alert => !alert.cleared);
  const grouped = new Map();
  for (const alert of activeAlerts) grouped.set(alert.title, (grouped.get(alert.title) ?? 0) + 1);
  const issues = [...grouped].sort((a, b) => b[1] - a[1]).map(([name, count]) => `${name} (${count})`);
  const vulnerable = list.filter(entry => entry.risk === 'Alto');
  const [start, end] = CS.weeks[index];
  const recorded = interventions.filter(item => item.date >= start && item.date <= end);
  const completed = interventions.filter(item => item.closed && item.closed >= start && item.closed <= end);
  const pending = interventions.filter(item => item.date <= end && (!item.closed || item.closed > end));
  const clearedAlerts = listAlerts().filter(item => item.cleared);
  const delta = curr.avg !== null && back?.avg != null ? Math.round((curr.avg - back.avg) * 10) / 10 : null;
  const variation = delta === null ? 'período sem comparação anterior' : delta === 0 ? 'estável frente à semana anterior' :
    `${delta > 0 ? 'alta' : 'queda'} de ${decimal(Math.abs(delta))} ponto${Math.abs(delta) === 1 ? '' : 's'} frente à semana anterior`;
  const summary = `A carteira tem ${curr.count} oficinas monitoradas${curr.rated ? ` e adoção média de ${decimal(curr.avg)} entre ${curr.rated} com nota, ${variation}` : ' em uma semana sem base para nota média'}. ${curr.atRisk ? `${curr.atRisk} contrato${curr.atRisk === 1 ? '' : 's'} com risco alto, somando ${reais(curr.monthly)} de mensalidades expostas.` : 'Nenhum contrato com risco alto sinalizado na semana.'}`;
  const movement = entry => `${entry.name} passou de ${decimal(entry.prior)} para ${decimal(entry.now)}`;
  const context = [
    ['Distribuição da carteira', [`${curr.healthy} saudáveis, ${curr.attention} em atenção, ${curr.critical} críticos, ${curr.pending} sem base e ${curr.na} sem aplicação da nota.`]],
    ['Clientes que melhoraram', scores.filter(e => e.delta > 0).sort((a, b) => b.delta - a.delta).map(movement)],
    ['Clientes que pioraram', scores.filter(e => e.delta < 0).sort((a, b) => a.delta - b.delta).map(movement)],
    ['Clientes recuperados', scores.filter(e => e.recovered).map(movement)],
    ['Problemas mais frequentes', issues],
    ['Situação das intervenções', [`${recorded.length} ações registradas na semana, ${completed.length} concluídas e ${pending.length} em aberto ao fim da semana.`, `${activeAlerts.length} alertas ativos e ${clearedAlerts.length} normalizados.`]],
    ['Contratos com risco alto', vulnerable.map(client => `${client.name} · ${reais(client.monthly)} por mês`)],
    ['Evolução da satisfação', [curr.csat == null ? 'Sem avaliações na semana.' :
      `Média atual de ${decimal(curr.csat)} de 5 entre ${curr.surveyed} respondentes.${back?.csat != null ? ` Na semana anterior, ${decimal(back.csat)} de 5 entre ${back.surveyed}.` : ''}`]],
    ['Prioridades da próxima semana', activeAlerts.slice(0, 3).map(alert => `${catalog[alert.client].name} · ${alert.action}`)],
  ];
  return { summary, context, latest: curr, avg: CS.weeks.map((_, i) => CS.aggregate(CS.portfolio(i, edits)).avg) };
}

function reportsView() {
  const report = reportData();
  return `${page('Relatório semanal', 'Resumo da carteira para a gestão da Engrena.')}
  <section class="panel">
    ${panelHead('Resumo executivo', `${weekLabel(index)} · Dados fictícios`, `<div class="row no-print">${button('print', 'Imprimir', '', 'quiet')}${button('export', 'Baixar resumo', '', 'button')}</div>`)}
    <div class="inside"><p class="report-intro">${escapeHtml(report.summary)}</p></div>
    ${report.context.map(([heading, lines]) => `<div class="report-section"><h3>${escapeHtml(heading)}</h3>
      ${lines.length > 1 ? `<ul class="report-list">${lines.map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul>` :
      `<p>${escapeHtml(lines[0] || 'Sem ocorrências na semana.')}</p>`}</div>`).join('')}
  </section>
  <section class="panel section-gap">${panelHead('Histórico da adoção média')}${chart('report-chart', report.avg)}</section>`;
}

function exportReport() {
  const { summary, context, avg } = reportData();
  const history = CS.weeks.slice(0, index + 1).map((_, i) => `${weekLabel(i)} · ${decimal(avg[i])}`).join('\n');
  const body = ['ENGRENA | CUSTOMER SUCCESS', `Resumo executivo · ${weekLabel(index)}`, 'Dados fictícios', '', summary,
    ...context.flatMap(([heading, lines]) => ['', heading, ...(lines.length ? lines : ['Sem ocorrências na semana.'])]),
    '', 'Histórico da adoção média', history].join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF', body], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `Engrena Resumo CS ${CS.weeks[index][1]}.txt`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const screens = { overview, clients: clientsView, alerts: alertsView, reports: reportsView, detail: detailView };
function render() {
  const selected = currentView === 'detail' ? priorView : currentView;
  document.querySelectorAll('[data-view]').forEach(element => {
    if (element.dataset.view === selected) element.setAttribute('aria-current', 'page');
    else element.removeAttribute('aria-current');
  });
  const count = CS.aggregate(portfolio()).alerts;
  document.querySelector('#nav-count').textContent = count || '';
  workspace.innerHTML = screens[currentView]();
}

function navigation(view, focus = true) {
  if (!screens[view]) return;
  currentView = view;
  render();
  if (focus) {
    main.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}

function setPeriod(period, target) {
  if (!CS.weeks[period]) return;
  index = period;
  if (!portfolio().some(item => item.id === filters.alertClient)) filters.alertClient = '';
  render();
  if (target === 'chart') {
    workspace.querySelector(`[data-action="week"][data-value="${period}"]`)?.focus({ preventScroll: true });
  } else {
    workspace.querySelector('[data-period]')?.focus({ preventScroll: true });
  }
}

function modal(title, body, trigger) {
  modalSource = trigger;
  dialogContent.innerHTML = `<div class="modal-head"><h2 id="dialog-title">${escapeHtml(title)}</h2>${button('close', 'Fechar', '', 'quiet')}</div><div class="modal-body">${body}</div>`;
  dialog.showModal();
}

function method(trigger) {
  modal('Metodologia de acompanhamento', `
    <p><strong>Pontuação de 1 a 10.</strong> Para cada indicador com pelo menos cinco casos, divida a taxa observada pela meta e limite o resultado a 100%. Multiplique pelo peso. Some os pontos, divida pela soma dos pesos válidos e multiplique por 10, com piso de 1.</p>
    <p><strong>Cobertura.</strong> É a proporção do peso válido sobre o peso aplicável. Soma pelo menos 70% e exige Atendimento efetivo válido para exibir nota. Base ausente ou com 1 a 4 casos fica pendente. Zero oportunidades comprovadas sai da base aplicável.</p>
    <p><strong>Faixas.</strong> Saudável a partir de 8,5. Atenção de 6,0 a 8,4. Crítico abaixo de 6,0. A primeira casa decimal determina a faixa. Assessoria sem ChatEngrena acompanha demanda, entregas, satisfação e risco.</p>
    <p><strong>Prazos iniciais.</strong> Resposta humana em 15 minutos úteis desde a entrada ou a transferência. Para a IA, use 5 minutos durante o período em que está configurada para atender. Contatos que ultrapassam 60 minutos úteis geram alerta na fila aplicável.</p>
    <p><strong>Risco alto.</strong> Intenção de cancelar, falha crítica aberta ou avaliação de 3 ou menos. A receita em risco soma as mensalidades fictícias da Engrena desses contratos. A satisfação e os valores que a oficina registrou aparecem separadamente.</p>
    <p><strong>Demonstração local.</strong> Você pode editar a semana de 16 a 22 de novembro. As alterações ficam neste navegador quando o armazenamento local está disponível. As semanas anteriores preservam os dados de origem.</p>`, trigger);
}

function editData(id, trigger) {
  if (index !== CS.latest || !catalog[id]) return;
  const client = catalog[id];
  const row = CS.baseline(client, index, edits);
  if (!row) return;
  const fields = client.plan === 'Assessoria' ? '' : `
    <p class="help">Deixe os dois campos vazios para indicar que o dado está indisponível. Use 0 nos dois campos quando a fonte confirmar que não houve casos elegíveis.</p>
    ${CS.metrics.map(metric => {
      const entry = row.measures[metric.key];
      return `<div class="edit-row"><strong>${escapeHtml(metric.name)}</strong>
        <label class="field">Executados<input aria-label="${escapeHtml(metric.name)} executados" type="number" min="0" max="1000000" step="1" name="${metric.key}Done" value="${entry.state === 'missing' ? '' : entry.done}"></label>
        <label class="field">Elegíveis<input aria-label="${escapeHtml(metric.name)} elegíveis" type="number" min="0" max="1000000" step="1" name="${metric.key}Total" value="${entry.state === 'missing' ? '' : entry.total}"></label></div>`;
    }).join('')}
    <label class="field">Contatos com mais de 60 minutos úteis sem resposta<input type="number" name="overdue" min="0" max="1000000" required value="${row.overdue}"></label>
    <label class="field">Retornos de orçamento vencidos e ainda pendentes<input type="number" name="openQuotes" min="0" max="1000000" required value="${row.openQuotes}"></label>
    <label class="field">Ações operacionais na semana<input type="number" name="useActions" min="0" max="1000000" required value="${row.useActions}"></label>`;
  modal('Editar dados da simulação', `<form id="scenario-form" data-client="${client.id}" class="edit-grid">
    ${fields}
    <label class="field">Satisfação da oficina<select name="feedback">${choices([['', 'Sem avaliação'], 1, 2, 3, 4, 5], row.scoreFeedback ?? '')}</select></label>
    ${client.plan === 'Assessoria' ? `<label class="field">Retorno do responsável registrado<select name="ownerSignal">${choices([['1', 'Sim'], ['0', 'Pendente']], row.ownerSignal ? '1' : '0')}</select></label>` : ''}
    <label class="field">Falha crítica em aberto<select name="failure">${choices([['0', 'Não'], ['1', 'Sim']], row.criticalFailure ? '1' : '0')}</select></label>
    <label class="field">Intenção explícita de cancelamento<select name="cancel">${choices([['0', 'Não'], ['1', 'Sim']], row.cancel ? '1' : '0')}</select></label>
    <p class="error" role="alert"></p>
    <div class="form-actions">${button('close', 'Cancelar')}<button type="submit" class="button">Recalcular indicadores</button></div>
    </form>`, trigger);
}

function storeScenario(form) {
  const id = form.dataset.client;
  const client = catalog[id];
  const values = new FormData(form);
  const row = structuredClone(CS.baseline(client, index, edits));
  const error = form.querySelector('.error');
  if (client.plan !== 'Assessoria') {
    for (const metric of CS.metrics) {
      const done = values.get(`${metric.key}Done`);
      const total = values.get(`${metric.key}Total`);
      if ((done === '') !== (total === '') || Number(done) > Number(total)) {
        error.textContent = `${metric.name}. Preencha os dois campos ou deixe ambos vazios. O número executado deve ser menor ou igual ao elegível.`;
        form.elements.namedItem(`${metric.key}Done`).focus();
        return;
      }
      row.measures[metric.key] = done === '' ? { state: 'missing', total: 0, done: 0 } : { state: 'count', total: Number(total), done: Number(done) };
    }
    row.overdue = Number(values.get('overdue'));
    row.openQuotes = Number(values.get('openQuotes'));
    row.useActions = Number(values.get('useActions'));
    const quote = row.measures.quote;
    if (quote.state === 'count' && row.openQuotes > quote.total - quote.done) {
      error.textContent = 'Os retornos vencidos em aberto não podem exceder os retornos que ficaram fora do prazo.';
      form.elements.namedItem('openQuotes').focus();
      return;
    }
  } else {
    row.ownerSignal = values.get('ownerSignal') === '1';
  }
  row.scoreFeedback = values.get('feedback') ? Number(values.get('feedback')) : null;
  row.criticalFailure = values.get('failure') === '1';
  row.cancel = values.get('cancel') === '1';
  row.lastNote = 'Indicadores ajustados na simulação';
  CS.alertList(index, edits, seen).filter(alert => !alert.cleared).forEach(alert => { seen[alert.id] = alert; });
  edits[id] = row;
  CS.alertList(index, edits, seen).filter(alert => !alert.cleared).forEach(alert => { seen[alert.id] = alert; });
  closeAndRender('edit-data', id);
  save('Indicadores recalculados na simulação.');
}

function intervention(id, alertId, item, trigger) {
  if (index !== CS.latest || !catalog[id]) return;
  const alert = alertId ? listAlerts().find(entry => entry.id === alertId) : null;
  const locked = item?.status === 'Resolvido';
  if (locked) {
    modal('Intervenção concluída', `<p>${escapeHtml(item.text)}</p><p><strong>Responsável</strong> ${escapeHtml(item.role)}</p>
      ${item.diagnosis ? `<p><strong>Problema</strong> ${escapeHtml(item.diagnosis)}</p><p><strong>Origem e evidência inicial</strong> ${escapeHtml(item.source || 'Pendente')}</p><p><strong>Causa</strong> ${escapeHtml(item.reason || 'Pendente')}</p>` : ''}
      <p><strong>Evidência de conclusão</strong> ${escapeHtml(item.evidence)}</p><p><strong>Encerramento</strong> ${date(item.closed)}</p>`, trigger);
    return;
  }
  modal(item ? 'Atualizar intervenção' : 'Nova intervenção', `<form id="intervention-form" class="edit-grid" data-id="${item?.id || ''}" data-client="${id}" data-alert="${escapeHtml(alertId || '')}">
    <p><strong>${escapeHtml(catalog[id].name)}</strong>${alert ? ` · ${escapeHtml(alert.title)}` : ''}</p>
    <label class="field">Problema observado<input name="diagnosis" maxlength="200" required value="${escapeHtml(item?.diagnosis ?? alert?.title ?? '')}"></label>
    <label class="field">Origem e evidência inicial<input name="source" maxlength="300" value="${escapeHtml(item?.source ?? alert?.evidence ?? '')}"></label>
    <label class="field">Causa confirmada<input name="reason" maxlength="200" placeholder="Deixe em branco se estiver investigando." value="${escapeHtml(item?.reason ?? '')}"></label>
    <label class="field">Ação<textarea name="text" required maxlength="500">${escapeHtml(item?.text ?? alert?.action ?? '')}</textarea></label>
    <label class="field">Responsável pela ação<select name="role" required>${choices(CS.roles, item?.role || alert?.owner || CS.roles[0])}</select></label>
    <label class="field">Prazo<input name="due" type="date" value="${item?.due || CS.asOf}" required></label>
    <label class="field">Status<select name="status">${choices(['Em aberto', 'Em andamento', 'Resolvido'], item?.status || 'Em aberto')}</select></label>
    <label class="field">Evidência de resolução<textarea name="evidence" maxlength="500" placeholder="Descreva o que confirmou a solução.">${escapeHtml(item?.evidence || '')}</textarea></label>
    ${alert ? '<p class="help">O registro documenta a ação. O alerta é normalizado quando o indicador da simulação deixa de disparar a regra.</p>' : ''}
    <p class="error" role="alert"></p><div class="form-actions">${button('close', 'Cancelar')}<button type="submit" class="button">Salvar intervenção</button></div>
    </form>`, trigger);
}

function storeIntervention(form) {
  const values = new FormData(form);
  const error = form.querySelector('.error');
  const text = values.get('text').trim();
  const diagnosis = values.get('diagnosis').trim();
  const status = values.get('status');
  const evidence = values.get('evidence').trim();
  if (!diagnosis || !text || (status === 'Resolvido' && !evidence)) {
    error.textContent = !diagnosis ? 'Descreva o problema observado.' : !text ? 'Descreva a ação a realizar.' : 'Registre a evidência para marcar a intervenção como resolvida.';
    form.elements.namedItem(!diagnosis ? 'diagnosis' : !text ? 'text' : 'evidence').focus();
    return;
  }
  const old = interventions.find(item => item.id === form.dataset.id);
  const id = old?.id ?? (globalThis.crypto?.randomUUID?.() || `i${Date.now()}`);
  const item = { id, client: form.dataset.client, alert: form.dataset.alert, date: old?.date || CS.asOf,
    due: values.get('due'), role: values.get('role'), status, text, diagnosis, source: values.get('source').trim(), reason: values.get('reason').trim(), evidence, closed: status === 'Resolvido' ? CS.asOf : '' };
  interventions = old ? interventions.map(entry => entry.id === id ? item : entry) : [...interventions, item];
  closeAndRender('edit-intervention', id);
  save('Intervenção registrada.');
}

function closeAndRender(action, value) {
  const source = modalSource;
  modalSource = null;
  dialog.close();
  render();
  const active = [...workspace.querySelectorAll(`[data-action="${action}"]`)].find(button => button.dataset.value === value);
  if (active) active.focus({ preventScroll: true });
  else if (source?.dataset.value && currentView === 'alerts') {
    const card = [...workspace.querySelectorAll('[data-alert-id]')].find(element => element.dataset.alertId === source.dataset.value);
    (card || main).focus({ preventScroll: true });
  } else {
    main.focus({ preventScroll: true });
  }
}

document.addEventListener('click', event => {
  const target = event.target.closest('[data-view], [data-action]');
  if (!target) return;
  if (target.dataset.view) {
    navigation(target.dataset.view);
    return;
  }
  const { action, value } = target.dataset;
  if (action === 'view') navigation(value);
  if (action === 'method') method(target);
  if (action === 'week') setPeriod(Number(value), 'chart');
  if (action === 'clear') {
    filters = { ...defaultFilters };
    render();
    workspace.querySelector('[data-filter="search"]')?.focus();
  }
  if (action === 'client') {
    if (currentView !== 'detail') priorView = currentView === 'alerts' ? 'alerts' : 'clients';
    clientId = value;
    navigation('detail');
  }
  if (action === 'alert-focus') {
    filters = { ...filters, priority: '', alertClient: '', alertType: '', alertState: 'Ativos' };
    navigation('alerts');
    const card = [...workspace.querySelectorAll('[data-alert-id]')].find(element => element.dataset.alertId === value);
    card?.focus();
    card?.scrollIntoView({ block: 'nearest' });
  }
  if (action === 'close') dialog.close();
  if (action === 'edit-data') editData(value, target);
  if (action === 'register') intervention(value, '', null, target);
  if (action === 'register-alert') {
    const alert = listAlerts().find(item => item.id === value);
    if (alert) intervention(alert.client, alert.id, null, target);
  }
  if (action === 'edit-intervention') {
    const item = interventions.find(entry => entry.id === value);
    if (item) intervention(item.client, item.alert, item, target);
  }
  if (action === 'print') window.print();
  if (action === 'export') exportReport();
});

document.addEventListener('input', event => {
  if (event.target.dataset.filter !== 'search') return;
  filters.search = event.target.value;
  document.querySelector('#client-table').innerHTML = clientTable();
});

document.addEventListener('change', event => {
  const field = event.target;
  if ('period' in field.dataset) setPeriod(Number(field.value), 'select');
  const key = field.dataset.filter;
  if (key && key !== 'search') {
    filters[key] = field.value;
    if (currentView === 'clients') document.querySelector('#client-table').innerHTML = clientTable();
    else {
      render();
      workspace.querySelector(`[data-filter="${key}"]`)?.focus({ preventScroll: true });
    }
  }
});

document.addEventListener('keydown', event => {
  if ((event.key === ' ' || event.key === 'Enter') && event.target.dataset.action === 'week') {
    event.preventDefault();
    setPeriod(Number(event.target.dataset.value), 'chart');
  }
});

dialog.addEventListener('close', () => {
  if (modalSource?.isConnected) modalSource.focus({ preventScroll: true });
  modalSource = null;
});

dialog.addEventListener('submit', event => {
  event.preventDefault();
  if (event.target.id === 'scenario-form') storeScenario(event.target);
  if (event.target.id === 'intervention-form') storeIntervention(event.target);
});

render();
