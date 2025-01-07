import ast
from django.shortcuts import render
import re
import json
from django.http import HttpResponse, JsonResponse
import logging
from django.views.decorators.csrf import csrf_exempt
import sqlite3
import html

# Step 1: Use 'with' to connect to the database (or create one) and automatically close it when done
# with sqlite3.connect('my_database.db') as connection:

#     # Step 2: Create a cursor object to interact with the database
#     cursor = connection.cursor()

#     print("Database created and connected successfully!")

# No need to call connection.close(); it's done automatically!

def home(request):
    return render(request,'home.html')

def extract_sql_insert_info(sql):
    try:
        # Regular expression to match the table name
        table_name_pattern = r"INSERT INTO (\w+)"
        
        # Regular expression to match the column names inside parentheses
        columns_pattern = r"\((.*?)\)"
        
        # Regular expression to match the values inside VALUES parentheses
        values_pattern = r"VALUES\((.*)\)"
        
        # Extract the table name
        table_name = re.search(table_name_pattern, sql).group(1)
        
        # Extract column names
        columns = re.search(columns_pattern, sql).group(1).split(",")
        
        # Extract values
        values = extract_values(re.search(values_pattern, sql).group(1))
        
        # Clean the values (remove extra spaces, quotes, and NULL)
        # values = [value.strip().strip("'").strip("NULL") if value.strip() != "NULL" else None for value in values]
        
        # Create a dictionary of column names and corresponding values
        column_value_dict = {columns[i]: values[i] for i in range(len(columns))}
    except Exception as e:
        logging.error('Error occurred ' + str(e))

    return table_name, column_value_dict

# def extract_all_sql_insert_info(sql_statements):  
#     all_data = {}
#     # Process each SQL statement
#     for sql in sql_statements:
#         table_name, column_value_dict = extract_sql_insert_info(sql)
        
#         # If the table already exists in the dictionary, append to it
#         if table_name in all_data:
#             all_data[table_name].append(column_value_dict)
#         else:
#             all_data[table_name] = [column_value_dict]
    
#     return all_data
 
@csrf_exempt
def process_query(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            query_type = data.get('query_type') 
            query_info = data.get('query_info', [])   
            # try:
            #     # query_info = json.loads(query_info)   
            # except json.JSONDecodeError as e:
            #     return HttpResponse("Invalid JSON in query_info: " + str(e), status=400)
            
            # Process the data and return a response
            return JsonResponse({
                "data":create_table_and_insert_no_types(query_info)
            })
            # return HttpResponse(extract_all_sql_insert_info(query_info))
        except Exception as e:
            return HttpResponse("Error processing request: " + str(e), status=500)
    else:
        return HttpResponse("Invalid request method.", status=405)
    
# def process_query(request):
#     if request.method == 'POST':
#         try:
#             body = request.body.decode('utf-8')
#             data = json.loads(request.body)
#             query_type = data.get('query_type') 
#             query_info = data.get('query_info', '[]')   
#             try:
                
#                 query_info = json.loads(query_info)  # Convert to Python list/dict
#                 create_table_and_insert_no_types(query_info[0])
#             except json.JSONDecodeError as e:
#                 return HttpResponse("Invalid JSON in query_info: " + str(e), status=400)
            
#             # Process the data and return a response
#             return JsonResponse({
#                 "data":extract_all_sql_insert_info(query_info)
#             })
#             # return HttpResponse(extract_all_sql_insert_info(query_info))
#         except Exception as e:
#             return HttpResponse("Error processing request: " + str(e), status=500)
#     else:
#         return HttpResponse("Invalid request method.", status=405)
# @csrf_exempt
# def validate_query(request):
#     if request.method == 'POST':
#         try:
#             # Parse the incoming JSON data
#             data = json.loads(request.body)
            
#             # Extract and parse the SQL query
#             query = data.get('query')
#             if not query:
#                 return JsonResponse({"error": "Query is missing in request"}, status=400)
            
#             parsed_query = process_insert_query(query)

#             # Return a success response with validation result
#             return JsonResponse({
#                 "result": str(parsed_query)
#             }, status=200)

#         except Exception as e:
#             # Return a formatted error message in case of an exception
#             return JsonResponse({"error": f"Error: {str(e)}"}, status=400)
        
# def is_valid_insert(query):
#     # Simple regex to check if the query is a valid INSERT INTO statement
#     pattern = re.compile(r"^INSERT INTO `?([a-zA-Z0-9_]+)`?\s?\([a-zA-Z0-9_,\s']+\)\s?VALUES\s?\((.+)\);$")
#     return bool(pattern.match(query.strip()))

# def convert_multi_line_insert(query):
#     if not is_valid_insert(query):
#         raise ValueError("Invalid INSERT query.")
    
#     # Extract the table name and columns
#     table_part = query.split('VALUES')[0].strip()
#     values_part = query.split('VALUES')[1].strip()
    
#     # Remove the surrounding parentheses and split into individual rows
#     values_rows = values_part[1:-1].split('),(')
    
#     # Generate individual INSERT queries
#     insert_queries = []
#     for row in values_rows:
#         insert_queries.append(f"{table_part} VALUES ({row});")
    
#     return '\n'.join(insert_queries)

# def process_insert_query(query):
#     # Check if it's a valid INSERT query
#     if not is_valid_insert(query):
#         return f"Invalid query: {query}"
    
#     # If it's a multi-line insert, convert it
#     if ',' in query.split('VALUES')[1]:  # Multiple rows of values
#         return convert_multi_line_insert(query)
    
#     # Otherwise, return the original query as is
#     return query        


# multi_line_query = """
# INSERT INTO Customers (CustomerName, ContactName, Address, City, PostalCode, Country)
# VALUES
# ('Cardinal', 'Tom B. Erichsen', 'Skagen 21', 'Stavanger', '4006', 'Norway'),
# ('Greasy Burger', 'Per Olsen', 'Gateveien 15', 'Sandnes', '4306', 'Norway'),
# ('Tasty Tee', 'Finn Egan', 'Streetroad 19B', 'Liverpool', 'L1 0AA', 'UK');
# """

# # Single insert query for testing
# single_insert_query = """
# INSERT INTO Customers (CustomerName, ContactName, Address, City, PostalCode, Country)
# VALUES ('Cardinal', 'Tom B. Erichsen', 'Skagen 21', 'Stavanger', '4006', 'Norway');
# """

def extract_values(sql_values):
    # Regex pattern to match values inside the SQL VALUES section
    # It matches single-quoted strings, NULLs, or unquoted numeric values
# Regex pattern to match various SQL value types
    pattern = r"""
        ('([^']|\\')*')             # Matches single-quoted strings (including escaped single quotes)
        | NULL                     # Matches NULL values
        | \{.*?\}                  # Matches JSON-like objects inside curly braces
        | ([^,]+)                  # Matches unquoted numeric or text values
    """
    # Extract values using regex
    matches = re.findall(pattern, sql_values, re.VERBOSE)
    
    # Process the matches to create a clean list of values
    values = []
    for match in matches:
        quoted_value, unquoted_value = match
        if quoted_value:
            # Handle escaped single quotes inside strings
            unescaped_value = quoted_value.replace("\\'", "'")
            values.append(unescaped_value)
        elif unquoted_value.strip() == "NULL":
            values.append(None)  # Treat NULL as Python's None
        else:
            # Try to interpret as a number if possible
            try:
                values.append(ast.literal_eval(unquoted_value.strip()))
            except (ValueError, SyntaxError):
                values.append(unquoted_value.strip())
    
    return values

def create_table_and_insert_no_types(sql_statements):
    # Regex to match INSERT INTO pattern    
        # Regular expression to match the table name
        table_name_pattern = r"INSERT INTO\s+(?:\w+\.)?(\w+)"  # Extracts only the table name
        schema_table_pattern= r"INSERT INTO\s+(\w+\.\w+)"
        
        
        # Regular expression to match the column names inside parentheses
        columns_pattern = r"\((.*?)\)"
        
        # Regular expression to match the values inside VALUES parentheses
        tables = set()
        conn = sqlite3.connect('flex_query.db')
        delete_all_tables(conn)
        schema_table_dict = dict()
        for query in sql_statements:
            cursor = conn.cursor()
            # Extract the table name
            table_name = re.search(table_name_pattern, query).group(1)
            try:
                schema_table = re.search(schema_table_pattern, query).group(1)
                schema_table_dict[table_name]=schema_table
            except Exception as e:
                schema_table_dict[table_name]=table_name

            # Extract column names
            columns = re.search(columns_pattern, query).group(1).split(",")
 
        
            # Create the CREATE TABLE statement without data types
            # create_table_stmt = f"CREATE TABLE {table_name} (\n"
            # for column in columns:
            #     create_table_stmt += f"    {column} TEXT,\n"
            # create_table_stmt = create_table_stmt.rstrip(',\n') + "\n);"
            
            # print("CREATE TABLE Statement:")
            # print(create_table_stmt)
                # Step 2: Create the table dynamically with TEXT type for all columns

            # Step 3: Create table query with TEXT type for all columns
            create_table_query = f"CREATE TABLE IF NOT EXISTS {table_name} (flex_query_id INTEGER PRIMARY KEY AUTOINCREMENT, {', '.join([f'{col}' for col in columns])});"
            
            # Debugging: Print the query before executing it
            print(f"Create Table Query: {create_table_query}")
            pattern = r"(INSERT INTO\s+)(?:\w+\.)?(\w+)"
            updated_query = re.sub(pattern, r"\1\2", query)
            try:
                cursor.execute(create_table_query)
                tables.add(table_name)
                cursor.execute(updated_query)
            except sqlite3.Error as e:
                print(f"Error occurred while creating table: {e}")
        # cursor.commit()
        # cursor.close()
        all_data = {}
        try:
            for table_name in tables:
                try:
                    cursor = conn.cursor()
                    # Fetch column names for the table
                    cursor.execute(f"PRAGMA table_info({table_name})")
                    column_info = cursor.fetchall()
                    column_names = [col[1] for col in column_info]  # Column names are in the second field

                    # Query to fetch all data from the table
                    cursor.execute(f"SELECT * FROM {table_name}")
                    rows = cursor.fetchall()

                    # Convert rows to dictionaries using column names
                    row_data = [dict(zip(column_names, row)) for row in rows]

                    # Add table data to the dictionary
                    all_data[schema_table_dict[table_name]] = row_data
                    cursor.close()
                except sqlite3.Error as e:
                    print(f"Error fetching data from table '{table_name}': {e}")
        finally:
            # Ensure the cursor is closed
            cursor.close()
        conn.commit()    
        return all_data

# Example INSERT INTO query
# sql_query = """INSERT INTO task_invoicedb (id, task_id, sender, cc_list, SAP_invoice_id, SAP_fiscal_year, file_name, url_file, list_images, list_thumbnail, md5_key, company_code, currency, company_info, supplier_id, supplier_info, header_text, reference, gross_amount, `transaction`, document_type, exchange_rate, purchase_order, purchase_order_item, payment_terms, baseline_date, tax_code, cost_center, debit_credit_code, g_l_account, invoice_date, posting_date, tax_reporting_date, tax_date, tax_fullfill_date, list_items, item_text, all_textbox, created_at, updated_at, status, is_locked, pic_id, userid_id, company_display, supplier_display, `assignment`, shared_notes, split_pages, url_email_file, invoice_updated_at, iban_id, iban_name, iban_swift_code, baseType, duedate, htmlPath, pdfPath) VALUES(34331, '281341c0bc6511ef8cdf0242ac150005', 'HuyenNTT14@fpt.com', '', NULL, NULL, 'ubl-tc434-example1.xml', 'staging/ionity_admin/2024/12/17/19468c6abc6511ef8cdf0242ac150005/ubl-tc434-example1.xml', NULL, NULL, '576c97b54d7152b76c60103a74aba8dc', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '0', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '0', NULL, NULL, '2024-12-17 11:53:32.189504', NULL, NULL, NULL, NULL, NULL, NULL, '2024-12-17 11:53:32.189521', '2024-12-17 11:53:32.189524', '5', 0, NULL, 2, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, 0, '2024-12-17 11:53:32.189534', NULL, NULL);"""

# create_table_and_insert_no_types(sql_query)


def convert_to_data1_type(data1,data2):
 
    converted_data = []
    
    for d1, d2 in zip(data1, data2):
        # Check if data1 element is a string or other data type and convert accordingly
        if isinstance(d1, str):
            converted_data.append(str(d2) if d2 is not None else '')
        elif isinstance(d1, float):
            try:
                converted_data.append(float(d2) if d2 is not None else 0.0)
            except ValueError:
                converted_data.append(0.0)
        elif isinstance(d1, int):
            try:
                converted_data.append(int(d2) if d2 is not None else 0)
            except ValueError:
                converted_data.append(0)
        elif d1 is None:
            converted_data.append(None)  # For None types, keep None
        
    return tuple(converted_data)

def delete_all_tables(connection):
    """
    Deletes all tables in the SQLite database connected via the given connection.

    Args:
        connection (sqlite3.Connection): SQLite database connection object.
    """
    cursor = connection.cursor()
    try:
        # Query to fetch all table names from SQLite master table
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()

        # Drop each table
        for table_name in tables:
            table = table_name[0]
            try:
                cursor.execute(f"DROP TABLE IF EXISTS {table}")
                print(f"Table '{table}' dropped successfully.")
            except sqlite3.Error as e:
                print(f"Error dropping table '{table}': {e}")
        
        # Commit the changes
        connection.commit()
    finally:
        cursor.close()


def update_value(request):
    if request.method == 'POST':
            data = json.loads(request.body)
            flex_query_id = data.get('flex_query_id') 
            column_name = data.get('column_name')   
            column_value = data.get('column_value')   
            table_name = data.get('table_name')   
            if not flex_query_id or not column_name or not column_value or not table_name:
               return JsonResponse({"error": "Missing required fields"}, status=400)
            if '.' in table_name:
                table_name_parts = table_name.split('.')
                if len(table_name_parts) > 1:
                    table_name = table_name_parts[1]
                else:
                    return JsonResponse({"error": "Invalid table name format"}, status=400)    
                
            query = f"UPDATE {table_name} SET {column_name} = {column_value} WHERE flex_query_id = {flex_query_id}"
            print(query)
            try:
                conn = sqlite3.connect('flex_query.db')  # Adjust with your database connection
                cursor = conn.cursor()
                
                # Execute the query with parameters to prevent SQL injection
                cursor.execute(query)
                
                # Commit the changes and close the connection
                conn.commit()
                conn.close()
            except sqlite3.Error as e:
                print(f"Error occurred while updating table: {e}")

def export_query(request):
    if request.method == 'GET':
        # Get the table name from the request body
        table_name = request.GET.get('table_name')
        default_table_name = request.GET.get('table_name')

        if not table_name:
            return JsonResponse({"error": "Missing table_name"}, status=400)
        if '.' in table_name:
            table_name_parts = table_name.split('.')
            if len(table_name_parts) > 1:
                table_name = table_name_parts[1]
            else:
                return JsonResponse({"error": "Invalid table name format"}, status=400)    
        # Use raw SQL to fetch column names and values
        conn = sqlite3.connect('flex_query.db')  # Adjust with your database connection
        cursor = conn.cursor()
        # Fetch column names for the given table
        cursor.execute(f"PRAGMA table_info({table_name})")  # SQLite specific query to get column info
        columns = cursor.fetchall()
        column_names = [column[1] for column in columns if column[1] != 'flex_query_id']  # Exclude the 'id' column

        # Fetch all rows from the table
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()

        insert_queries = []
        for row in rows:
            # Create a list of values for each row, excluding the first column (id)
            # values = [value if value is not None else 'NULL' for value in row[1:]]
            values = []
            for value in row[1:]:
                if isinstance(value, str):
                    # Escape single quotes within string values
                    escaped_value = value.replace("'", "''")
                    values.append(f"'{escaped_value}'")
                elif value is None:
                    # Use NULL for None values
                    values.append("NULL")
                else:
                    # Convert other types (e.g., integers, floats) directly
                    values.append(str(value))

            # Construct the query
            query = f"INSERT INTO {default_table_name} ({', '.join(column_names)}) VALUES ({', '.join(map(str,values))});"

            insert_queries.append(query)
        # Return the generated queries as JSON response
        return JsonResponse({
            "data":'; '.join(insert_queries)
        })
