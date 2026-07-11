# ContabCalc AI

Plataforma inteligente de cálculos trabalhistas e contábeis brasileiros — não apenas mostra o número, explica cada verba, a fórmula e a base legal.

## Status atual

🚧 Fase 1 — motor de cálculo (client-side, sem backend ainda).

Módulo implementado: **Rescisão sem justa causa** (saldo de salário, aviso prévio, férias vencidas/proporcionais + 1/3, 13º proporcional, FGTS + multa 40%, INSS e IRRF com o redutor da Lei 15.270/2025).

## Como testar agora

Abra `demo-rescisao.html` diretamente no navegador — sem instalação, sem build. Todo o motor de cálculo está reimplementado em JS puro nesse arquivo para teste imediato.

## Estrutura

```
types/index.ts                          # contrato de saída padrão (ResultadoCalculo, ItemCalculo)
lib/engine/legislacao/2026.ts           # tabelas oficiais vigentes (INSS, IRRF, FGTS, salário mínimo)
lib/engine/inss/calcularInss.ts
lib/engine/irrf/calcularIrrf.ts
lib/engine/ferias/calcularFerias.ts
lib/engine/decimoTerceiro/calcularDecimoTerceiro.ts
lib/engine/rescisao/semJustaCausa.ts    # orquestra todos os módulos acima
lib/engine/utils/datas.ts               # meses proporcionais, dias de aviso prévio etc.
demo-rescisao.html                      # demo standalone, roda no navegador
ARQUITETURA.md                          # planejamento completo da plataforma
```

## Fonte das tabelas de legislação (2026)

- **INSS:** salário mínimo R$1.621,00, teto de contribuição R$8.475,55, alíquotas progressivas 7,5%/9%/12%/14%.
- **IRRF:** tabela progressiva da Lei 15.191/2025 + redutor da Lei 15.270/2025 (isenção total até R$5.000, redução parcial até R$7.350).
- **FGTS:** 8% de depósito, multa de 40% (sem justa causa) / 20% (acordo).

Tabelas versionadas por ano em `lib/engine/legislacao/` — nunca sobrescrever, sempre criar um novo arquivo (`2027.ts`) quando a lei mudar, preservando auditabilidade de cálculos antigos.

## Próximos passos

- Demais tipos de rescisão (justa causa, pedido de demissão, acordo, experiência)
- FGTS, Seguro-Desemprego, Salário Líquido como módulos independentes
- Interface completa (formulário + tela de resultado com breakdown)
- Painel do Contador (login, histórico de clientes) — quando chegar aqui, plugar num schema separado dentro de um projeto Supabase já existente, para não estourar o limite de 2 projetos gratuitos
