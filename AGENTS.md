# Regras Dos Agentes

## Geral

- Trabalhe somente dentro deste repositorio.
- Nao use codigo proprietario nem snippets nao verificados.
- Nao invente funcionalidades sem registrar a hipotese.
- Nao altere ADRs silenciosamente.
- Nao sobrescreva trabalho de outro agente sem revisao final.
- Nao crie codigo morto nem abstracoes sem caso de uso real.
- Nao ignore erros, enfraqueca seguranca ou commite segredos.
- Mantenha documentacao, codigo, scripts e decisoes alinhados.

## Coordenacao

- Backend define contratos de API em conjunto com frontend.
- Frontend nao assume respostas de API nao documentadas.
- UI/UX nao altera regras de negocio.
- Seguranca pode bloquear escolhas inseguras.
- Infraestrutura nao expoe servicos sem necessidade explicita de ambiente.
- Contratos compartilhados, schema de banco, variaveis de ambiente, Docker e scripts da raiz exigem revisao final.
- O revisor final resolve conflitos e registra o resultado.

## Conclusao

Uma entrega so esta completa quando compila, passa lint, typecheck, testes e build, possui documentacao, possui a skill relevante atualizada, tem revisao de seguranca e tem revisao de integracao.
