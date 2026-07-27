# Cenarios Manuais De Teste Logistico

Data: 2026-07-25

Estes cenarios descrevem a verificacao manual esperada depois da execucao do prompt de implementacao. Nem todos estao executaveis atualmente porque parte dos servicos logisticos ainda pode estar ausente ou apenas estruturada.

## Cenarios De Smoke Executaveis Atualmente

### Landing Publica

1. Abrir `http://localhost:3000/`.
2. Verificar se a marca `Nexora Freight` esta visivel.
3. Verificar CTA para `/login`.
4. Verificar responsividade em desktop e mobile.

Status atual esperado: parcialmente executavel.

### Login Local

1. Garantir que migrations e seed foram aplicadas.
2. Abrir `http://localhost:3000/login`.
3. Informar `administrador@dev.com`.
4. Informar `@DEV1512`.
5. Enviar o formulario.
6. Verificar redirecionamento para `/dashboard`.
7. Verificar se os cookies sao definidos pelo backend e se o frontend nao usa localStorage para tokens.

Status atual esperado: executavel somente se migration e seed do banco estiverem saudaveis.

### Resumo Do Dashboard

1. Fazer login como admin.
2. Abrir `/dashboard`.
3. Verificar se os indicadores carregam de `/api/v1/dashboard/summary`.
4. Parar a API e repetir para validar o estado de erro.

Status atual esperado: parcialmente executavel.

## Cenarios Finais Obrigatorios

### Isolamento De Tenant

1. Fazer login como admin do tenant principal.
2. Listar clientes, transportadoras, simulacoes, shipments, import jobs e audit logs.
3. Tentar acesso direto a IDs de recursos do tenant secundario.
4. Verificar retorno 404 ou 403 conforme politica documentada.
5. Verificar se totais do dashboard excluem registros do tenant secundario.
6. Verificar se eventos realtime de importacao/tracking do tenant secundario nao sao recebidos.

### Gestao De Usuarios

1. Fazer login como `ADMIN`.
2. Convidar um novo `OPERATOR`.
3. Alterar usuario para `MANAGER`.
4. Tentar remover o ultimo `ADMIN` ativo e verificar rejeicao.
5. Desativar um usuario e verificar revogacao de sessoes.
6. Fazer login como `OPERATOR` e verificar se acoes restritas retornam 403.

### Gestao De Clientes E Enderecos

1. Criar cliente pessoa juridica com CNPJ.
2. Criar cliente pessoa fisica com CPF.
3. Adicionar enderecos de faturamento, coleta e entrega.
4. Preencher endereco por CEP e editar manualmente.
5. Tentar documento duplicado no mesmo tenant e verificar validacao.
6. Verificar se o mesmo documento em outro tenant segue a politica documentada.

### Transportadoras, Servicos E Cobertura

1. Criar transportadora.
2. Adicionar servicos economico e expresso.
3. Configurar limites de peso, fator cubico e cobertura.
4. Desativar servico e verificar que ele nao e oferecido em novas simulacoes.
5. Desativar transportadora e verificar que nenhuma nova opcao de simulacao a utiliza.

### Tabelas De Frete

1. Criar tabela de frete ativa para servico de transportadora.
2. Adicionar faixas de peso e taxas.
3. Tentar faixa sobreposta e verificar rejeicao.
4. Criar nova versao com vigencia futura.
5. Verificar se simulacao historica mantem versao antiga e breakdown.

### Simulacao De Frete

1. Selecionar cliente opcional.
2. Preencher origem/destino por CEP.
3. Adicionar multiplos volumes.
4. Informar valor da carga e data desejada.
5. Executar simulacao.
6. Verificar peso real, peso cubado e peso taxavel.
7. Verificar opcoes, motivos de indisponibilidade, indicadores de menor preco e menor prazo.
8. Abrir breakdown.
9. Selecionar uma opcao.
10. Verificar entrada de auditoria.

### Historico De Simulacao

1. Abrir historico.
2. Filtrar por periodo, cliente, usuario, transportadora, servico, origem, destino e relacao com shipment.
3. Abrir detalhe.
4. Verificar entrada original, volumes, opcoes, opcao selecionada e versoes de regras.

### Shipment E Tracking

1. Criar shipment a partir de opcao selecionada de simulacao.
2. Verificar snapshots de endereco.
3. Registrar eventos de tracking em ordem valida.
4. Tentar transicao de status invalida e verificar rejeicao.
5. Registrar evento de correcao e verificar que o evento original permanece.
6. Verificar se o status atual do shipment corresponde a linha do tempo.

### Importacoes, Async E Realtime

1. Fazer upload de CSV valido.
2. Verificar preview de pre-validacao.
3. Confirmar importacao.
4. Verificar inicio do job BullMQ.
5. Acompanhar progresso em realtime.
6. Verificar fallback por polling desativando websocket.
7. Fazer upload de arquivo com erros por linha e baixar relatorio de erros.
8. Reenviar o mesmo arquivo e verificar regra de idempotencia.

### Dashboard E Insights

1. Abrir dashboard com dataset demo.
2. Aplicar filtros de periodo/cliente/transportadora/servico/status.
3. Verificar se KPIs correspondem aos registros no banco.
4. Abrir insights.
5. Verificar evidencia, severidade, metrica e link contextual do insight.
6. Marcar insight como lido e dispensar insight permitido.

### Auditoria

1. Executar login, edicao de usuario, edicao de cliente, edicao de transportadora, edicao de tabela de frete, simulacao, shipment e tracking.
2. Abrir pagina de auditoria.
3. Filtrar por periodo, usuario, acao e recurso.
4. Verificar que segredos, tokens, senhas, TOTP secrets ou recovery codes nao aparecem.

### Seguranca

1. Tentar brute-force de login e verificar lockout/rate limit.
2. Tentar mutation sem CSRF token e verificar rejeicao.
3. Tentar entrar em sala WebSocket de outro tenant e verificar rejeicao.
4. Verificar paginas de falha OAuth e estados de desafio MFA.

### Idempotencia Da Seed

1. Rodar seed.
2. Capturar contagens de tenants, usuarios, clientes, transportadoras e registros operacionais demo.
3. Rodar seed novamente.
4. Verificar que contagens e registros unicos nao duplicam.

## Fluxo Final De Demonstracao

1. Abrir landing.
2. Fazer login como `administrador@dev.com`.
3. Revisar dashboard.
4. Criar cliente.
5. Criar servico de transportadora e tabela de frete.
6. Executar simulacao de frete.
7. Selecionar opcao.
8. Criar shipment.
9. Registrar tracking.
10. Importar um arquivo.
11. Acompanhar progresso.
12. Revisar auditoria.
13. Revisar insight.
14. Fazer logout.
