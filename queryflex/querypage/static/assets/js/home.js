  function isNotNullOrBlank(value) {
    return value !== null && value.trim() !== "";
  }
  
  // Function to delete a row from the table
  function deleteRow(row,tableName,flexQueryId) {
    //   const row = button.closest('tr');
      row.remove();
      $.ajax({
        url:`/delete-row`,
        type: 'POST',
        headers: {
            "X-CSRFToken": getCsrfToken()
        },
        data: JSON.stringify({
            'table_name': tableName,
            'flex_query_id': flexQueryId,// Still JSON string for nested data
        }),
        contentType: "application/json",
        success: function(response){
            console.log(response);
        },
        error: function (error) {
            console.log(error);
        }
    })
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
    let htmlContent=``;
    // let htmlContent=`<button onclick="addNewTable()" class="text-gray-900 hover:text-white border border-gray-800 hover:bg-gray-900 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-gray-600 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-800">Add New Table</button>`;
    for(const tableName in data){
        const tableData = data[tableName];
        const tableCount = tableContainer.getElementsByClassName('table-component').length + 1;
    
        // Create a new table
        htmlContent += `<div class="table-component" id="table-${tableCount}"> 
          <div class="flex justify-between items-center mb-2">
              <label class="text-xl font-semibold mb-2" contenteditable="true">Table ${tableName}</label>
              <div>
                <button onclick="exportQuery('${tableName}')" class="text-blue-700 hover:text-white border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-500 dark:focus:ring-blue-800">Export New Query</button>
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
                            <div class="text-center">
                              <span>${columns[i]}</span>
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
                if(row[columns[i]] ==='FLEX_QUERY_TRUE') {
                    htmlContent +=`
                        <td class="px-6 py-4">
                            <input type="checkbox" checked onchange="updateData('FLEX_QUERY_FALSE', '${tableName}', '${columns[i]}', ${row[columns[0]]},'text');"  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" value='${row[columns[i]] !== null ? row[columns[i]] : ""}' />
                        </td>
                    `;
                }
                else if(row[columns[i]] ==='FLEX_QUERY_FALSE'){
                    htmlContent +=`
                        <td class="px-6 py-4">
                            <input type="checkbox" onchange="updateData('FLEX_QUERY_TRUE', '${tableName}', '${columns[i]}', ${row[columns[0]]},'text');"  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" value='${row[columns[i]] !== null ? row[columns[i]] : ""}' />
                        </td>
                    `;
                }
                else {
                    htmlContent +=`
                        <td class="px-6 py-4">
                            <input type="${!isNaN(row[columns[i]]) ? 'number' : 'text'}" onblur="if(this.value!==this.defaultValue){updateData(this.value, '${tableName}', '${columns[i]}', ${row[columns[0]]},this.type);}"  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" value='${row[columns[i]] !== null ? row[columns[i]] : ""}' />
                        </td>
                    `;
                }
            }
            htmlContent +=`
                                <td class="px-6 py-4 text-center">
                                    <button onclick="deleteRow(this.closest('tr'), '${tableName}',${row[columns[0]]})">
                                         <img src="/static/assets/img/icons/bin.png" class="w-4 h-4 icon-image" alt="Delete">
                                    </button>
                                </td></tr>
           `;
        })
        htmlContent += `</tbody></table></div> 
        </div>`;
        tableContainer.innerHTML = htmlContent;
    }                    
    

  }

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

function updateData(columnValue,tableName,columnName,flexQueryId,dataType){
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
                'column_value':columnValue,
                'data_type':dataType
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

function copyToClipboard(){
    const textAreaResult = document.getElementById('sql-result');
    navigator.clipboard.writeText(textAreaResult.value)
}
