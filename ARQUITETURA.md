# ContabCalc AI — Planejamento de Arquitetura

## 1. Stack Tecnológica (proposta)

Dado que você já domina Supabase (usado no CTT e no Meu Bolso), a proposta aproveita essa base:

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend/Auth/DB:** Supabase (Postgres + Auth + Row Level Security)
- **Motor de cálculo:** pacote isolado em TypeScript puro (`/lib/engine`), sem dependência de UI ou banco — testável e versionável independente da legislação
- **PWA:** manifest + service worker (padrão que você já usa no CTT/Meu Bolso)
- **Geração de PDF:** biblioteca client-side (pdf-lib ou react-pdf)
- **Gráficos:** Chart.js (já é seu padrão)
- **Hospedagem:** Vercel (frontend) + Supabase (dados) — GitHub Pages não serve aqui porque precisamos de rotas dinâmicas e RLS multiusuário (painel do contador)

> Alternativa mais simples: se preferir manter seu padrão de arquivo único/PWA estático como no CTT, dá para fazer uma v1 só com React + Supabase client-side, sem Next.js. Posso ajustar se preferir esse caminho.

---

## 2. Estrutura de Pastas

```
contabcalc-ai/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                 # landing
│   │   ├── rescisao/page.tsx
│   │   ├── ferias/page.tsx
│   │   ├── decimo-terceiro/page.tsx
│   │   ├── fgts/page.tsx
│   │   ├── seguro-desemprego/page.tsx
│   │   ├── salario-liquido/page.tsx
│   │   ├── horas-extras/page.tsx
│   │   └── adicionais/page.tsx
│   ├── (contador)/
│   │   ├── dashboard/page.tsx
│   │   ├── clientes/page.tsx
│   │   ├── funcionarios/page.tsx
│   │   ├── calculos/page.tsx
│   │   └── relatorios/page.tsx
│   └── api/                         # rotas server-side (PDF, export, webhooks)
├── lib/
│   ├── engine/                      # MOTOR DE CÁLCULO — puro, sem UI
│   │   ├── rescisao/
│   │   │   ├── semJustaCausa.ts
│   │   │   ├── justaCausa.ts
│   │   │   ├── pedidoDemissao.ts
│   │   │   ├── acordo.ts
│   │   │   ├── experiencia.ts
│   │   │   └── indireta.ts
│   │   ├── ferias/
│   │   ├── decimoTerceiro/
│   │   ├── fgts/
│   │   ├── inss/
│   │   ├── irrf/
│   │   ├── horas/
│   │   ├── adicionais/
│   │   └── segurodesemprego/
│   ├── legislacao/                  # tabelas versionadas por vigência
│   │   ├── inss/2026.ts, 2025.ts...
│   │   ├── irrf/2026.ts, 2025.ts...
│   │   ├── salarioMinimo/2026.ts...
│   │   └── index.ts                 # resolve tabela vigente por data
│   ├── explicacoes/                 # textos didáticos + base legal por verba
│   └── validacoes/                  # regras de consistência (datas, piso, etc.)
├── components/
│   ├── ui/                          # shadcn primitives
│   ├── calculadora/                 # inputs, resultado, breakdown, PDF button
│   └── contador/                    # tabelas, filtros, dashboard
├── supabase/
│   ├── migrations/
│   └── schema.sql
└── types/
    └── index.ts
```

---

## 3. Modelo de Dados (Supabase / Postgres)

```sql
-- Perfis (contador ou usuário comum)
perfis (id, user_id, tipo['contador','usuario'], nome, plano, created_at)

-- Clientes do contador (pessoa física/empresa que ele atende)
clientes (id, contador_id, nome, cnpj_cpf, email, telefone, created_at)

-- Empresas
empresas (id, cliente_id, razao_social, cnpj, cnae, convencao_coletiva_id)

-- Funcionários
funcionarios (
  id, empresa_id, nome, cpf, cargo, salario,
  data_admissao, data_desligamento, jornada,
  dependentes, estado, cidade, categoria_id,
  sindicato_id, beneficios jsonb, descontos jsonb, observacoes
)

-- Convenções coletivas / categorias (fonte de piso salarial, adicionais)
categorias_profissionais (id, nome, piso_salarial, estado, sindicato, vigencia_inicio, vigencia_fim)

-- Tabelas legais versionadas (histórico, nunca sobrescrever)
tabela_inss (id, vigencia_inicio, vigencia_fim, faixas jsonb)
tabela_irrf (id, vigencia_inicio, vigencia_fim, faixas jsonb, deducao_dependente)
tabela_salario_minimo (id, vigencia_inicio, vigencia_fim, valor)
tabela_fgts (id, vigencia_inicio, aliquota)

-- Histórico de cálculos (auditável, nunca editar — só criar nova versão)
calculos (
  id, perfil_id, funcionario_id, tipo_calculo, input jsonb,
  resultado jsonb, base_legal jsonb, criado_em, favorito bool
)
```

**Princípio-chave:** nenhuma tabela de legislação é editada in-place — cada mudança de lei gera uma nova linha com `vigencia_inicio`, preservando cálculos antigos auditáveis (igual ao seu princípio de "nunca perder dado histórico" no CTT).

---

## 4. Motor de Cálculo — Contrato de Interface

Todo módulo de cálculo segue o mesmo formato de saída, para que a UI de "resultado detalhado" seja genérica:

```typescript
interface ResultadoCalculo {
  valorFinal: number;
  itens: {
    codigo: string;          // ex: "aviso_previo"
    descricao: string;       // "Aviso Prévio Indenizado"
    valor: number;
    formula: string;         // "salário / 30 × dias"
    baseLegal: string;       // "Lei 12.506/2011"
    explicacao: string;      // texto didático
  }[];
  descontos: MesmoFormatoAcima[];
  alertas: string[];         // inconsistências detectadas
  faqRelacionado: {pergunta: string, resposta: string}[];
}
```

Isso garante: qualquer módulo novo (férias, 13º, FGTS...) "encaixa" automaticamente nos componentes de resultado, PDF, exportação, sem retrabalho de UI.

---

## 5. Estratégia de Atualização da Legislação

1. Tabelas de INSS/IRRF/salário mínimo/FGTS ficam em `lib/legislacao/`, **versionadas por ano/vigência**, nunca sobrescritas.
2. Função central `resolverTabelaVigente(tipo, data)` decide qual tabela usar — cálculos retroativos continuam corretos mesmo após mudança de lei.
3. Pisos salariais por categoria/convenção ficam no banco (não no código), porque mudam por sindicato e são numerosos — mais fácil manter via painel admin do que via deploy.
4. Checklist trimestral (documentado em `/lib/legislacao/CHECKLIST.md`) para revisar: tabela INSS, tabela IRRF, salário mínimo, teto FGTS, valor seguro-desemprego.

---

## 6. Fluxo de Navegação

```
Landing → Escolher módulo (Rescisão, Férias, 13º, FGTS, Salário, Horas...)
   → Formulário guiado (dados do funcionário + situação específica)
   → Validação em tempo real (alertas de inconsistência)
   → Tela de Resultado:
        - Valor final em destaque
        - Breakdown item a item (com fórmula + base legal + explicação)
        - Botões: Salvar / PDF / Compartilhar / Novo cálculo
   → (se logado como contador) → salvo automaticamente no histórico do cliente
```

Painel do Contador (área logada):
```
Dashboard → Clientes → Empresas → Funcionários → Histórico de Cálculos
                                                 → Comparar / Duplicar
                                                 → Relatórios / Exportação em massa
```

---

## 7. Ordem de Implementação Recomendada (por valor entregue)

| Fase | Entregável |
|---|---|
| **1** | Motor de cálculo: Rescisão sem justa causa + Férias + 13º (os 3 mais buscados) |
| **2** | UI da calculadora pública (formulário + resultado detalhado + PDF) |
| **3** | Auth Supabase + Painel do Contador (clientes/funcionários/histórico) |
| **4** | Demais módulos de rescisão (justa causa, acordo, experiência, indireta) |
| **5** | FGTS, Seguro-Desemprego, Salário Líquido (INSS/IRRF), Horas/Adicionais |
| **6** | Diferenças regionais (convenções coletivas, pisos por categoria) |
| **7** | Dashboard estatístico, comparação de cálculos, exportação em massa |

---

## 8. Observação sobre responsabilidade legal

Cálculos trabalhistas têm implicação jurídica direta. A plataforma deve deixar claro em todas as telas de resultado: **"Cálculo estimado, não substitui orientação de contador ou advogado trabalhista"** — isso protege você juridicamente e é padrão em qualquer calculadora comercial séria do setor.
