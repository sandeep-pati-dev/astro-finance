# Fix 404 Error on Root Route

## Tasks

- [x] Add root route handler in backend/src/app.ts to return welcome message
- [ ] Commit and push changes to trigger redeploy on Render
- [ ] Verify the fix by checking the deployed URL

## Details

- Issue: 404 error when accessing root URL https://astro-finance-1.onrender.com/
- Solution: Add GET route for '/' that returns JSON with API info
- Files to edit: backend/src/app.ts
