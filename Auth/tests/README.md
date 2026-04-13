# Auth API Test Suite

Comprehensive test suite for authentication endpoints including login, logout, me, and password reset.

## Test Files

### 1. `auth.test.http` - REST Client Tests
HTTP file for testing with VS Code REST Client extension or similar tools.

**Usage:**
- Install REST Client extension in VS Code
- Open `auth.test.http`
- Click "Send Request" above each test
- Manually copy cookies between requests as needed

### 2. `auth.test.js` - Automated Node.js Tests
Standalone JavaScript test runner that doesn't require additional dependencies.

**Prerequisites:**
```bash
# Ensure server is running
npm run dev

# Create test user in database (if not exists)
# Email: test@example.com
# Password: Test@123
```

**Run Tests:**
```bash
node tests/auth.test.js
```

**Features:**
- ✅ Automatic cookie management
- ✅ Sequential test execution
- ✅ Detailed pass/fail reporting
- ✅ Test summary with success rate
- ✅ No external dependencies required

### 3. `postman-collection.json` - Postman Collection
Complete Postman collection with automated test scripts.

**Import to Postman:**
1. Open Postman
2. Click "Import" button
3. Select `postman-collection.json`
4. Collection will appear in sidebar

**Run Collection:**
- **Individual Tests:** Click on any request and click "Send"
- **Run All Tests:** Click collection → "Run" → "Run Auth API Test Suite"

**Features:**
- ✅ Automatic cookie handling
- ✅ Collection variables for easy configuration
- ✅ Pre-request and test scripts
- ✅ Automated assertions
- ✅ Token extraction and storage

## Test Coverage

### 1. Login Endpoint (`POST /auth/login`)
- ✅ Successful login with valid credentials
- ✅ Login with missing email
- ✅ Login with missing password
- ✅ Login with invalid credentials
- ✅ Login with non-existent user
- ✅ Cookie setting verification

### 2. Me Endpoint (`GET /auth/me`)
- ✅ Get user details with valid token
- ✅ Get user details without token (401)
- ✅ Get user details with expired access token (token rotation)
- ✅ Get user details with invalid token (401)
- ✅ Password field omission verification

### 3. Logout Endpoint (`POST /auth/logout`)
- ✅ Successful logout with valid token
- ✅ Logout without token (401)
- ✅ Logout with invalid token (401)
- ✅ Cookie clearing verification
- ✅ Token revocation verification

### 4. Password Reset Endpoint (`POST /auth/reset-password/:email`)
- ✅ Successful password reset
- ✅ Reset with wrong old password (400)
- ✅ Reset for non-existent user (400)
- ✅ Reset with missing old password
- ✅ Reset with missing new password
- ✅ Token revocation after password change
- ✅ Login with new password
- ✅ Old token invalidation

### 5. Token Rotation Tests
- ✅ Automatic token rotation on expired access token
- ✅ New tokens issued and set in cookies
- ✅ Continued access with rotated tokens

### 6. Complete Flow Tests
- ✅ Login → Get User → Reset Password → Re-login → Logout
- ✅ Token lifecycle management
- ✅ Security verification at each step

## Configuration

### Environment Variables
Update these in your `.env` file:
```env
PORT=4000
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
ACCESS_TOKEN_SECRET=your_access_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
```

### Test User Setup
Create a test user in your database:
```sql
INSERT INTO "User" (id, email, password, firstname, "authProvider")
VALUES (
  gen_random_uuid(),
  'test@example.com',
  '$2b$12$...',  -- bcrypt hash of 'Test@123'
  'Test',
  'EMAIL'
);
```

Or use your user registration endpoint to create the test user.

### Update Test Configuration
Edit the test files to match your setup:

**auth.test.http:**
```http
@baseUrl = http://localhost:4000/api/v1
@email = test@example.com
@password = Test@123
```

**auth.test.js:**
```javascript
const BASE_URL = 'http://localhost:4000/api/v1';
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test@123'
};
```

**postman-collection.json:**
- Update collection variables in Postman after import
- `baseUrl`: http://localhost:4000/api/v1
- `email`: test@example.com
- `password`: Test@123

## Expected Test Results

### Successful Test Run
```
🚀 Starting Auth API Test Suite...

============================================================
TEST: 1.1: Successful Login
============================================================
✅ PASSED: Login returns 200 status
✅ PASSED: Login response has error: false
✅ PASSED: Login returns user email
✅ PASSED: Access token is set in cookies
✅ PASSED: Refresh token is set in cookies

...

============================================================
TEST SUMMARY
============================================================
Total Tests: 18
Passed: 18
Failed: 0
Success Rate: 100.00%
============================================================

🎉 All tests passed!
```

## Troubleshooting

### Server Not Running
```
Error: fetch failed
```
**Solution:** Start the server with `npm run dev`

### Test User Not Found
```
Status code is 400
Response: User not found
```
**Solution:** Create test user in database

### Token Expiry Too Long
If token rotation tests fail, tokens might not be expiring:
```env
# Set shorter expiry for testing
ACCESS_TOKEN_EXPIRY=1m
REFRESH_TOKEN_EXPIRY=2m
```

### Cookie Issues
If cookies aren't being set/read:
- Check `cookie-parser` middleware is configured
- Verify `secure` flag matches your environment (HTTP vs HTTPS)
- For local testing, set `secure: false` in development

### Database Connection Issues
```
Error: Connection refused
```
**Solution:** Check database is running and `.env` has correct connection string

## Test Maintenance

### Adding New Tests
1. Add test case to `auth.test.http` for manual testing
2. Add test function to `auth.test.js` for automation
3. Add request to `postman-collection.json` for Postman users
4. Update this README with new test coverage

### Updating Test Data
When changing test user credentials:
1. Update all three test files
2. Update this README
3. Recreate test user in database

## CI/CD Integration

### GitHub Actions Example
```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Start server
        run: npm run dev &
      - name: Wait for server
        run: sleep 5
      - name: Run tests
        run: node tests/auth.test.js
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Test Credentials:** Never use production credentials in test files
2. **Test Database:** Use separate test database, not production
3. **Sensitive Data:** Don't commit actual tokens or secrets to git
4. **Token Expiry:** Use short expiry times for testing
5. **Cleanup:** Delete test tokens after test runs

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure database schema is up to date
4. Review authentication middleware logs with `[AUTHENTICATE]` prefix
5. Check service logs with `[LOGOUT]`, `[ME]`, `[PASSWORD_RESET]` prefixes
