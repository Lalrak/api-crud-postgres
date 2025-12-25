# API CRUD com Node.js, Express e PostgreSQL

Este projeto é uma API RESTful desenvolvida em Node.js utilizando o framework Express e banco de dados PostgreSQL. Ela permite operações CRUD (Create, Read, Update, Delete) para gerenciamento de usuários.

## Funcionalidades

- Cadastro de usuários
- Listagem de usuários
- Atualização de dados de usuários
- Remoção de usuários

## Estrutura do Projeto

```
src/
  config/
    db.js                # Configuração da conexão com o banco de dados
  controller/
    userController.js    # Lógica dos endpoints de usuário
  data/
    createUserTable.js   # Script para criação da tabela de usuários
    data.sql             # Dados de exemplo
  middlewares/
    errorHandler.js      # Middleware de tratamento de erros
    inputValidator.js    # Middleware de validação de entrada
  models/
    userModel.js         # Model de usuário
  routes/
    userRoutes.js        # Rotas da API de usuário
index.js                 # Ponto de entrada da aplicação
```

## Pré-requisitos

- Node.js >= 14.x
- PostgreSQL

## Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/seu-repo.git
   cd seu-repo
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure o banco de dados em `src/config/db.js` conforme suas credenciais.
4. Crie a tabela de usuários executando o script:
   ```bash
   node src/data/createUserTable.js
   ```
5. (Opcional) Popule o banco com dados de exemplo:
   ```bash
   psql -U seu_usuario -d seu_banco < src/data/data.sql
   ```

## Executando a Aplicação

```bash
npm start
```

A API estará disponível em `http://localhost:3000`.

## Endpoints Principais

- `GET /users` — Lista todos os usuários
- `GET /users/:id` — Busca usuário por ID
- `POST /users` — Cria um novo usuário
- `PUT /users/:id` — Atualiza um usuário existente
- `DELETE /users/:id` — Remove um usuário

## Licença

Este projeto está sob a licença MIT.
