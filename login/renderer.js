document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('http://localhost:3000/auth', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (data.success) {
      alert('Login exitoso');
      // Aquí puedes guardar el token o navegar a otra vista
    } else {
      alert('Credenciales incorrectas');
    }
  } catch (err) {
    console.error(err);
    alert('Error al conectar con el servidor');
  }
});
