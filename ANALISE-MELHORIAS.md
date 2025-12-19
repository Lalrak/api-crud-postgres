# Análise do Projeto - API CRUD Postgres

Data: 18 de dezembro de 2025

---

## 📊 Resumo Geral

Seu projeto está bem estruturado e segue boas práticas de organização (separação em camadas: routes, controllers, models, middlewares). No entanto, existem alguns pontos de melhoria relacionados a segurança, tratamento de erros, validação e configuração.

---

## 🔴 Problemas Críticos

### 1. **SQL Injection (Sintaxe incorreta no data.sql)**

**Arquivo:** [src/data/data.sql](src/data/data.sql#L5)

**Problema:**
```sql
email VARCHAR(100) UNIQUE NOT NULL
created_at TIMESTAMP DEFAULT NOW()
```
Falta vírgula após `NOT NULL`, o que causará erro de sintaxe no banco.

**Solução:**
```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
)
```

---

### 2. **Falta de Variáveis de Ambiente no Repositório**

**Problema:**
Não há arquivo `.env.example` para guiar outros desenvolvedores sobre quais variáveis são necessárias.

**Solução:**
Criar um arquivo `.env.example`:
```env
DB_USER=seu_usuario
DB_HOST=localhost
DB_NAME=nome_do_banco
DB_PASSWORD=sua_senha
DB_PORT=5432
PORT=3000
NODE_ENV=development
```

---

### 3. **Tratamento de Erros do Pool de Conexões**

**Arquivo:** [src/config/db.js](src/config/db.js)

**Problema:**
O pool não trata erros de conexão, o que pode causar crashes não controlados.

**Solução:**
```javascript
pool.on("connect", () => {
    console.log("Connected to the database");
});

pool.on("error", (err) => {
    console.error("Unexpected error on idle client", err);
    process.exit(-1);
});
```

---

## ⚠️ Problemas Importantes

### 4. **Validação Inconsistente nas Rotas**

**Arquivo:** [src/routes/userRoutes.js](src/routes/userRoutes.js)

**Problema:**
- `POST /user` não tem validação
- `GET /user` tem validação desnecessária (não recebe body)

**Solução:**
```javascript
router.get("/user", getAllUsers); // Remover validação
router.post("/user", validateUser, createUser); // Adicionar validação
router.put("/user/:id", validateUser, updateUser);
```

---

### 5. **Falta de Validação do ID nos Parâmetros**

**Arquivo:** [src/routes/userRoutes.js](src/routes/userRoutes.js)

**Problema:**
IDs não são validados, permitindo valores inválidos como strings ou negativos.

**Solução:**
Criar middleware para validar IDs:
```javascript
// src/middlewares/validateId.js
export const validateId = (req, res, next) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      status: 400,
      message: "Invalid ID format. ID must be a positive number."
    });
  }
  req.params.id = id;
  next();
};
```

Aplicar nas rotas:
```javascript
router.get("/user/:id", validateId, getUserById);
router.put("/user/:id", validateId, validateUser, updateUser);
router.delete("/user/:id", validateId, deleteUser);
```

---

### 6. **Endpoint de Teste em Produção**

**Arquivo:** [src/index.js](src/index.js#L26-L33)

**Problema:**
O endpoint `/test-db` expõe informações sensíveis e não deve estar disponível em produção.

**Solução:**
```javascript
// Adicionar apenas em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  app.get("/test-db", async (req, res) => {
    try {
      const result = await pool.query("SELECT current_database()");
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
```

---

### 7. **Await Faltando na Criação de Tabela**

**Arquivo:** [src/data/createUserTable.js](src/data/createUserTable.js#L12)

**Problema:**
```javascript
pool.query(queryText); // Sem await
```
A query não está sendo aguardada, podendo causar problemas de sincronização.

**Solução:**
```javascript
try {
  await pool.query(queryText);
  console.log("Table users created if not exists");
} catch (error) {
  console.log("Error creating user table: ", error);
}
```

E no [src/index.js](src/index.js#L23):
```javascript
// Antes de iniciar o servidor
await createUserTable();
```

---

## 💡 Melhorias Sugeridas

### 8. **Adicionar Status de Saúde da API**

**Problema:**
Não há endpoint para verificar se a API está funcionando (útil para monitoramento).

**Solução:**
No [src/index.js](src/index.js#L19):
```javascript
// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});
```

---

### 9. **Melhorar Tratamento de Duplicação de Email**

**Arquivo:** [src/models/userModel.js](src/models/userModel.js)

**Problema:**
Violação de constraint única (email duplicado) retorna erro genérico 500.

**Solução:**
```javascript
export const createUserService = async (name, email) => {
    try {
        const result = await pool.query(
            'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
            [name, email]
        );
        return result.rows[0];
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            const err = new Error('Email already exists');
            err.status = 409;
            throw err;
        }
        throw error;
    }
};
```

---

### 10. **Adicionar Validação de Campos no Update**

**Problema:**
O update exige todos os campos, mas deveria permitir atualização parcial.

**Solução:**
Criar schema específico para update:
```javascript
// src/middlewares/inputValidator.js
const updateUserScheme = Joi.object({
  name: Joi.string().min(3),
  email: Joi.string().email(),
}).min(1); // Pelo menos 1 campo deve ser enviado

export const validateUpdateUser = (req, res, next) => {
  const { error } = updateUserScheme.validate(req.body);
  if (error)
    return res.status(400).json({
      status: 400,
      message: error.details[0].message,
    });
  next();
};
```

E atualizar o service:
```javascript
export const updateUserService = async (id, data) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.name) {
        fields.push(`name = $${paramCount++}`);
        values.push(data.name);
    }
    if (data.email) {
        fields.push(`email = $${paramCount++}`);
        values.push(data.email);
    }

    values.push(id);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await pool.query(query, values);
    return result.rows[0];
};
```

---

### 11. **Adicionar Limite de Requisições (Rate Limiting)**

**Problema:**
API vulnerável a ataques de força bruta ou abuso.

**Solução:**
```bash
npm install express-rate-limit
```

No [src/index.js](src/index.js):
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api', limiter);
```

---

### 12. **Adicionar Tratamento de Graceful Shutdown**

**Problema:**
O servidor não fecha conexões adequadamente ao ser encerrado.

**Solução:**
No [src/index.js](src/index.js#L36):
```javascript
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server gracefully...');
  server.close(async () => {
    await pool.end();
    console.log('Server closed');
    process.exit(0);
  });
});
```

---

### 13. **Adicionar Timestamps em Logs**

**Problema:**
Logs não têm informação de quando ocorreram.

**Solução:**
Instalar e configurar um logger simples ou usar o winston:
```bash
npm install morgan
```

No [src/index.js](src/index.js):
```javascript
import morgan from 'morgan';

// Logging apenas em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
```

---

### 14. **Adicionar .gitignore Completo**

**Problema:**
Pode estar commitando arquivos desnecessários.

**Solução:**
Criar/atualizar `.gitignore`:
```
node_modules/
.env
.DS_Store
*.log
npm-debug.log*
coverage/
.vscode/
dist/
```

---

### 15. **Melhorar Mensagens de Erro**

**Arquivo:** [src/middlewares/errorHandler.js](src/middlewares/errorHandler.js)

**Problema:**
Mensagem genérica "An unexpected error occurred!" não ajuda em debugging.

**Solução:**
```javascript
const errorHandler = (err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error:`, err);
    
    const status = err.status || 500;
    const message = err.status ? err.message : 'Internal server error';
    
    const payload = {
        statusCode: status,
        message: message
    };
    
    if(process.env.NODE_ENV !== 'production') {
        payload.error = err.message;
        payload.stack = err.stack;
    }
    
    res.status(status).json(payload);
}
```

---

## 📝 Boas Práticas Encontradas

✅ Uso de ES6 modules  
✅ Separação em camadas (MVC)  
✅ Uso de variáveis de ambiente  
✅ Prepared statements (proteção contra SQL Injection)  
✅ Middleware de validação com Joi  
✅ Error handler centralizado  
✅ Uso de async/await  
✅ Respostas padronizadas no controller

---

## 🚀 Sugestões de Arquitetura (Opcional - Para Crescimento Futuro)

Se o projeto crescer, considere:

1. **Adicionar paginação** nos endpoints de listagem
2. **Implementar autenticação JWT** se necessário
3. **Adicionar testes automatizados** (Jest + Supertest)
4. **Documentação com Swagger/OpenAPI**
5. **Migrations** para versionamento do banco (ex: knex, sequelize-cli)
6. **Docker** para padronizar ambiente de desenvolvimento
7. **Logging estruturado** com Winston ou Pino

---

## 📌 Prioridades de Implementação

### Alta Prioridade (Fazer Agora)
1. Corrigir SQL do data.sql (vírgula faltando)
2. Adicionar await na criação da tabela
3. Corrigir validação nas rotas (POST deve ter, GET não)
4. Adicionar tratamento de erro no pool
5. Adicionar validação de ID
6. Criar .env.example

### Média Prioridade (Próximos Passos)
7. Implementar tratamento de email duplicado
8. Remover endpoint de teste em produção
9. Adicionar health check
10. Implementar rate limiting
11. Melhorar mensagens de erro

### Baixa Prioridade (Melhorias Futuras)
12. Graceful shutdown
13. Logging com morgan
14. Update parcial
15. Documentação com Swagger

---

## 💻 Comandos Úteis

```bash
# Instalar dependências sugeridas
npm install express-rate-limit morgan

# Verificar vulnerabilidades
npm audit

# Formatar código (se usar prettier)
npx prettier --write "src/**/*.js"
```

---

## 📚 Recursos Recomendados

- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Error Handling](https://nodejs.org/en/docs/guides/error-handling/)
- [PostgreSQL Node.js](https://node-postgres.com/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)

---

**Conclusão:** Seu código está em um bom nível inicial! As correções críticas são simples e podem ser implementadas rapidamente. O projeto demonstra conhecimento sólido de estruturação e boas práticas fundamentais. 🎯
