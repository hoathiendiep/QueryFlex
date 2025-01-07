import ast
from django.shortcuts import render
import re
import json
from django.http import HttpResponse, JsonResponse
import logging
from django.views.decorators.csrf import csrf_exempt
import sqlite3
 

def home(request):
    return render(request,'home.html')
 
@csrf_exempt
def process_query(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            query_type = data.get('query_type') 
            query_info = data.get('query_info', [])   
            return JsonResponse({
                "data":create_table_and_insert_no_types(query_info)
            })
            # return HttpResponse(extract_all_sql_insert_info(query_info))
        except Exception as e:
            return HttpResponse("Error processing request: " + str(e), status=500)
    else:
        return HttpResponse("Invalid request method.", status=405)

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
            query = replace_booleans(query,True)
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
            data_type = data.get('data_type')  
            if not flex_query_id or not column_name or not column_value or not table_name:
               return JsonResponse({"error": "Missing required fields"}, status=400)
            if '.' in table_name:
                table_name_parts = table_name.split('.')
                if len(table_name_parts) > 1:
                    table_name = table_name_parts[1]
                else:
                    return JsonResponse({"error": "Invalid table name format"}, status=400)    
            if data_type == 'number':
                query = f"UPDATE {table_name} SET {column_name} = {column_value} WHERE flex_query_id = {flex_query_id}"
            else :
                query = f"UPDATE {table_name} SET {column_name} = '{column_value}' WHERE flex_query_id = {flex_query_id}"
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

            insert_queries.append(replace_booleans(query,False))
        # Return the generated queries as JSON response
        return JsonResponse({
            "data":'; '.join(insert_queries)
        })
def delete_row(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        table_name = data.get('table_name')
        flex_query_id = data.get('flex_query_id')
        if table_name and flex_query_id:
            if '.' in table_name:
                table_name_parts = table_name.split('.')
                if len(table_name_parts) > 1:
                    table_name = table_name_parts[1]
                else:
                    return JsonResponse({"error": "Invalid table name format"}, status=400)    
            conn = sqlite3.connect('flex_query.db')  
            cursor = conn.cursor()
            query = f"DELETE FROM {table_name} WHERE flex_query_id = {flex_query_id}"
            try:
                cursor.execute(query)
                conn.commit()
                return HttpResponse("Delete success",status=200)
            except Exception as e:
                return HttpResponse("Error delete row request: " + str(e), status=500)
            finally:
                cursor.close
                conn.close
                
def replace_booleans(query, to_flex=True):
    if to_flex:
        # Replace standalone TRUE/FALSE outside of quotes
        return replace_booleans_data(query)
    else:
        # Replace FLEX_QUERY_TRUE/FLEX_QUERY_FALSE back to TRUE/FALSE
        query = re.sub(r"'FLEX_QUERY_TRUE'", 'TRUE', query, flags=re.IGNORECASE)
        query = re.sub(r"'FLEX_QUERY_FALSE'", 'FALSE', query, flags=re.IGNORECASE)
    return query


def replace_booleans_data(query):
    result = []
    in_single_quote = False
    in_double_quote = False
    i = 0

    while i < len(query):
        char = query[i]

        # Toggle state when encountering quotes
        if char == "'" and not in_double_quote:
            in_single_quote = not in_single_quote
        elif char == '"' and not in_single_quote:
            in_double_quote = not in_double_quote

        # Check for TRUE/FALSE outside quotes
        if not in_single_quote and not in_double_quote:
            if query[i:i + 4].upper() == "TRUE" and (i == 0 or not query[i - 1].isalnum()):
                result.append("'FLEX_QUERY_TRUE'")
                i += 4
                continue
            elif query[i:i + 5].upper() == "FALSE" and (i == 0 or not query[i - 1].isalnum()):
                result.append("'FLEX_QUERY_FALSE'")
                i += 5
                continue

        result.append(char)
        i += 1

    return ''.join(result)