# Dashboard de Customer Success da Engrena

Este documento descreve o comportamento do HTML aprovado e serve de especificação para uma implementação ligada ao ChatEngrena. Use o código como referência de paridade e valide a versão integrada com os cenários da seção 10.

## 1. O que o painel responde

O painel informa quais oficinas estão utilizando adequadamente a operação contratada, onde o processo comercial trava, quais acompanhamentos precisam de ação e quanto da receita contratual da Engrena está exposto a risco alto.

| Conceito | Significado |
| --- | --- |
| Adoção | Nota de 1 a 10 sobre a execução das etapas da plataforma |
| Cobertura | Proporção do peso dos indicadores para os quais existe base utilizável |
| Satisfação | Avaliação da oficina em escala de 1 a 5, acompanhada de contexto |
| Risco de cancelamento | Classificação operacional derivada de sinais, alertas e disponibilidade de evidência |
| Resultado comercial | Contatos, atendimento, orçamentos, agenda, serviços e valores registrados pela oficina |
| Receita mensal em risco | Soma das mensalidades da Engrena dos clientes classificados com risco alto |

Os indicadores de adoção valem para contratos com ChatEngrena, inclusive o pacote completo. Clientes de assessoria sem ChatEngrena permanecem na carteira para acompanhamento de demanda, satisfação e risco. Sua nota de adoção aparece como **Não se aplica**.

## 2. Arquivos, período e comportamento da demonstração

| Arquivo | Responsabilidade |
| --- | --- |
| [HTML autônomo](engrena/customer-success/output/dashboard/Dashboard%20Customer%20Success%20Engrena.html) | Versão entregue, com marca, dados, estilo e scripts embutidos |
| [model.js](engrena/customer-success/source/dashboard/model.js) | Dados fictícios, pontuação, regras de alerta e agregação da carteira |
| [app.js](engrena/customer-success/source/dashboard/app.js) | Interface, filtros, gráficos, formulários, persistência local e relatório |
| [shell.html](engrena/customer-success/source/dashboard/shell.html) e [style.css](engrena/customer-success/source/dashboard/style.css) | Estrutura da aplicação, estilos responsivos e de impressão |
| [build.cjs](engrena/customer-success/source/dashboard/build.cjs) | Gera o HTML a partir dos arquivos de origem e do SVG |

### Período

- A base contém quatro semanas de segunda a domingo, de 26/10/2026 a 22/11/2026. O seletor inicia na última.
- Cada semana é uma tupla `[inicio, fim, rotulo]`. Na demonstração o índice da última semana define as edições permitidas e seu fim define `asOf`, a data usada ao registrar e concluir uma intervenção.
- Um cliente entra no recorte se `since <= fim_da_semana`. Todos os clientes cadastrados no exemplo são ativos. A demo possui somente a data de entrada.
- A interface exibe o histórico de adoção das quatro semanas. O ponto do gráfico e o seletor alteram a visão do período. Quando as notas têm lacunas, o traçado fica interrompido. O resumo exportado inclui somente as semanas até a selecionada.
- As semanas anteriores têm leitura apenas. O formulário **Editar simulação** substitui uma cópia dos dados da semana mais recente do cliente. A partir dela o painel recalcula nota, cobertura, alertas e risco.
- Na produção, represente início e fim explícitos no fuso da operação, com início inclusivo e fim exclusivo. Preserve a mesma semana de negócio para todas as fontes. O fim de domingo que aparece na interface equivale ao instante imediatamente anterior à segunda-feira seguinte.

### Armazenamento

A demonstração usa `localStorage`, chave `engrena-customer-success-demo-v1`, com `{ edits, interventions, seen }`. `edits` contém os dados substituídos da última semana por cliente, `interventions` armazena as ações e `seen` retém alertas já observados. Uma aba consegue funcionar em memória quando o armazenamento local fica bloqueado. Abra o mesmo arquivo no mesmo navegador para testar a persistência. A demo funciona offline, sem API, sincronização, autenticação ou notificações externas.

## 3. Contrato de dados da demonstração

### Cliente

| Campo | Tipo e interpretação |
| --- | --- |
| `id` | Identificador estável da oficina do exemplo |
| `name`, `initials` | Nome e iniciais fictícios |
| `plan` | `Pacote completo`, `ChatEngrena` ou `Assessoria` |
| `since` | Data de entrada em formato `AAAA-MM-DD` |
| `monthly` | Mensalidade fictícia da Engrena em reais |
| `phase` | `Implantação` ou `Acompanhamento` |
| `owner` | Função da pessoa responsável na oficina |
| `next` | Próxima ação padrão usada quando não há prioridade identificada |

### Registro semanal

O cadastro é associado a um registro semanal por cliente. Um registro inteiro pode ser `null`. As seis medições têm a estrutura `{ state, done, total }`, na qual `done` é o numerador e `total` é o denominador.

| Campo | Tipo e interpretação |
| --- | --- |
| `measures` | Chaves `service`, `speed`, `quote`, `schedule`, `record` e `aftercare`, uma medição por chave |
| `state` da medição | `count` para contagem disponível, inclusive `0/0`, e `missing` para fonte sem dado |
| `channels` | Vetor `[Google, Meta, outros_e_desconhecidos]` de contatos |
| `calls` | Vetor `[recebidas, atendidas, efetuadas]` ou `null` |
| `speedAvg` | Tempo médio de resposta em minutos ou `null` |
| `quotes` | Orçamentos enviados no período ou `null` |
| `booked` | Agendamentos criados no período ou `null` |
| `linkedBookings` | Contatos da semana identificados como autores de algum agendamento ou `null` |
| `value` | Valor registrado pela oficina em reais ou `null` |
| `scoreFeedback` | Nota de satisfação de 1 a 5 ou `null` |
| `feedbackNote` | Contexto textual da avaliação |
| `ownerSignal` | Indica que existe retorno do responsável no acompanhamento de assessoria |
| `criticalFailure` | Indica falha crítica de integração ou automação ainda aberta |
| `cancel` | Indica manifestação explícita de intenção de cancelar |
| `overdue` | Contatos sem resposta acima de 60 minutos úteis, já contabilizados na fonte |
| `openQuotes` | Retornos de orçamento vencidos e ainda pendentes |
| `useActions` | Quantidade de ações operacionais elegíveis para comparação de uso |
| `lastNote` | Descrição recente da atividade ou atualização da oficina |

O formulário do exemplo aceita pares de inteiros de 0 a 1.000.000, com `0 <= done <= total`. Ambos vazios gravam `missing` e ambos preenchidos gravam `count`. Para orçamentos com contagem disponível, `openQuotes <= total - done`. Um retorno concluído fora do prazo reduz o desempenho daquela semana, mas deixa de compor os retornos vencidos ainda abertos. Quando inexistentes, os valores auxiliares devem chegar como desconhecidos na implementação integrada.

## 4. Cálculo completo da adoção

### Numeradores, denominadores, metas e pesos

| Chave | Indicador | Numerador `done` | Denominador `total` | Peso | Meta |
| --- | --- | --- | --- | ---: | ---: |
| `service` | Atendimento efetivo | Contatos com resposta útil de IA ou da equipe | Contatos elegíveis para atendimento | 25 | 95% |
| `speed` | Resposta no prazo | Contatos ou transferências atendidos dentro do prazo aplicável | Contatos ou transferências elegíveis para medição de prazo | 15 | 80% |
| `quote` | Orçamentos acompanhados | Retornos efetuados até o vencimento | Retornos de orçamento com vencimento no período | 15 | 85% |
| `schedule` | Agenda atualizada | Agendamentos com presença, ausência ou reagendamento registrado | Agendamentos que precisavam de desfecho no período | 15 | 90% |
| `record` | Serviços registrados | Serviços concluídos com registro completo, inclusive valor | Serviços confirmados como concluídos | 20 | 90% |
| `aftercare` | Pós-venda enviado | Envios automáticos confirmados | Pós-vendas previstos e elegíveis para envio | 10 | 95% |

Uma resposta útil resolve o pedido ou conduz a conversa ao próximo passo. O horário configurado da IA determina quando ela pode responder. A equipe assume as exceções, fornece os orçamentos de serviço e atualiza presença, reagendamento, execução e valor. A IA pode agendar e cotar pneus quando o estoque integrado está disponível. O cálculo trata o canal de resposta como parte do prazo aplicável, e o atendimento efetivo pode ser humano ou automatizado.

### Aplicabilidade, cobertura e cálculo

1. Para cada indicador com `state=count` e `total>0`, calcule `taxa = 100 * done / total`. Preserve a precisão ao comparar a meta.
2. Um indicador é válido para a nota quando `state=count` e `total >= 5`. Cada indicador válido contribui `peso * min(taxa / meta, 1)`.
3. Some os pesos dos indicadores válidos para obter `pesoValido`. Some os pesos aplicáveis para obter `pesoAplicavel`.
4. Na demo, `count 0/0` comprovado é sem oportunidade e fica fora de `pesoAplicavel`. `missing` e amostras de um a quatro casos continuam no peso aplicável e ficam fora do peso válido. Isso evita que lacunas aumentem artificialmente a cobertura. Em produção, represente também ausência de uma funcionalidade contratada como inaplicabilidade explícita.
5. `cobertura = 100 * pesoValido / pesoAplicavel`. Quando `pesoAplicavel=0`, a cobertura é 0. A interface mostra a porcentagem arredondada, mas a regra usa a cobertura antes do arredondamento.
6. A nota exige cobertura de pelo menos 70% e Atendimento efetivo válido. Sem essas condições, o retorno é `value=null` e o rótulo fica **Sem base**. O cliente em assessoria sem plataforma retorna **Não se aplica**, com nota e cobertura nulas. Um cliente com plataforma que não possui registro semanal retorna **Sem base**, com cobertura nula.
7. Calcule `notaBruta = max(1, 10 * somaDosPontos / pesoValido)`. O limite de 10 decorre do teto de cada contribuição. O JavaScript grava `Math.round(notaBruta * 10) / 10`, usando uma casa decimal antes de classificar.

| Nota arredondada | Classificação |
| --- | --- |
| 8,5 até 10,0 | Saudável |
| 6,0 até 8,4 | Atenção |
| 1,0 até 5,9 | Crítico |

A coluna **Pontos** de cada indicador mostra a contribuição ponderada antes de reescalar a soma para 1 a 10. Os rótulos de adoção e risco são independentes.

### Exemplo completo

Na semana final, `c2` tem os pares `52/64, 40/64, 21/37, 20/26, 14/20, 12/19`, na ordem da tabela. Todos os denominadores são válidos e a cobertura é 100%. Os pontos aproximados, sem arredondar na conta final, são `21,38158 + 11,71875 + 10,01590 + 12,82051 + 15,55556 + 6,64820 = 78,14050`. A nota é `10 * 78,14050 / 100 = 7,81405`, exibida como **7,8**, classe **Atenção**. Em atendimento efetivo, por exemplo, `52/64 = 81,25%` e a contribuição é `25 * min(81,25 / 95, 1) = 21,38158`.

Em `c8`, os pesos de Atendimento efetivo e Pós-venda estão indisponíveis. Os outros quatro somam 65 de 100. O resultado é **Sem base**, mesmo com boas taxas nos indicadores disponíveis. A falha técnica aberta ainda produz **Risco alto**.

## 5. Alertas e risco

### Detecção

O modelo produz uma ocorrência por cliente, semana e regra. O ID da demo tem formato `cliente/indiceDaSemana/codigo`. A lista é ordenada por Crítica, Alta e Média.

| Código | Condição exata na demo | Prioridade | Função sugerida |
| --- | --- | --- | --- |
| `cancellation` | `cancel=true` | Crítica | Gestão da Engrena |
| `failure` | `criticalFailure=true` | Alta | Suporte e implantação |
| `overdue` | `overdue>0`, para contrato com plataforma | Alta | Liderança da oficina |
| `satisfaction` | Avaliação conhecida e `scoreFeedback <= 3` | Alta | Customer Success |
| `quote` | Contrato com plataforma, retorno com contagem disponível, `total>=5` e `5 * openQuotes > total` | Média | Liderança da oficina |
| `adoption` | Contrato com plataforma e semana anterior. Volume de contatos de ambas as semanas pelo menos 5, ações anteriores pelo menos 5, variação absoluta de volume de até 25%, ações atuais abaixo de 60% das anteriores e nenhuma falha crítica nas duas semanas | Média | Customer Success |

Em `quote`, exatamente 20% com atraso fica abaixo do gatilho. Em `adoption`, exatamente 40% de queda fica abaixo do gatilho e exatamente 25% de diferença de volume é permitido. A comparação considera `abs(volumeAtual / volumeAnterior - 1)`. O volume soma `channels`; ligações ficam fora dessa conta. Em `overdue`, a demo recebe a contagem pronta. O relógio de minutos úteis deve ser calculado na integração. Prazos iniciais do manual: 5 minutos com IA ativa e 15 minutos úteis para atendimento humano, desde a chegada ou a transferência aplicável. O alerta de fila usa a marca estrita de mais de 60 minutos úteis.

### Estados e normalização

1. **Em aberto** quando a regra está ativa e nenhuma intervenção vinculada permanece aberta.
2. **Em andamento** enquanto houver intervenção vinculada não resolvida.
3. **A verificar** quando um alerta observado deixa de ser retornado em uma edição e a demo identifica uma lacuna especial. Ocorre para satisfação apagada, orçamento sem fonte ou com menos de cinco casos e pendência positiva, ou queda de uso durante falha crítica atual.
4. **Normalizado** quando o alerta observado deixa de ser retornado e os testes específicos de ausência de dados acima não se aplicam.

A ordem no código é `Normalizado`, `A verificar`, `Em andamento`, `Em aberto`. Os dois primeiros se referem ao estado da detecção e os outros se referem ao trabalho associado. Apenas os normalizados saem da contagem de alertas pendentes. Encerrar uma intervenção exige evidência e mantém a regra de detecção independente. Se a regra ainda disparar depois do encerramento, o alerta volta a aparecer **Em aberto**, salvo se houver outra intervenção em aberto. Na demo, preservar alertas conhecidos e detectar normalizações se aplica à semana editável. As semanas anteriores recalculam os alertas diretamente de sua base.

### Classificação de risco, em ordem

| Ordem | Condição | Resultado |
| --- | --- | --- |
| 1 | Registro semanal ausente | Em avaliação |
| 2 | Intenção de cancelar, falha crítica aberta ou alerta ativo de insatisfação, inclusive A verificar | Alto |
| 3 | Outro alerta pendente ou adoção Crítica | Atenção |
| 4 | Assessoria com retorno do responsável registrado, ou contrato com plataforma e nota calculável | Baixo |
| 5 | Demais casos | Em avaliação |

O risco alto é um sinal para priorização. A receita mensal exposta soma as mensalidades de clientes com risco alto uma vez por cliente, independentemente do número de alertas.

## 6. Cálculos das telas e do relatório

### Visão geral e carteira

| Medida | Cálculo |
| --- | --- |
| Clientes ativos | Total de clientes admitidos no recorte |
| Distribuição de saúde | Contagem por Saudável, Atenção, Crítico, Sem base e Não se aplica |
| Percentual saudável | `100 * saudáveis / clientes_com_nota`, arredondado para inteiro na tela |
| Barra de distribuição | Cada fatia tem `100 * clientes_do_grupo / total_da_carteira` |
| Adoção média | Média simples das notas já arredondadas dos clientes com nota, exibida com uma casa decimal |
| Comparação da média | Média atual menos média anterior, arredondada para um decimal; indisponível se faltar uma média |
| Satisfação média | Soma das notas de satisfação conhecidas dividida pela quantidade de respostas; exibe também a quantidade |
| Alertas pendentes | Soma de ocorrências que não estão Normalizado |
| Intervenções vencidas | Registro criado até o fim da semana, prazo estritamente anterior ao fim, e um encerramento inexistente ou posterior ao fim |
| Receita mensal em risco | Soma de `monthly` apenas onde `risk=Alto`; exibição em reais sem centavos na demo |

A busca na Carteira ignora caixa e acentos. Filtros simultâneos usam interseção. O tempo de carteira é `fimDaSemana - since` em dias, e a faixa inicial cobre menos de 30 dias. A ordenação padrão mostra risco Alto, Atenção, Em avaliação e Baixo, desempata pela quantidade de alertas e preserva a ordem original no empate restante. Ordenar por nota põe notas ausentes por último. A próxima ação da tabela usa a intervenção aberta com prazo mais próximo, depois a ação do primeiro alerta e depois a anotação padrão.

### Ficha da oficina

- Contatos recebidos somam Google, Meta e outros ou origem desconhecida do período. Contagem pertence ao contato elegível da oficina, com uma classificação de origem por contato.
- Ligações não atendidas são `recebidas - atendidas` no mesmo universo. Ligações efetuadas aparecem separadamente. O cartão usa indisponível quando não há fonte.
- **Contatos da semana que agendaram** usa `linkedBookings / total_de_contatos`, expresso como fração e porcentagem inteira, quando os dois dados existem e o denominador é positivo. Agendamentos criados no período podem vir de contatos de semanas anteriores.
- O tempo médio, os orçamentos enviados e o valor registrado vêm do registro semanal. A demo não calcula esses valores a partir de eventos. Serviços registrados exibem o numerador de `record` quando disponível.
- Valor registrado é um dado operacional da oficina. Atribuir faturamento a um canal exige vínculo verificável entre contato e serviço, inclusive data e regra de atribuição.

### Relatório semanal

- Melhoras e pioras exigem notas comparáveis para o mesmo cliente nas duas semanas. A diferença é a nota atual menos a anterior. Recuperados passaram de uma classe inferior à classe **Saudável** com nota nas duas semanas.
- Problemas frequentes agrupam ocorrências pendentes por tipo e ordenam pela frequência. Prioridades do próximo período são as primeiras três ocorrências pendentes em ordem de prioridade.
- Ações registradas usam intervalo inclusivo de criação. Concluídas usam intervalo inclusivo de encerramento. Pendentes são as ações que estavam abertas no fim da semana. Abrir e encerrar na mesma semana pode contar nos dois primeiros grupos.
- A satisfação mostra contagem e média das respostas atuais e, quando disponível, da semana anterior.
- A impressão usa o navegador. **Baixar resumo** gera texto UTF‑8 com marca de codificação, com contexto e histórico até a semana escolhida.
- A média entre semanas pode mudar em função da composição da carteira e da cobertura. O relatório de clientes que melhoraram ou pioraram compara apenas quem tem nota nos dois períodos.

## 7. Intervenções e edição do cenário

| Campo da intervenção | Uso |
| --- | --- |
| `id`, `client`, `alert` | Identificador próprio, oficina e vínculo opcional com alerta |
| `date`, `due`, `closed` | Registro, vencimento e encerramento. Na demo, criação e fechamento usam `asOf` |
| `diagnosis`, `source`, `reason` | Problema observado, origem da evidência e causa confirmada |
| `text`, `role`, `status` | Ação, função responsável e estado |
| `evidence` | Evidência de conclusão, obrigatória para resolver |

O formulário exige problema, ação, função e prazo. Oferece os estados **Em aberto**, **Em andamento** e **Resolvido**. Origem e causa podem ficar pendentes durante a investigação. Ao resolver, a intervenção fica em modo de consulta. Em uma ficha histórica, uma ação encerrada depois do período ainda aparece em andamento. A edição das métricas altera os pares e sinais definidos no formulário. Ela mantém os totais auxiliares de demanda e resultado como estavam, pois os campos da demonstração foram preparados para ensaiar as regras de saúde.

## 8. Integração com operação real

### Eventos e fontes que a Engrena precisa mapear

| Fonte ou entidade | Chaves e dados mínimos | Agregação proposta |
| --- | --- | --- |
| CRM e contrato da Engrena | `client_id`, unidade, plano, horários, fuso, início, fim, mensalidade em centavos, recursos habilitados | Elegibilidade da carteira, cobertura, filtros e mensalidade vigente |
| Entrada de contatos e atribuição | `contact_id` estável, `client_id`, data e canal de entrada, origem confirmada ou desconhecida, referência da origem | Um contato por oportunidade elegível, Google e Meta identificados; cliques, sessões e visualizações ficam em métricas próprias |
| Caixa de entrada | Contato, conversa, data de entrada, eventos de resposta, ator humano ou IA, indicação de resposta efetiva, momento de transferência e responsável | Atendimento efetivo, prazo, fila sem resposta e evidências |
| Telefonia | `call_id`, cliente, direção, data, estado final, vínculo opcional com contato | Recebidas, atendidas e efetuadas; deduplicar retornos do provedor |
| Orçamentos e retornos | `quote_id`, contato, envio, `followup_id`, vencimento e conclusão | Total de retornos devidos, feitos no prazo e vencidos ainda abertos |
| Agenda | `appointment_id`, contato, criação, horário programado, desfecho e momento de registro | Agendamentos criados, desfechos devidos e contatos identificados que agendaram |
| Ordem de serviço | `service_id`, contato ou agendamento relacionado, status confirmado, conclusão, momento do registro e valor em centavos | Denominador de serviços concluídos, numerador completo e valor registrado |
| Pós-venda | `aftercare_id`, serviço, elegibilidade, data prevista, tentativa, aceite ou confirmação do provedor | Envios esperados e confirmados; diferencie confirmação de envio e entrega ao destinatário |
| Satisfação e incidentes | Nota, respondente autorizado, instante, feedback, incidente, criticidade, estado, manifestação de cancelamento e referências | Último resultado aplicável ao recorte conforme regra acordada e sinais críticos com trilha de evidência |

### Regras de integração

- Preserve identidade por cliente e, se houver mais de uma unidade, por unidade. Defina a chave da oportunidade comercial com a Engrena antes de deduplicar. Um mesmo telefone pode reaparecer em uma oportunidade distinta.
- Processe cada evento idempotentemente, com chave do provedor e do evento. Registre fonte, instante do evento, instante recebido e versão. Preserve mudanças e estornos para refazer agregados de um período.
- Calcule horários úteis com a agenda da oficina ou do responsável, fuso, pausas e feriados conforme política combinada. Para humano, inicie na chegada quando a equipe é responsável desde o início, ou na transferência quando a IA encaminha. Para IA aplique horário ativo e as regras de pausa da oficina. Defina como lidar com reabertura, troca de responsável e múltiplas transferências e teste esses cenários.
- Use a data que expressa a obrigação da métrica. Exemplo: retorno pertence à semana do vencimento; desfecho pertence à semana em que deveria ser registrado. Quando houver atraso na ingestão, versões posteriores devem manter a data do fato e registrar a revisão.
- Registre se cada fonte está completa, parcial, indisponível ou fora do escopo por cliente e período. Zero elegíveis significa ausência comprovada de oportunidades. Se houver perda de acesso ou atraso, mantenha o indicador pendente e preserve o alerta como A verificar enquanto falta evidência de encerramento, inclusive ao cruzar semanas.
- Defina uma unidade de análise por indicador e documente como evitar dupla contagem. Conte cada retorno elegível por `followup_id`, cada desfecho por agendamento, cada serviço por ordem e cada envio por obrigação de pós-venda. Alguns casos podem ter mais de um evento com o mesmo identificador.
- Para serviço concluído, obtenha um denominador que permita encontrar registros faltantes, como uma confirmação operacional independente. Usar somente ordens já lançadas como denominador mascara subregistro.
- Separe as janelas das conversões. Para “contatos da semana que agendaram”, conte contatos distintos da semana com agendamento vinculado e use uma data de corte consistente para medir a maturação. Para conversão em serviço, crie métrica própria depois de validar identidade e datas.
- Para valores, armazene centavos como inteiros e moeda separada. Use valores de contrato vigentes na semana do indicador de risco. Distinga valor registrado, confirmação de pagamento e atribuição por canal.
- Mantenha pesos, metas, relógios e gatilhos versionados. Exiba a versão usada no cálculo histórico. Valide a calibragem após um primeiro ciclo de resultados reais antes de ajustar os padrões documentados.

## 9. Caminho para implementar com outra IA

1. Execute o HTML localmente e percorra Visão geral, Carteira, ficha da oficina, Alertas, Relatórios e Metodologia. Use os estilos e componentes do dashboard como referência para a interface já aprovada.
2. Separe fonte de dados, cálculo e renderização. Reproduza primeiro as fórmulas puras e prove paridade com o conjunto fictício, inclusive estados nulos e arredondamento.
3. Confirme APIs, exportações e tabelas reais na operação. A disponibilidade de integração de cada fonte ainda deve ser verificada. Use um adaptador por fonte, com IDs estáveis, janelas explícitas e validação do contrato.
4. Persista clientes, eventos, resumos semanais versionados, alertas, intervenções e evidências no backend. Exemplo de chaves de resumo `(cliente_id, unidade_id, semana_inicio, versao_calculo)`. Registre quem criou, alterou e concluiu cada intervenção, com timestamp do servidor.
5. Preserve alertas ativos até que haja avaliação com evidência suficiente. Modele detecção e intervenção como entidades próprias. Registre reaberturas e altere estados com transações e controle de concorrência. Defina o que aparece na semana de origem e nas semanas em que o caso permanece aberto.
6. Ofereça à interface uma consulta de carteira por período, ficha detalhada, fila de alertas, registros de intervenção e geração do resumo. Os nomes de rotas e o banco de dados ficam a cargo do projeto real.
7. Aplique autenticação e autorização por perfil e cliente ou unidade, validação no servidor, escopo aos relatórios e trilha de auditoria. Evite histórico de conversas e dados pessoais em logs e exportações desnecessários. Use credenciais somente no ambiente do servidor.
8. Valide as fontes e os agregados com casos reais autorizados em ambiente de testes. Trate a falta de dado como um estado operacional visível. Depois de confirmar números e funções, faça a transição do exemplo estático para a versão de uso interno.

Para a IA que receber este repositório, a primeira entrega é a paridade verificável. Em seguida, apresente o mapa de fontes e campos que foram confirmados, as lacunas que dependem da Engrena e os testes usados antes de conectar a fonte de produção.

## 10. Resultados esperados e testes de aceitação

### Base original, semana de 16 a 22 de novembro de 2026

| Cliente | Nota | Adoção | Cobertura | Risco | Alertas pendentes |
| --- | ---: | --- | ---: | --- | ---: |
| c1, Atlas | 10,0 | Saudável | 100% | Baixo | 0 |
| c2, Horizonte | 7,8 | Atenção | 100% | Atenção | 2 |
| c3, Impulso | 4,3 | Crítico | 100% | Alto | 5 |
| c4, Rota | 9,8 | Saudável | 100% | Baixo | 0 |
| c5, Circuito | 9,9 | Saudável | 100% | Baixo | 0 |
| c6, Ponto | n/d | Sem base | 0% | Em avaliação | 0 |
| c7, Nexo | n/d | Não se aplica | n/d | Baixo | 0 |
| c8, Eixo | n/d | Sem base | 65% | Alto | 1 |

Resultados consolidados: **8** clientes ativos, **5** com nota, **3** saudáveis, **60%** saudáveis entre quem tem nota, adoção média **8,36** exibida como **8,4**, satisfação média **4,4** com **7** respostas, **8** alertas pendentes, **2** contratos com risco alto e **R$ 5.950** em mensalidades expostas. O relatório inicial mostra 3 ações registradas, 1 concluída, 2 em aberto e 1 prazo vencido na visão geral.

Para conferir rapidamente o modelo na raiz do repositório:

```sh
node -e "const x=require('./engrena/customer-success/source/dashboard/model.js'); console.table(x.portfolio(x.latest).map(c=>({id:c.id,nota:c.adoption.value,risco:c.risk,alertas:c.alerts.length}))); console.log(x.aggregate(x.portfolio(x.latest)))"
```

### Casos a verificar

| Caso | Resultado esperado |
| --- | --- |
| Indicador com quatro casos | Taxa pode aparecer na ficha, contribuição fica pendente |
| Indicador com contagem disponível `0/0` | Indicador fica fora do peso aplicável |
| Indicador com `0/5` | Indicador válido com contribuição de zero |
| Atendimento inválido com demais dados | Nota Sem base |
| Cobertura em 70% com Atendimento válido | Nota numérica |
| Resultado arredondado para 8,5 ou 6,0 | Saudável ou Atenção, respectivamente |
| Orçamentos com 2 retornos abertos de 10 | Sem sinal de orçamento |
| Orçamentos com 3 retornos abertos de 10 | Sinal de orçamento |
| Remover a fonte de orçamentos de `c2` após existir alerta | Alertas conserva o caso como A verificar |
| Atualizar os orçamentos de `c2` para `25/25` e zero abertos | O alerta de orçamento fica Normalizado. A fila de contatos continua sujeita à sua regra |
| Resolver ação sem evidência | Formulário impede o encerramento |
| Resolver uma intervenção com regra ainda ativa | A intervenção fica resolvida. O alerta continua pendente |
| Editar a semana final, recarregar e abrir as anteriores | A alteração persiste localmente. As notas históricas de origem ficam iguais |
| Exportar relatório da terceira semana | O arquivo identifica 9 a 15 de novembro e só inclui o histórico até essa semana |
| Abrir no celular, navegar, filtrar e editar | Os controles continuam utilizáveis e a tabela permite rolagem horizontal no próprio contêiner |
