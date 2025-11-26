/* server.js - Express server for Customer CRUD operations */

/* Uses mssql package to connect to SQL Server database */
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT, 10),
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

/* ===========================
    AUTHENTICATION ENDPOINTS
=========================== */

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
        return res.status(400).json({ message: 'Username, password, and role are required' });
    }

    try {
        await sql.connect(config);

        // Check if user already exists
        const checkUser = await sql.query`SELECT * FROM Users WHERE Username = ${username}`;
        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        await sql.query`
            INSERT INTO Users (Username, PasswordHash, Role)
            VALUES (${username}, ${hashedPassword}, ${role})
        `;

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).send('Server error');
    }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        await sql.connect(config);

        const result = await sql.query`SELECT * FROM Users WHERE Username = ${username}`;
        if (result.recordset.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = result.recordset[0];

        // Verify password
        const isMatch = await bcrypt.compare(password, user.PasswordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create JWT
        const token = jwt.sign(
            { id: user.Id, username: user.Username, role: user.Role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token });
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).send('Server error');
    }
});

/* ===========================
    AUTHENTICATION MIDDLEWARE
=========================== */

// Middleware to verify JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token required' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
}

// GET /api/auth/me
app.get('/api/auth/me', authenticateToken, (req, res) => {
    res.json({ userId: req.user.userId, username: req.user.username, role: req.user.role });
});

/* ===========================
    USER PROFILE ENDPOINTS
=========================== */



app.get('/profile', authenticateToken, async (req, res) => {
    const id = parseInt(req.user.id, 10);
    try {
        await sql.connect(config);
        const request = new sql.Request();
        request.input('Id', sql.Int, id);
        const result = await request.query(`
            SELECT Id, Username, FirstName, LastName, Email
            FROM Users
            WHERE Id = @Id
        `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const row = result.recordset[0];
        const user = {
            id: row.Id,
            username: row.Username,
            firstName: row.FirstName,
            lastName: row.LastName,
            email: row.Email
        };

        res.json(user);
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).send('Server error');
    }
});


app.put('/profile', authenticateToken, async (req, res) => {
    const id = parseInt(req.user.id, 10);
    const { username, password, email } = req.body;
    try {
        await sql.connect(config);
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `
            UPDATE Users SET
                Username = @Username,
                PasswordHash = @PasswordHash,
                Email = @Email,
                ModifiedOn = GETDATE()
            WHERE Id = @Id
        `;
        const request = new sql.Request();
        request.input('Id', sql.Int, id);
        request.input('Username', sql.VarChar, username);
        request.input('PasswordHash', sql.VarChar, hashedPassword);
        request.input('Email', sql.VarChar, email);
        await request.query(query);
        res.status(200).json({ message: 'Profile updated successfully' });
    }
    catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).send('Server error');
    }
});


/* ===========================
   USER MANAGEMENT ENDPOINTS
=========================== */

// GET /admin (all users)

app.get('/admin', authenticateToken, async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query(`
      SELECT Id, Username, PasswordHash, Role, CreatedOn, RoleId, Email, Active, ModifiedOn FROM Users
    `);

    // Map to camelCase for Angular
    const users = result.recordset.map(row => ({
      id: row.Id,
      username: row.Username,
      passwordHash: row.PasswordHash,
      role: row.Role,
      createdOn: row.CreatedOn,
      roleId: row.RoleId,
      email: row.Email,
      active: row.Active,
      modifiedOn: row.ModifiedOn
    }));

    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send('Server error');
  }
});

// GET /admin/:id (single user)
app.get('/admin/:id', authenticateToken, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
        await sql.connect(config);
        const request = new sql.Request();
        request.input('Id', sql.Int, id);
        const result = await request.query('SELECT Id, Username, PasswordHash, Role, CreatedOn, RoleId, Email, Active, ModifiedOn FROM Users WHERE Id = @Id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const row = result.recordset[0];
        const user = {
            id: row.Id,
            username: row.Username,
            passwordHash: row.PasswordHash,
            role: row.Role,
            createdOn: row.CreatedOn,
            roleId: row.RoleId,
            email: row.Email,
            active: row.Active,
            modifiedOn: row.ModifiedOn
        };
        res.json(user);
    }
    catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).send('Server error');
    }
});

// POST /admin (add new user)
app.post('/admin', authenticateToken, async (req, res) => {
    const { username, password, email, role, active } = req.body;
    try {
        await sql.connect(config);
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO Users (Username, PasswordHash, Email, Role, Active, CreatedOn)
            VALUES (@Username, @PasswordHash, @Email, @Role, @Active, GETDATE())
        `;
        const request = new sql.Request();
        request.input('Username', sql.VarChar, username);
        request.input('PasswordHash', sql.VarChar, hashedPassword);
        request.input('Email', sql.VarChar, email);
        request.input('Role', sql.VarChar, role);
        request.input('Active', sql.Bit, active);
        await request.query(query);
        res.status(201).json({ message: 'User added successfully' });
    } catch (err) {
        console.error('Error adding user:', err);
        res.status(500).send('Server error');
    }
});

// PUT /admin/:id (update user)
app.put('/admin/:id', authenticateToken, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { username, password, email, role, active } = req.body;
    try {
        await sql.connect(config);
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `
            UPDATE Users SET
                Username = @Username,
                PasswordHash = @PasswordHash,
                Email = @Email,
                Role = @Role,
                Active = @Active,
                ModifiedOn = GETDATE()
            WHERE Id = @Id
        `;
        const request = new sql.Request();
        request.input('Id', sql.Int, id);
        request.input('Username', sql.VarChar, username);
        request.input('PasswordHash', sql.VarChar, hashedPassword);
        request.input('Email', sql.VarChar, email);
        request.input('Role', sql.VarChar, role);
        request.input('Active', sql.Bit, active);
        await request.query(query);
        res.status(200).json({ message: 'User updated successfully' });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).send('Server error');
    }
});

// DELETE /admin/:id (delete user)
app.delete('/admin/:id', authenticateToken, async (req, res) => {
    const id = parseInt(req.params.id, 10);

    try {
        await sql.connect(config);

        const request = new sql.Request();
        request.input('Id', sql.Int, id);

        await request.query('DELETE FROM Users WHERE Id = @Id');
        res.status(204).send();
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).send('Server error');
    }
});

/* ===========================
   CUSTOMER MANAGEMENT ENDPOINTS
=========================== */


// GET /customers (all customers)
app.get('/customers', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM Customers');

    const customers = result.recordset.map(row => ({
      rowId: parseInt(row.RowID, 10),
      customerName: row.CustomerName,
      billingAddress: {
        address1: row.Address1,
        address2: row.Address2,
        city: row.City,
        state: row.State,
        zip: row.Zip,
        county: row.County,
        country: row.Country,
        email: row.Email
      },
      primaryContact: {
        name: row.PrimaryContactName,
        phone: row.PrimaryContactPhone,
        email: row.PrimaryContactEmail
      },
      accountingSystemName: row.AccountingSystemName,
      active: row.Active,
      customerNote: row.CustomerNote,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));

    res.json(customers);
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send('Server error');
  }
});

// GET /customers/:id (single customer by ID)
app.get('/customers/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);

    const request = new sql.Request();
    request.input('RowID', sql.Int, id);

    const result = await request.query('SELECT * FROM Customers WHERE RowID = @RowID');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const row = result.recordset[0];
    const customer = {
      rowId: parseInt(row.RowID, 10),
      customerName: row.CustomerName,
      billingAddress: {
        address1: row.Address1,
        address2: row.Address2,
        city: row.City,
        state: row.State,
        zip: row.Zip,
        county: row.County,
        country: row.Country,
        email: row.Email
      },
      primaryContact: {
        name: row.PrimaryContactName,
        phone: row.PrimaryContactPhone,
        email: row.PrimaryContactEmail
      },
      accountingSystemName: row.AccountingSystemName,
      active: row.Active,
      customerNote: row.CustomerNote,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    };

    res.json(customer);
  } catch (err) {
    console.error('Error fetching customer:', err);
    res.status(500).send('Server error');
  }
});

// POST /customers (add new customer)
app.post('/customers', async (req, res) => {
  try {
    await sql.connect(config);
    const customer = req.body;

    const query = `
      INSERT INTO Customers (
        CustomerName, Address1, Address2, City, State, Zip, County, Country, Email,
        PrimaryContactName, PrimaryContactPhone, PrimaryContactEmail,
        AccountingSystemName, Active, CustomerNote, CreatedBy, CreatedOn
      ) VALUES (
        @CustomerName, @Address1, @Address2, @City, @State, @Zip, @County, @Country, @Email,
        @PrimaryContactName, @PrimaryContactPhone, @PrimaryContactEmail,
        @AccountingSystemName, @Active, @CustomerNote, @CreatedBy, GETDATE()
      )
    `;

    const request = new sql.Request();
    request.input('CustomerName', sql.VarChar, customer.customerName);
    request.input('Address1', sql.VarChar, customer.billingAddress.address1);
    request.input('Address2', sql.VarChar, customer.billingAddress.address2);
    request.input('City', sql.VarChar, customer.billingAddress.city);
    request.input('State', sql.VarChar, customer.billingAddress.state);
    request.input('Zip', sql.VarChar, customer.billingAddress.zip);
    request.input('County', sql.VarChar, customer.billingAddress.county);
    request.input('Country', sql.VarChar, customer.billingAddress.country);
    request.input('Email', sql.VarChar, customer.billingAddress.email);
    request.input('PrimaryContactName', sql.VarChar, customer.primaryContact.name);
    request.input('PrimaryContactPhone', sql.VarChar, customer.primaryContact.phone);
    request.input('PrimaryContactEmail', sql.VarChar, customer.primaryContact.email);
    request.input('AccountingSystemName', sql.VarChar, customer.accountingSystemName);
    request.input('Active', sql.Bit, customer.active);
    request.input('CustomerNote', sql.VarChar, customer.customerNote);
    request.input('CreatedBy', sql.VarChar, 'admin_user');

    await request.query(query);
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({ message: 'Customer added successfully' });
  } catch (err) {
    console.error('Error adding customer:', err);
    res.status(500).send('Server error');
  }
});

// PUT /customers/:id (update existing customer)
app.put('/customers/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const customer = req.body;
    const id = req.params.id;

    const query = `
      UPDATE Customers SET
        CustomerName = @CustomerName,
        Address1 = @Address1,
        Address2 = @Address2,
        City = @City,
        State = @State,
        Zip = @Zip,
        County = @County,
        Country = @Country,
        Email = @Email,
        PrimaryContactName = @PrimaryContactName,
        PrimaryContactPhone = @PrimaryContactPhone,
        PrimaryContactEmail = @PrimaryContactEmail,
        AccountingSystemName = @AccountingSystemName,
        Active = @Active,
        CustomerNote = @CustomerNote,
        ModifiedBy = @ModifiedBy,
        ModifiedOn = GETDATE()
      WHERE RowID = @RowID
    `;

    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    request.input('CustomerName', sql.VarChar, customer.customerName);
    request.input('Address1', sql.VarChar, customer.billingAddress.address1);
    request.input('Address2', sql.VarChar, customer.billingAddress.address2);
    request.input('City', sql.VarChar, customer.billingAddress.city);
    request.input('State', sql.VarChar, customer.billingAddress.state);
    request.input('Zip', sql.VarChar, customer.billingAddress.zip);
    request.input('County', sql.VarChar, customer.billingAddress.county);
    request.input('Country', sql.VarChar, customer.billingAddress.country);
    request.input('Email', sql.VarChar, customer.billingAddress.email);
    request.input('PrimaryContactName', sql.VarChar, customer.primaryContact.name);
    request.input('PrimaryContactPhone', sql.VarChar, customer.primaryContact.phone);
    request.input('PrimaryContactEmail', sql.VarChar, customer.primaryContact.email);
    request.input('AccountingSystemName', sql.VarChar, customer.accountingSystemName);
    request.input('Active', sql.Bit, customer.active);
    request.input('CustomerNote', sql.VarChar, customer.customerNote);
    request.input('ModifiedBy', sql.VarChar, 'admin_user');

    await request.query(query);
    res.status(200).json({ message: 'Customer updated successfully' });
  } catch (err) {
    console.error('Error updating customer:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /customers/:id (delete customer)
app.delete('/customers/:id', async (req, res) => {
  try {
   await sql.connect(config);
    const id = parseInt(req.params.id, 10);

    const request = new sql.Request();
    request.input('RowID', sql.Int, id);

    const result = await request.query('DELETE FROM Customers OUTPUT DELETED.* WHERE RowID = @RowID');

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const row = result.recordset[0];
    const customer = {
      rowId: parseInt(row.RowID, 10),
      customerName: row.CustomerName,
      billingAddress: {
        address1: row.Address1,
        address2: row.Address2,
        city: row.City,
        state: row.State,
        zip: row.Zip,
        county: row.County,
        country: row.Country,
        email: row.Email
      },
      primaryContact: {
        name: row.PrimaryContactName,
        phone: row.PrimaryContactPhone,
        email: row.PrimaryContactEmail
      },
      accountingSystemName: row.AccountingSystemName,
      active: row.Active,
      customerNote: row.CustomerNote,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    };

    res.json(customer);
  } catch (err) {
    console.error('Error fetching customer:', err);
    res.status(500).send('Server error');
  }
});

/* Start the server */
app.listen(3000, () => console.log('Server running on port 3000'));

/* Test database connection
const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT, 10),
  options: {
    encrypt: false,
    trustServerCertificate: true,
    //enableArithAbort: true
  },
  //port: 1433
};

sql.connect(config)
  .then(() => console.log('Connected to SQL Server!'))
  .catch(err => console.error('Connection failed:', err));
*/