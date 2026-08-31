# Railway deployment – HesabYar v69

## 1. Create the Railway service
Create a new Railway project and deploy this repository/folder. Railway will use the included `Dockerfile`.

## 2. Add a persistent Volume (required)
Add a Railway Volume and mount it at:

`/data`

The application stores `cludari.db`, `auth.db`, and per-user databases under `/data`. Without a Volume, SQLite data can be lost when the service is redeployed/recreated.

## 3. Deploy
The container automatically uses Railway's `$PORT`, binds to `0.0.0.0`, and exposes `/health`.

After deployment, open the Railway-generated public domain. You can also add a custom domain in Railway.

## Existing v69 data
On the first boot of a fresh Volume, the bundled `cludari.db`, `auth.db`, and `data/*.db` files are copied into `/data` only if those files do not already exist. Later restarts/deploys do not overwrite the persistent databases.

## Important
The main HesabYar data is SQLite-based. The included persistent Volume makes this workable for a single Railway service, but PostgreSQL is the better long-term database for heavy multi-user/concurrent usage.

The Taraz ledger is currently held in memory and rebuilt/migrated from sales/purchases after a service restart. The primary SQLite accounting data remains persistent on the Volume.
