# Uploads

## Objetivo

Tratar arquivos enviados por usuarios, tenants e integracoes como conteudo nao confiavel, reduzindo risco de malware, vazamento, execucao indevida, custo excessivo e contaminacao cross-tenant.

## Regras obrigatorias

1. Upload deve exigir autenticacao, autorizacao e tenant resolvido no backend.
2. Cada arquivo deve ter owner tenant, owner user ou owner integration.
3. O backend deve validar tamanho, extensao, MIME detectado, assinatura de arquivo e quantidade por operacao.
4. Arquivos devem ser armazenados fora do webroot e acessados por URLs assinadas ou proxy autorizado.
5. Nomes originais devem ser tratados como metadados nao confiaveis e nunca usados diretamente como caminho.
6. Arquivos devem passar por antivirus ou scanning equivalente antes de processamento sensivel ou distribuicao.
7. Conteudo de planilhas/CSV deve ser protegido contra formula injection.
8. Erros de processamento nao devem expor conteudo bruto do arquivo.
9. Exportacoes devem seguir as mesmas regras de acesso e expiracao de uploads privados.

## Limites recomendados

- Definir tamanho maximo por arquivo e por lote.
- Definir quota diaria/mensal por tenant.
- Limitar tipos aceitos por caso de uso.
- Aplicar timeout e memoria maxima para parsing.
- Bloquear arquivos compactados aninhados ou com taxa suspeita de compressao.
- Restringir quantidade de linhas/abas/colunas em planilhas importadas.

## Pipeline seguro

1. Receber requisicao autenticada.
2. Autorizar acao de upload/importacao para o tenant.
3. Criar registro de arquivo com status inicial.
4. Armazenar com identificador aleatorio e prefixo isolado por tenant.
5. Validar MIME real, extensao e tamanho.
6. Executar scanning.
7. Processar em job com contexto de tenant explicito.
8. Persistir resultado com ownership por tenant.
9. Registrar auditoria de sucesso, falha e download/exportacao.
10. Expirar ou remover arquivos temporarios.

## Dados sensiveis em arquivos

- Arquivos podem conter PII, dados comerciais, rotas, volumes, enderecos, notas fiscais e custos.
- Previews devem mascarar campos sensiveis quando exibidos para usuarios sem permissao elevada.
- Downloads devem exigir autorizacao no momento do acesso, nao apenas na criacao do link.
- Links assinados devem ter vida curta e escopo por objeto.

## Testes minimos

- Tenant A nao consegue baixar, consultar status ou reprocessar arquivo do tenant B.
- Usuario sem permissao de importacao nao consegue iniciar upload via API.
- Arquivo com extensao permitida e MIME divergente e rejeitado.
- CSV com formula perigosa e neutralizado ou rejeitado.
- Arquivo acima do limite e rejeitado antes de processamento caro.
- URL assinada expirada nao permite acesso.

