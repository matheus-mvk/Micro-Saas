# Security Rules for Agents

Estas regras se aplicam a qualquer agente trabalhando na plataforma SaaS multi-tenant de inteligencia logistica.

## Escopo de mudanca

- Mudancas de documentacao de seguranca devem ficar em `docs/security/**`.
- Regras operacionais de seguranca devem ficar neste arquivo.
- Nao alterar codigo de aplicacao, manifests, Docker, pacotes, backend, frontend ou shared quando a tarefa for apenas documentacao/regras.
- Nao reverter alteracoes de outros agentes.

## Regras de implementacao futura

1. Toda feature privada deve declarar como resolve tenant, autentica sujeito e autoriza acao.
2. Toda consulta a dado privado deve filtrar por tenant no backend.
3. Toda acao sensivel deve gerar evento de auditoria sem segredos.
4. Uploads devem validar tipo, tamanho, ownership, malware e acesso por tenant.
5. Segredos nunca devem ser adicionados ao repositorio, logs ou respostas de erro.
6. Cache, filas, jobs, storage, embeddings e analytics devem particionar dados por tenant.
7. Endpoints administrativos devem ser deny-by-default e separados de permissoes de tenant.
8. Tests de cross-tenant devem acompanhar mudancas em endpoints privados, jobs e consultas compartilhadas.

## Checklist de revisao

- O cliente consegue influenciar `tenant_id` sem validacao server-side?
- Algum endpoint depende apenas da UI para permissao?
- IDs de recursos sao validados contra ownership do tenant?
- Listagens, contagens e exportacoes respeitam o tenant antes de agregacao?
- Logs podem conter token, cookie, segredo, PII ou payload bruto?
- Arquivos e URLs assinadas expiram e exigem autorizacao no acesso?
- Jobs e workers carregam tenant no envelope da mensagem?
- Prompts, embeddings e caches de IA estao isolados por tenant?
