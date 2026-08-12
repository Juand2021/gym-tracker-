# Fuerza — Gym AI Tracker

App web personal para registrar entrenos, peso corporal, ver evolución de fuerza y pedir recomendaciones con OpenAI.

- **Frontend / API:** Next.js (App Router) en **Vercel**
- **Datos:** **Cloud Firestore** (Vercel no guarda historial; Firestore sí)
- **IA:** OpenAI (`gpt-4o-mini`)
- **Acceso:** un PIN por persona (`SITE_PIN` Juan, `SITE_PIN_LAURA` Laura). Cada PIN abre su propio historial y métricas.

## Arranque local

```bash
cd ~/Projects/gym-tracker
cp .env.example .env.local
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

| Variable | Uso |
|---|---|
| `SITE_PIN` | PIN de Juan (datos actuales) |
| `SITE_PIN_LAURA` | PIN de Laura (default `2026` si no se define) |
| `AZURE_OPENAI_ENDPOINT` | Endpoint Azure OpenAI (`.../openai/v1`) |
| `AZURE_OPENAI_API_KEY` | API key de Azure AI Foundry |
| `AZURE_OPENAI_DEPLOYMENT` | Nombre del deployment (ej. `gpt-5-mini`) |
| `FIREBASE_SERVICE_ACCOUNT` | JSON del service account en una línea |

Alternativa al JSON completo:

```env
FIREBASE_PROJECT_ID=tu-proyecto
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@....iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Firebase (una sola vez)

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. Activa **Firestore Database**.
3. Publica las reglas de [`firestore.rules`](firestore.rules) (todo denegado al cliente; la app usa Admin SDK).
4. En Project settings → Service accounts → **Generate new private key**.
5. Pega el JSON en `FIREBASE_SERVICE_ACCOUNT` (una línea) o usa las variables sueltas.

## Deploy en Vercel

1. Sube el repo a GitHub.
2. Importa el proyecto en Vercel.
3. Añade las mismas variables de entorno.
4. Deploy.

### Releases (versión de la app)

- La versión viva en [`package.json`](package.json) y se documenta en [`CHANGELOG.md`](CHANGELOG.md).
- En GitHub se marca con un tag `vX.Y.Z` (ej. `v1.1.0`).
- **Vercel despliega el código de `main`**. Firestore no se toca al desplegar: solo cambia la UI/API; tus workouts y pesos ya guardados permanecen.

Flujo típico:

```bash
# 1) Trabaja en una rama
git checkout -b feature/mi-cambio

# 2) Commit
git add .
git commit -m "Describe el porqué del cambio."

# 3) Push de la rama
git push -u origin HEAD

# 4) Abre PR hacia main (GitHub UI o:)
gh pr create --base main --title "..." --body "..."

# 5) Tras merge a main, etiqueta el release
git checkout main
git pull
git tag -a v1.1.0 -m "Release 1.1.0"
git push origin v1.1.0
```

## Uso

1. Entra con tu PIN.
2. **Entreno:** añade series (peso × reps) y guarda la sesión.
3. **Peso:** registra peso corporal.
4. **Métricas:** gráficos de mejor peso / 1RM estimado y peso corporal.
5. **IA:** pregunta por progreso, estancamientos o cambios de rutina.

## Modelo de datos

- `workouts/{id}` → `date`, `notes`, `createdAt`
- `workouts/{id}/sets/{id}` → `exercise`, `weightKg`, `reps`, `setNumber`
- `bodyWeight/{id}` → `date`, `weightKg`
