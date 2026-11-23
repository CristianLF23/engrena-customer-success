# Customer Success da Engrena

Dashboard de demonstração para acompanhar o uso do ChatEngrena, a satisfação, o risco de cancelamento e as intervenções da equipe de Customer Success. A base contém oito oficinas fictícias e quatro semanas de exemplo.

- [Abrir o arquivo do dashboard no repositório](engrena/customer-success/output/dashboard/Dashboard%20Customer%20Success%20Engrena.html). Baixe o HTML pelo botão de download do GitHub e abra no navegador.
- [Documentação técnica para implementação](DOCUMENTACAO-TECNICA.md). Inclui todas as fórmulas, contrato dos dados, regras de alertas, resultados esperados e orientações para ligar o painel às fontes reais.
- [Código-fonte](engrena/customer-success/source/dashboard). O HTML entregue é autônomo, pode ser aberto sem conexão e usa armazenamento local no navegador.

## Gerar o HTML a partir do código

Na raiz do repositório, com Node.js local, execute:

```sh
node engrena/customer-success/source/dashboard/build.cjs
```

O build reúne a estrutura HTML, o CSS, o modelo, o JavaScript da interface e o SVG da Engrena incluído aqui. Ele grava o HTML em `engrena/customer-success/output/dashboard/`. Para a demonstração, basta abrir o HTML entregue.

SHA-256 do HTML aprovado: `820b53623dfb9daef5763b6f7a29287d24e9fcba050504d7ed35758b750a4eb3`.
