# 🔐 Master Group Dashboard - Login Credentials

## Admin User Credentials

**IMPORTANT: Keep this file secure and do not commit to version control!**

### Login Details

```
Email: admin@mastergroup.com
Password: MG@2024#Secure!Pass
```

### Access URLs

- **Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs

### Security Notes

1. ✅ Password is hashed with bcrypt in database
2. ✅ JWT tokens expire after 24 hours
3. ✅ All API requests require authentication
4. ✅ Login page does not display credentials

### Changing Password

To change the password, use this Python script:

```python
import bcrypt

# Your new password
new_password = "YourNewSecurePassword123!"

# Generate hash
hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
print(f"Hashed: {hashed.decode()}")
```

Then update the database:

```sql
UPDATE users 
SET password_hash = 'YOUR_HASHED_PASSWORD_HERE'
WHERE email = 'admin@mastergroup.com';
```

### Adding New Users

```sql
-- First generate password hash using Python script above
INSERT INTO users (email, password_hash, full_name, is_active)
VALUES ('newuser@mastergroup.com', 'HASHED_PASSWORD', 'User Name', true);
```

### Security Best Practices

- ✅ Never share credentials via email or chat
- ✅ Change password regularly
- ✅ Use strong passwords (16+ characters, mixed case, numbers, symbols)
- ✅ Keep this file in a secure location
- ✅ Add CREDENTIALS.md to .gitignore

---

**Last Updated**: November 19, 2025
**Password Strength**: Strong (19 characters, mixed case, numbers, symbols)
