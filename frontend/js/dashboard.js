async function listCreations() {
  try {
    const res = await fetch('http://localhost:3000/api/creations', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const creations = await res.json();

    creationsList.innerHTML = "";
    creations.forEach(c => {
      const li = document.createElement('li');
      li.textContent = c.title;
      creationsList.appendChild(li);
    });
  } catch (err) {
    console.error(err);
  }
}

// Chama ao carregar a página
listCreations();

async function listCreations() {
  try {
    const res = await fetch('http://localhost:3000/api/creations', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const creations = await res.json();

    creationsList.innerHTML = "";
    creations.forEach(c => {
      const li = document.createElement('li');
      li.textContent = c.title;
      creationsList.appendChild(li);
    });
  } catch (err) {
    console.error(err);
  }
}

// Chama ao carregar a página
listCreations();

async function editCreation(id, newTitle) {
  try {
    const res = await fetch(`http://localhost:3000/api/creations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title: newTitle })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message);

    alert("Criação atualizada!");
    listCreations();
  } catch (err) {
    alert(err.message);
  }
}

// DELETAR
async function deleteCreation(id) {
  if (!confirm("Deseja realmente deletar esta criação?")) return;

  try {
    const res = await fetch(`http://localhost:3000/api/creations/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message);

    alert("Criação deletada!");
    listCreations();
  } catch (err) {
    alert(err.message);
  }
}

//atualizar lista
async function listCreations() {
  try {
    const res = await fetch('http://localhost:3000/api/creations', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const creations = await res.json();
    creationsList.innerHTML = "";

    creations.forEach(c => {
      const li = document.createElement('li');
      li.textContent = c.title + " ";

      const editBtn = document.createElement('button');
      editBtn.textContent = "Editar";
      editBtn.onclick = () => {
        const newTitle = prompt("Novo título:", c.title);
        if (newTitle) editCreation(c._id, newTitle);
      };

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = "Deletar";
      deleteBtn.onclick = () => deleteCreation(c._id);

      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
      creationsList.appendChild(li);
    });
  } catch (err) {
    console.error(err);
  }
}
