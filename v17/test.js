const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Read the local file
  const html = fs.readFileSync('./public/beta.html', 'utf8');
  await page.setContent(html);

  // Evaluate the rows property
  const result = await page.evaluate(() => {
    // Simulate loading data
    const grid = {
      data: {
        Monday: { '09:30': [{subject: 'Test Subject', room: 'Test Room', faculty: 'Test Faculty', ltp: 'Lecture', batch: '23CSBTB04'}] }
      }
    };
    
    // Call renderGrid
    renderGrid(grid, 'fBody');
    
    // Check table.rows
    const headId = 'facultyGridHead';
    const table = document.getElementById(headId).parentElement;
    
    return {
      fBodyInnerHTML: document.getElementById('fBody').innerHTML,
      tableRowsLength: table.rows.length,
      tableRowsHTML: Array.from(table.rows).map(r => r.outerHTML).join('\n')
    };
  });
  
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
