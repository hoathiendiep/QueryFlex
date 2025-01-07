// Add functionality to dynamically add or remove rows
document.querySelector('.add-row').addEventListener('click', () => {
    const tableBody = document.getElementById('table-body');
    const row = document.createElement('tr');
  
    row.innerHTML = `
      <td><input type="text" placeholder="Field Name"></td>
      <td><input type="text" placeholder="Value"></td>
      <td><button class="delete-row">✖</button></td>
    `;
  
    tableBody.appendChild(row);
    attachDeleteHandlers();
  });
  
  function attachDeleteHandlers() {
    document.querySelectorAll('.delete-row').forEach(button => {
      button.addEventListener('click', (event) => {
        event.target.closest('tr').remove();
      });
    });
  }
  
  // Attach delete handlers to existing rows
  attachDeleteHandlers();
  