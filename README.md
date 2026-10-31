# OurPeople Backoffice

Repositório independente da aplicação web de administração. Permite autenticar administradores, pesquisar utilizadores e consultar a lista paginada. Tem os seus próprios estilos e ícone, sem importar ficheiros da app.

## Executar

Node.js 22.13 ou superior e npm:

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Abra <http://localhost:3002/> (redireciona para `/be/`). Para execução normal: `npm start`. Testes: `npm test`.

O servidor publica apenas `public/` e encaminha `/api/*` para a API configurada. Não é necessário compilar a interface.

## Variáveis

| Variável | Exemplo | Função |
| --- | --- | --- |
| `PORT` | `3002` | Porta local; em implantação respeita o ambiente. |
| `API_URL` | `http://localhost:3000` | Origem da API, sem `/api`. Obrigatória em produção. |
| `APP_URL` | `http://localhost:3001` | Origem da PWA para os links «Abrir app». Obrigatória e HTTPS em produção. |
| `NODE_ENV` | `development` | Usar `production` no Railway. |
| `TRUST_PROXY_HOPS` | `0` | Proxies confiáveis à frente do servidor; ajustar à topologia. |

O proxy preserva cookies, corpo, estado e redirecionamentos da API. Assim o navegador faz os pedidos na origem do backoffice e não precisa de cookies entre sites. Na API, configure `BE_URL` com a origem pública deste backoffice.

## Acesso de administrador

Registe a conta na app. No repositório e ambiente do serviço **API**, execute:

```powershell
npm run admin -- administrador@exemplo.pt
```

Depois inicie sessão neste backoffice. O comando deve usar a mesma ligação MongoDB e `MONGODB_DB` da API que está a servir o backoffice; no Railway use o ambiente do serviço API.

Membros podem autenticar-se mas não consultar a lista de utilizadores. A API valida as permissões em todos os pedidos administrativos. Em domínios diferentes, a sessão da app não é partilhada com o backoffice; inicie sessão em cada interface.

## Railway

1. Publique este repositório Git e ligue-o a um serviço Railway, com raiz `/`.
2. O [Dockerfile é detetado pelo Railway](https://docs.railway.com/builds/dockerfiles) e o CMD já inicia o servidor.
3. Configure `NODE_ENV=production`, `API_URL=https://API-DOMAIN` e `APP_URL=https://APP-DOMAIN`. Se estiver na mesma rede privada Railway da API, pode usar a sua origem interna HTTP; em projetos diferentes use HTTPS público.
4. Gere o domínio HTTPS e, no serviço API, configure `BE_URL=https://BE-DOMAIN`.
5. Configure o healthcheck em `/health` e o número de proxies confiáveis. O servidor escuta em `0.0.0.0:$PORT` (imagem: 8080 por omissão).
6. Para login social, registe os callbacks `https://BE-DOMAIN/api/auth/google/callback` e `https://BE-DOMAIN/api/auth/facebook/callback` nos portais Google/Meta. As credenciais ficam apenas na API.

Este serviço não requer volume ou base de dados. Pode ser instalado, testado e implantado sem ter os outros repositórios presentes; as funcionalidades de gestão precisam da API em execução.

O workflow CI executa `npm ci` e `npm test`, verificando os ficheiros públicos, links para a app e o proxy, incluindo cookies, redirecionamentos e falhas da API.
