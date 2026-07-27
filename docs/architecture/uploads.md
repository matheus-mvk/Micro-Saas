# Uploads

A plataforma usa dois fluxos de upload com objetivos operacionais diferentes.

## Uploads Assincronos Em Lote

Importacoes CSV/XLSX sao processadas de forma assincrona. A API recebe o arquivo com Multer, valida a planilha, armazena em storage local com escopo por tenant, cria um `ImportJob` e envia o job para BullMQ/Redis. Esse fluxo e usado para conjuntos operacionais maiores, em que preview, validacao por linha, progresso e relatorios de erro sao necessarios.

## Uploads Sincronos De Imagem

Imagens pequenas, como logos de transportadoras, usam um endpoint sincrono. A API valida acesso ao tenant, RBAC, MIME type, extensao e tamanho, armazena o arquivo em storage local de imagens com escopo por tenant, atualiza o registro de negocio imediatamente e retorna o DTO atualizado.

Endpoints atuais de logo de transportadora:

- `POST /api/v1/carriers/:id/logo`
- `GET /api/v1/carriers/:id/logo`

O endpoint de upload e documentado no Swagger com `ApiConsumes('multipart/form-data')` e um campo binario `file`. Ele aceita imagens PNG, JPG e WebP ate 2 MB. O storage local e destinado a desenvolvimento e demonstracao; ambientes de producao que precisam de persistencia entre redeploys devem substituir o servico de storage por S3, Cloudflare R2 ou outro provider compativel com S3.

As duas estrategias de upload derivam `tenantId` da sessao autenticada. O navegador nunca deve enviar um identificador livre de tenant para autorizacao de upload.
