# Security policy, assumptions, key handling and guardrails

This file records the security policies, assumptions, and the concrete key/secret handling practices and runtime guardrails used by the SOAISEC FastAPI service (`answer.py`).

## Policies
- No secrets in source: never commit API keys, tokens, or credentials. 
- Least privilege: grant the minimum permissions to service accounts and keys used by the app.
- Redact and limit logs: logs must not contain secrets or raw LLM responses. Use structured logging too.
- Secure deployment: only use platform-managed secrets (Render environment variables or managed secret stores) for production credentials.

## Assumptions
- App runs as a managed web service (Render) and receives secrets via environment variables.
- `GEMINI_API_KEY` is required for Google GenAI calls; `API_KEYS` is a comma-separated list used to authenticate client requests.
- The deployed environment provides HTTPS and a trusted `X-Forwarded-For` header for real client IP detection.
- Local `app.log` is ephemeral on instances and not a secure audit store.

## Key Handling practices
1. Use environment variables / platform secrets for production (Render secrets).
2. Never expose secrets in client-side code; move keys out of `static/script.js` if present.
3. Do not persist secrets to disk; avoid writing credentials to local files.
4. Rotate secrets quickly and automate rotation where possible.
5. Redact secrets in logs: configure loggers to filter `api_key`, `password`, `token`, etc.


## Guardrails implemented in this project
These are the runtime protections implemented in `answer.py` and supporting code.

- Input validation and prompt-injection detection
	- Function: `detect_prompt_injection(text)` checks inputs against regex patterns to block obvious injection attempts (e.g., "ignore previous instructions", "jailbreak", "developer mode").

- Output scanning
	- Function: `check_output(text)` looks for API-key-like strings, credential patterns, emails, SSN, CCN patterns and blocks responses that match.

- Authentication
	- Endpoint auth: `verify_api_key` checks `X-API-Key` against `API_KEYS` loaded from environment before serving `/api/answer` and `/api/logs`.

- Rate limiting
	- `slowapi.Limiter` used with key function `get_real_ip` and decorated on `/api/answer` with `@limiter.limit("5/minute")` to limit abuse per client IP.

- Trusted client IP extraction
	- `get_real_ip` extracts IP from `X-Forwarded-For` when present.
- CORS policy
	- `CORSMiddleware` is configured with an explicit `allow_origins` list .

- Health & audit endpoints
	- `GET /api/health` for health checks and `GET /api/logs` to return the last 100 log lines (requires API key) for quick audits.

## Recommended additional guardrails (not yet implemented or suggested improvements)
- Replace API key header with per-user short-lived tokens or OAuth for production use.
- Apply stricter output sanitization (e.g., remove any substring that matches secret regexes before returning to clients).
- Add allback responses or cached replies when the external API is failing or at its limit.
- Enforce per-key quotas in addition to per-IP rate limits. Use an application-level quota store (Redis) for accurate counting.
- Move logging to structured JSON and push to an external log collector; remove `app.log` from repository and add a sanitized sample log if needed for tests.


