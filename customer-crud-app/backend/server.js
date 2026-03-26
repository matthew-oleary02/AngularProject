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



// Ensure: const bcrypt = require('bcrypt');
// Ensure: app.use(express.json());

app.put('/profile', authenticateToken, async (req, res) => {
  const id = parseInt(req.user.id, 10);
  const profile = req.body;

  try {
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    await sql.connect(config);

    let hashedPassword = null;
    if (profile.password && typeof profile.password === 'string' && profile.password.length > 0) {
      hashedPassword = await bcrypt.hash(profile.password, 10);
    }

    // Build query depending on whether password is being changed
    const query = `
      UPDATE Users SET
        Username   = @Username,
        FirstName  = @FirstName,
        LastName   = @LastName,
        Email      = @Email,
        ${hashedPassword ? 'PasswordHash = @PasswordHash,' : ''}
        ModifiedOn = GETDATE()
      WHERE Id = @Id
    `;

    const request = new sql.Request();
    request.input('Id', sql.Int, id);
    request.input('Username', sql.VarChar(100), profile.username);
    request.input('FirstName', sql.VarChar(100), profile.firstName);
    request.input('LastName', sql.VarChar(100), profile.lastName);
    request.input('Email', sql.VarChar(200), profile.email);

    if (hashedPassword) {
      request.input('PasswordHash', sql.VarChar(200), hashedPassword);
    }

    const result = await request.query(query);

    if (result.rowsAffected && result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Error updating profile:', err);
    return res.status(500).send('Server error');
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
        const result = await request.query('SELECT Id, Username, FirstName, LastName, PasswordHash, Role, CreatedOn, RoleId, Email, Active, ModifiedOn FROM Users WHERE Id = @Id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const row = result.recordset[0];
        const user = {
            id: row.Id,
            username: row.Username,
            firstName: row.FirstName,
            lastName: row.LastName,
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
  const admin = req.body;

  try {
    await sql.connect(config);

    if (!admin.username || !admin.email || !admin.role || typeof admin.active !== 'boolean') {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!admin.password || typeof admin.password !== 'string') {
      return res.status(400).json({ message: 'Password is required for new users' });
    }

    // Map role string to roleId
    const roleMap = { 'Admin': 1, 'Manager': 2, 'User': 3 };
    const roleId = roleMap[admin.role];
    if (!roleId) {
      return res.status(400).json({ message: 'Invalid role. Must be Admin, Manager, or User' });
    }

    const hashedPassword = await bcrypt.hash(admin.password, 10);

    const query = `
      INSERT INTO Users (Username, FirstName, LastName, PasswordHash, Email, Role, RoleId, Active, CreatedOn)
      VALUES (@Username, @PasswordHash, @Email, @Role, @RoleId, @Active, GETDATE())
    `;

    const request = new sql.Request();
    request.input('Username', sql.VarChar(100), admin.username);
    request.input('FirstName', sql.VarChar(100), admin.firstName);
    request.input('LastName', sql.VarChar(100), admin.lastName);
    request.input('PasswordHash', sql.VarChar(200), hashedPassword);
    request.input('Email', sql.VarChar(200), admin.email);
    request.input('Role', sql.VarChar(50), admin.role);
    request.input('RoleId', sql.Int, roleId);
    request.input('Active', sql.Bit, admin.active);

    await request.query(query);
    return res.status(201).json({ message: 'User added successfully' });
  } catch (err) {
    console.error('Error adding user:', err);
    return res.status(500).send('Server error');
  }
});

// PUT /admin/:id (update existing user)
app.put('/admin/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const admin = req.body;

  try {
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    await sql.connect(config);

    // Map role string to roleId
    const roleMap = { 'Admin': 1, 'Manager': 2, 'User': 3 };
    const roleId = roleMap[admin.role];
    if (!roleId) {
      return res.status(400).json({ message: 'Invalid role. Must be Admin, Manager, or User' });
    }

    // Optional password update
    let hashedPassword = null;
    if (admin.password && typeof admin.password === 'string' && admin.password.length > 0) {
      hashedPassword = await bcrypt.hash(admin.password, 10);
    }

    // Build query depending on whether password is being changed
    const query = `
      UPDATE Users SET
        Username = @Username,
        FirstName = @FirstName,
        LastName = @LastName,
        Email = @Email,
        Role = @Role,
        RoleId = @RoleId,
        Active = @Active,
        ${hashedPassword ? 'PasswordHash = @PasswordHash,' : ''}
        ModifiedOn = GETDATE()
      WHERE Id = @Id
    `;

    const request = new sql.Request();
    request.input('Id', sql.Int, id);
    request.input('Username', sql.VarChar(100), admin.username);
    request.input('FirstName', sql.VarChar(100), admin.firstName);
    request.input('LastName', sql.VarChar(100), admin.lastName);
    request.input('Email', sql.VarChar(200), admin.email);
    request.input('Role', sql.VarChar(50), admin.role);
    request.input('RoleId', sql.Int, roleId);
    request.input('Active', sql.Bit, admin.active);

    if (hashedPassword) {
      request.input('PasswordHash', sql.VarChar(200), hashedPassword);
    }

    const result = await request.query(query);

    if (result.rowsAffected && result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Error updating user:', err);
    return res.status(500).send('Server error');
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
    ROLE MANAGEMENT ENDPOINTS
=========================== */

// GET /roles (all roles)
app.get('/roles', authenticateToken, async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM Roles');

    const roles = result.recordset.map(row => ({
      roleId: row.RoleID,
      roleName: row.RoleName,
      roleDescription: row.RoleDescription,
    }));

    res.json(roles);

  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send('Server error');
  }
});

// GET /roles/:id (single role by ID)
app.get('/roles/:id', authenticateToken, async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RoleID', sql.Int, id);
    const result = await request.query('SELECT * FROM Roles WHERE RoleID = @RoleID');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const row = result.recordset[0];
    const role = {
      roleId: row.RoleID,
      roleName: row.RoleName,
      roleDescription: row.RoleDescription,
    };

    res.json(role);
  } catch (err) {
    console.error('Error fetching role:', err);
    res.status(500).send('Server error');
  }
});

// POST /roles (add new role)
app.post('/roles', authenticateToken, async (req, res) => {
  try {
    await sql.connect(config);
    const role = req.body;

    if (!role.roleName) {
      return res.status(400).json({ message: 'Role name is required' });
    }

    const query = `
      INSERT INTO Roles (RoleName, RoleDescription)
      VALUES (@RoleName, @RoleDescription)
    `;

    const request = new sql.Request();
    request.input('RoleName', sql.VarChar(100), role.roleName);
    request.input('RoleDescription', sql.VarChar(500), role.roleDescription || '');

    await request.query(query);
    res.status(201).json({ message: 'Role added successfully' });
  } catch (err) {
    console.error('Error adding role:', err);
    res.status(500).send('Server error');
  }
});

// PUT /roles/:id (update existing role)
app.put('/roles/:id', authenticateToken, async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const role = req.body;

    const query = `
      UPDATE Roles SET
        RoleName = @RoleName,
        RoleDescription = @RoleDescription
      WHERE RoleID = @RoleID
    `;

    const request = new sql.Request();
    request.input('RoleID', sql.Int, id);
    request.input('RoleName', sql.VarChar(100), role.roleName);
    request.input('RoleDescription', sql.VarChar(500), role.roleDescription || '');

    const result = await request.query(query);

    if (result.rowsAffected && result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.status(200).json({ message: 'Role updated successfully' });
  } catch (err) {
    console.error('Error updating role:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /roles/:id (delete role)
app.delete('/roles/:id', authenticateToken, async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RoleID', sql.Int, id);

    await request.query('DELETE FROM Roles WHERE RoleID = @RoleID');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting role:', err);
    res.status(500).send('Server error');
  }
});

/* ==========================
    JOBS MANAGEMENT ENDPOINTS
========================== */

// GET /jobs (all jobs)
app.get('/jobs', authenticateToken, async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM Jobs');
    const jobs = result.recordset.map(row => ({
      rowId: parseInt(row.RowID, 10),
      jobNumber: row.JobNumber,
      customer: row.Customer,
      location: row.Location,
      clientTrackingNumber: row.ClientTrackingNumber,
      serviceType: row.ServiceType,
      jobStatus: row.JobStatus,
      trade: row.Trade,
      vendor: row.Vendor,
      jobOwner: row.JobOwner,
      dateReceived: row.DateReceived,
      state: row.State,
      eta: row.ETA,
      caller: row.Caller,
      nte: row.NTE,
      vendorNTE: row.VendorNTE,
      quote: row.Quote,
      jobNote: row.JobNote,
      active: row.Active,
      enteredBy: row.EnteredBy,
      enteredOn: row.EnteredOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(jobs);
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send('Server error');
  }
});

// GET /jobs/:id (single job by ID)
app.get('/jobs/:id', authenticateToken, async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    const result = await request.query('SELECT * FROM Jobs WHERE RowID = @RowID');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }
    const row = result.recordset[0];
    const job = {
      rowId: parseInt(row.RowID, 10),
      jobNumber: row.JobNumber,
      customer: row.Customer,
      location: row.Location,
      clientTrackingNumber: row.ClientTrackingNumber,
      serviceType: row.ServiceType,
      jobStatus: row.JobStatus,
      trade: row.Trade,
      vendor: row.Vendor,
      jobOwner: row.JobOwner,
      dateReceived: row.DateReceived,
      state: row.State,
      eta: row.ETA,
      caller: row.Caller,
      nte: row.NTE,
      vendorNTE: row.VendorNTE,
      quote: row.Quote,
      jobNote: row.JobNote,
      active: row.Active,
      enteredBy: row.EnteredBy,
      enteredOn: row.EnteredOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    };
    res.json(job);
  } catch (err) {
    console.error('Error fetching job:', err);
    res.status(500).send('Server error');
  }
});

// POST /jobs (add new job)
app.post('/jobs', authenticateToken, async (req, res) => {
  try {
    await sql.connect(config);
    const job = req.body;
    const query = `
      INSERT INTO Jobs (
        JobNumber, Customer, Location, ClientTrackingNumber, ServiceType, JobStatus, Trade, Vendor, JobOwner,
        DateReceived, State, ETA, Caller, NTE, VendorNTE, Quote, JobNote, Active, EnteredBy, EnteredOn
      ) VALUES (
        @JobNumber, @Customer, @Location, @ClientTrackingNumber, @ServiceType, @JobStatus, @Trade, @Vendor, @JobOwner,  
        @DateReceived, @State, @ETA, @Caller, @NTE, @VendorNTE, @Quote, @JobNote, @Active, @EnteredBy, GETDATE()
      )
    `;

    const request = new sql.Request();
    request.input('JobNumber', sql.VarChar, job.jobNumber);
    request.input('Customer', sql.VarChar, job.customer);
    request.input('Location', sql.VarChar, job.location);
    request.input('ClientTrackingNumber', sql.VarChar, job.clientTrackingNumber);
    request.input('ServiceType', sql.VarChar, job.serviceType);
    request.input('JobStatus', sql.VarChar, job.jobStatus);
    request.input('Trade', sql.VarChar, job.trade);
    request.input('Vendor', sql.VarChar, job.vendor);
    request.input('JobOwner', sql.VarChar, job.jobOwner);
    request.input('DateReceived', sql.DateTime, job.dateReceived);
    request.input('State', sql.VarChar, job.state);
    request.input('ETA', sql.DateTime, job.eta);
    request.input('Caller', sql.VarChar, job.caller);
    request.input('NTE', sql.Decimal(18, 2), job.nte);
    request.input('VendorNTE', sql.Decimal(18, 2), job.vendorNTE);
    request.input('Quote', sql.Decimal(18, 2), job.quote);
    request.input('JobNote', sql.VarChar, job.jobNote);
    request.input('Active', sql.Bit, job.active);
    request.input('EnteredBy', sql.VarChar, 'admin_user');
    await request.query(query);
    res.status(201).json({ message: 'Job added successfully' });
  } catch (err) {
    console.error('Error adding job:', err);
    res.status(500).send('Server error');
  }
});

// PUT /jobs/:id (update existing job)
app.put('/jobs/:id', authenticateToken, async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const job = req.body;
    const query = `
      UPDATE Jobs SET
        JobNumber = @JobNumber,
        Customer = @Customer,
        Location = @Location,
        ClientTrackingNumber = @ClientTrackingNumber,
        ServiceType = @ServiceType,
        JobStatus = @JobStatus,
        Trade = @Trade,
        Vendor = @Vendor,
        JobOwner = @JobOwner,
        DateReceived = @DateReceived,
        State = @State,
        ETA = @ETA,
        Caller = @Caller,
        NTE = @NTE,
        VendorNTE = @VendorNTE,
        Quote = @Quote,
        JobNote = @JobNote,
        Active = @Active,
        ModifiedBy = @ModifiedBy,
        ModifiedOn = GETDATE()
      WHERE RowID = @RowID
    `;
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    request.input('JobNumber', sql.VarChar, job.jobNumber);
    request.input('Customer', sql.VarChar, job.customer);
    request.input('Location', sql.VarChar, job.location);
    request.input('ClientTrackingNumber', sql.VarChar, job.clientTrackingNumber);
    request.input('ServiceType', sql.VarChar, job.serviceType);
    request.input('JobStatus', sql.VarChar, job.jobStatus);
    request.input('Trade', sql.VarChar, job.trade);
    request.input('Vendor', sql.VarChar, job.vendor);
    request.input('JobOwner', sql.VarChar, job.jobOwner);
    request.input('DateReceived', sql.DateTime, job.dateReceived);
    request.input('State', sql.VarChar, job.state);
    request.input('ETA', sql.DateTime, job.eta);
    request.input('Caller', sql.VarChar, job.caller);
    request.input('NTE', sql.Decimal(18, 2), job.nte);
    request.input('VendorNTE', sql.Decimal(18, 2), job.vendorNTE);
    request.input('Quote', sql.Decimal(18, 2), job.quote);
    request.input('JobNote', sql.VarChar, job.jobNote);
    request.input('Active', sql.Bit, job.active);
    request.input('ModifiedBy', sql.VarChar, 'admin_user');
    const result = await request.query(query);
    if (result.rowsAffected && result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.status(200).json({ message: 'Job updated successfully' });
  } catch (err) {
    console.error('Error updating job:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /jobs/:id (delete job)
app.delete('/jobs/:id', authenticateToken, async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    await request.query('DELETE FROM Jobs WHERE RowID = @RowID');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting job:', err);
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

// jobs list per customer
app.get('/customers/:id/jobs', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    if (Number.isNaN(customerId)) {
      return res.status(400).json({ error: 'Invalid customer id.' });
    }
    await sql.connect(config);
    const request = new sql.Request();
    request.input('CustomerId', sql.Int, customerId);
    const result = await request.query(`
      SELECT j.RowID, j.JobNumber, j.Customer, j.Location, j.ClientTrackingNumber, j.ServiceType, j.JobStatus, j.Trade, j.Vendor, 
      j.JobOwner, j.DateReceived, j.State, j.ETA, j.Caller, j.NTE, j.VendorNTE, j.Quote, 
      j.JobNote, j.Active, j.EnteredBy, j.EnteredOn, j.ModifiedBy, j.ModifiedOn
      FROM Jobs j
      INNER JOIN Customers c ON j.Customer = c.CustomerName
      WHERE c.RowID = @CustomerId
    `);
    const jobs = result.recordset.map(row => ({
      rowId: Number(row.RowID),
      jobNumber: row.JobNumber,
      customer: row.Customer,
      location: row.Location,
      clientTrackingNumber: row.ClientTrackingNumber,
      serviceType: row.ServiceType,
      jobStatus: row.JobStatus,
      trade: row.Trade,
      vendor: row.Vendor,
      jobOwner: row.JobOwner,
      dateReceived: row.DateReceived,
      state: row.State,
      eta: row.ETA,
      caller: row.Caller,
      nte: row.NTE,
      vendorNTE: row.VendorNTE,
      quote: row.Quote,
      jobNote: row.JobNote,
      active: !!row.Active,
      enteredBy: row.EnteredBy,
      enteredOn: row.EnteredOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(jobs);
  } catch (err) {
    console.error('Error fetching jobs for customer:', err);
    res.status(500).send('Server error');
  }
});

// location list per customer
app.get('/customers/:id/locations', async (req, res) => {
  try {
    // Validate and parse ID
    const customerId = parseInt(req.params.id, 10);
    if (Number.isNaN(customerId)) {
      return res.status(400).json({ error: 'Invalid customer id.' });
    }

    await sql.connect(config);

    const request = new sql.Request();
    request.input('CustomerId', sql.Int, customerId);

    // Fetch all locations for the given customer RowID via CustomerName match
    const result = await request.query(`
      SELECT
        l.RowID,
        l.Customer,
        l.StoreNumber,
        l.ContactFName,
        l.ContactLName,
        l.PhoneNumber,
        l.Email,
        l.Address1,
        l.Address2,
        l.City,
        l.State,
        l.ZipCode,
        l.County,
        l.Country,
        l.Active,
        l.SiteNote,
        l.enteredBy,
        l.DateEntered,
        l.ModifiedBy,
        l.ModifiedOn
      FROM Locations l
      INNER JOIN Customers c ON l.Customer = c.CustomerName
      WHERE c.RowID = @CustomerId
        -- Uncomment the next line if you only want active locations:
        -- AND l.Active = 1
      ORDER BY TRY_CAST(l.StoreNumber AS INT) ASC, l.StoreNumber ASC
    `);

    const locations = result.recordset.map(row => ({
      rowId: Number(row.RowID),
      customer: row.Customer,
      storeNumber: row.StoreNumber,
      primaryContact: {
        firstName: row.ContactFName,
        lastName: row.ContactLName,
        phone: row.PhoneNumber,
        email: row.Email
      },
      siteAddress: {
        address1: row.Address1,
        address2: row.Address2,
        city: row.City,
        state: row.State,
        zip: row.ZipCode,
        county: row.County,
        country: row.Country
      },
      active: !!row.Active,
      siteNote: row.SiteNote,
      enteredBy: row.enteredBy,
      dateEntered: row.DateEntered,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));

    res.json(locations);
  } catch (err) {
    console.error('Error fetching locations for customer:', err);
    res.status(500).send('Server error');
  }
});

// customer status messages per customer
app.get('/customers/:id/status-messages', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    if (Number.isNaN(customerId)) {
      return res.status(400).json({ error: 'Invalid customer id.' });
    }
    await sql.connect(config);
    const request = new sql.Request();
    request.input('CustomerId', sql.Int, customerId);
    const result = await request.query(`
      SELECT csm.RowID, csm.Customer, csm.Status, csm.Message, csm.Active, csm.enteredBy, csm.DateEntered, csm.ModifiedBy, csm.ModifiedOn
      FROM CustomerStatusMessages csm
      INNER JOIN Customers c ON csm.Customer = c.CustomerName
      WHERE c.RowID = @CustomerId
      ORDER BY csm.DateEntered DESC
    `);
    const statusMessages = result.recordset.map(row => ({
      rowId: Number(row.RowID),
      customer: row.Customer,
      status: row.Status,
      message: row.Message,
      active: !!row.Active,
      enteredBy: row.enteredBy,
      dateEntered: row.DateEntered,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(statusMessages);
  } catch (err) {
    console.error('Error fetching status messages for customer:', err);
    res.status(500).send('Server error');
  }
});

// customer cams per customer
app.get('/customers/:id/customer-cams', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    if (Number.isNaN(customerId)) {
      return res.status(400).json({ error: 'Invalid customer id.' });
    }
    await sql.connect(config);
    const request = new sql.Request();
    request.input('CustomerId', sql.Int, customerId);
    const result = await request.query(`
      SELECT cc.RowID, cc.Customer, cc.Username, cc.Email, cc.PhoneNumber, cc.Trade, cc.Active, cc.CreatedBy, cc.CreatedOn, cc.ModifiedBy, cc.ModifiedOn
      FROM CustomerCAMs cc
      INNER JOIN Customers c ON cc.Customer = c.CustomerName
      WHERE c.RowID = @CustomerId
      ORDER BY cc.CreatedOn DESC
    `);
    const customerCams = result.recordset.map(row => ({
      rowId: Number(row.RowID),
      customer: row.Customer,
      username: row.Username,
      email: row.Email,
      phone: row.PhoneNumber,
      trade: row.Trade,
      active: !!row.Active,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(customerCams);
  } catch (err) {
    console.error('Error fetching customer CAMs for customer:', err);
    res.status(500).send('Server error');
  }
});

// customer nte per customer
app.get('/customers/:id/customer-nte', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    if (Number.isNaN(customerId)) {
      return res.status(400).json({ error: 'Invalid customer id.' });
    }
    await sql.connect(config);
    const request = new sql.Request();
    request.input('CustomerId', sql.Int, customerId);
    const result = await request.query(`
      SELECT nte.RowID, nte.Customer, nte.Classification, nte.ServiceType, nte.RateNTE, nte.VendorNTE, nte.Note
      FROM CustomerNTE nte
      INNER JOIN Customers c ON nte.Customer = c.CustomerName
      WHERE c.RowID = @CustomerId
    `);
    const customerNTEs = result.recordset.map(row => ({
      rowId: Number(row.RowID),
      customer: row.Customer,
      classification: row.Classification,
      serviceType: row.ServiceType,
      rateNTE: row.RateNTE,
      vendorNte: row.VendorNTE,
      note: row.Note
    }));
    res.json(customerNTEs);
  } catch (err) {
    console.error('Error fetching customer NTE for customer:', err);
    res.status(500).send('Server error');
  }
});

// customer eta per customer
app.get('/customers/:id/customer-eta', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    if (Number.isNaN(customerId)) {
      return res.status(400).json({ error: 'Invalid customer id.' });
    }
    await sql.connect(config);
    const request = new sql.Request();
    request.input('CustomerId', sql.Int, customerId);
    const result = await request.query(`
      SELECT eta.RowID, eta.Customer, eta.ServiceType, eta.ETAHours, eta.HoursBusDays
      FROM CustomerETA eta
      INNER JOIN Customers c ON eta.Customer = c.CustomerName
      WHERE c.RowID = @CustomerId
    `);
    const customerETAs = result.recordset.map(row => ({
      rowId: Number(row.RowID),
      customer: row.Customer,
      serviceType: row.ServiceType,
      etaHours: row.ETAHours,
      hoursBusDays: row.HoursBusDays
    }));
    res.json(customerETAs);
  } catch (err) {
    console.error('Error fetching customer ETA for customer:', err);
    res.status(500).send('Server error');
  }
});

// Customer Rates per customer
app.get('/customers/:id/customer-rates', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    if (Number.isNaN(customerId)) {
      return res.status(400).json({ error: 'Invalid customer id.' });
    }
    await sql.connect(config);
    const request = new sql.Request();
    request.input('CustomerId', sql.Int, customerId);
    const result = await request.query(`
      SELECT cr.RowID, cr.Customer, cr.Trade, cr.RateType, cr.State, cr.Rate, cr.CreatedBy, cr.CreatedOn, cr.ModifiedBy, cr.ModifiedOn
      FROM CustomerRates cr
      INNER JOIN Customers c ON cr.Customer = c.CustomerName
      WHERE c.RowID = @CustomerId
    `);
    const customerRates = result.recordset.map(row => ({
      rowId: Number(row.RowID),
      customer: row.Customer,
      trade: row.Trade,
      rateType: row.RateType,
      state: row.State,
      rate: row.Rate,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(customerRates);
  } catch (err) {
    console.error('Error fetching customer rates for customer:', err);
    res.status(500).send('Server error');
  }
});

// customer service types per customer
app.get('/customers/:id/service-types', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    if (Number.isNaN(customerId)) {
      return res.status(400).json({ error: 'Invalid customer id.' });
    }
    await sql.connect(config);
    const request = new sql.Request();
    request.input('CustomerId', sql.Int, customerId);
    const result = await request.query(`
      SELECT st.RowID, st.Customer, st.ServiceType, st.CreatedBy, st.CreatedOn, st.ModifiedBy, st.ModifiedOn
      FROM ServiceTypes st
      INNER JOIN Customers c ON st.Customer = c.CustomerName
      WHERE c.RowID = @CustomerId
    `);
    const serviceTypes = result.recordset.map(row => ({
      rowId: Number(row.RowID),
      customer: row.Customer,
      serviceType: row.ServiceType,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(serviceTypes);
  } catch (err) {
    console.error('Error fetching service types for customer:', err);
    res.status(500).send('Server error');
  }
});

// equipment list per customer
app.get('/customers/:id/equipment', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    if (Number.isNaN(customerId)) {
      return res.status(400).json({ error: 'Invalid customer id.' });
    }
    await sql.connect(config);
    const request = new sql.Request();
    request.input('CustomerId', sql.Int, customerId);
    const result = await request.query(`
      SELECT eq.RowID, eq.Customer, eq.Location, eq.EntryStatus, eq.Manufacturer, eq.Model, eq.SerialNumber, eq.Tonnage, eq.Age, eq.Condition, eq.TypeOfUnit, eq.DateLoaded
      FROM Equipment eq
      INNER JOIN Customers c ON eq.Customer = c.CustomerName
      WHERE c.RowID = @CustomerId
    `);
    const equipmentList = result.recordset.map(row => ({
      rowId: Number(row.RowID),
      customer: row.Customer,
      location: row.Location,
      entryStatus: row.EntryStatus,
      manufacturer: row.Manufacturer,
      model: row.Model,
      serialNumber: row.SerialNumber,
      tonnage: row.Tonnage,
      age: row.Age,
      condition: row.Condition,
      typeOfUnit: row.TypeOfUnit,
      dateLoaded: row.DateLoaded
    }));  
    res.json(equipmentList);
  } catch (err) {
    console.error('Error fetching equipment list for customer:', err);
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

/* ===========================
   LOCATIONS MANAGEMENT ENDPOINTS
=========================== */


// GET /locations (all locations)
app.get('/locations', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM Locations');

    const locations = result.recordset.map(row => ({
      rowId: parseInt(row.RowID, 10),
      customer: row.Customer,
      storeNumber: row.StoreNumber,
      primaryContact: {
        firstName: row.ContactFName,
        lastName: row.ContactLName,
        phone: row.PhoneNumber,
        email: row.Email
      },
      siteAddress: {
        address1: row.Address1,
        address2: row.Address2,
        city: row.City,
        state: row.State,
        zip: row.ZipCode,
        county: row.County,
        country: row.Country
      },
      active: row.Active,
      siteNote: row.SiteNote,
      enteredBy: row.enteredBy,
      dateEntered: row.DateEntered,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));

    res.json(locations);
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send('Server error');
  }
});


// GET /locations/:id (single location by ID)
app.get('/locations/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    const result = await request.query('SELECT * FROM Locations WHERE RowID = @RowID');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Location not found' });
    }
    const row = result.recordset[0];
    const location = {
      rowId: parseInt(row.RowID, 10),
      customer: row.Customer,
      storeNumber: row.StoreNumber,
      primaryContact: {
        firstName: row.ContactFName,
        lastName: row.ContactLName,
        phone: row.PhoneNumber,
        email: row.Email
      },
      siteAddress: {
        address1: row.Address1,
        address2: row.Address2,
        city: row.City,
        state: row.State,
        zip: row.ZipCode,
        county: row.County,
        country: row.Country
      },
      active: row.Active,
      siteNote: row.SiteNote,
      enteredBy: row.enteredBy,
      dateEntered: row.DateEntered,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    };
    res.json(location);
  } catch (err) {
    console.error('Error fetching location:', err);
    res.status(500).send('Server error');
  }
});


// POST /locations (add new location)
app.post('/locations', async (req, res) => {
  try {
    await sql.connect(config);
    const location = req.body;
    const query = `
      INSERT INTO Locations (
        Customer, StoreNumber, ContactFName, ContactLName, PhoneNumber, Email,
        Address1, Address2, City, State, ZipCode, County, Country,
        Active, SiteNote, enteredBy, DateEntered
      ) VALUES (
        @Customer, @StoreNumber, @ContactFName, @ContactLName, @PhoneNumber, @Email,
        @Address1, @Address2, @City, @State, @ZipCode, @County, @Country,
        @Active, @SiteNote, @enteredBy, GETDATE()
      )
    `;
    const request = new sql.Request();
    request.input('Customer', sql.VarChar, location.customer);
    request.input('StoreNumber', sql.VarChar, location.storeNumber);
    request.input('ContactFName', sql.VarChar, location.primaryContact.firstName);
    request.input('ContactLName', sql.VarChar, location.primaryContact.lastName);
    request.input('PhoneNumber', sql.VarChar, location.primaryContact.phone);
    request.input('Email', sql.VarChar, location.primaryContact.email);
    request.input('Address1', sql.VarChar, location.siteAddress.address1);
    request.input('Address2', sql.VarChar, location.siteAddress.address2);
    request.input('City', sql.VarChar, location.siteAddress.city);
    request.input('State', sql.VarChar, location.siteAddress.state);
    request.input('ZipCode', sql.VarChar, location.siteAddress.zip);
    request.input('County', sql.VarChar, location.siteAddress.county);
    request.input('Country', sql.VarChar, location.siteAddress.country);
    request.input('Active', sql.Bit, location.active);
    request.input('SiteNote', sql.VarChar, location.siteNote);
    request.input('enteredBy', sql.VarChar, 'admin_user');
    await request.query(query);
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({ message: 'Location added successfully' });
  } catch (err) {
    console.error('Error adding location:', err);
    res.status(500).send('Server error');
  }
});

// PUT /locations/:id (update existing location)
app.put('/locations/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const location = req.body;
    const id = req.params.id;
    const query = `
      UPDATE Locations SET
        Customer = @Customer,
        StoreNumber = @StoreNumber,
        ContactFName = @ContactFName,
        ContactLName = @ContactLName,
        PhoneNumber = @PhoneNumber,
        Email = @Email,
        Address1 = @Address1,
        Address2 = @Address2,
        City = @City,
        State = @State,
        ZipCode = @ZipCode,
        County = @County,
        Country = @Country,
        Active = @Active,
        SiteNote = @SiteNote,
        ModifiedBy = @ModifiedBy,
        ModifiedOn = GETDATE()
      WHERE RowID = @RowID
    `;
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    request.input('Customer', sql.VarChar, location.customer);
    request.input('StoreNumber', sql.VarChar, location.storeNumber);
    request.input('ContactFName', sql.VarChar, location.primaryContact.firstName);
    request.input('ContactLName', sql.VarChar, location.primaryContact.lastName);
    request.input('PhoneNumber', sql.VarChar, location.primaryContact.phone);
    request.input('Email', sql.VarChar, location.primaryContact.email);
    request.input('Address1', sql.VarChar, location.siteAddress.address1);
    request.input('Address2', sql.VarChar, location.siteAddress.address2);
    request.input('City', sql.VarChar, location.siteAddress.city);
    request.input('State', sql.VarChar, location.siteAddress.state);
    request.input('ZipCode', sql.VarChar, location.siteAddress.zip);
    request.input('County', sql.VarChar, location.siteAddress.county);
    request.input('Country', sql.VarChar, location.siteAddress.country);
    request.input('Active', sql.Bit, location.active);
    request.input('SiteNote', sql.VarChar, location.siteNote);
    request.input('ModifiedBy', sql.VarChar, 'admin_user');
    await request.query(query);
    res.status(200).json({ message: 'Location updated successfully' });
  } catch (err) {
    console.error('Error updating location:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /locations/:id (delete location)
app.delete('/locations/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    await request.query('DELETE FROM Locations WHERE RowID = @RowID');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting location:', err);
    res.status(500).send('Server error');
  }
});

/* ===========================
    CUSTOMER STATUS MESSAGES ENDPOINTS
=========================== */

// GET /customer-status-messages (all status messages)
app.get('/status-messages', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM CustomerStatusMessages');
    const statusMessages = result.recordset.map(row => ({
      rowId: Number(row.RowID),
      customer: row.Customer,
      status: row.Status,
      message: row.Message,
      active: !!row.Active,
      enteredBy: row.enteredBy,
      dateEntered: row.DateEntered,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(statusMessages);
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send('Server error');
  }
});

// GET /customer-status-messages/:id (single status message by ID)
app.get('/status-messages/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    const result = await request.query('SELECT * FROM CustomerStatusMessages WHERE RowID = @RowID');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Status message not found' });
    }
    const row = result.recordset[0];
    const statusMessage = {
      rowId: Number(row.RowID),
      customer: row.Customer,
      status: row.Status,
      message: row.Message,
      active: !!row.Active,
      enteredBy: row.enteredBy,
      dateEntered: row.DateEntered,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    };
    res.json(statusMessage);
  } catch (err) {
    console.error('Error fetching status message:', err);
    res.status(500).send('Server error');
  }
});

// POST /customer-status-messages (add new status message)
app.post('/status-messages', async (req, res) => {
  try {
    await sql.connect(config);

    const statusMessage = req.body;
    const query = `
      INSERT INTO CustomerStatusMessages (
        Customer, Status, Message, Active, enteredBy, DateEntered
      ) VALUES (
        @Customer, @Status, @Message, @Active, @enteredBy, GETDATE()
      )
    `;
    const request = new sql.Request();
    request.input('Customer', sql.VarChar, statusMessage.customer);
    request.input('Status', sql.VarChar, statusMessage.status);
    request.input('Message', sql.VarChar, statusMessage.message);
    request.input('Active', sql.Bit, statusMessage.active);
    request.input('enteredBy', sql.VarChar, 'admin_user');
    await request.query(query);
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({ message: 'Status message added successfully' });
  } catch (err) {
    console.error('Error adding status message:', err);
    res.status(500).send('Server error');
  }
});


// PUT /customer-status-messages/:id (update existing status message)
app.put('/status-messages/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const statusMessage = req.body;
    const id = req.params.id;
    const query = `
      UPDATE CustomerStatusMessages SET
        Customer = @Customer,
        Status = @Status,
        Message = @Message,
        Active = @Active,
        ModifiedBy = @ModifiedBy,
        ModifiedOn = GETDATE()
      WHERE RowID = @RowID
    `;
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    request.input('Customer', sql.VarChar, statusMessage.customer);
    request.input('Status', sql.VarChar, statusMessage.status);
    request.input('Message', sql.VarChar, statusMessage.message);
    request.input('Active', sql.Bit, statusMessage.active);
    request.input('ModifiedBy', sql.VarChar, 'admin_user');
    await request.query(query);
    res.status(200).json({ message: 'Status message updated successfully' });
  } catch (err) {
    console.error('Error updating status message:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /customer-status-messages/:id (delete status message)
app.delete('/status-messages/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    await request.query('DELETE FROM CustomerStatusMessages WHERE RowID = @RowID');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting status message:', err);
    res.status(500).send('Server error');
  }
});

/* ===========================
    CUSTOMER CAMS ENDPOINTS
=========================== */

// GET /customer-cams (all customer cams)
app.get('/customer-cams', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM CustomerCAMs');
    const customerCams = result.recordset.map(row => ({
      rowId: Number(row.RowID),
      customer: row.Customer,
      username: row.Username,
      email: row.Email,
      phone: row.PhoneNumber,
      trade: row.Trade,
      active: !!row.Active,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(customerCams);
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send('Server error');
  }
});

// GET /customer-cams/:id (single customer cam by ID)
app.get('/customer-cams/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    const result = await request.query('SELECT * FROM CustomerCAMs WHERE RowID = @RowID');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Customer CAM not found' });
    }
    const row = result.recordset[0];
    const customerCam = {
      rowId: Number(row.RowID),
      customer: row.Customer,
      username: row.Username,
      email: row.Email,
      phone: row.PhoneNumber,
      trade: row.Trade,
      active: !!row.Active,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    };
    res.json(customerCam);
  } catch (err) {
    console.error('Error fetching customer CAM:', err);
    res.status(500).send('Server error');
  }
});

// POST /customer-cams (add new customer cam)
app.post('/customer-cams', async (req, res) => {
  try {
    await sql.connect(config);
    const customerCam = req.body;
    const query = `
      INSERT INTO CustomerCAMs (
        Customer, Username, Email, PhoneNumber, Trade, Active, CreatedBy, CreatedOn
      ) VALUES (
        @Customer, @Username, @Email, @PhoneNumber, @Trade, @Active, @CreatedBy, GETDATE()
      )
    `;
    const request = new sql.Request();
    request.input('Customer', sql.VarChar, customerCam.customer);
    request.input('Username', sql.VarChar, customerCam.username);
    request.input('Email', sql.VarChar, customerCam.email);
    request.input('PhoneNumber', sql.VarChar, customerCam.phone);
    request.input('Trade', sql.VarChar, customerCam.trade);
    request.input('Active', sql.Bit, customerCam.active);
    request.input('CreatedBy', sql.VarChar, 'admin');
    await request.query(query);
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({ message: 'Customer CAM added successfully' });
  } catch (err) {
    console.error('Error adding customer CAM:', err);
    res.status(500).send('Server error');
  }
});

// PUT /customer-cams/:id (update existing customer cam)
app.put('/customer-cams/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const customerCam = req.body;
    const id = req.params.id;
    const query = `
      UPDATE CustomerCAMs SET
        Customer = @Customer,
        Username = @Username,
        Email = @Email,
        PhoneNumber = @PhoneNumber,
        Trade = @Trade,
        Active = @Active,
        ModifiedBy = @ModifiedBy,
        ModifiedOn = GETDATE()
      WHERE RowID = @RowID
    `;
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    request.input('Customer', sql.VarChar, customerCam.customer);
    request.input('Username', sql.VarChar, customerCam.username);
    request.input('Email', sql.VarChar, customerCam.email);
    request.input('PhoneNumber', sql.VarChar, customerCam.phone);
    request.input('Trade', sql.VarChar, customerCam.trade);
    request.input('Active', sql.Bit, customerCam.active);
    request.input('ModifiedBy', sql.VarChar, 'admin_user');
    await request.query(query);
    res.status(200).json({ message: 'Customer CAM updated successfully' });
  } catch (err) {
    console.error('Error updating customer CAM:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /customer-cams/:id (delete customer cam)
app.delete('/customer-cams/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    await request.query('DELETE FROM CustomerCAMs WHERE RowID = @RowID');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting customer CAM:', err);
    res.status(500).send('Server error');
  }
});

/* ===========================
    CUSTOMER NTE ENDPOINTS
=========================== */

// GET /customer-nte (all customer nte)
app.get('/customer-nte', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM CustomerNTE');
    const customerNTEs = result.recordset.map(row => ({
      rowId: Number(row.RowID),
      customer: row.Customer,
      classification: row.Classification,
      serviceType: row.ServiceType,
      rateNTE: row.RateNTE,
      vendorNte: row.VendorNTE,
      note: row.Note
    }));
    res.json(customerNTEs);
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send('Server error');
  }
});

// GET /customer-nte/:id (single customer nte by ID)
app.get('/customer-nte/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    const result = await request.query('SELECT * FROM CustomerNTE WHERE RowID = @RowID');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Customer NTE not found' });
    }
    const row = result.recordset[0];
    const customerNTE = {
      rowId: Number(row.RowID),
      customer: row.Customer,
      classification: row.Classification,
      serviceType: row.ServiceType,
      rateNTE: row.RateNTE,
      vendorNte: row.VendorNTE,
      note: row.Note
    };
    res.json(customerNTE);
  } catch (err) {
    console.error('Error fetching customer NTE:', err);
    res.status(500).send('Server error');
  }
});

// POST /customer-nte (add new customer nte)
app.post('/customer-nte', async (req, res) => {
  try {
    await sql.connect(config);
    const customerNTE = req.body;
    const query = `
      INSERT INTO CustomerNTE (
        Customer, Classification, ServiceType, RateNTE, VendorNTE, Note
      ) VALUES (
        @Customer, @Classification, @ServiceType, @RateNTE, @VendorNTE, @Note
      )
    `;
    const request = new sql.Request();
    request.input('Customer', sql.VarChar, customerNTE.customer);
    request.input('Classification', sql.VarChar, customerNTE.classification);
    request.input('ServiceType', sql.VarChar, customerNTE.serviceType);
    request.input('RateNTE', sql.Decimal(18, 2), customerNTE.rateNTE);
    request.input('VendorNTE', sql.Decimal(18, 2), customerNTE.vendorNte);
    request.input('Note', sql.VarChar, customerNTE.note);
    await request.query(query);
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({ message: 'Customer NTE added successfully' });
  } catch (err) {
    console.error('Error adding customer NTE:', err);
    res.status(500).send('Server error');
  }
});

// PUT /customer-nte/:id (update existing customer nte)
app.put('/customer-nte/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const customerNTE = req.body;
    const id = req.params.id;
    const query = `
      UPDATE CustomerNTE SET
        Customer = @Customer,
        Classification = @Classification,
        ServiceType = @ServiceType,
        RateNTE = @RateNTE,
        VendorNTE = @VendorNTE,
        Note = @Note
      WHERE RowID = @RowID
    `;
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    request.input('Customer', sql.VarChar, customerNTE.customer);
    request.input('Classification', sql.VarChar, customerNTE.classification);
    request.input('ServiceType', sql.VarChar, customerNTE.serviceType);
    request.input('RateNTE', sql.Decimal(18, 2), customerNTE.rateNTE);
    request.input('VendorNTE', sql.Decimal(18, 2), customerNTE.vendorNte);
    request.input('Note', sql.VarChar, customerNTE.note);
    await request.query(query);
    res.status(200).json({ message: 'Customer NTE updated successfully' });
  } catch (err) {
    console.error('Error updating customer NTE:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /customer-nte/:id (delete customer nte)
app.delete('/customer-nte/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    await request.query('DELETE FROM CustomerNTE WHERE RowID = @RowID');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting customer NTE:', err);
    res.status(500).send('Server error');
  }
});

/* ===========================
    CUSTOMER ETA ENDPOINTS
=========================== */

// GET /customer-eta (all customer eta)
app.get('/customer-eta', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM CustomerETA');
    const customerETAs = result.recordset.map(row => ({
      rowId: Number(row.RowID),
      customer: row.Customer,
      serviceType: row.ServiceType,
      etaHours: row.ETAHours,
      hoursBusDays: row.HoursBusDays
    }));
    res.json(customerETAs);
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send('Server error');
  }
});

// GET /customer-eta/:id (single customer eta by ID)
app.get('/customer-eta/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    const result = await request.query('SELECT * FROM CustomerETA WHERE RowID = @RowID');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Customer ETA not found' });
    }
    const row = result.recordset[0];
    const customerETA = {
      rowId: Number(row.RowID),
      customer: row.Customer,
      serviceType: row.ServiceType,
      etaHours: row.ETAHours,
      hoursBusDays: row.HoursBusDays
    };
    res.json(customerETA);
  } catch (err) {
    console.error('Error fetching customer ETA:', err);
    res.status(500).send('Server error');
  }
});

// POST /customer-eta (add new customer eta)
app.post('/customer-eta', async (req, res) => {
  try {
    await sql.connect(config);
    const customerETA = req.body;
    const query = `
      INSERT INTO CustomerETA (
        Customer, ServiceType, ETAHours, HoursBusDays
      ) VALUES (
        @Customer, @ServiceType, @ETAHours, @HoursBusDays
      )
    `;
    const request = new sql.Request();
    request.input('Customer', sql.VarChar, customerETA.customer);
    request.input('ServiceType', sql.VarChar, customerETA.serviceType);
    request.input('ETAHours', sql.Int, customerETA.etaHours);
    request.input('HoursBusDays', sql.Int, customerETA.hoursBusDays);
    await request.query(query);
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({ message: 'Customer ETA added successfully' });
  } catch (err) {
    console.error('Error adding customer ETA:', err);
    res.status(500).send('Server error');
  }
});

// PUT /customer-eta/:id (update existing customer eta)
app.put('/customer-eta/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const customerETA = req.body;
    const id = req.params.id;
    const query = `
      UPDATE CustomerETA SET
        Customer = @Customer,
        ServiceType = @ServiceType,
        ETAHours = @ETAHours,
        HoursBusDays = @HoursBusDays
      WHERE RowID = @RowID
    `;
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    request.input('Customer', sql.VarChar, customerETA.customer);
    request.input('ServiceType', sql.VarChar, customerETA.serviceType);
    request.input('ETAHours', sql.Int, customerETA.etaHours);
    request.input('HoursBusDays', sql.Int, customerETA.hoursBusDays);
    await request.query(query);
    res.status(200).json({ message: 'Customer ETA updated successfully' });
  } catch (err) {
    console.error('Error updating customer ETA:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /customer-eta/:id (delete customer eta)
app.delete('/customer-eta/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    await request.query('DELETE FROM CustomerETA WHERE RowID = @RowID');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting customer ETA:', err);
    res.status(500).send('Server error');
  }
});

/* ===========================
    CUSTOMER RATES ENDPOINTS
=========================== */

// GET /customer-rates (all customer rates)
app.get('/customer-rates', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM CustomerRates');
    const customerRates = result.recordset.map(row => ({
      rowId: Number(row.RowID),
      customer: row.Customer,
      trade: row.Trade,
      rateType: row.RateType,
      state: row.State,
      rate: row.Rate,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(customerRates);
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send('Server error');
  }
});

// GET /customer-rates/:id (single customer rate by ID)
app.get('/customer-rates/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    const result = await request.query('SELECT * FROM CustomerRates WHERE RowID = @RowID');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Customer rate not found' });
    }
    const row = result.recordset[0];
    const customerRate = {
      rowId: Number(row.RowID),
      customer: row.Customer,
      trade: row.Trade,
      rateType: row.RateType,
      state: row.State,
      rate: row.Rate,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    };
    res.json(customerRate);
  } catch (err) {
    console.error('Error fetching customer rate:', err);
    res.status(500).send('Server error');
  }
});

// POST /customer-rates (add new customer rate)
app.post('/customer-rates', async (req, res) => {
  try {
    await sql.connect(config);
    const customerRate = req.body;
    const query = `
      INSERT INTO CustomerRates (
        Customer, Trade, RateType, State, Rate, CreatedBy, CreatedOn
      ) VALUES (
        @Customer, @Trade, @RateType, @State, @Rate, @CreatedBy, GETDATE()
      )
    `;
    const request = new sql.Request();
    request.input('Customer', sql.VarChar, customerRate.customer);
    request.input('Trade', sql.VarChar, customerRate.trade);
    request.input('RateType', sql.VarChar, customerRate.rateType);
    request.input('State', sql.VarChar, customerRate.state);
    request.input('Rate', sql.Decimal(18, 2), customerRate.rate);
    request.input('CreatedBy', sql.VarChar, 'admin');
    await request.query(query);
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({ message: 'Customer rate added successfully' });
  } catch (err) {
    console.error('Error adding customer rate:', err);
    res.status(500).send('Server error');
  }
});

// PUT /customer-rates/:id (update existing customer rate)
app.put('/customer-rates/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const customerRate = req.body;
    const id = req.params.id;
    const query = `
      UPDATE CustomerRates SET
        Customer = @Customer,
        Trade = @Trade,
        RateType = @RateType,
        State = @State,
        Rate = @Rate,
        ModifiedBy = @ModifiedBy,
        ModifiedOn = GETDATE()
      WHERE RowID = @RowID
    `;
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    request.input('Customer', sql.VarChar, customerRate.customer);
    request.input('Trade', sql.VarChar, customerRate.trade);
    request.input('RateType', sql.VarChar, customerRate.rateType);
    request.input('State', sql.VarChar, customerRate.state);
    request.input('Rate', sql.Decimal(18, 2), customerRate.rate);
    request.input('ModifiedBy', sql.VarChar, 'admin_user');
    await request.query(query);
    res.status(200).json({ message: 'Customer rate updated successfully' });
  } catch (err) {
    console.error('Error updating customer rate:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /customer-rates/:id (delete customer rate)
app.delete('/customer-rates/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    await request.query('DELETE FROM CustomerRates WHERE RowID = @RowID');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting customer rate:', err);
    res.status(500).send('Server error');
  }
});

/* ===========================
    CUSTOMER SERVICE TYPES ENDPOINTS
=========================== */

// GET /service-types (all customer service types)
app.get('/service-types', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM ServiceTypes');
    const serviceTypes = result.recordset.map(row => ({
      rowId: Number(row.RowID),
      customer: row.Customer,
      serviceType: row.ServiceType
    }));
    res.json(serviceTypes);
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send('Server error');
  }
});

// GET /service-types/:id (single service type by ID)
app.get('/service-types/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    const result = await request.query('SELECT * FROM ServiceTypes WHERE RowID = @RowID');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Service type not found' });
    }
    const row = result.recordset[0];
    const serviceType = {
      rowId: Number(row.RowID),
      customer: row.Customer,
      serviceType: row.ServiceType,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    };
    res.json(serviceType);
  } catch (err) {
    console.error('Error fetching service type:', err);
    res.status(500).send('Server error');
  }
});

// POST /service-types (add new service type)
app.post('/service-types', async (req, res) => {
  try {
    await sql.connect(config);
    const serviceType = req.body;
    const query = `
      INSERT INTO ServiceTypes (
        Customer, ServiceType, CreatedBy, CreatedOn
      ) VALUES (
        @Customer, @ServiceType, @CreatedBy, GETDATE()
      )
    `;
    const request = new sql.Request();
    request.input('Customer', sql.VarChar, serviceType.customer);
    request.input('ServiceType', sql.VarChar, serviceType.serviceType);
    request.input('CreatedBy', sql.VarChar, 'admin');
    request.input('CreatedOn', sql.DateTime, new Date());
    await request.query(query);
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({ message: 'Service type added successfully' });
  } catch (err) {
    console.error('Error adding service type:', err);
    res.status(500).send('Server error');
  }
});

// PUT /service-types/:id (update existing service type)
app.put('/service-types/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const serviceType = req.body;
    const id = req.params.id;
    const query = `
      UPDATE ServiceTypes SET
        Customer = @Customer,
        ServiceType = @ServiceType,
        ModifiedBy = @ModifiedBy,
        ModifiedOn = GETDATE()
      WHERE RowID = @RowID
    `;
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    request.input('Customer', sql.VarChar, serviceType.customer);
    request.input('ServiceType', sql.VarChar, serviceType.serviceType);
    request.input('ModifiedBy', sql.VarChar, 'admin_user');
    request.input('ModifiedOn', sql.DateTime, new Date());
    await request.query(query);
    res.status(200).json({ message: 'Service type updated successfully' });
  }
  catch (err) {
    console.error('Error updating service type:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /service-types/:id (delete service type)
app.delete('/service-types/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    await request.query('DELETE FROM ServiceTypes WHERE RowID = @RowID');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting service type:', err);
    res.status(500).send('Server error');
  }
});

/* ===========================
    EQUIPMENT ENDPOINTS
=========================== */

// GET /equipment (all equipment)
app.get('/equipment', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM Equipment');
    const equipment = result.recordset.map(row => ({
      rowId: Number(row.RowID),
      customer: row.Customer,
      location: row.Location,
      entryStatus: row.EntryStatus,
      manufacturer: row.Manufacturer,
      model: row.Model,
      serialNumber: row.SerialNumber,
      tonnage: row.Tonnage,
      age: row.Age,
      condition: row.Condition,
      typeOfUnit: row.TypeOfUnit,
      dateLoaded: row.DateLoaded,
      enteredBy: row.EnteredBy,
      dateEntered: row.DateEntered,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(equipment);
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send('Server error');
  }
});

// GET /equipment/:id (single equipment by ID)
app.get('/equipment/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    const result = await request.query('SELECT * FROM Equipment WHERE RowID = @RowID');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    const row = result.recordset[0];
    const equipment = {
      rowId: Number(row.RowID),
      customer: row.Customer,
      location: row.Location,
      entryStatus: row.EntryStatus,
      manufacturer: row.Manufacturer,
      model: row.Model,
      serialNumber: row.SerialNumber,
      tonnage: row.Tonnage,
      age: row.Age,
      condition: row.Condition,
      typeOfUnit: row.TypeOfUnit,
      dateLoaded: row.DateLoaded,
      enteredBy: row.EnteredBy,
      dateEntered: row.DateEntered,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    };
    res.json(equipment);
  } catch (err) {
    console.error('Error fetching equipment:', err);
    res.status(500).send('Server error');
  }
});

// POST /equipment (add new equipment)
app.post('/equipment', async (req, res) => {
  try {
    await sql.connect(config);
    const equipment = req.body;
    const query = `
      INSERT INTO Equipment (
        Customer, Location, EntryStatus, Manufacturer, Model, SerialNumber,
        Tonnage, Age, Condition, TypeOfUnit, DateLoaded, EnteredBy, DateEntered
      ) VALUES (
        @Customer, @Location, @EntryStatus, @Manufacturer, @Model, @SerialNumber,
        @Tonnage, @Age, @Condition, @TypeOfUnit, @DateLoaded, @EnteredBy, GETDATE()
      )
    `;
    const request = new sql.Request();
    request.input('Customer', sql.VarChar, equipment.customer);
    request.input('Location', sql.VarChar, equipment.location);
    request.input('EntryStatus', sql.VarChar, equipment.entryStatus);
    request.input('Manufacturer', sql.VarChar, equipment.manufacturer);
    request.input('Model', sql.VarChar, equipment.model);
    request.input('SerialNumber', sql.VarChar, equipment.serialNumber);
    request.input('Tonnage', sql.Decimal(18, 2), equipment.tonnage);
    request.input('Age', sql.Int, equipment.age);
    request.input('Condition', sql.VarChar, equipment.condition);
    request.input('TypeOfUnit', sql.VarChar, equipment.typeOfUnit);
    request.input('DateLoaded', sql.Date, equipment.dateLoaded);
    request.input('EnteredBy', sql.VarChar, 'admin');
    await request.query(query);
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({ message: 'Equipment added successfully' });
  } catch (err) {
    console.error('Error adding equipment:', err);
    res.status(500).send('Server error');
  }
});

// PUT /equipment/:id (update existing equipment)
app.put('/equipment/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const equipment = req.body;
    const id = req.params.id;
    const query = `
      UPDATE Equipment SET
        Customer = @Customer,
        Location = @Location,
        EntryStatus = @EntryStatus,
        Manufacturer = @Manufacturer,
        Model = @Model,
        SerialNumber = @SerialNumber,
        Tonnage = @Tonnage,
        Age = @Age,
        Condition = @Condition,
        TypeOfUnit = @TypeOfUnit,
        DateLoaded = @DateLoaded,
        ModifiedBy = @ModifiedBy,
        ModifiedOn = GETDATE()
      WHERE RowID = @RowID
    `;
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    request.input('Customer', sql.VarChar, equipment.customer);
    request.input('Location', sql.VarChar, equipment.location);
    request.input('EntryStatus', sql.VarChar, equipment.entryStatus);
    request.input('Manufacturer', sql.VarChar, equipment.manufacturer);
    request.input('Model', sql.VarChar, equipment.model);
    request.input('SerialNumber', sql.VarChar, equipment.serialNumber);
    request.input('Tonnage', sql.Decimal(18, 2), equipment.tonnage);
    request.input('Age', sql.Int, equipment.age);
    request.input('Condition', sql.VarChar, equipment.condition);
    request.input('TypeOfUnit', sql.VarChar, equipment.typeOfUnit);
    request.input('DateLoaded', sql.Date, equipment.dateLoaded);
    request.input('ModifiedBy', sql.VarChar, 'admin_user');
    await request.query(query);
    res.status(200).json({ message: 'Equipment updated successfully' });
  } catch (err) {
    console.error('Error updating equipment:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /equipment/:id (delete equipment)
app.delete('/equipment/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    await request.query('DELETE FROM Equipment WHERE RowID = @RowID');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting equipment:', err);
    res.status(500).send('Server error');
  }
});


/* ===========================
    VENDOR MANAGEMENT ENDPOINTS
=========================== */

// GET /vendors (all vendors)
app.get('/vendors', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM Vendor');

    const vendors = result.recordset.map(row => ({
      rowId: parseInt(row.RowID, 10),
      vendorName: row.VendorName,
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
      vendorType: row.VendorType,
      status: row.Status,
      statusNote: row.StatusNote,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));

    res.json(vendors);
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send('Server error');
  }
});

// GET /vendors/:id (single vendor by ID)
app.get('/vendors/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);

    const request = new sql.Request();
    request.input('RowID', sql.Int, id);

    const result = await request.query('SELECT * FROM Vendor WHERE RowID = @RowID');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const row = result.recordset[0];
    const vendor = {
      rowId: parseInt(row.RowID, 10),
      vendorName: row.VendorName,
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
      vendorType: row.VendorType,
      status: row.Status,
      statusNote: row.StatusNote,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    };

    res.json(vendor);
  } catch (err) {
    console.error('Error fetching vendor:', err);
    res.status(500).send('Server error');
  }
});

// POST /vendors (add new vendor)
app.post('/vendors', async (req, res) => {
  try {
    await sql.connect(config);
    const vendor = req.body;

    const query = `
      INSERT INTO Vendor (
        VendorName, Address1, Address2, City, State, Zip, County, Country, Email,
        PrimaryContactName, PrimaryContactPhone, PrimaryContactEmail,
        Status, StatusNote, VendorType, CreatedBy, CreatedOn
      ) VALUES (
        @VendorName, @Address1, @Address2, @City, @State, @Zip, @County, @Country, @Email,
        @PrimaryContactName, @PrimaryContactPhone, @PrimaryContactEmail,
        @Status, @StatusNote, @VendorType, @CreatedBy, GETDATE()
      )
    `;

    const request = new sql.Request();
    request.input('VendorName', sql.VarChar, vendor.vendorName);
    request.input('Address1', sql.VarChar, vendor.billingAddress.address1);
    request.input('Address2', sql.VarChar, vendor.billingAddress.address2);
    request.input('City', sql.VarChar, vendor.billingAddress.city);
    request.input('State', sql.VarChar, vendor.billingAddress.state);
    request.input('Zip', sql.VarChar, vendor.billingAddress.zip);
    request.input('County', sql.VarChar, vendor.billingAddress.county);
    request.input('Country', sql.VarChar, vendor.billingAddress.country);
    request.input('Email', sql.VarChar, vendor.billingAddress.email);
    request.input('PrimaryContactName', sql.VarChar, vendor.primaryContact.name);
    request.input('PrimaryContactPhone', sql.VarChar, vendor.primaryContact.phone);
    request.input('PrimaryContactEmail', sql.VarChar, vendor.primaryContact.email);
    request.input('Status', sql.VarChar, vendor.status);
    request.input('StatusNote', sql.VarChar, vendor.statusNote);
    request.input('VendorType', sql.VarChar, vendor.vendorType);
    request.input('CreatedBy', sql.VarChar, 'admin');

    await request.query(query);
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({ message: 'Vendor added successfully' });
  } catch (err) {
    console.error('Error adding vendor:', err);
    res.status(500).send('Server error');
  }
});

// PUT /vendors/:id (update existing vendor)
app.put('/vendors/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const vendor = req.body;
    const id = req.params.id;

    const query = `
      UPDATE Vendor SET
        VendorName = @VendorName,
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
        Status = @Status,
        StatusNote = @StatusNote,
        VendorType = @VendorType,
        ModifiedBy = @ModifiedBy,
        ModifiedOn = GETDATE()
      WHERE RowID = @RowID
    `;

    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    request.input('VendorName', sql.VarChar, vendor.vendorName);
    request.input('Address1', sql.VarChar, vendor.billingAddress.address1);
    request.input('Address2', sql.VarChar, vendor.billingAddress.address2);
    request.input('City', sql.VarChar, vendor.billingAddress.city);
    request.input('State', sql.VarChar, vendor.billingAddress.state);
    request.input('Zip', sql.VarChar, vendor.billingAddress.zip);
    request.input('County', sql.VarChar, vendor.billingAddress.county);
    request.input('Country', sql.VarChar, vendor.billingAddress.country);
    request.input('Email', sql.VarChar, vendor.billingAddress.email);
    request.input('PrimaryContactName', sql.VarChar, vendor.primaryContact.name);
    request.input('PrimaryContactPhone', sql.VarChar, vendor.primaryContact.phone);
    request.input('PrimaryContactEmail', sql.VarChar, vendor.primaryContact.email);
    request.input('Status', sql.VarChar, vendor.status);
    request.input('StatusNote', sql.VarChar, vendor.statusNote);
    request.input('VendorType', sql.VarChar, vendor.vendorType);
    request.input('ModifiedBy', sql.VarChar, 'admin');

    await request.query(query);
    res.status(200).json({ message: 'Vendor updated successfully' });
  } catch (err) {
    console.error('Error updating vendor:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /vendors/:id (delete vendor)
app.delete('/vendors/:id', async (req, res) => {
  try {
   await sql.connect(config);
    const id = parseInt(req.params.id, 10);

    const request = new sql.Request();
    request.input('RowID', sql.Int, id);

    const result = await request.query('DELETE FROM Vendor OUTPUT DELETED.* WHERE RowID = @RowID');

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const row = result.recordset[0];
    const vendor = {
      rowId: parseInt(row.RowID, 10),
      vendorName: row.VendorName,
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
      vendorType: row.VendorType,
      status: row.Status,
      statusNote: row.StatusNote,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    };

    res.json(vendor);
  } catch (err) {
    console.error('Error fetching vendor:', err);
    res.status(500).send('Server error');
  }
});

/* ===========================
    VEHICLES MANAGEMENT ENDPOINTS
=========================== */

// GET /vehicles (all vehicles)
app.get('/vehicles', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM Vehicles');
    const vehicles = result.recordset.map(row => ({
      rowId: row.RowID,
      vehicleCode: row.VehicleCode,
      status: row.Status,
      gpsType: row.GPSType,
      statusNote: row.StatusNote,
      vehicleType: row.VehicleType,
      year: row.Year,
      make: row.Make,
      model: row.Model,
      color: row.Color,
      vin: row.VIN,
      plate: row.Plate,
      state: row.State,
      manager: row.Manager,
      assignedTo: row.AssignedTo,
      department: row.Department,
      registration: row.Registration,
      inspection: row.Inspection,
      vendorVehicleID: row.VendorVehicleID,
      passType: row.PassType,
      passNumber: row.PassNumber
    }));
    res.json(vehicles);
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send('Server error');
  }
});


// GET /vehicles/:id (get one vehicle by RowID)
app.get('/vehicles/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    const result = await request.query(`SELECT * FROM Vehicles WHERE RowID = @RowID`);
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    const row = result.recordset[0];
    const vehicle = {
      rowId: row.RowID,
      vehicleCode: row.VehicleCode,
      status: row.Status,
      gpsType: row.GPSType,
      statusNote: row.StatusNote,
      vehicleType: row.VehicleType,
      year: row.Year,
      make: row.Make,
      model: row.Model,
      color: row.Color,
      vin: row.VIN,
      plate: row.Plate,
      state: row.State,
      manager: row.Manager,
      assignedTo: row.AssignedTo,
      department: row.Department,
      registration: row.Registration,
      inspection: row.Inspection,
      vendorVehicleID: row.VendorVehicleID,
      passType: row.PassType,
      passNumber: row.PassNumber,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    };
    res.json(vehicle);
  } catch (err) {
    console.error('Error fetching vehicle:', err);
    res.status(500).send('Server error');
  }
});

app.post('/vehicles', async (req, res) => {
  try {
    await sql.connect(config);
    const v = req.body;
    const query = `
      INSERT INTO Vehicles (
        VehicleCode, Status, GPSType, StatusNote, VehicleType, Year, Make, Model,
        Color, VIN, Plate, State, Manager, AssignedTo, Department,
        Registration, Inspection, VendorVehicleID, PassType, PassNumber, CreatedBy, CreatedOn
        )
      VALUES (
        @VehicleCode, @Status, @GPSType, @StatusNote, @VehicleType, @Year, @Make, @Model,
        @Color, @VIN, @Plate, @State, @Manager, @AssignedTo, @Department,
        @Registration, @Inspection, @VendorVehicleID, @PassType, @PassNumber, @CreatedBy, GETDATE()
        )
    `;
    const request = new sql.Request();
    request.input('VehicleCode', sql.VarChar, v.vehicleCode);
    request.input('Status', sql.Bit, v.status ? 1 : 0);
    request.input('GPSType', sql.VarChar, v.gpsType);
    request.input('StatusNote', sql.VarChar, v.statusNote);
    request.input('VehicleType', sql.VarChar, v.vehicleType);
    request.input('Year', sql.Int, v.year);
    request.input('Make', sql.VarChar, v.make);
    request.input('Model', sql.VarChar, v.model);
    request.input('Color', sql.VarChar, v.color);
    request.input('VIN', sql.VarChar, v.vin);
    request.input('Plate', sql.VarChar, v.plate);
    request.input('State', sql.VarChar, v.state);
    request.input('Manager', sql.VarChar, v.manager);
    request.input('AssignedTo', sql.VarChar, v.assignedTo);
    request.input('Department', sql.VarChar, v.department);
    request.input('Registration', sql.VarChar, v.registration);
    request.input('Inspection', sql.VarChar, v.inspection);
    request.input('VendorVehicleID', sql.VarChar, v.vendorVehicleID);
    request.input('PassType', sql.VarChar, v.passType);
    request.input('PassNumber', sql.VarChar, v.passNumber);
    request.input('CreatedBy', sql.VarChar, 'admin');
    await request.query(query);
    res.status(201).json({ message: 'Vehicle added successfully' });
  } catch (err) {
    console.error('Error adding vehicle:', err);
    res.status(500).send('Server error');
  }
});

app.put('/vehicles/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const v = req.body;
    const id = parseInt(req.params.id, 10);
    const query = `
      UPDATE Vehicles SET
        VehicleCode = @VehicleCode,
        Status = @Status,
        GPSType = @GPSType,
        StatusNote = @StatusNote,
        VehicleType = @VehicleType,
        Year = @Year,
        Make = @Make,
        Model = @Model,
        Color = @Color,
        VIN = @VIN,
        Plate = @Plate,
        State = @State,
        Manager = @Manager,
        AssignedTo = @AssignedTo,
        Department = @Department,
        Registration = @Registration,
        Inspection = @Inspection,
        VendorVehicleID = @VendorVehicleID,
        PassType = @PassType,
        PassNumber = @PassNumber,
        ModifiedBy = @ModifiedBy,
        ModifiedOn = GETDATE()
      WHERE RowID = @RowID;
    `;
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    request.input('VehicleCode', sql.VarChar, v.vehicleCode);
    request.input('Status', sql.Bit, v.status ? 1 : 0);
    request.input('GPSType', sql.VarChar, v.gpsType);
    request.input('StatusNote', sql.VarChar, v.statusNote);
    request.input('VehicleType', sql.VarChar, v.vehicleType);
    request.input('Year', sql.Int, v.year);
    request.input('Make', sql.VarChar, v.make);
    request.input('Model', sql.VarChar, v.model);
    request.input('Color', sql.VarChar, v.color);
    request.input('VIN', sql.VarChar, v.vin);
    request.input('Plate', sql.VarChar, v.plate);
    request.input('State', sql.VarChar, v.state);
    request.input('Manager', sql.VarChar, v.manager);
    request.input('AssignedTo', sql.VarChar, v.assignedTo);
    request.input('Department', sql.VarChar, v.department);
    request.input('Registration', sql.DateTime, v.registration);
    request.input('Inspection', sql.DateTime, v.inspection);
    request.input('VendorVehicleID', sql.VarChar, v.vendorVehicleID);
    request.input('PassType', sql.VarChar, v.passType);
    request.input('PassNumber', sql.Int, v.passNumber);
    request.input('ModifiedBy', sql.VarChar, 'admin');
    await request.query(query);
    res.status(200).json({ message: 'Vehicle updated successfully' });
  } catch (err) {
    console.error('Error updating vehicle:', err);
    res.status(500).send('Server error');
  }
});

app.delete('/vehicles/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    await request.query('DELETE FROM Vehicles WHERE RowId = @RowId');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting vehicle:', err);
    res.status(500).send('Server error');
  }
});

/* ===========================
    RESOURCES MANAGEMENT ENDPOINTS
=========================== */

// GET /resources (all resources)
app.get('/resources', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM Resources');
    const resource = result.recordset.map(row => ({
      rowId: row.RowID,
      fname: row.FirstName,
      lname: row.LastName,
      contactInfo: {
        title: row.Title,
        department: row.Department,
        phone: row.Phone,
        cellphone: row.Mobile,
        email: row.Email,
        address1: row.Address1,
        address2: row.Address2,
        city: row.City,
        state: row.State,
        zipCode: row.ZipCode,
        hireDate: row.HireDate,
        termDate: row.TermDate,
        leadTech: row.LeadTech,
        active: row.Active,
      },
      company: row.Company,
      employmentType: row.EmploymentType,
      pin: row.PIN,
      dob: row.DateOfBirth,
      groupName: row.GroupName,
    }));
    res.json(resource);
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send('Server error');
  }
});


// GET /resources/:id (get one resource by RowID)
app.get('/resources/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = Number(req.params.id);

    const request = new sql.Request();
    request.input('RowID', sql.Int, id);

    const result = await request.query(`
      SELECT * FROM Resources WHERE RowID = @RowID
    `);

    if (!result.recordset.length) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const row = result.recordset[0];

    const resource = {
      rowId: row.RowID,
      fname: row.FirstName,
      lname: row.LastName,
      contactInfo: {
        title: row.Title,
        department: row.Department,
        phone: row.Phone,
        cellphone: row.Mobile,
        email: row.Email,
        address1: row.Address1,
        address2: row.Address2,
        city: row.City,
        state: row.State,
        zipCode: row.ZipCode,
        hireDate: row.HireDate,
        termDate: row.TermDate,
        leadTech: row.LeadTech,
        active: row.Active,
      },
      company: row.Company,
      employmentType: row.EmploymentType,
      pin: row.PIN,
      dob: row.DateOfBirth,
      groupName: row.GroupName,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    };

    res.json(resource);
  } catch (err) {
    console.error('Error fetching resource:', err);
    res.status(500).send('Server error');
  }
});


app.post('/resources', async (req, res) => {
  try {
    await sql.connect(config);
    const r = req.body;

    const query = `
      INSERT INTO Resources (
        FirstName, LastName, Title, Department, Phone, Mobile, Email,
        Address1, Address2, City, State, ZipCode,
        HireDate, TermDate, LeadTech, Active, Company,
        EmploymentType, PIN, DateOfBirth, GroupName,
        CreatedBy, CreatedOn
      )
      VALUES (
        @FirstName, @LastName, @Title, @Department, @Phone, @Mobile, @Email,
        @Address1, @Address2, @City, @State, @ZipCode,
        @HireDate, @TermDate, @LeadTech, @Active, @Company,
        @EmploymentType, @PIN, @DateOfBirth, @GroupName,
        @CreatedBy, GETDATE()
      )
    `;

    const request = new sql.Request();
    request.input('FirstName', sql.VarChar, r.fname);
    request.input('LastName', sql.VarChar, r.lname);
    request.input('Title', sql.VarChar, r.contactInfo.title);
    request.input('Department', sql.VarChar, r.contactInfo.department);
    request.input('Phone', sql.VarChar, r.contactInfo.phone);
    request.input('Mobile', sql.VarChar, r.contactInfo.cellphone);
    request.input('Email', sql.VarChar, r.contactInfo.email);
    request.input('Address1', sql.VarChar, r.contactInfo.address1);
    request.input('Address2', sql.VarChar, r.contactInfo.address2);
    request.input('City', sql.VarChar, r.contactInfo.city);
    request.input('State', sql.VarChar, r.contactInfo.state);
    request.input('ZipCode', sql.Int, r.contactInfo.zipCode);
    request.input('HireDate', sql.DateTime, r.contactInfo.hireDate);
    request.input('TermDate', sql.DateTime, r.contactInfo.termDate);
    request.input('LeadTech', sql.Bit, r.contactInfo.leadTech ? 1 : 0);
    request.input('Active', sql.Bit, r.contactInfo.active ? 1 : 0);
    request.input('Company', sql.VarChar, r.company);
    request.input('EmploymentType', sql.VarChar, r.employmentType);
    request.input('PIN', sql.Int, r.pin);
    request.input('DateOfBirth', sql.DateTime, r.dob);
    request.input('GroupName', sql.VarChar, r.groupName);
    request.input('CreatedBy', sql.VarChar, 'admin');

    await request.query(query);
    res.status(201).json({ message: 'Resource added successfully' });
  } catch (err) {
    console.error('Error adding resource:', err);
    res.status(500).send('Server error');
  }
});


app.put('/resources/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const r = req.body;
    const id = Number(req.params.id);

    const query = `
      UPDATE Resources SET
        FirstName = @FirstName,
        LastName = @LastName,
        Title = @Title,
        Department = @Department,
        Phone = @Phone,
        Mobile = @Mobile,
        Email = @Email,
        Address1 = @Address1,
        Address2 = @Address2,
        City = @City,
        State = @State,
        ZipCode = @ZipCode,
        HireDate = @HireDate,
        TermDate = @TermDate,
        LeadTech = @LeadTech,
        Active = @Active,
        Company = @Company,
        EmploymentType = @EmploymentType,
        PIN = @PIN,
        DateOfBirth = @DateOfBirth,
        GroupName = @GroupName,
        ModifiedBy = @ModifiedBy,
        ModifiedOn = GETDATE()
      WHERE RowID = @RowID
    `;

    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    request.input('FirstName', sql.VarChar, r.fname);
    request.input('LastName', sql.VarChar, r.lname);
    request.input('Title', sql.VarChar, r.contactInfo.title);
    request.input('Department', sql.VarChar, r.contactInfo.department);
    request.input('Phone', sql.VarChar, r.contactInfo.phone);
    request.input('Mobile', sql.VarChar, r.contactInfo.cellphone);
    request.input('Email', sql.VarChar, r.contactInfo.email);
    request.input('Address1', sql.VarChar, r.contactInfo.address1);
    request.input('Address2', sql.VarChar, r.contactInfo.address2);
    request.input('City', sql.VarChar, r.contactInfo.city);
    request.input('State', sql.VarChar, r.contactInfo.state);
    request.input('ZipCode', sql.Int, r.contactInfo.zipCode);
    request.input('HireDate', sql.DateTime, r.contactInfo.hireDate);
    request.input('TermDate', sql.DateTime, r.contactInfo.termDate);
    request.input('LeadTech', sql.Bit, r.contactInfo.leadTech ? 1 : 0);
    request.input('Active', sql.Bit, r.contactInfo.active ? 1 : 0);
    request.input('Company', sql.VarChar, r.company);
    request.input('EmploymentType', sql.VarChar, r.employmentType);
    request.input('PIN', sql.Int, r.pin);
    request.input('DateOfBirth', sql.DateTime, r.dob);
    request.input('GroupName', sql.VarChar, r.groupName);
    request.input('ModifiedBy', sql.VarChar, r.modifiedBy || 'admin');

    await request.query(query);
    res.status(200).json({ message: 'Resource updated successfully' });
  } catch (err) {
    console.error('Error updating resource:', err);
    res.status(500).send('Server error');
  }
});

app.delete('/resources/:id', async (req, res) => {
  try {
    await sql.connect(config);

    const id = Number(req.params.id);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);

    await request.query(`
      DELETE FROM Resources WHERE RowID = @RowID
    `);

    res.status(204).send();
  } catch (err) {
    console.error('Error deleting resource:', err);
    res.status(500).send('Server error');
  }
});


/* ===========================
    REPORT GROUP ENDPOINTS
=========================== */

// GET /report-group (all report groups)
app.get('/report-groups', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM ReportGroups');

    const groups = result.recordset.map(row => ({
      rowId: row.RowID,
      groupName: row.GroupName,
      employee: row.Employee,
      levelId: row.LevelID,
      alertEmail: row.AlertEmail,
      active: row.Active,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));

    res.json(groups);
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send('Server error');
  }
});

app.get('/report-groups/:id', async (req, res) => {
  try {
    await sql.connect(config);

    const id = Number(req.params.id);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);

    const result = await request.query(`
      SELECT * FROM ReportGroups WHERE RowID = @RowID
    `);

    if (!result.recordset.length) {
      return res.status(404).json({ message: 'Report group not found' });
    }

    const row = result.recordset[0];

    const group = {
      rowId: row.RowID,
      groupName: row.GroupName,
      employee: row.Employee,
      levelId: row.LevelID,
      alertEmail: row.AlertEmail,
      active: row.Active,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    };

    res.json(group);
  } catch (err) {
    console.error('Error fetching report group:', err);
    res.status(500).send('Server error');
  }
});

// POST /report-group (add new report group)
app.post('/report-groups', async (req, res) => {
  try {
    await sql.connect(config);
    const r = req.body;

    const query = `
      INSERT INTO ReportGroups (
        GroupName, Employee, LevelID, AlertEmail, Active,
        CreatedBy, CreatedOn
      ) VALUES (
        @GroupName, @Employee, @LevelID, @AlertEmail, @Active,
        @CreatedBy, GETDATE()
      )
    `;

    const request = new sql.Request();
    request.input('GroupName', sql.VarChar, r.groupName);
    request.input('Employee', sql.VarChar, r.employee);
    request.input('LevelID', sql.Int, r.levelId);
    request.input('AlertEmail', sql.VarChar, r.alertEmail);
    request.input('Active', sql.Bit, r.active ? 1 : 0);
    request.input('CreatedBy', sql.VarChar, r.createdBy || 'admin');

    await request.query(query);

    res.status(201).json({ message: 'Report group added successfully' });
  } catch (err) {
    console.error('Error adding report group:', err);
    res.status(500).send('Server error');
  }
});

// PUT /report-group/:id (update existing report group)
app.put('/report-groups/:id', async (req, res) => {
  try {
    await sql.connect(config);

    const r = req.body;
    const id = Number(req.params.id);

    const query = `
      UPDATE ReportGroups SET
        GroupName = @GroupName,
        Employee = @Employee,
        LevelID = @LevelID,
        AlertEmail = @AlertEmail,
        Active = @Active,
        ModifiedBy = @ModifiedBy,
        ModifiedOn = GETDATE()
      WHERE RowID = @RowID
    `;

    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    request.input('GroupName', sql.VarChar, r.groupName);
    request.input('Employee', sql.VarChar, r.employee);
    request.input('LevelID', sql.Int, r.levelId);
    request.input('AlertEmail', sql.VarChar, r.alertEmail);
    request.input('Active', sql.Bit, r.active ? 1 : 0);
    request.input('ModifiedBy', sql.VarChar, r.modifiedBy || 'admin');

    await request.query(query);

    res.status(200).json({ message: 'Report group updated successfully' });
  } catch (err) {
    console.error('Error updating report group:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /report-group/:id (delete report group)
app.delete('/report-groups/:id', async (req, res) => {
  try {
    await sql.connect(config);

    const id = Number(req.params.id);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);

    await request.query(`
      DELETE FROM ReportGroups WHERE RowID = @RowID
    `);

    res.status(204).send();
  } catch (err) {
    console.error('Error deleting report group:', err);
    res.status(500).send('Server error');
  }
});


/* ===========================
    OFFICE MANAGEMENT ENDPOINTS
=========================== */

// GET /offices (all offices)
app.get('/offices', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM Offices');
    const offices = result.recordset.map(row => ({
      id: row.OfficeID,
      name: row.OfficeName,
      address1: row.Address1,
      address2: row.Address2,
      city: row.City,
      state: row.State,
      zip: row.Zip,
      county: row.County,
      country: row.Country,
      phone: row.Phone,
      active: row.Active
    }));
    res.json(offices);
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send('Server error');
  }
});

app.get('/offices/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('OfficeID', sql.Int, id);
    const result = await request.query('SELECT * FROM Offices WHERE OfficeID = @OfficeID');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Office not found' });
    }
    const row = result.recordset[0];
    const office = {
      id: row.OfficeID,
      name: row.OfficeName,
      address1: row.Address1,
      address2: row.Address2,
      city: row.City,
      state: row.State,
      zip: row.Zip,
      county: row.County,
      country: row.Country,
      phone: row.Phone,
      active: row.Active
    };
    res.json(office);
  } catch (err) {
    console.error('Error fetching office:', err);
    res.status(500).send('Server error');
  }
});

app.post('/offices', async (req, res) => {
  try {
    await sql.connect(config);
    const office = req.body;
    const query = `
      INSERT INTO Offices (OfficeName, Address1, Address2, City, State, Zip, County, Country, Phone, Active)
      VALUES (@OfficeName, @Address1, @Address2, @City, @State, @Zip, @County, @Country, @Phone, @Active)
    `;
    const request = new sql.Request();
    request.input('OfficeName', sql.VarChar, office.name);
    request.input('Address1', sql.VarChar, office.address1);
    request.input('Address2', sql.VarChar, office.address2);
    request.input('City', sql.VarChar, office.city);
    request.input('State', sql.VarChar, office.state);
    request.input('Zip', sql.VarChar, office.zip);
    request.input('County', sql.VarChar, office.county);
    request.input('Country', sql.VarChar, office.country);
    request.input('Phone', sql.VarChar, office.phone);
    request.input('Active', sql.Bit, office.active);
    await request.query(query);
    res.status(201).json({ message: 'Office added successfully' });
  } catch (err) {
    console.error('Error adding office:', err);
    res.status(500).send('Server error');
  }
});

app.put('/offices/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const office = req.body;
    const id = req.params.id;
    const query = `
      UPDATE Offices SET
        OfficeName = @OfficeName,
        Address1 = @Address1,
        Address2 = @Address2,
        City = @City,
        State = @State,
        Zip = @Zip,
        County = @County,
        Country = @Country,
        Phone = @Phone,
        Active = @Active
      WHERE OfficeID = @OfficeID
    `;
    const request = new sql.Request();
    request.input('OfficeID', sql.Int, id);
    request.input('OfficeName', sql.VarChar, office.name);
    request.input('Address1', sql.VarChar, office.address1);
    request.input('Address2', sql.VarChar, office.address2);
    request.input('City', sql.VarChar, office.city);
    request.input('State', sql.VarChar, office.state);
    request.input('Zip', sql.VarChar, office.zip);
    request.input('County', sql.VarChar, office.county);
    request.input('Country', sql.VarChar, office.country);
    request.input('Phone', sql.VarChar, office.phone);
    request.input('Active', sql.Bit, office.active);
    await request.query(query);
    res.status(200).json({ message: 'Office updated successfully' });
  } catch (err) {
    console.error('Error updating office:', err);
    res.status(500).send('Server error');
  }
});

app.delete('/offices/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('OfficeID', sql.Int, id);
    await request.query('DELETE FROM Offices WHERE OfficeID = @OfficeID');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting office:', err);
    res.status(500).send('Server error');
  }
});

/* ===========================
    ACCOUNTING MANAGEMENT ENDPOINTS
=========================== */

// GET /purchase-orders (all purchase orders)
app.get('/purchase-orders', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM PurchaseOrders');

    const purchaseOrders = result.recordset.map(row => ({
      rowId: parseInt(row.RowID, 10),
      poNumber: row.PONumber,
      total: row.Total,
      customer: row.Customer,
      vendor: row.Vendor,
      employee: row.Employee,
      description: row.Description,
      cardType: row.CardType,
      void: row.Void,
      enteredBy: row.EnteredBy,
      dateEntered: row.DateEntered,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(purchaseOrders);
  }
  catch (err) {
    console.error('SQL error', err);
    res.status(500).send('Server error');
  }
});

//GET /purchase-orders/:id (single purchase order by ID)
app.get('/purchase-orders/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    const result = await request.query('SELECT * FROM PurchaseOrders WHERE RowID = @RowID');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    const row = result.recordset[0];
    const purchaseOrder = {
      rowId: parseInt(row.RowID, 10),
      poNumber: row.PONumber,
      total: row.Total,
      customer: row.Customer,
      vendor: row.Vendor,
      employee: row.Employee,
      description: row.Description,
      cardType: row.CardType,
      void: row.Void,
      enteredBy: row.EnteredBy,
      dateEntered: row.DateEntered,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    };
    res.json(purchaseOrder);
  } catch (err) {
    console.error('Error fetching purchase order:', err);
    res.status(500).send('Server error');
  }
});

//POST /purchase-orders (add new purchase order)
app.post('/purchase-orders', async (req, res) => {
  try {
    await sql.connect(config);
    const purchaseOrder = req.body;
    const query = `
      INSERT INTO PurchaseOrders (
        PONumber, Total, Customer, Vendor, Employee, Description,
        CardType, Void, EnteredBy, DateEntered
      ) VALUES (
        @PONumber, @Total, @Customer, @Vendor, @Employee, @Description,
        @CardType, @Void, @EnteredBy, GETDATE()
      )
    `;
    const request = new sql.Request();
    request.input('PONumber', sql.VarChar, purchaseOrder.poNumber);
    request.input('Total', sql.Decimal(18, 2), purchaseOrder.total);
    request.input('Customer', sql.VarChar, purchaseOrder.customer);
    request.input('Vendor', sql.VarChar, purchaseOrder.vendor);
    request.input('Employee', sql.VarChar, purchaseOrder.employee);
    request.input('Description', sql.VarChar, purchaseOrder.description);
    request.input('CardType', sql.VarChar, purchaseOrder.cardType);
    request.input('Void', sql.Bit, purchaseOrder.void);
    request.input('EnteredBy', sql.VarChar, 'admin');
    await request.query(query);
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({ message: 'Purchase order added successfully' });
  }
  catch (err) {
    console.error('Error adding purchase order:', err);
    res.status(500).send('Server error');
  }
});

// PUT /purchase-orders/:id (update existing purchase order)
app.put('/purchase-orders/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const purchaseOrder = req.body;
    const id = req.params.id;
    const query = `
      UPDATE PurchaseOrders SET
        PONumber = @PONumber,
        Total = @Total,
        Customer = @Customer,
        Vendor = @Vendor,
        Employee = @Employee,
        Description = @Description,
        CardType = @CardType,
        Void = @Void,
        ModifiedBy = @ModifiedBy,
        ModifiedOn = GETDATE()
      WHERE RowID = @RowID
    `;
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    request.input('PONumber', sql.VarChar, purchaseOrder.poNumber);
    request.input('Total', sql.Decimal(18, 2), purchaseOrder.total);
    request.input('Customer', sql.VarChar, purchaseOrder.customer);
    request.input('Vendor', sql.VarChar, purchaseOrder.vendor);
    request.input('Employee', sql.VarChar, purchaseOrder.employee);
    request.input('Description', sql.VarChar, purchaseOrder.description);
    request.input('CardType', sql.VarChar, purchaseOrder.cardType);
    request.input('Void', sql.Bit, purchaseOrder.void);
    request.input('ModifiedBy', sql.VarChar, 'admin');
    await request.query(query);
    res.status(200).json({ message: 'Purchase order updated successfully' });
  } catch (err) {
    console.error('Error updating purchase order:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /purchase-orders/:id (delete purchase order)
app.delete('/purchase-orders/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    await request.query('DELETE FROM PurchaseOrders WHERE RowID = @RowID');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting purchase order:', err);
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