## Estado Atual do Projeto

Data: 2026-04-02

### Stack
- Backend: FastAPI
- Frontend: React 19 + TypeScript + MUI 7
- Banco: PostgreSQL
- Auth: JWT com login, logout e refresh

### Backend
- CRUD completo para `Categoria`, `Prioridade`, `Ocorrencia` e `Historico`
- Paginacao server-side
- Filtros dinamicos por campo, operador e valor
- Validacao de CPF
- Maquina de estados:
  - `Aberta -> Em Analise -> Em Andamento -> Resolvida -> Fechada`
  - `Cancelada` apenas a partir de `Aberta`
- Historico automatico nas mudancas de status
- Rotas protegidas com JWT, exceto login
- Rate limiting nos endpoints de autenticacao
- CORS restrito
- Erros tratados sem expor detalhes internos

### Frontend
- Tela de login
- Dashboard com contadores por status
- CRUD de ocorrencias com DataGrid e filtros
- Dialogo de criacao/edicao com React Hook Form + Zod
- Exibicao de historico por ocorrencia
- Componentes reutilizaveis com prefixo `Tx`

### Infra e Ambiente
- Node.js instalado e frontend compilando com `npm run build`
- PostgreSQL local validado com:
  - usuario: `postgres`
  - senha: `987456`
  - banco: `fiscateste`

### Validacoes Ja Feitas
- Fluxo completo de autenticacao
- Protecao de rotas
- CRUD e filtros
- Regras de transicao de status
- Historico automatico
- Refresh e logout
- Testes funcionais usando PostgreSQL real

### Pendencias Relevantes
- `git` nao esta disponivel no terminal atual
- Refatorar melhor o `frontend/src/App.tsx` para melhorar organizacao/componentizacao
- Tratar aviso tecnico residual de `passlib`/`bcrypt`
