  function isNotNullOrBlank(value) {
    return value !== null && value.trim() !== "";
  }
  // Function to add a row to the table
  function addRow(tableId, tbodyId) {
    const table = document.getElementById(tableId); // Get the table element

    if (!table) {
        console.error(`Table with ID "${tableId}" not found.`);
        return;
    }

    const headerCells = table.querySelector('thead tr') ? table.querySelector('thead tr').cells : null; // Get all <th> elements
    const tableBody = document.getElementById(tbodyId); // Get the table's <tbody> element by ID

    if (!headerCells || !tableBody) {
        console.error("Missing <thead> or <tbody> in the table.");
        return;
    }

    const newRow = document.createElement('tr');
    newRow.className='odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700'

    // Loop through the header cells to generate <td>
    Array.from(headerCells).forEach((header, index) => {
        const cell = document.createElement('td');

        if (index === headerCells.length - 1) {
            // Last column for Actions
            // cell.classList.add('text-center');
            cell.className = "px-6 py-4 text-center";
            cell.innerHTML = `
                <button onclick="deleteRow(this)">
                   <img src="/static/assets/img/icons/bin.png" class="w-4 h-4 icon-image tex" alt="Delete">
                  </button>
            `;
        } else {
            // Add an input field for other columns
            cell.className = "px-6 py-4";
            const input = document.createElement('input');
            input.type = "text";
            input.placeholder = header.textContent.trim(); // Use header text as placeholder
            input.className = "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500";
            cell.appendChild(input);
        }

        newRow.appendChild(cell);
    });

    // Append the new row to the table body
    tableBody.appendChild(newRow);
}


  
  // Function to delete a row from the table
  function deleteRow(button) {
      const row = button.closest('tr');
      row.remove();
  }
  
  // Function to add a new column to the table
  function addColumn(tableId) {
    const table = document.getElementById(tableId);
    const rows = table.querySelectorAll("tr");

    rows.forEach((row, rowIndex) => {
        const actionCell = row.lastElementChild; // Reference to the "Actions" column
        const newCell = document.createElement(rowIndex === 0 ? "th" : "td");
        newCell.classList.add("px-6", "py-3"); 
        newCell.setAttribute("scope", "col");

        if (rowIndex === 0) {
            // Add header cell with delete button
            newCell.innerHTML = `
                <div class="flex justify-between items-center">
                <span contenteditable>Price</span>
                <button onclick="deleteColumn('${tableId}',  this.closest('th'), this)">
                    <img src="/static/assets/img/icons/x-mark.png" class="w-4 h-4 icon-image" alt="Delete">
                </button>
                </div>
            `;
        } else {
            // Add a default input field for rows
            newCell.innerHTML = `<input type="text" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />`;
        }

        // Insert the new cell before the "Actions" column
        row.insertBefore(newCell, actionCell);
    });
}

  
  // Function to delete a column from the table
function deleteColumn(tableId, headerCell, button) {
    const table = document.getElementById(tableId);
    const rows = table.querySelectorAll("tr");

    // Find the index of the header cell
    const headerIndex = Array.from(rows[0].cells).indexOf(headerCell);

    if (headerIndex === -1) {
        console.error("Header cell not found!");
        return;
    }

    // Loop through all rows and delete the cell at the header index
    rows.forEach((row) => {
        const cells = row.cells;
        if (cells[headerIndex]) {
            row.deleteCell(headerIndex); // Delete the <td> or <th> at the specified index
        }
    });

    // Remove the delete button itself
    if (button) {
        button.remove();
    }
}
  // Function to delete a table
  function deleteTable(tableId) {
      const table = document.getElementById(tableId);
      if (table) {
          table.remove();  // Removes the table from the DOM
      }
  }
  
  // Function to add a new table dynamically
  function addNewTable() {
      const tableContainer = document.getElementById('tables-container');
      const tableCount = tableContainer.getElementsByClassName('table-component').length + 1;
  
      // Create a new table
      const newTable = document.createElement('div');
      newTable.className = 'table-component';
      newTable.id = 'table-' + tableCount;
  
      newTable.innerHTML = `
          <div class="flex justify-between items-center mb-2">
              <label class="text-xl font-semibold mb-2" contenteditable="true">Table ${tableCount}</label>
              <div>
                <button onclick="exportQuery('${tableName}')" class="text-blue-700 hover:text-white border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-500 dark:focus:ring-blue-800">Export New Query</button>
                <button onclick="deleteTable('table-${tableCount}')" class="text-red-500 hover:text-white border border-red-500 hover:bg-red-600 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-2">Delete Table</button>
             </div>
          </div>
          <div class="overflow-x-auto overflow-y-auto relative shadow-md sm:rounded-lg">
          <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400" id="table-${tableCount}-element">
              <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                          <th scope="col" class="px-6 py-3">
                            <div class="flex justify-between items-center">
                              <span contenteditable>ID</span>
                              <button onclick="deleteColumn('table-${tableCount}', this.closest('th'), this)" class="p-0 m-0">
                                  <img src="/static/assets/img/icons/x-mark.png" class="w-4 h-4 icon-image" alt="Delete">
                              </button>
                          </div>
                          </th>
                          <th scope="col" class="px-6 py-3">
                            <div class="flex justify-between items-center">
                              <span contenteditable>Name</span>
                              <button onclick="deleteColumn('table-${tableCount}', this.closest('th'), this)" class="p-0 m-0">
                                  <img src="/static/assets/img/icons/x-mark.png" class="w-4 h-4 icon-image" alt="Delete">
                              </button>
                          </div>
                            </th>
                          <th scope="col" class="px-6 py-3">
                            <div class="flex justify-between items-center">
                              <span contenteditable>Price</span>
                              <button onclick="deleteColumn('table-${tableCount}', this.closest('th'), this)" class="p-0 m-0">
                                  <img src="/static/assets/img/icons/x-mark.png" class="w-4 h-4 icon-image" alt="Delete">
                              </button>
                          </div>
                          </th>
                          <th scope="col" class="px-6 py-3 text-center">Actions</th>
                      </tr>
              </thead>
              <tbody id="table-${tableCount}-body">
                  <!-- Rows will go here -->
              </tbody>
          </table>
          </div>
          <div class="flex space-x-2 mt-3">
              <button onclick="addRow('table-${tableCount}-element','table-${tableCount}-body')" class="text-purple-700 hover:text-white border border-purple-700 hover:bg-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Add Row</button>
              <button onclick="addColumn('table-${tableCount}')" class="text-blue-700 hover:text-white border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Add Column</button>
          </div>
      `;
  
      tableContainer.appendChild(newTable);
  }
  
  function getCsrfToken() {
    var csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    return csrfToken;
} 

 function convertQueryToTable(){
    const insertRegex = /INSERT INTO\s+\w+(\.\w+)?\s*\(.*?\)\s*VALUES\s*\([\s\S]*?\)\s*;/gi;
    const selectElement = document.getElementById("select-query-type");
    const selectedValue = selectElement.value;
    const sqlQuery = document.getElementById("sql-query").value.trim();
    let matches = [];
    if(isNotNullOrBlank(selectedValue) && isNotNullOrBlank(sqlQuery)){
        switch(selectedValue){
            case "INSERT":
                matches = sqlQuery.match(insertRegex);
                if (matches && matches.length > 0) {
                    console.log("Matched Queries:", matches);
                }
                break;
        }
        if(matches.length > 0){
            $.ajax({
                url:'/process-query',
                type: 'POST',
                headers: {
                    "X-CSRFToken": getCsrfToken()
                },
                data: JSON.stringify({
                    'query_type': selectedValue,
                    'query_info': matches,// Still JSON string for nested data
                }),
                contentType: "application/json",
                success: function(response){
                    console.log("Response from server: ",response.data);
                    generateTables(response.data);
                },
                error: function (error) {
                    console.log(error);
                }
            })
        }
          

    }
  }

  function generateTables(data){
    const tableContainer = document.getElementById('tables-container');
    let htmlContent=`<button onclick="addNewTable()" class="text-gray-900 hover:text-white border border-gray-800 hover:bg-gray-900 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-gray-600 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-800">Add New Table</button>`;
    for(const tableName in data){
        const tableData = data[tableName];
        const tableCount = tableContainer.getElementsByClassName('table-component').length + 1;
    
        // Create a new table
        htmlContent += `<div class="table-component" id="table-${tableCount}"> 
          <div class="flex justify-between items-center mb-2">
              <label class="text-xl font-semibold mb-2" contenteditable="true">Table ${tableName}</label>
              <div>
                <button onclick="exportQuery('${tableName}')" class="text-blue-700 hover:text-white border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-500 dark:focus:ring-blue-800">Export New Query</button>
                <button onclick="deleteTable('table-${tableCount}')" class="text-red-500 hover:text-white border border-red-500 hover:bg-red-600 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-2">Delete Table</button>
             </div>
          </div>
              <div class="overflow-x-auto overflow-y-auto relative shadow-md sm:rounded-lg">
              <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400" id="table-${tableCount}-element">
                  <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>`;
        const columns = Object.keys(tableData[0]);      
        for(let i = 1; i < columns.length;  i++){
            htmlContent +=`
                          <th scope="col" class="px-6 py-3">
                            <div class="flex justify-between items-center">
                              <span contenteditable>${columns[i]}</span>
                              <button onclick="deleteColumn('table-${tableCount}', this.closest('th'), this)" class="p-0 m-0">
                                  <img src="/static/assets/img/icons/x-mark.png" class="w-4 h-4 icon-image" alt="Delete">
                              </button>
                          </div>
                          </th>
            `;
        }
  
        htmlContent +=`<th scope="col" class="px-6 py-3 text-center">Actions</th>
        </tr>
              </thead>
              <tbody id="table-${tableCount}-body">
                `;
              
        tableData.forEach(row => { 
            htmlContent +=`<tr class="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">`
            for(let i = 1; i < columns.length;  i++){
                htmlContent +=`
                <td class="px-6 py-4">
                    <input type="${!isNaN(row[columns[i]]) ? 'number' : 'text'}" onblur="if(this.value!==this.defaultValue){updateData(this.value, '${tableName}', '${columns[i]}', ${row[columns[0]]});}"  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" value='${row[columns[i]] !== null ? row[columns[i]] : ""}' />
                </td>
               `;
            }
            htmlContent +=`
                                <td class="px-6 py-4 text-center">
                                    <button onclick="deleteRow(this)">
                                         <img src="/static/assets/img/icons/bin.png" class="w-4 h-4 icon-image" alt="Delete">
                                    </button>
                                </td></tr>
           `;
        })
        htmlContent += `</tbody></table></div> 
                          <div class="flex space-x-2 mt-3">
                      <button onclick="addRow('table-1-element','table-1-body')" class="text-purple-700 hover:text-white border border-purple-700 hover:bg-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Add Row</button>
                      <button onclick="addColumn('table-1')" class="text-blue-700 hover:text-white border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Add Column</button>
                  </div>
        </div>`;
        tableContainer.innerHTML = htmlContent;
    }                    
    

  }
//   function exportQuery(tableId,tableName){
//     const table = document.getElementById(tableId);
//     const columns = Array.from(table.querySelectorAll("thead th span"))
//         .map(th => th.textContent.trim())
//         .filter(name => name !== "Actions"); // Exclude 'Actions' column

//     // Extract row values
//     const rows = Array.from(table.querySelectorAll("tbody tr")).map(row => {
//         return Array.from(row.querySelectorAll("td input")).map(cell => cell.value.trim());
//     });

//     // Create SQL query
//     const columnList = columns.join(", ");
//     const valueList = rows
//         .map(row => `(${row.map(value => `'${value.replace(/'/g, "''")}'`).join(", ")})`)
//         .join(",\n");

//     const sqlQuery = `INSERT INTO ${tableName} (${columnList}) VALUES\n${valueList};`;
//     console.log(sqlQuery);

//     // Send to server if needed
//     // fetch('/your-endpoint/', {
//     //     method: 'POST',
//     //     headers: { 'Content-Type': 'application/json' },
//     //     body: JSON.stringify({ sqlQuery })
//     // });
// }
function exportQuery(tableName){
    $.ajax({
        url:`/export-query?table_name=${tableName}`,
        type: 'GET',
        headers: {
            "X-CSRFToken": getCsrfToken()
        },
        contentType: "application/json",
        success: function(response){
            fillSqlResult(response.data)
        },
        error: function (error) {
            console.log(error);
        }
    })
}
function escapeSqlString(str) {
    // Escape single quotes and backslashes in the JSON data
    return str.replace(/\\/g, '\\\\').replace(/'/g, "''");
}

function standardizeInsertQuery(sqlQuery) {
    // Remove backticks and unnecessary escape characters
    sqlQuery = sqlQuery.replace(/`/g, '') // Remove backticks
                       .replace(/\\n/g, ' ') // Remove newlines
                       .replace(/\\'/g, "'") // Escape single quotes
                       .replace(/\\"/g, '"'); // Escape double quotes

    // Regex to match INSERT INTO queries, both with and without columns
    const insertRegex = /INSERT INTO\s+(\w+)\s*(?:\(([^)]+)\))?\s*VALUES\s*(\(([^)]+)\))(.*?);/gi;

    let standardizedQueries = [];
    let match;

    // Loop through the query string and match all INSERT INTO queries
    while ((match = insertRegex.exec(sqlQuery)) !== null) {
        const tableName = match[1];  // Table name
        const columns = match[2] ? match[2] : '';  // Columns if available
        const valuesString = match[3];  // Values without parentheses
        const additionalValues = match[4]; // Additional rows in case of multi-row inserts

        // If columns are not provided, generate a simple format
        if (!columns) {
            standardizedQueries.push(`INSERT INTO ${tableName} VALUES ${escapeSqlString(valuesString)};`);
        } else {
            // If columns are provided, process each row of values
            const valueRows = valuesString.split(/\),\s*\(/).map(row => `(${row})`);
            valueRows.forEach(row => {
                standardizedQueries.push(`INSERT INTO ${tableName} (${columns}) VALUES ${escapeSqlString(row)};`);
            });
        }
    }

    // Return the standardized queries as a single string, joined by newline
    return standardizedQueries.join(" ");
}

function updateData(columnValue,tableName,columnName,flexQueryId){
        $.ajax({
            url:'/update-value',
            type: 'POST',
            headers: {
                "X-CSRFToken": getCsrfToken()
            },
            data: JSON.stringify({
                'column_name': columnName,
                'table_name': tableName, 
                'flex_query_id':flexQueryId,
                'column_value':columnValue
            }),
            contentType: "application/json",
            error: function (error) {
                console.log(error);
            }
        })
    
}

function fillSqlResult(data){
    const textAreaResult = document.getElementById('sql-result');
    textAreaResult.value = data;
}
