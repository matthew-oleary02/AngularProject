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
    CUSTOMER NOTIFICATIONS ENDPOINTS
=========================== */

// GET /customer-notifs (all customer notifications)
app.get('/customer-notifs', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM CustomerNotifs');
    const customerNotifs = result.recordset.map(row => ({
      rowId: Number(row.RowID),
      customer: row.Customer,
      status: row.Status,
      serviceType: row.ServiceType,
      serviceClass: row.ServiceClass,
      email: row.Email
    }));
    res.json(customerNotifs);
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send('Server error');
  }
});

// GET /customer-notifs/:id (single customer notification by ID)
app.get('/customer-notifs/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    const result = await request.query('SELECT * FROM CustomerNotifs WHERE RowID = @RowID');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Customer notification not found' });
    }
    const row = result.recordset[0];
    const customerNotif = {
      rowId: Number(row.RowID),
      customer: row.Customer,
      status: row.Status,
      serviceType: row.ServiceType,
      serviceClass: row.ServiceClass,
      email: row.Email
    };
    res.json(customerNotif);
  } catch (err) {
    console.error('Error fetching customer notification:', err);
    res.status(500).send('Server error');
  }
});

// POST /customer-notifs (add new customer notification)
app.post('/customer-notifs', async (req, res) => {
  try {
    await sql.connect(config);
    const customerNotif = req.body;
    const query = `
      INSERT INTO CustomerNotifs (
        Customer, Status, ServiceType, ServiceClass, Email, CreatedBy, CreatedOn
      ) VALUES (
        @Customer, @Status, @ServiceType, @ServiceClass, @Email, @CreatedBy, GETDATE()
      )
    `;
    const request = new sql.Request();
    request.input('Customer', sql.VarChar, customerNotif.customer);
    request.input('Status', sql.VarChar, customerNotif.status);
    request.input('ServiceType', sql.VarChar, customerNotif.serviceType);
    request.input('ServiceClass', sql.VarChar, customerNotif.serviceClass);
    request.input('Email', sql.VarChar, customerNotif.email);
    request.input('CreatedBy', sql.VarChar, 'admin');
    await request.query(query);
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({ message: 'Customer notification added successfully' });
  } catch (err) {
    console.error('Error adding customer notification:', err);
    res.status(500).send('Server error');
  }
});

// PUT /customer-notifs/:id (update existing customer notification)
app.put('/customer-notifs/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const customerNotif = req.body;
    const id = req.params.id;
    const query = `
      UPDATE CustomerNotifs SET
        Customer = @Customer,
        Status = @Status,
        ServiceType = @ServiceType,
        ServiceClass = @ServiceClass,
        Email = @Email,
        ModifiedBy = @ModifiedBy,
        ModifiedOn = GETDATE()
      WHERE RowID = @RowID
    `;
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    request.input('Customer', sql.VarChar, customerNotif.customer);
    request.input('Status', sql.VarChar, customerNotif.status);
    request.input('ServiceType', sql.VarChar, customerNotif.serviceType);
    request.input('ServiceClass', sql.VarChar, customerNotif.serviceClass);
    request.input('Email', sql.VarChar, customerNotif.email);
    request.input('ModifiedBy', sql.VarChar, 'admin_user');
    await request.query(query);
    res.status(200).json({ message: 'Customer notification updated successfully' });
  } catch (err) {
    console.error('Error updating customer notification:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /customer-notifs/:id (delete customer notification)
app.delete('/customer-notifs/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    await request.query('DELETE FROM CustomerNotifs WHERE RowID = @RowID');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting customer notification:', err);
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

// GET /vendors/:id/jobs (fetch jobs for a specific vendor)
app.get('/vendors/:id/jobs', async (req, res) => {
  try {
    const vendorId = parseInt(req.params.id, 10);
    if (Number.isNaN(vendorId)) {
      return res.status(400).json({ error: 'Invalid vendor id.' });
    }
    await sql.connect(config);
    const request = new sql.Request();
    request.input('VendorId', sql.Int, vendorId);
    const result = await request.query(`
      SELECT j.RowID, j.JobNumber, j.Customer, j.Location, j.ClientTrackingNumber, j.ServiceType, j.JobStatus, j.Trade, j.Vendor, 
      j.JobOwner, j.DateReceived, j.State, j.ETA, j.Caller, j.NTE, j.VendorNTE, j.Quote, 
      j.JobNote, j.Active, j.EnteredBy, j.EnteredOn, j.ModifiedBy, j.ModifiedOn
      FROM Jobs j
      INNER JOIN Vendor v ON j.Vendor = v.VendorName
      WHERE v.RowID = @VendorId
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
    console.error('Error fetching jobs for vendor:', err);
    res.status(500).send('Server error');
  }
});

// GET /vendors/:id/rates (fetch rates for a specific vendor)
app.get('/vendors/:id/rates', async (req, res) => {
  try {
    const vendorId = parseInt(req.params.id, 10);
    if (Number.isNaN(vendorId)) {
      return res.status(400).json({ error: 'Invalid vendor id.' });
    }
    await sql.connect(config);
    const request = new sql.Request();
    request.input('VendorID', sql.Int, vendorId);
    const result = await request.query(`
      SELECT vr.* FROM VendorRates vr
      INNER JOIN Vendor v ON vr.VendorName = v.VendorName
      WHERE v.RowID = @VendorID
    `);
    const rates = result.recordset.map(row => ({
      rowId: row.RowID,
      vendorName: row.VendorName,
      trade: row.Trade,
      rateType: row.RateType,
      state: row.State,
      rate: row.Rate
    }));
    res.json(rates);
  } catch (err) {
    console.error('Error fetching rates for vendor:', err);
    res.status(500).send('Server error');
  }
});

// GET /vendors/:id/users (fetch users for a specific vendor)
app.get('/vendors/:id/users', async (req, res) => {
  try {
    const vendorId = parseInt(req.params.id, 10);
    if (Number.isNaN(vendorId)) {
      return res.status(400).json({ error: 'Invalid vendor id.' });
    }
    await sql.connect(config);
    const request = new sql.Request();
    request.input('VendorID', sql.Int, vendorId);
    const result = await request.query(`
      SELECT vu.* FROM VendorUsers vu
      INNER JOIN Vendor v ON vu.VendorName = v.VendorName
      WHERE v.RowID = @VendorID
    `);
    const users = result.recordset.map(row => ({
      rowId: row.RowID || row.RowId,
      vendorName: row.VendorName,
      username: row.Username,
      email: row.Email,
      phone: row.Phone,
      trade: row.Trade,
      active: row.Active,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(users);
  } catch (err) {
    console.error('Error fetching users for vendor:', err);
    res.status(500).send('Server error');
  }
});

// GET /vendors/:id/notifications (fetch notifications for a specific vendor)
app.get('/vendors/:id/notifications', async (req, res) => {
  try {
    const vendorId = parseInt(req.params.id, 10);
    if (Number.isNaN(vendorId)) {
      return res.status(400).json({ error: 'Invalid vendor id.' });
    }
    await sql.connect(config);
    const request = new sql.Request();
    request.input('VendorId', sql.Int, vendorId);
    const result = await request.query(`
      SELECT vn.* FROM VendorNotifications vn
      INNER JOIN Vendor v ON vn.VendorName = v.VendorName
      WHERE v.RowId = @VendorId
    `);
    const notifs = result.recordset.map(row => ({
      rowId: row.RowId,
      vendorName: row.VendorName,
      status: row.Status,
      serviceType: row.ServiceType,
      serviceClass: row.ServiceClass,
      email: row.Email,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(notifs);
  } catch (err) {
    console.error('Error fetching notifications for vendor:', err);
    res.status(500).send('Server error');
  }
});

// GET /vendors/:id/coverage (fetch coverage for a specific vendor)
app.get('/vendors/:id/coverage', async (req, res) => {
  try {
    const vendorId = parseInt(req.params.id, 10);
    if (Number.isNaN(vendorId)) {
      return res.status(400).json({ error: 'Invalid vendor id.' });
    }
    await sql.connect(config);
    const request = new sql.Request();
    request.input('VendorID', sql.Int, vendorId);
    const result = await request.query(`
      SELECT vc.* FROM VendorCoverage vc
      INNER JOIN Vendor v ON vc.VendorName = v.VendorName
      WHERE v.RowID = @VendorID
    `);
    const coverage = result.recordset.map(row => ({
      rowId: row.RowID || row.RowId,
      vendorName: row.VendorName,
      status: row.Status,
      city: row.City,
      state: row.State,
      zipCode: row.ZipCode,
      trade: row.Trade,
      rate: row.Rate,
      radius: row.Radius,
      vendorStatus: row.VendorStatus,
      active: row.Active,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(coverage);
  } catch (err) {
    console.error('Error fetching coverage for vendor:', err);
    res.status(500).send('Server error');
  }
});

// GET /vendors/:id/assets (fetch assets for a specific vendor)
app.get('/vendors/:id/assets', async (req, res) => {
  try {
    const vendorId = parseInt(req.params.id, 10);
    if (Number.isNaN(vendorId)) {
      return res.status(400).json({ error: 'Invalid vendor id.' });
    }
    await sql.connect(config);
    const request = new sql.Request();
    request.input('VendorId', sql.Int, vendorId);
    const result = await request.query('SELECT * FROM VendorAsset WHERE VendorId = @VendorId');
    const assets = result.recordset.map(row => ({
      rowId: row.RowId,
      vendorId: row.VendorId,
      assetName: row.AssetName,
      active: row.Active,
      startTime: row.StartTime,
      endTime: row.EndTime,
      monthly: row.Monthly,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(assets);
  } catch (err) {
    console.error('Error fetching assets for vendor:', err);
    res.status(500).send('Server error');
  }
});

// GET /vendors/:id/notes (fetch notes for a specific vendor)
app.get('/vendors/:id/notes', async (req, res) => {
  try {
    const vendorId = parseInt(req.params.id, 10);
    if (Number.isNaN(vendorId)) {
      return res.status(400).json({ error: 'Invalid vendor id.' });
    }
    await sql.connect(config);
    const request = new sql.Request();
    request.input('VendorId', sql.Int, vendorId);
    const result = await request.query(`
      SELECT vn.* FROM VendorNote vn
      INNER JOIN Vendor v ON vn.Vendor = v.VendorName
      WHERE v.RowId = @VendorId
    `);
    const notes = result.recordset.map(row => ({
      rowId: row.RowId,
      vendor: row.Vendor,
      status: row.Status,
      message: row.Message,
      active: row.Active,
      enteredBy: row.EnteredBy,
      dateEntered: row.DateEntered,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(notes);
  } catch (err) {
    console.error('Error fetching notes for vendor:', err);
    res.status(500).send('Server error');
  }
});

// GET /vendors/:id/classifications
app.get('/vendors/:id/classifications', async (req, res) => {
  try {
    const vendorId = parseInt(req.params.id, 10);
    if (Number.isNaN(vendorId)) {
      return res.status(400).json({ error: 'Invalid vendor id.' });
    }
    await sql.connect(config);
    const request = new sql.Request();
    request.input('VendorId', sql.Int, vendorId);
    const result = await request.query('SELECT * FROM VendorClassification WHERE VendorId = @VendorId');
    const classifications = result.recordset.map(row => ({
      rowId: row.RowId,
      vendorId: row.VendorId,
      classification: row.Classification,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(classifications);
  } catch (err) {
    console.error('Error fetching classifications for vendor:', err);
    res.status(500).send('Server error');
  }
});

// GET /vendors/:id/contract-statuses
app.get('/vendors/:id/contract-statuses', async (req, res) => {
  try {
    const vendorId = parseInt(req.params.id, 10);
    if (Number.isNaN(vendorId)) {
      return res.status(400).json({ error: 'Invalid vendor id.' });
    }
    await sql.connect(config);
    const request = new sql.Request();
    request.input('VendorId', sql.Int, vendorId);
    const result = await request.query('SELECT * FROM VendorContractStatus WHERE VendorId = @VendorId');
    const contractStatuses = result.recordset.map(row => ({
      rowId: row.RowId,
      vendorId: row.VendorId,
      status: row.Status,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(contractStatuses);
  } catch (err) {
    console.error('Error fetching vendor contract statuses for vendor:', err);
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
    VENDOR COVERAGE ENDPOINTS
=========================== */

// GET /vendor-coverage (all vendor coverage records)
app.get('/vendor-coverage', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM VendorCoverage');
    const coverageRecords = result.recordset.map(row => ({
      rowId: parseInt(row.RowID, 10),
      vendorName: row.VendorName,
      status: row.Status,
      city: row.City,
      state: row.State,
      zipCode: row.ZipCode,
      trade: row.Trade,
      rate: row.Rate,
      radius: row.Radius,
      vendorStatus: row.VendorStatus,
      active: row.Active,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(coverageRecords);
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send('Server error');
  }
});

// GET /vendor-coverage/:id (single vendor coverage record by ID)
app.get('/vendor-coverage/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    const result = await request.query('SELECT * FROM VendorCoverage WHERE RowID = @RowID');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Vendor coverage record not found' });
    }
    const row = result.recordset[0];
    const coverageRecord = {
      rowId: parseInt(row.RowID, 10),
      vendorName: row.VendorName,
      status: row.Status,
      city: row.City,
      state: row.State,
      zipCode: row.ZipCode,
      trade: row.Trade,
      rate: row.Rate,
      radius: row.Radius,
      vendorStatus: row.VendorStatus,
      active: row.Active,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    };
    res.json(coverageRecord);
  } catch (err) {
    console.error('Error fetching vendor coverage record:', err);
    res.status(500).send('Server error');
  }
});

// POST /vendor-coverage (add new vendor coverage record)
app.post('/vendor-coverage', async (req, res) => {
  try {
    await sql.connect(config);
    const coverageRecord = req.body;
    const query = `
      INSERT INTO VendorCoverage (
        VendorName, Status, City, State, ZipCode, Trade, Rate, Radius,
        VendorStatus, Active, CreatedBy, CreatedOn
      ) VALUES (
        @VendorName, @Status, @City, @State, @ZipCode, @Trade, @Rate, @Radius,
        @VendorStatus, @Active, @CreatedBy, GETDATE()
      )
    `;
    const request = new sql.Request();
    request.input('VendorName', sql.VarChar, coverageRecord.vendorName);
    request.input('Status', sql.VarChar, coverageRecord.status);
    request.input('City', sql.VarChar, coverageRecord.city);
    request.input('State', sql.VarChar, coverageRecord.state);
    request.input('ZipCode', sql.VarChar, coverageRecord.zipCode);
    request.input('Trade', sql.VarChar, coverageRecord.trade);
    request.input('Rate', sql.Decimal(18, 2), coverageRecord.rate);
    request.input('Radius', sql.Int, coverageRecord.radius);
    request.input('VendorStatus', sql.VarChar, coverageRecord.vendorStatus);
    request.input('Active', sql.Bit, coverageRecord.active ? 1 : 0);
    request.input('CreatedBy', sql.VarChar, 'admin');
    await request.query(query);
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({ message: 'Vendor coverage record added successfully' });
  } catch (err) {
    console.error('Error adding vendor coverage record:', err);
    res.status(500).send('Server error');
  }
});

// PUT /vendor-coverage/:id (update existing vendor coverage record)
app.put('/vendor-coverage/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const coverageRecord = req.body;
    const id = req.params.id;
    const query = `
      UPDATE VendorCoverage SET
        VendorName = @VendorName,
        Status = @Status,
        City = @City,
        State = @State,
        ZipCode = @ZipCode,
        Trade = @Trade,
        Rate = @Rate,
        Radius = @Radius,
        VendorStatus = @VendorStatus,
        Active = @Active,
        ModifiedBy = @ModifiedBy,
        ModifiedOn = GETDATE()
      WHERE RowID = @RowID
    `;
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    request.input('VendorName', sql.VarChar, coverageRecord.vendorName);
    request.input('Status', sql.VarChar, coverageRecord.status);
    request.input('City', sql.VarChar, coverageRecord.city);
    request.input('State', sql.VarChar, coverageRecord.state);
    request.input('ZipCode', sql.VarChar, coverageRecord.zipCode);
    request.input('Trade', sql.VarChar, coverageRecord.trade);
    request.input('Rate', sql.Decimal(18, 2), coverageRecord.rate);
    request.input('Radius', sql.Int, coverageRecord.radius);
    request.input('VendorStatus', sql.VarChar, coverageRecord.vendorStatus);
    request.input('Active', sql.Bit, coverageRecord.active ? 1 : 0);
    request.input('ModifiedBy', sql.VarChar, 'admin_user');
    await request.query(query);
    res.status(200).json({ message: 'Vendor coverage record updated successfully' });
  } catch (err) {
    console.error('Error updating vendor coverage record:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /vendor-coverage/:id (delete vendor coverage record)
app.delete('/vendor-coverage/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    await request.query('DELETE FROM VendorCoverage WHERE RowID = @RowID');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting vendor coverage record:', err);
    res.status(500).send('Server error');
  }
});

/* ===========================
    VENDOR MAPS MANAGEMENT ENDPOINTS
=========================== */

// GET /vendor-maps (all vendor maps)
app.get('/vendor-maps', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM VendorMap');
    const vendorMaps = result.recordset.map(row => ({
      rowId: row.RowID || row.RowId,
      vendorId: row.VendorID || row.VendorId,
      vendorName: row.VendorName,
      vendorCoverageId: row.VendorCoverageID || row.VendorCoverageId,
      coordinates: row.Coordinates,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(vendorMaps);
  } catch (err) {
    console.error('Error fetching vendor maps:', err);
    res.status(500).send('Server error');
  }
});

// GET /vendor-maps/:id (single vendor map by ID)
app.get('/vendor-maps/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    const result = await request.query('SELECT * FROM VendorMap WHERE RowID = @RowID');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Vendor map not found' });
    }
    const row = result.recordset[0];
    const vendorMap = {
      rowId: row.RowID || row.RowId,
      vendorId: row.VendorID || row.VendorId,
      vendorName: row.VendorName,
      vendorCoverageId: row.VendorCoverageID || row.VendorCoverageId,
      coordinates: row.Coordinates,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    };
    res.json(vendorMap);
  } catch (err) {
    console.error('Error fetching vendor map:', err);
    res.status(500).send('Server error');
  }
});

// POST /vendor-maps (add new vendor map)
app.post('/vendor-maps', async (req, res) => {
  try {
    await sql.connect(config);
    const vendorMap = req.body;
    const query = `
      INSERT INTO VendorMap (
        VendorID, VendorName, VendorCoverageID, Coordinates, CreatedBy, CreatedOn
      ) VALUES (
        @VendorID, @VendorName, @VendorCoverageID, @Coordinates, @CreatedBy, GETDATE()
      )
    `;
    const request = new sql.Request();
    request.input('VendorID', sql.Int, vendorMap.vendorId);
    request.input('VendorName', sql.VarChar, vendorMap.vendorName);
    request.input('VendorCoverageID', sql.Int, vendorMap.vendorCoverageId);
    request.input('Coordinates', sql.VarChar, vendorMap.coordinates);
    request.input('CreatedBy', sql.VarChar, 'admin');
    await request.query(query);
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({ message: 'Vendor map added successfully' });
  } catch (err) {
    console.error('Error adding vendor map:', err);
    res.status(500).send('Server error');
  }
});

// PUT /vendor-maps/:id (update existing vendor map)
app.put('/vendor-maps/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const vendorMap = req.body;
    const id = req.params.id;
    const query = `
      UPDATE VendorMap SET
        VendorID = @VendorID,
        VendorName = @VendorName,
        VendorCoverageID = @VendorCoverageID,
        Coordinates = @Coordinates,
        ModifiedBy = @ModifiedBy,
        ModifiedOn = GETDATE()
      WHERE RowID = @RowID
    `;
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    request.input('VendorID', sql.Int, vendorMap.vendorId);
    request.input('VendorName', sql.VarChar, vendorMap.vendorName);
    request.input('VendorCoverageID', sql.Int, vendorMap.vendorCoverageId);
    request.input('Coordinates', sql.VarChar, vendorMap.coordinates);
    request.input('ModifiedBy', sql.VarChar, 'admin');
    await request.query(query);
    res.status(200).json({ message: 'Vendor map updated successfully' });
  } catch (err) {
    console.error('Error updating vendor map:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /vendor-maps/:id (delete vendor map)
app.delete('/vendor-maps/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    await request.query('DELETE FROM VendorMap WHERE RowID = @RowID');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting vendor map:', err);
    res.status(500).send('Server error');
  }
});

/* ===========================
    VENDOR RATE MANAGEMENT ENDPOINTS
=========================== */

// GET /vendor-rates (all vendor rates)
app.get('/vendor-rates', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM VendorRates');
    const vendorRates = result.recordset.map(row => ({
      rowId: row.RowID,
      vendorName: row.VendorName,
      trade: row.Trade,
      rateType: row.RateType,
      state: row.State,
      rate: row.Rate
    }));
    res.json(vendorRates);
  } catch (err) {
    console.error('Error fetching vendor rates:', err);
    res.status(500).send('Server error');
  }
});

// GET /vendor-rates/:id (single vendor rate by ID)
app.get('/vendor-rates/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    const result = await request.query('SELECT * FROM VendorRates WHERE RowID = @RowID');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Vendor rate not found' });
    }
    const row = result.recordset[0];
    const vendorRate = {
      rowId: row.RowID,
      vendorName: row.VendorName,
      trade: row.Trade,
      rateType: row.RateType,
      state: row.State,
      rate: row.Rate
    };
    res.json(vendorRate);
  } catch (err) {
    console.error('Error fetching vendor rate:', err);
    res.status(500).send('Server error');
  }
});

// POST /vendor-rates (add new vendor rate)
app.post('/vendor-rates', async (req, res) => {
  try {
    await sql.connect(config);
    const vendorRate = req.body;
    const query = `
      INSERT INTO VendorRates (
        VendorName, Trade, RateType, State, Rate
      ) VALUES (
        @VendorName, @Trade, @RateType, @State, @Rate
      )
    `;
    const request = new sql.Request();
    request.input('VendorName', sql.VarChar, vendorRate.vendorName);
    request.input('Trade', sql.VarChar, vendorRate.trade);
    request.input('RateType', sql.VarChar, vendorRate.rateType);
    request.input('State', sql.VarChar, vendorRate.state);
    request.input('Rate', sql.Decimal, vendorRate.rate);
    await request.query(query);
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({ message: 'Vendor rate added successfully' });
  } catch (err) {
    console.error('Error adding vendor rate:', err);
    res.status(500).send('Server error');
  }
});

// PUT /vendor-rates/:id (update existing vendor rate)
app.put('/vendor-rates/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const vendorRate = req.body;
    const id = req.params.id;
    const query = `
      UPDATE VendorRates SET
        VendorName = @VendorName,
        Trade = @Trade,
        RateType = @RateType,
        State = @State,
        Rate = @Rate
      WHERE RowID = @RowID
    `;
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    request.input('VendorName', sql.VarChar, vendorRate.vendorName);
    request.input('Trade', sql.VarChar, vendorRate.trade);
    request.input('RateType', sql.VarChar, vendorRate.rateType);
    request.input('State', sql.VarChar, vendorRate.state);
    request.input('Rate', sql.Decimal, vendorRate.rate);
    await request.query(query);
    res.status(200).json({ message: 'Vendor rate updated successfully' });
  } catch (err) {
    console.error('Error updating vendor rate:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /vendor-rates/:id (delete vendor rate)
app.delete('/vendor-rates/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    await request.query('DELETE FROM VendorRates WHERE RowID = @RowID');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting vendor rate:', err);
    res.status(500).send('Server error');
  }
});

/* ===========================
    VENDOR NOTIFICATION MANAGEMENT ENDPOINTS
=========================== */

// GET /vendor-notifications (all vendor notifications)
app.get('/vendor-notifications', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM VendorNotifications');
    const vendorNotifications = result.recordset.map(row => ({
      rowId: row.RowId,
      vendorName: row.VendorName,
      status: row.Status,
      serviceType: row.ServiceType,
      serviceClass: row.ServiceClass,
      email: row.Email,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(vendorNotifications);
  } catch (err) {
    console.error('Error fetching vendor notifications:', err);
    res.status(500).send('Server error');
  }
});

// GET /vendor-notifications/:id (single vendor notification by ID)
app.get('/vendor-notifications/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowId', sql.Int, id);
    const result = await request.query('SELECT * FROM VendorNotifications WHERE RowId = @RowId');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Vendor notification not found' });
    }
    const row = result.recordset[0];
    const vendorNotification = {
      rowId: row.RowId,
      vendorName: row.VendorName,
      status: row.Status,
      serviceType: row.ServiceType,
      serviceClass: row.ServiceClass,
      email: row.Email,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    };
    res.json(vendorNotification);
  } catch (err) {
    console.error('Error fetching vendor notification:', err);
    res.status(500).send('Server error');
  }
});

// POST /vendor-notifications (add new vendor notification)
app.post('/vendor-notifications', async (req, res) => {
  try {
    await sql.connect(config);
    const vendorNotification = req.body;
    const query = `
      INSERT INTO VendorNotifications (
        VendorName, Status, ServiceType, ServiceClass, Email, CreatedBy, CreatedOn
      ) VALUES (
        @VendorName, @Status, @ServiceType, @ServiceClass, @Email, @CreatedBy, GETDATE()
      )
    `;
    const request = new sql.Request();
    request.input('VendorName', sql.VarChar, vendorNotification.vendorName);
    request.input('Status', sql.VarChar, vendorNotification.status);
    request.input('ServiceType', sql.VarChar, vendorNotification.serviceType);
    request.input('ServiceClass', sql.VarChar, vendorNotification.serviceClass);
    request.input('Email', sql.VarChar, vendorNotification.email);
    request.input('CreatedBy', sql.VarChar, 'admin');
    await request.query(query);
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({ message: 'Vendor notification added successfully' });
  } catch (err) {
    console.error('Error adding vendor notification:', err);
    res.status(500).send('Server error');
  }
});

// PUT /vendor-notifications/:id (update existing vendor notification)
app.put('/vendor-notifications/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const vendorNotification = req.body;
    const id = req.params.id;
    const query = `
      UPDATE VendorNotifications SET
        VendorName = @VendorName,
        Status = @Status,
        ServiceType = @ServiceType,
        ServiceClass = @ServiceClass,
        Email = @Email,
        ModifiedBy = @ModifiedBy,
        ModifiedOn = GETDATE()
      WHERE RowId = @RowId
    `;
    const request = new sql.Request();
    request.input('RowId', sql.Int, id);
    request.input('VendorName', sql.VarChar, vendorNotification.vendorName);
    request.input('Status', sql.VarChar, vendorNotification.status);
    request.input('ServiceType', sql.VarChar, vendorNotification.serviceType);
    request.input('ServiceClass', sql.VarChar, vendorNotification.serviceClass);
    request.input('Email', sql.VarChar, vendorNotification.email);
    request.input('ModifiedBy', sql.VarChar, 'admin');
    await request.query(query);
    res.status(200).json({ message: 'Vendor notification updated successfully' });
  } catch (err) {
    console.error('Error updating vendor notification:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /vendor-notifications/:id (delete vendor notification)
app.delete('/vendor-notifications/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowId', sql.Int, id);
    await request.query('DELETE FROM VendorNotifications WHERE RowId = @RowId');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting vendor notification:', err);
    res.status(500).send('Server error');
  }
});

/* ===========================
    VENDOR ASSETS MANAGEMENT ENDPOINTS
=========================== */

// GET /vendor-assets (all vendor assets)
app.get('/vendor-assets', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM VendorAsset');
    const vendorAssets = result.recordset.map(row => ({
      rowId: row.RowId,
      vendorId: row.VendorId,
      assetName: row.AssetName,
      active: row.Active,
      startTime: row.StartTime,
      endTime: row.EndTime,
      monthly: row.Monthly,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(vendorAssets);
  } catch (err) {
    console.error('Error fetching vendor assets:', err);
    res.status(500).send('Server error');
  }
});

// GET vendor-assets:id
app.get('/vendor-assets/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    const result = await request.query('SELECT * FROM VendorAsset WHERE RowId = @RowID');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Vendor asset not found' });
    }
    const row = result.recordset[0];
    const vendorAsset = {
      rowId: row.RowId,
      vendorId: row.VendorId,
      assetName: row.AssetName,
      active: row.Active,
      startTime: row.StartTime,
      endTime: row.EndTime,
      monthly: row.Monthly,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    };
    res.json(vendorAsset);
  } catch (err) {
    console.error('Error fetching vendor asset:', err);
    res.status(500).send('Server error');
  }
});

// POST vendor-assets
app.post('/vendor-assets', async (req, res) => {
  try {
    await sql.connect(config);
    const vendorAsset = req.body;
    const query = `
      INSERT INTO VendorAsset (
        VendorID, AssetName, Active, StartTime, EndTime, Monthly, CreatedBy, CreatedOn, ModifiedBy, ModifiedOn
      ) VALUES (
        @VendorID, @AssetName, @Active, @StartTime, @EndTime, @Monthly, @CreatedBy, @CreatedOn, @ModifiedBy, @ModifiedOn
      )
    `;
    const request = new sql.Request();
    request.input('VendorID', sql.Int, vendorAsset.vendorId);
    request.input('AssetName', sql.VarChar, vendorAsset.assetName);
    request.input('Active', sql.Bit, vendorAsset.active);
    request.input('StartTime', sql.Date, vendorAsset.startTime);
    request.input('EndTime', sql.Date, vendorAsset.endTime);
    request.input('Monthly', sql.Decimal, vendorAsset.monthly);
    request.input('CreatedBy', sql.VarChar, vendorAsset.createdBy);
    request.input('CreatedOn', sql.Date, vendorAsset.createdOn);
    request.input('ModifiedBy', sql.VarChar, vendorAsset.modifiedBy);
    request.input('ModifiedOn', sql.Date, vendorAsset.modifiedOn);
    await request.query(query);
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({ message: 'Vendor asset added successfully' });
  } catch (err) {
    console.error('Error adding vendor asset:', err);
    res.status(500).send('Server error');
  }
});

// PUT /vendor-assets/:id (update existing vendor asset)
app.put('/vendor-assets/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const vendorAsset = req.body;
    const id = req.params.id;
    const query = `
      UPDATE VendorAsset SET
        VendorID = @VendorID,
        AssetName = @AssetName,
        Active = @Active,
        StartTime = @StartTime,
        EndTime = @EndTime,
        Monthly = @Monthly,
        CreatedBy = @CreatedBy,
        CreatedOn = @CreatedOn,
        ModifiedBy = @ModifiedBy,
        ModifiedOn = @ModifiedOn
      WHERE RowID = @RowID
    `;
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    request.input('VendorID', sql.Int, vendorAsset.vendorId);
    request.input('AssetName', sql.VarChar, vendorAsset.assetName);
    request.input('Active', sql.Bit, vendorAsset.active);
    request.input('StartTime', sql.Date, vendorAsset.startTime);
    request.input('EndTime', sql.Date, vendorAsset.endTime);
    request.input('Monthly', sql.Decimal, vendorAsset.monthly);
    request.input('CreatedBy', sql.VarChar, vendorAsset.createdBy);
    request.input('CreatedOn', sql.Date, vendorAsset.createdOn);
    request.input('ModifiedBy', sql.VarChar, vendorAsset.modifiedBy);
    request.input('ModifiedOn', sql.Date, vendorAsset.modifiedOn);
    await request.query(query);
    res.status(200).json({ message: 'Vendor asset updated successfully' });
  } catch (err) {
    console.error('Error updating vendor asset:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /vendor-assets/:id (delete vendor asset)
app.delete('/vendor-assets/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    await request.query('DELETE FROM VendorAsset WHERE RowID = @RowID');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting vendor asset:', err);
    res.status(500).send('Server error');
  }
});

/* ===========================
    VENDOR CLASSIFICATION ENDPOINTS
=========================== */

// GET /vendor-classification (all vendor classifications)
app.get('/vendor-classification', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM VendorClassification');
    const vendorClassification = result.recordset.map(row => ({
      rowId: row.RowId,
      vendorId: row.VendorId,
      classification: row.Classification,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(vendorClassification);
  } catch (err) {
    console.error('Error fetching vendor classifications:', err);
    res.status(500).send('Server error');
  }
});

// GET /vendor-classification/:id (get one vendor classification by RowID)
app.get('/vendor-classification/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    const result = await request.query('SELECT * FROM VendorClassification WHERE RowID = @RowID');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Vendor classification not found' });
    }
    const row = result.recordset[0];
    const vendorClassification = {
      rowId: row.RowId,
      vendorId: row.VendorId,
      classification: row.Classification,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    };
    res.json(vendorClassification);
  } catch (err) {
    console.error('Error fetching vendor classification:', err);
    res.status(500).send('Server error');
  }
});

// POST /vendor-classification (create new vendor classification)
app.post('/vendor-classification', async (req, res) => {
  try {
    await sql.connect(config);
    const vendorClassification = req.body;
    const query = `
      INSERT INTO VendorClassification (
        VendorId, Classification, CreatedBy, CreatedOn, ModifiedBy, ModifiedOn
      ) VALUES (
        @VendorId, @Classification, @CreatedBy, @CreatedOn, @ModifiedBy, @ModifiedOn
      )
    `;
    const request = new sql.Request();
    request.input('VendorId', sql.Int, vendorClassification.vendorId);
    request.input('Classification', sql.VarChar, vendorClassification.classification);
    request.input('CreatedBy', sql.VarChar, vendorClassification.createdBy);
    request.input('CreatedOn', sql.Date, vendorClassification.createdOn);
    request.input('ModifiedBy', sql.VarChar, vendorClassification.modifiedBy);
    request.input('ModifiedOn', sql.Date, vendorClassification.modifiedOn);
    await request.query(query);
    res.status(201).json({ message: 'Vendor classification added successfully' });
  } catch (err) {
    console.error('Error adding vendor classification:', err);
    res.status(500).send('Server error');
  }
});

// PUT /vendor-classification/:id (update existing vendor classification)
app.put('/vendor-classification/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const vendorClassification = req.body;
    const id = req.params.id;
    const query = `
      UPDATE VendorClassification SET
        VendorId = @VendorId,
        Classification = @Classification,
        CreatedBy = @CreatedBy,
        CreatedOn = @CreatedOn,
        ModifiedBy = @ModifiedBy,
        ModifiedOn = @ModifiedOn
      WHERE RowID = @RowID
    `;
    const request = new sql.Request();
    request.input('RowId', sql.Int, id);
    request.input('VendorId', sql.Int, vendorClassification.vendorId);
    request.input('Classification', sql.VarChar, vendorClassification.classification);
    request.input('CreatedBy', sql.VarChar, vendorClassification.createdBy);
    request.input('CreatedOn', sql.Date, vendorClassification.createdOn);
    request.input('ModifiedBy', sql.VarChar, vendorClassification.modifiedBy);
    request.input('ModifiedOn', sql.Date, vendorClassification.modifiedOn);
    await request.query(query);
    res.status(200).json({ message: 'Vendor classification updated successfully' });
  } catch (err) {
    console.error('Error updating vendor classification:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /vendor-classification/:id (delete vendor classification)
app.delete('/vendor-classification/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowId', sql.Int, id);
    await request.query('DELETE FROM VendorClassification WHERE RowID = @RowID');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting vendor classification:', err);
    res.status(500).send('Server error');
  }
});

/* ===========================
    VENDOR CONTRACT STATUS ENDPOINTS
=========================== */

// GET /vendor-contract-status (all vendor contract statuses)
app.get('/vendor-contract-status', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM VendorContractStatus');
    const vendorContractStatuses = result.recordset.map(row => ({
      rowId: row.RowID,
      vendorId: row.VendorId,
      status: row.Status,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(vendorContractStatuses);
  } catch (err) {
    console.error('Error fetching vendor contract statuses:', err);
    res.status(500).send('Server error');
  }
});

// GET /vendor-contract-status/:id (get one vendor contract status by RowID)
app.get('/vendor-contract-status/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    const result = await request.query('SELECT * FROM VendorContractStatus WHERE RowID = @RowID');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Vendor contract status not found' });
    }
    const row = result.recordset[0];
    const vendorContractStatus = {
      rowId: row.RowID,
      vendorId: row.VendorId,
      status: row.Status,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    };
    res.json(vendorContractStatus);
  } catch (err) {
    console.error('Error fetching vendor contract status:', err);
    res.status(500).send('Server error');
  }
});

// POST /vendor-contract-status (create new vendor contract status)
app.post('/vendor-contract-status', async (req, res) => {
  try {
    await sql.connect(config);
    const vendorContractStatus = req.body;
    const query = `
      INSERT INTO VendorContractStatus (
        VendorId, Status, CreatedBy, CreatedOn, ModifiedBy, ModifiedOn
      ) VALUES (
        @VendorId, @Status, @CreatedBy, @CreatedOn, @ModifiedBy, @ModifiedOn
      )
    `;
    const request = new sql.Request();
    request.input('VendorId', sql.Int, vendorContractStatus.vendorId);
    request.input('Status', sql.VarChar, vendorContractStatus.status);
    request.input('CreatedBy', sql.VarChar, vendorContractStatus.createdBy);
    request.input('CreatedOn', sql.Date, vendorContractStatus.createdOn);
    request.input('ModifiedBy', sql.VarChar, vendorContractStatus.modifiedBy);
    request.input('ModifiedOn', sql.Date, vendorContractStatus.modifiedOn);
    await request.query(query);
    res.status(201).json({ message: 'Vendor contract status added successfully' });
  } catch (err) {
    console.error('Error adding vendor contract status:', err);
    res.status(500).send('Server error');
  }
});

// PUT /vendor-contract-status/:id (update existing vendor contract status)
app.put('/vendor-contract-status/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const vendorContractStatus = req.body;
    const id = req.params.id;
    const query = `
      UPDATE VendorContractStatus SET
        VendorId = @VendorId,
        Status = @Status,
        CreatedBy = @CreatedBy,
        CreatedOn = @CreatedOn,
        ModifiedBy = @ModifiedBy,
        ModifiedOn = @ModifiedOn
      WHERE RowID = @RowID
    `;
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    request.input('VendorId', sql.Int, vendorContractStatus.vendorId);
    request.input('Status', sql.VarChar, vendorContractStatus.status);
    request.input('CreatedBy', sql.VarChar, vendorContractStatus.createdBy);
    request.input('CreatedOn', sql.Date, vendorContractStatus.createdOn);
    request.input('ModifiedBy', sql.VarChar, vendorContractStatus.modifiedBy);
    request.input('ModifiedOn', sql.Date, vendorContractStatus.modifiedOn);
    await request.query(query);
    res.status(200).json({ message: 'Vendor contract status updated successfully' });
  } catch (err) {
    console.error('Error updating vendor contract status:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /vendor-contract-status/:id (delete vendor contract status)
app.delete('/vendor-contract-status/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    await request.query('DELETE FROM VendorContractStatus WHERE RowID = @RowID');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting vendor contract status:', err);
    res.status(500).send('Server error');
  }
});

/* ==========================
    VENDOR NOTES ENDPOINTS
=========================== */

// GET /vendor-notes (all vendor notes)
app.get('/vendor-notes', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM VendorNote');
    const vendorNote = result.recordset.map(row => ({
      rowId: row.RowId,
      vendor: row.Vendor,
      status: row.Status,
      message: row.Message,
      active: row.Active,
      enteredBy: row.EnteredBy,
      dateEntered: row.DateEntered,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(vendorNote);
  } catch (err) {
    console.error('Error fetching vendor notes:', err);
    res.status(500).send('Server error');
  }
});

// GET /vendor-notes/:id (get one vendor note by RowID)
app.get('/vendor-notes/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowId', sql.Int, id);
    const result = await request.query(`SELECT * FROM VendorNote WHERE RowId = @RowId`);
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Vendor note not found' });
    }
    const row = result.recordset[0];
    const vendorNote = {
      rowId: row.RowId,
      vendor: row.Vendor,
      status: row.Status,
      message: row.Message,
      active: row.Active,
      enteredBy: row.EnteredBy,
      dateEntered: row.DateEntered,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    };
    res.json(vendorNote);
  } catch (err) {
    console.error('Error fetching vendor note:', err);
    res.status(500).send('Server error');
  }
});

// POST /vendor-notes (create new vendor note)
app.post('/vendor-notes', async (req, res) => {
  try {
    await sql.connect(config);
    const vendorNote = req.body;
    const query = `
      INSERT INTO VendorNote (
        Vendor, Status, Message, Active, EnteredBy, DateEntered, ModifiedBy, ModifiedOn
      ) VALUES (
        @Vendor, @Status, @Message, @Active, @EnteredBy, GETDATE(), @ModifiedBy, GETDATE()
      )
    `;
    const request = new sql.Request();
    request.input('Vendor', sql.VarChar, vendorNote.vendor);
    request.input('Status', sql.VarChar, vendorNote.status);
    request.input('Message', sql.VarChar, vendorNote.message);
    request.input('Active', sql.Bit, vendorNote.active);
    request.input('EnteredBy', sql.VarChar, vendorNote.enteredBy || 'admin');
    request.input('ModifiedBy', sql.VarChar, vendorNote.modifiedBy || 'admin');
    await request.query(query);
    res.status(201).json({ message: 'Vendor note added successfully' });
  } catch (err) {
    console.error('Error adding vendor note:', err);
    res.status(500).send('Server error');
  }
});

// PUT /vendor-notes/:id (update existing vendor note)
app.put('/vendor-notes/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const vendorNote = req.body;
    const id = req.params.id;
    const query = `
      UPDATE VendorNote SET
        Vendor = @Vendor,
        Status = @Status,
        Message = @Message,
        Active = @Active,
        ModifiedBy = @ModifiedBy,
        ModifiedOn = GETDATE()
      WHERE RowID = @RowID
    `;
    const request = new sql.Request();
    request.input('RowId', sql.Int, id);
    request.input('Vendor', sql.VarChar, vendorNote.vendor);
    request.input('Status', sql.VarChar, vendorNote.status);
    request.input('Message', sql.VarChar, vendorNote.message);
    request.input('Active', sql.Bit, vendorNote.active);
    request.input('ModifiedBy', sql.VarChar, vendorNote.modifiedBy || 'admin');
    await request.query(query);
    res.status(200).json({ message: 'Vendor note updated successfully' });
  } catch (err) {
    console.error('Error updating vendor note:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /vendor-notes/:id (delete vendor note)
app.delete('/vendor-notes/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    await request.query('DELETE FROM VendorNote WHERE RowID = @RowID');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting vendor note:', err);
    res.status(500).send('Server error');
  }
});

/* ===========================
    VENDOR USERS ENDPOINTS
=========================== */

// GET /vendor-users (all vendor users)
app.get('/vendor-users', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM VendorUsers');
    const vendorUsers = result.recordset.map(row => ({
      rowId: row.RowID || row.RowId,
      vendorName: row.VendorName,
      username: row.Username,
      email: row.Email,
      phone: row.Phone,
      trade: row.Trade,
      active: row.Active,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(vendorUsers);
  } catch (err) {
    console.error('Error fetching vendor users:', err);
    res.status(500).send('Server error');
  }
});

// GET /vendor-users/:id (get one vendor user by RowID)
app.get('/vendor-users/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    const result = await request.query(`SELECT * FROM VendorUsers WHERE RowID = @RowID`);
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Vendor user not found' });
    }
    const row = result.recordset[0];
    const vendorUser = {
      rowId: row.RowID || row.Id || row.RowId,
      vendorName: row.VendorName,
      username: row.Username,
      email: row.Email,
      phone: row.Phone,
      trade: row.Trade,
      active: row.Active,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    };
    res.json(vendorUser);
  } catch (err) {
    console.error('Error fetching vendor user:', err);
    res.status(500).send('Server error');
  }
});

// POST /vendor-users (create new vendor user)
app.post('/vendor-users', async (req, res) => {
  try {
    await sql.connect(config);
    const vendorUser = req.body;
    const query = `
      INSERT INTO VendorUsers (
        VendorName, Username, Email, Phone, Trade, Active, CreatedBy, CreatedOn, ModifiedBy, ModifiedOn
      ) VALUES (
        @VendorName, @Username, @Email, @Phone, @Trade, @Active, @CreatedBy, @CreatedOn, @ModifiedBy, @ModifiedOn
      )
    `;
    const request = new sql.Request();
    request.input('VendorName', sql.VarChar, vendorUser.vendorName);
    request.input('Username', sql.VarChar, vendorUser.username);
    request.input('Email', sql.VarChar, vendorUser.email);
    request.input('Phone', sql.VarChar, vendorUser.phone);
    request.input('Trade', sql.VarChar, vendorUser.trade);
    request.input('Active', sql.Bit, vendorUser.active);
    request.input('CreatedBy', sql.VarChar, vendorUser.createdBy);
    request.input('CreatedOn', sql.Date, vendorUser.createdOn);
    request.input('ModifiedBy', sql.VarChar, vendorUser.modifiedBy);
    request.input('ModifiedOn', sql.Date, vendorUser.modifiedOn);
    await request.query(query);
    res.status(201).json({ message: 'Vendor user added successfully' });
  } catch (err) {
    console.error('Error adding vendor user:', err);
    res.status(500).send('Server error');
  }
});

// PUT /vendor-users/:id (update existing vendor user)
app.put('/vendor-users/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const vendorUser = req.body;
    const id = req.params.id;
    const query = `
      UPDATE VendorUsers SET
        VendorName = @VendorName,
        Username = @Username,
        Email = @Email,
        Phone = @Phone,
        Trade = @Trade,
        Active = @Active,
        CreatedBy = @CreatedBy,
        CreatedOn = @CreatedOn,
        ModifiedBy = @ModifiedBy,
        ModifiedOn = @ModifiedOn
      WHERE RowID = @RowID
    `;
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    request.input('VendorName', sql.VarChar, vendorUser.vendorName);
    request.input('Username', sql.VarChar, vendorUser.username);
    request.input('Email', sql.VarChar, vendorUser.email);
    request.input('Phone', sql.VarChar, vendorUser.phone);
    request.input('Trade', sql.VarChar, vendorUser.trade);
    request.input('Active', sql.Bit, vendorUser.active);
    request.input('CreatedBy', sql.VarChar, vendorUser.createdBy);
    request.input('CreatedOn', sql.Date, vendorUser.createdOn);
    request.input('ModifiedBy', sql.VarChar, vendorUser.modifiedBy);
    request.input('ModifiedOn', sql.Date, vendorUser.modifiedOn);
    await request.query(query);
    res.status(200).json({ message: 'Vendor user updated successfully' });
  } catch (err) {
    console.error('Error updating vendor user:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /vendor-users/:id (delete vendor user)
app.delete('/vendor-users/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    await request.query('DELETE FROM VendorUsers WHERE RowID = @RowID');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting vendor user:', err);
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
    TABLET USERS MANAGEMENT ENDPOINTS
=========================== */

// GET /tablet-users (all tablet users)
app.get('/tablet-users', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM TabletUsers');
    const users = result.recordset.map(row => ({
      rowId: row.RowID,
      fname: row.FirstName,
      lname: row.LastName,
      pin: row.PIN,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    }));
    res.json(users);
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send('Server error');
  }
});

//GET /tablet-users/:id (get one tablet user by RowID)
app.get('/tablet-users/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    const result = await request.query('SELECT * FROM TabletUsers WHERE RowID = @RowID');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Tablet user not found' });
    }
    const row = result.recordset[0];
    const user = {
      rowId: row.RowID,
      fname: row.FirstName,
      lname: row.LastName,
      pin: row.PIN,
      createdBy: row.CreatedBy,
      createdOn: row.CreatedOn,
      modifiedBy: row.ModifiedBy,
      modifiedOn: row.ModifiedOn
    };
    res.json(user);
  } catch (err) {
    console.error('Error fetching tablet user:', err);
    res.status(500).send('Server error');
  }
});

// POST /tablet-users (add new tablet user)
app.post('/tablet-users', async (req, res) => {
  try {
    await sql.connect(config);
    const user = req.body;
    const query = `
      INSERT INTO TabletUsers (FirstName, LastName, PIN, CreatedBy, CreatedOn)
      VALUES (@FirstName, @LastName, @PIN, @CreatedBy, GETDATE())
    `;
    const request = new sql.Request();
    request.input('FirstName', sql.VarChar, user.fname);
    request.input('LastName', sql.VarChar, user.lname);
    request.input('PIN', sql.Int, user.pin);
    request.input('CreatedBy', sql.VarChar, 'admin');
    await request.query(query);
    res.status(201).json({ message: 'Tablet user added successfully' });
  } catch (err) {
    console.error('Error adding tablet user:', err);
    res.status(500).send('Server error');
  }
});

// PUT /tablet-users/:id (update existing tablet user)
app.put('/tablet-users/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const user = req.body;
    const id = parseInt(req.params.id, 10);
    const query = `
      UPDATE TabletUsers SET
        FirstName = @FirstName,
        LastName = @LastName,
        PIN = @PIN,
        ModifiedBy = @ModifiedBy,
        ModifiedOn = GETDATE()
      WHERE RowID = @RowID
    `;
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    request.input('FirstName', sql.VarChar, user.fname);
    request.input('LastName', sql.VarChar, user.lname);
    request.input('PIN', sql.Int, user.pin);
    request.input('ModifiedBy', sql.VarChar, 'admin');
    await request.query(query);
    res.status(200).json({ message: 'Tablet user updated successfully' });
  } catch (err) {
    console.error('Error updating tablet user:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /tablet-users/:id (delete tablet user)
app.delete('/tablet-users/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    await request.query('DELETE FROM TabletUsers WHERE RowID = @RowID');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting tablet user:', err);
    res.status(500).send('Server error');
  }
});

/* ===========================
    RESOURCE PRODUCTIVITY ENDPOINTS
=========================== */

// GET /resource-productivity (all resource productivity records)
app.get('/resource-productivity', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM ResourceProductivity');
    const records = result.recordset.map(row => ({
      rowId: row.RowID,
      employee: row.Employee,
      productivityRate: row.ProductivityRate,
      variance: row.Variance,
      createdOn: row.CreatedOn,
      createdBy: row.CreatedBy,
      modifiedOn: row.ModifiedOn,
      modifiedBy: row.ModifiedBy
    }));
    res.json(records);
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send('Server error');
  }
});

// GET /resource-productivity/:id (get one resource productivity record by RowID)
app.get('/resource-productivity/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    const result = await request.query('SELECT * FROM ResourceProductivity WHERE RowID = @RowID');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Resource productivity record not found' });
    }
    const row = result.recordset[0];
    const record = {
      rowId: row.RowID,
      employee: row.Employee,
      productivityRate: row.ProductivityRate,
      variance: row.Variance,
      createdOn: row.CreatedOn,
      createdBy: row.CreatedBy,
      modifiedOn: row.ModifiedOn,
      modifiedBy: row.ModifiedBy
    };
    res.json(record);
  } catch (err) {
    console.error('Error fetching resource productivity record:', err);
    res.status(500).send('Server error');
  }
});

// POST /resource-productivity (add new resource productivity record)
app.post('/resource-productivity', async (req, res) => {
  try {
    await sql.connect(config);
    const record = req.body;
    const query = `
      INSERT INTO ResourceProductivity (Employee, ProductivityRate, Variance, CreatedBy, CreatedOn)
      VALUES (@Employee, @ProductivityRate, @Variance, @CreatedBy, GETDATE())
    `;
    const request = new sql.Request();
    request.input('Employee', sql.VarChar, record.employee);
    request.input('ProductivityRate', sql.Decimal(5, 2), record.productivityRate);
    request.input('Variance', sql.Decimal(5, 2), record.variance);
    request.input('CreatedBy', sql.VarChar, 'admin');
    await request.query(query);
    res.status(201).json({ message: 'Resource productivity record added successfully' });
  } catch (err) {
    console.error('Error adding resource productivity record:', err);
    res.status(500).send('Server error');
  }
});

// PUT /resource-productivity/:id (update existing resource productivity record)
app.put('/resource-productivity/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const record = req.body;
    const id = parseInt(req.params.id, 10);
    const query = `
      UPDATE ResourceProductivity SET
        Employee = @Employee,
        ProductivityRate = @ProductivityRate,
        Variance = @Variance,
        ModifiedBy = @ModifiedBy,
        ModifiedOn = GETDATE()
      WHERE RowID = @RowID
    `;
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    request.input('Employee', sql.VarChar, record.employee);
    request.input('ProductivityRate', sql.Decimal(5, 2), record.productivityRate);
    request.input('Variance', sql.Decimal(5, 2), record.variance);
    request.input('ModifiedBy', sql.VarChar, 'admin');
    await request.query(query);
    res.status(200).json({ message: 'Resource productivity record updated successfully' });
  } catch (err) {
    console.error('Error updating resource productivity record:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /resource-productivity/:id (delete resource productivity record)
app.delete('/resource-productivity/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    await request.query('DELETE FROM ResourceProductivity WHERE RowID = @RowID');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting resource productivity record:', err);
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

/* ===========================
    INVOICE ITEMS ENDPOINTS
=========================== */

// GET /invoice-items (all invoice items)
app.get('/invoice-items', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM InvoiceItems');
    const invoiceItems = result.recordset.map(row => ({
      rowId: parseInt(row.RowID, 10),
      serviceRequestId: row.ServiceRequestId,
      category: row.Category,
      description: row.Description,
      total: row.Total,
      saleTaxTotal: row.SaleTaxTotal,
      quantity: row.Quantity,
      rate: row.Rate,
      createdOn: row.CreatedOn,
      createdBy: row.CreatedBy,
      modifiedOn: row.ModifiedOn,
      modifiedBy: row.ModifiedBy
    }));
    res.json(invoiceItems);
  }
  catch (err) {
    console.error('SQL error', err);
    res.status(500).send('Server error');
  }
});

// GET /invoice-items/:id (single invoice item by ID)
app.get('/invoice-items/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    const result = await request.query('SELECT * FROM InvoiceItems WHERE RowID = @RowID');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Invoice item not found' });
    }
    const row = result.recordset[0];
    const invoiceItem = {
      rowId: parseInt(row.RowID, 10),
      serviceRequestId: row.ServiceRequestId,
      category: row.Category,
      description: row.Description,
      total: row.Total,
      saleTaxTotal: row.SaleTaxTotal,
      quantity: row.Quantity,
      rate: row.Rate,
      createdOn: row.CreatedOn,
      createdBy: row.CreatedBy,
      modifiedOn: row.ModifiedOn,
      modifiedBy: row.ModifiedBy
    };
    res.json(invoiceItem);
  } catch (err) {
    console.error('Error fetching invoice item:', err);
    res.status(500).send('Server error');
  }
});

// POST /invoice-items (add new invoice item)
app.post('/invoice-items', async (req, res) => {
  try {
    await sql.connect(config);
    const invoiceItem = req.body;
    const query = `
      INSERT INTO InvoiceItems (
        ServiceRequestId, Category, Description, Total, SaleTaxTotal,
        Quantity, Rate, CreatedOn, CreatedBy
      ) VALUES (
        @ServiceRequestId, @Category, @Description, @Total, @SaleTaxTotal,
        @Quantity, @Rate, GETDATE(), @CreatedBy
      )
    `;
    const request = new sql.Request();
    request.input('ServiceRequestId', sql.Int, invoiceItem.serviceRequestId);
    request.input('Category', sql.VarChar, invoiceItem.category);
    request.input('Description', sql.VarChar, invoiceItem.description);
    request.input('Total', sql.Decimal(18, 2), invoiceItem.total);
    request.input('SaleTaxTotal', sql.Decimal(18, 2), invoiceItem.saleTaxTotal);
    request.input('Quantity', sql.Int, invoiceItem.quantity);
    request.input('Rate', sql.Decimal(18, 2), invoiceItem.rate);
    request.input('CreatedBy', sql.VarChar, 'admin');
    await request.query(query);
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({ message: 'Invoice item added successfully' });
  }
  catch (err) {
    console.error('Error adding invoice item:', err);
    res.status(500).send('Server error');
  }
});

// PUT /invoice-items/:id (update existing invoice item)
app.put('/invoice-items/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const invoiceItem = req.body;
    const id = req.params.id;
    const query = `
      UPDATE InvoiceItems SET
        ServiceRequestId = @ServiceRequestId,
        Category = @Category,
        Description = @Description,
        Total = @Total,
        SaleTaxTotal = @SaleTaxTotal,
        Quantity = @Quantity,
        Rate = @Rate,
        ModifiedBy = @ModifiedBy,
        ModifiedOn = GETDATE()
      WHERE RowID = @RowID
    `;
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    request.input('ServiceRequestId', sql.Int, invoiceItem.serviceRequestId);
    request.input('Category', sql.VarChar, invoiceItem.category);
    request.input('Description', sql.VarChar, invoiceItem.description);
    request.input('Total', sql.Decimal(18, 2), invoiceItem.total);
    request.input('SaleTaxTotal', sql.Decimal(18, 2), invoiceItem.saleTaxTotal);
    request.input('Quantity', sql.Int, invoiceItem.quantity);
    request.input('Rate', sql.Decimal(18, 2), invoiceItem.rate);
    request.input('ModifiedBy', sql.VarChar, 'admin');
    await request.query(query);
    res.status(200).json({ message: 'Invoice item updated successfully' });
  } catch (err) {
    console.error('Error updating invoice item:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /invoice-items/:id (delete invoice item)
app.delete('/invoice-items/:id', async (req, res) => {
  try {
    await sql.connect(config);
    const id = parseInt(req.params.id, 10);
    const request = new sql.Request();
    request.input('RowID', sql.Int, id);
    await request.query('DELETE FROM InvoiceItems WHERE RowID = @RowID');
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting invoice item:', err);
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