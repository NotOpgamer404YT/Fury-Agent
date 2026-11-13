## What changed

Short description of the change and the motivation.

## How it was verified

- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] Manually exercised in the running app (describe what you clicked)
- [ ] Migrations regenerated (`npm run db:generate`) if the schema changed

## Screenshots (UI changes)

Include a 360 px mobile-width shot where relevant.

## Checklist

- [ ] No secrets, tokens or ciphertext added to logs or API responses
- [ ] New endpoints validate input with Zod and filter by `userId`
- [ ] New agent tools declare a permission level and `needsApproval`
- [ ] Documentation updated for behaviour/configuration changes
- [ ] Limitations stated honestly rather than hidden
