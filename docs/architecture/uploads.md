# Uploads

The platform uses two upload flows with different operational goals.

## Asynchronous batch uploads

CSV/XLSX imports are processed asynchronously. The API receives the file with Multer, validates the spreadsheet, stores it in tenant-scoped local storage, creates an `ImportJob`, and sends the job to BullMQ/Redis. This is used for larger operational datasets where preview, row validation, progress and error reports are required.

## Synchronous image uploads

Small images, such as carrier logos, use a synchronous endpoint. The API validates tenant access, RBAC, MIME type, extension and size, stores the file in tenant-scoped local image storage, updates the business record immediately and returns the updated DTO.

Current carrier logo endpoints:

- `POST /api/v1/carriers/:id/logo`
- `GET /api/v1/carriers/:id/logo`

The upload endpoint is documented in Swagger with `ApiConsumes('multipart/form-data')` and a binary `file` field. It accepts PNG, JPG and WebP images up to 2 MB. Local storage is intended for development and demonstration; production environments that need persistence across redeploys should replace the storage service with S3, Cloudflare R2 or another S3-compatible provider.

Both upload strategies derive `tenantId` from the authenticated session. The browser must never send a free-form tenant identifier for upload authorization.
