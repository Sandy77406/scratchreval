const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Path to the text file
const filePath = path.join(__dirname, 'data.txt');

// Helper function to read records
async function readRecords() {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return data.trim() ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Error reading file:', err);
    return [];
  }
}

// Helper function to write records
async function writeRecords(records) {
  try {
    await fs.writeFile(filePath, JSON.stringify(records, null, 2));
  } catch (err) {
    console.error('Error writing file:', err);
    throw err;
  }
}

// Input screen
app.get('/', async (req, res) => {
  res.render('input', { number: '', startDate: '', endDate: '' });
});

// Handle form submission
app.post('/update', async (req, res) => {
  const { number, startDate, endDate } = req.body;

  // Validate inputs
  if (isNaN(number) || !startDate || !endDate) {
    return res.status(400).send('Please provide a valid number and dates');
  }

  // Validate date format and ensure endDate is after startDate
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return res.status(400).send('Invalid dates or end date must be after start date');
  }

  // Read existing records
  const records = await readRecords();

  // Add new record
  records.push({
    number: parseFloat(number),
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  });

  // Write back to file
  await writeRecords(records);
  res.redirect('/');
});

// Display screen (original)
app.get('/display', async (req, res) => {
  const records = await readRecords();
  res.render('display', {
    records,
    filterStart: '',
    filterEnd: '',
    filteredRecords: records,
  });
});

// Handle date range filter for display
app.post('/display', async (req, res) => {
  const { filterStart, filterEnd } = req.body;
  const records = await readRecords();

  // Validate filter dates
  const start = filterStart ? new Date(filterStart) : null;
  const end = filterEnd ? new Date(filterEnd) : null;

  if ((start && isNaN(start.getTime())) || (end && isNaN(end.getTime())) || (start && end && end <= start)) {
    return res.status(400).send('Invalid date range');
  }

  // Filter records where startDate is within the range
  const filteredRecords = records.filter(record => {
    const recordStart = new Date(record.startDate);
    return (!start || recordStart >= start) && (!end || recordStart <= end);
  });

  res.render('display', {
    records,
    filterStart: filterStart || '',
    filterEnd: filterEnd || '',
    filteredRecords,
  });
});

// Display screen (new)
app.get('/display2', async (req, res) => {
  const records = await readRecords();
  res.render('display2', {
    records,
    filterStart: '',
    filterEnd: '',
    filteredRecords: records,
  });
});

// Handle date range filter for display2
app.post('/display2', async (req, res) => {
  const { filterStart, filterEnd } = req.body;
  const records = await readRecords();

  // Validate filter dates
  const start = filterStart ? new Date(filterStart) : null;
  const end = filterEnd ? new Date(filterEnd) : null;

  if ((start && isNaN(start.getTime())) || (end && isNaN(end.getTime())) || (start && end && end <= start)) {
    return res.status(400).send('Invalid date range');
  }

  // Filter records where startDate is within the range
  const filteredRecords = records.filter(record => {
    const recordStart = new Date(record.startDate);
    return (!start || recordStart >= start) && (!end || recordStart <= end);
  });

  res.render('display2', {
    records,
    filterStart: filterStart || '',
    filterEnd: filterEnd || '',
    filteredRecords,
  });
});

// Handle delete request
app.post('/delete', async (req, res) => {
  const { index, source } = req.body;
  const records = await readRecords();

  // Validate index
  if (index >= 0 && index < records.length) {
    records.splice(index, 1); // Remove record at index
    await writeRecords(records);
  }

  // Redirect to the appropriate display page
  res.redirect(source === 'display2' ? '/display2' : '/display');
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});