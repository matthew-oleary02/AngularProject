/* server.js - Express server for Customer CRUD operations */

/* Uses mssql package to connect to SQL Server database */
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
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