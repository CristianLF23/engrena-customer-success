const CS = (() => {
  const weeks = [
    ['2026-10-26', '2026-11-01', '26 out a 1 nov'],
    ['2026-11-02', '2026-11-08', '2 a 8 nov'],
    ['2026-11-09', '2026-11-15', '9 a 15 nov'],
    ['2026-11-16', '2026-11-22', '16 a 22 nov'],
  ];
  const latest = weeks.length - 1;
  const asOf = weeks[latest][1];
  const metrics = [
    { key: 'service', name: 'Atendimento efetivo', weight: 25, goal: 95, meaning: 'Contatos elegíveis com resposta que orienta ou resolve, pela IA ou pelo atendente.' },
    { key: 'speed', name: 'Resposta no prazo', weight: 15, goal: 80, meaning: 'Contatos ou transferências atendidos no prazo aplicável à IA ou ao atendente.' },
    { key: 'quote', name: 'Orçamentos acompanhados', weight: 15, goal: 85, meaning: 'Orçamentos com retorno previsto na semana e acompanhados no prazo.' },
    { key: 'schedule', name: 'Agenda atualizada', weight: 15, goal: 90, meaning: 'Agendamentos com desfecho devido e registrado: compareceu, faltou ou reagendou.' },
    { key: 'record', name: 'Serviços registrados', weight: 20, goal: 90, meaning: 'Serviços confirmados como concluídos com registro completo, incluindo valor.' },
    { key: 'aftercare', name: 'Pós-venda enviado', weight: 10, goal: 95, meaning: 'Envios automáticos confirmados entre os clientes com pós-venda previsto.' },
  ];
  const clients = [
    { id: 'c1', name: 'Oficina Modelo Atlas', initials: 'AT', plan: 'Pacote completo', since: '2026-07-13', monthly: 3900, phase: 'Acompanhamento', owner: 'Coordenação da oficina', next: 'Revisar resultados com a direção' },
    { id: 'c2', name: 'Autocenter Modelo Horizonte', initials: 'HO', plan: 'Pacote completo', since: '2026-08-10', monthly: 3600, phase: 'Acompanhamento', owner: 'Liderança do atendimento', next: 'Revisar os retornos de orçamento' },
    { id: 'c3', name: 'Oficina Modelo Impulso', initials: 'IM', plan: 'Pacote completo', since: '2026-08-03', monthly: 4200, phase: 'Acompanhamento', owner: 'Direção da oficina', next: 'Alinhar a recuperação do atendimento' },
    { id: 'c4', name: 'Autocenter Modelo Rota', initials: 'RO', plan: 'ChatEngrena', since: '2026-09-14', monthly: 1600, phase: 'Acompanhamento', owner: 'Liderança do atendimento', next: 'Conferir a rotina de agenda' },
    { id: 'c5', name: 'Oficina Modelo Circuito', initials: 'CI', plan: 'ChatEngrena', since: '2026-09-28', monthly: 1600, phase: 'Acompanhamento', owner: 'Coordenação da oficina', next: 'Acompanhar a rotina de pós-venda' },
    { id: 'c6', name: 'Autocenter Modelo Ponto', initials: 'PO', plan: 'Pacote completo', since: '2026-11-09', monthly: 3300, phase: 'Implantação', owner: 'Direção da oficina', next: 'Conferir a primeira semana completa' },
    { id: 'c7', name: 'Oficina Modelo Nexo', initials: 'NE', plan: 'Assessoria', since: '2026-09-21', monthly: 2850, phase: 'Acompanhamento', owner: 'Coordenação da oficina', next: 'Conferir a qualidade dos contatos' },
    { id: 'c8', name: 'Autocenter Modelo Eixo', initials: 'EI', plan: 'ChatEngrena', since: '2026-08-31', monthly: 1750, phase: 'Acompanhamento', owner: 'Liderança do atendimento', next: 'Validar a integração de mensagens' },
  ];

  function sample(rates, volume, options = {}) {
    const base = options.denominators || [volume, volume, Math.round(volume * .58), Math.round(volume * .4), Math.round(volume * .32), Math.round(volume * .29)];
    return {
      measures: Object.fromEntries(metrics.map(({ key }, index) => {
        const total = base[index];
        const rate = rates[index];
        const item = rate == null ? { state: 'missing', done: 0, total: 0 } :
          { state: 'count', done: Math.round(total * rate / 100), total };
        return [key, item];
      })),
      channels: options.channels || [Math.round(volume * .45), Math.round(volume * .37), volume - Math.round(volume * .45) - Math.round(volume * .37)],
      calls: options.calls === undefined ? [Math.round(volume * .21), Math.round(volume * .15), Math.round(volume * .11)] : options.calls,
      speedAvg: options.speed ?? null,
      quotes: options.quotes ?? null,
      booked: options.booked ?? null,
      linkedBookings: options.linkedBookings ?? null,
      value: options.value ?? null,
      scoreFeedback: options.feedback ?? null,
      feedbackNote: options.note || '',
      ownerSignal: options.ownerSignal ?? true,
      criticalFailure: options.failure ?? false,
      cancel: options.cancel ?? false,
      overdue: options.overdue ?? 0,
      openQuotes: options.openQuotes ?? Math.max(0, base[2] - Math.round(base[2] * (rates[2] ?? 100) / 100)),
      useActions: options.actions ?? Math.round(volume * 2.5),
      lastNote: options.last || 'Indicadores revisados na semana',
    };
  }

  const seed = {
    c1: [
      sample([90, 78, 82, 86, 89, 90], 73, { feedback: 4 }),
      sample([93, 79, 82, 90, 90, 95], 77, { feedback: 4 }),
      sample([95, 84, 89, 94, 95, 96], 79, { feedback: 5 }),
      sample([98, 92, 91, 96, 96, 98], 84, { feedback: 5, speed: 7, quotes: 52, booked: 35, linkedBookings: 30, value: 36540, last: 'Pós-venda conferido em 22 nov', note: 'A direção ficou satisfeita com a previsibilidade da agenda.' }),
    ],
    c2: [
      sample([86, 74, 78, 84, 80, 78], 60, { feedback: 4 }),
      sample([81, 70, 73, 83, 72, 76], 62, { feedback: 4 }),
      sample([79, 66, 70, 79, 75, 73], 62, { feedback: 4 }),
      sample([82, 63, 56, 75, 70, 61], 64, { feedback: 4, overdue: 2, speed: 22, quotes: 39, booked: 26, linkedBookings: 17, value: 18460, last: 'Revisão de orçamentos em 21 nov', note: 'A equipe relata dificuldade em distribuir a fila de retornos.' }),
    ],
    c3: [
      sample([78, 71, 77, 72, 74, 75], 61, { feedback: 4 }),
      sample([74, 60, 70, 72, 65, 68], 64, { feedback: 4 }),
      sample([60, 49, 57, 55, 53, 57], 64, { feedback: 3, overdue: 3, actions: 150 }),
      sample([49, 30, 33, 44, 30, 40], 60, { feedback: 2, overdue: 8, cancel: true, actions: 75, speed: 44, quotes: 23, booked: 18, linkedBookings: 11, value: 7200, last: 'Sinal de cancelamento em 20 nov', note: 'A direção sinalizou que considera interromper o contrato.' }),
    ],
    c4: [
      sample([59, 46, 52, 54, 51, 58], 45, { feedback: 3, overdue: 3 }),
      sample([67, 58, 59, 61, 64, 65], 47, { feedback: 4, overdue: 1 }),
      sample([77, 68, 73, 71, 70, 72], 49, { feedback: 4 }),
      sample([91, 83, 86, 91, 90, 92], 50, { feedback: 5, speed: 10, quotes: 31, booked: 20, linkedBookings: 16, value: 17840, channels: [8, 5, 37], last: 'Agenda validada em 21 nov' }),
    ],
    c5: [
      sample([93, 82, 86, 91, 91, 91], 55, { feedback: 4 }),
      sample([95, 87, 85, 91, 93, 93], 52, { feedback: 4 }),
      sample([94, 80, 84, 90, 91, 90], 56, { feedback: 5 }),
      sample([93, 85, 85, 88, 92, 92], 56, { feedback: 5, speed: 11, quotes: 31, booked: 23, linkedBookings: 20, value: 21980, channels: [6, 4, 46], last: 'Retornos validados em 20 nov' }),
    ],
    c6: [
      null,
      null,
      sample([100, null, null, 100, null, null], 4, { ownerSignal: false, calls: null }),
      sample([75, 75, 50, 100, null, 100], 4, { ownerSignal: false, calls: null, quotes: 2, booked: 1, last: 'Amostra inicial em 20 nov' }),
    ],
    c7: [
      sample([], 48, { feedback: 4, ownerSignal: true, calls: null }),
      sample([], 52, { feedback: 4, ownerSignal: true, calls: null }),
      sample([], 55, { feedback: 5, ownerSignal: true, calls: null }),
      sample([], 48, { feedback: 5, ownerSignal: true, calls: null, last: 'Qualidade da demanda revisada em 21 nov', note: 'O responsável confirmou que a origem dos contatos está sendo revisada.' }),
    ],
    c8: [
      sample([91, 85, 85, 85, 89, 88], 41, { feedback: 4 }),
      sample([90, 83, 85, 85, 87, 89], 40, { feedback: 4 }),
      sample([93, 86, 88, 90, 90, 91], 41, { feedback: 5 }),
      sample([null, 88, 88, 88, 90, null], 41, { feedback: 5, failure: true, calls: null, channels: [4, 4, 33], last: 'Falha de integração em 22 nov', note: 'Há lacuna no registro da caixa de entrada durante a falha.' }),
    ],
  };
  const cause = {
    cancellation: { title: 'Intenção de cancelamento', priority: 'Crítica', metric: 'Risco de cancelamento', owner: 'Gestão da Engrena', action: 'Ouvir a direção, alinhar expectativas e acordar um plano de recuperação.' },
    failure: { title: 'Falha técnica', priority: 'Alta', metric: 'Integração ou automação', owner: 'Suporte e implantação', action: 'Reproduzir a falha, aplicar contingência e confirmar o funcionamento com um teste.' },
    overdue: { title: 'Contato sem resposta', priority: 'Alta', metric: 'Atendimento efetivo', owner: 'Liderança da oficina', action: 'Assumir as conversas pendentes, priorizar as mais antigas e conferir a fila.' },
    satisfaction: { title: 'Insatisfação', priority: 'Alta', metric: 'Satisfação', owner: 'Customer Success', action: 'Ouvir a causa, combinar uma correção e colher novo retorno da oficina.' },
    quote: { title: 'Retornos vencidos', priority: 'Média', metric: 'Orçamentos acompanhados', owner: 'Liderança da oficina', action: 'Distribuir os retornos atrasados, atualizar os prazos e conferir a execução.' },
    adoption: { title: 'Queda de utilização', priority: 'Média', metric: 'Ações operacionais', owner: 'Customer Success', action: 'Verificar o volume, a rotina, os acessos e a disponibilidade da integração.' },
  };
  const priorities = { 'Crítica': 0, 'Alta': 1, 'Média': 2 };
  const roles = ['Customer Success', 'Gestão da Engrena', 'Tráfego pago', 'Suporte e implantação', 'Liderança da oficina', 'Atendimento da oficina'];
  const firstActions = [
    { id: 'i1', client: 'c3', alert: 'c3/3/cancellation', date: '2026-11-20', due: '2026-11-23', role: 'Gestão da Engrena', status: 'Em andamento', text: 'Agendar conversa com a direção e propor uma primeira correção no atendimento.', diagnosis: 'Intenção de cancelar', source: 'A direção sinalizou a intenção em conversa com CS.', reason: '', evidence: '', closed: '' },
    { id: 'i2', client: 'c2', alert: 'c2/3/quote', date: '2026-11-19', due: '2026-11-20', role: 'Liderança da oficina', status: 'Em andamento', text: 'Distribuir os retornos pendentes por atendente e revisar a fila.', diagnosis: 'Fila de orçamentos atrasada', source: 'Retornos vencidos no recorte da semana.', reason: 'Fila de retornos sem responsável definido.', evidence: '', closed: '' },
    { id: 'i3', client: 'c4', alert: '', date: '2026-11-17', due: '2026-11-21', role: 'Customer Success', status: 'Resolvido', text: 'Revisar o registro de faltas e reagendamentos com a equipe.', diagnosis: 'Desfechos faltando na agenda', source: 'Amostra de agendamentos sem atualização.', reason: 'Rotina de conferência de agenda não estava definida.', evidence: 'A equipe registrou corretamente o desfecho dos casos revisados.', closed: '2026-11-21' },
  ];

  function score(client, row) {
    if (client.plan === 'Assessoria' || !row) {
      return { value: null, coverage: null, label: client.plan === 'Assessoria' ? 'Não se aplica' : 'Sem base', details: [] };
    }
    const details = metrics.map(metric => {
      const item = row.measures[metric.key];
      const empty = item.state === 'count' && item.total === 0;
      const valid = item.state === 'count' && item.total >= 5;
      const rate = item.state === 'count' && item.total ? 100 * item.done / item.total : null;
      return { ...metric, ...item, applicable: !empty, valid, rate, points: valid ? Math.min(rate / metric.goal, 1) * metric.weight : null };
    });
    const applicable = details.filter(metric => metric.applicable).reduce((sum, metric) => sum + metric.weight, 0);
    const valid = details.filter(metric => metric.valid).reduce((sum, metric) => sum + metric.weight, 0);
    const coverage = applicable ? 100 * valid / applicable : 0;
    const eligible = coverage >= 70 && details[0].valid;
    const value = eligible ? Math.round(10 * Math.max(1, 10 * details.reduce((sum, metric) => sum + (metric.points ?? 0), 0) / valid)) / 10 : null;
    const label = value === null ? 'Sem base' : value >= 8.5 ? 'Saudável' : value >= 6 ? 'Atenção' : 'Crítico';
    return { value, coverage, label, details };
  }

  function baseline(client, index, edits) {
    return edits?.[client.id] && index === latest ? edits[client.id] : seed[client.id][index];
  }

  function detect(client, index, edits) {
    const row = baseline(client, index, edits);
    if (!row) return [];
    const prev = index > 0 ? baseline(client, index - 1, edits) : null;
    const date = weeks[index][1];
    const flags = [];
    const add = (code, evidence) => flags.push({ ...cause[code], key: code, client: client.id, date, id: [client.id, index, code].join('/'), evidence });
    if (row.cancel) add('cancellation', 'A direção manifestou intenção de encerrar o contrato.');
    if (row.criticalFailure) add('failure', 'Foi registrada uma falha crítica ainda aberta na semana.');
    if (row.overdue > 0 && client.plan !== 'Assessoria') add('overdue', `${row.overdue} contatos acima de 60 minutos úteis na fila da semana.`);
    if (row.scoreFeedback !== null && row.scoreFeedback <= 3) add('satisfaction', `A satisfação registrada foi de ${row.scoreFeedback} em 5.`);
    const quote = row.measures.quote;
    if (client.plan !== 'Assessoria' && quote.state === 'count' && quote.total >= 5 && 5 * row.openQuotes > quote.total) {
      add('quote', `${row.openQuotes} de ${quote.total} retornos venceram e seguem pendentes.`);
    }
    const volume = entry => entry.channels.reduce((acc, count) => acc + count, 0);
    if (client.plan !== 'Assessoria' && prev && volume(prev) >= 5 && prev.useActions >= 5 && volume(row) >= 5 &&
      Math.abs(volume(row) / volume(prev) - 1) <= .25 && row.useActions / prev.useActions < .6 && !row.criticalFailure && !prev.criticalFailure) {
      add('adoption', `As ações caíram de ${prev.useActions} para ${row.useActions} com volume de contatos semelhante.`);
    }
    return flags.sort((left, right) => priorities[left.priority] - priorities[right.priority]);
  }

  function alertList(index, edits, seen = {}) {
    const active = clients.flatMap(client => detect(client, index, edits));
    if (index !== latest) return active;
    const activeIds = new Set(active.map(alert => alert.id));
    const initial = Object.fromEntries(clients.flatMap(client => detect(client, index, {})).map(alert => [alert.id, alert]));
    const updated = Object.values({ ...initial, ...seen })
      .filter(alert => !activeIds.has(alert.id) && alert.date === asOf)
      .map(alert => {
        const row = edits?.[alert.client];
        const unverified = (alert.key === 'satisfaction' && row?.scoreFeedback == null) ||
          (alert.key === 'quote' && (row?.measures.quote.state !== 'count' ||
            (row.measures.quote.total < 5 && row.openQuotes > 0))) ||
          (alert.key === 'adoption' && row?.criticalFailure);
        return { ...alert, cleared: !unverified, unverified: !!unverified };
      });
    return [...active, ...updated];
  }

  function risk(client, row, snapshot, alerts) {
    if (!row) return 'Em avaliação';
    if (row.cancel || row.criticalFailure || alerts.some(alert => alert.key === 'satisfaction' && !alert.cleared)) return 'Alto';
    if (alerts.some(alert => !alert.cleared) || snapshot.label === 'Crítico') return 'Atenção';
    return client.plan === 'Assessoria' ? row.ownerSignal ? 'Baixo' : 'Em avaliação' :
      snapshot.value !== null ? 'Baixo' : 'Em avaliação';
  }

  function portfolio(index, edits = {}, seen = {}) {
    const signals = alertList(index, edits, seen).filter(alert => !alert.cleared);
    return clients.filter(client => client.since <= weeks[index][1]).map(client => {
      const row = baseline(client, index, edits);
      const adoption = score(client, row);
      const alerts = signals.filter(alert => alert.client === client.id);
      return { ...client, row, adoption, alerts, risk: risk(client, row, adoption, alerts) };
    });
  }

  function aggregate(list) {
    const rated = list.filter(client => client.adoption.value !== null);
    const surveyed = list.filter(client => client.row?.scoreFeedback != null);
    const vulnerable = list.filter(client => client.risk === 'Alto');
    return {
      count: list.length, rated: rated.length, surveyed: surveyed.length,
      healthy: list.filter(client => client.adoption.label === 'Saudável').length,
      attention: list.filter(client => client.adoption.label === 'Atenção').length,
      critical: list.filter(client => client.adoption.label === 'Crítico').length,
      pending: list.filter(client => client.adoption.label === 'Sem base').length,
      na: list.filter(client => client.adoption.label === 'Não se aplica').length,
      avg: rated.length ? rated.reduce((sum, client) => sum + client.adoption.value, 0) / rated.length : null,
      csat: surveyed.length ? surveyed.reduce((sum, client) => sum + client.row.scoreFeedback, 0) / surveyed.length : null,
      atRisk: vulnerable.length, monthly: vulnerable.reduce((sum, client) => sum + client.monthly, 0),
      alerts: list.reduce((sum, client) => sum + client.alerts.length, 0),
    };
  }

  return { weeks, latest, asOf, metrics, seed, clients, cause, roles, firstActions, priorities, baseline, score, alertList, portfolio, aggregate };
})();
if (typeof module !== 'undefined') module.exports = CS;
