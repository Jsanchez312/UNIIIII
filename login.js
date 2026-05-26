(function() {
      const USERS_KEY = 'unimercs_users';
      const SESSION_KEY = 'session';

      const toast = document.getElementById('toast');
      function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.hidden = false;
        toast.classList.add('show');
        setTimeout(() => {
          toast.classList.remove('show');
          setTimeout(() => toast.hidden = true, 300);
        }, 2500);
      }

      const passwordInput = document.getElementById('password');
      const toggleBtn = document.getElementById('toggle-password');
      
      toggleBtn?.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        toggleBtn.innerHTML = type === 'password' 
          ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'
          : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
      });

      const errorEl = document.getElementById('error-message');
      const successEl = document.getElementById('success-message');

      function showError(message) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
        successEl.classList.remove('show');
      }

      function showSuccess(message) {
        successEl.textContent = message;
        successEl.classList.add('show');
        errorEl.classList.remove('show');
      }

      function hideMessages() {
        errorEl.classList.remove('show');
        successEl.classList.remove('show');
      }

      const existingSession = localStorage.getItem(SESSION_KEY);
      if (existingSession) {
        try {
          const session = JSON.parse(existingSession);
          if (session && session.email) {
            window.location.href = 'prueba.html';
          }
        } catch (err) {
          localStorage.removeItem(SESSION_KEY);
        }
      }

      const loginForm = document.getElementById('login-form');
      const emailInput = document.getElementById('email');
      const submitBtn = document.getElementById('submit-btn');
      const rememberCheckbox = document.getElementById('remember-me');

      loginForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        hideMessages();

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        if (!email || !email.includes('@')) {
          showError('Por favor ingresa un correo electrónico válido');
          return;
        }

        if (!password) {
          showError('Por favor ingresa tu contraseña');
          return;
        }

        submitBtn.disabled = true;
        submitBtn.classList.add('loading');

        setTimeout(() => {
          try {
            const usersData = localStorage.getItem(USERS_KEY);
            let users = [];
            if (usersData) users = JSON.parse(usersData);

            const user = users.find(u => u.email === email);

            if (!user) {
              showError('No existe una cuenta con este correo electrónico');
              submitBtn.disabled = false;
              submitBtn.classList.remove('loading');
              return;
            }

            if (user.password !== password) {
              showError('Contraseña incorrecta');
              submitBtn.disabled = false;
              submitBtn.classList.remove('loading');
              return;
            }

            const sessionData = {
              email: user.email,
              name: user.name,
              loginTime: new Date().toISOString(),
              remember: rememberCheckbox ? rememberCheckbox.checked : false
            };
            localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));

            showSuccess(`¡Bienvenido de nuevo, ${user.name}!`);
            submitBtn.textContent = '✓ Iniciando sesión...';
            submitBtn.style.background = 'linear-gradient(90deg,#10b981,#059669)';

            setTimeout(() => {
              window.location.href = 'prueba.html';
            }, 1500);

          } catch (err) {
            console.error('Login error:', err);
            showError('Error al iniciar sesión. Por favor intenta de nuevo.');
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
          }
        }, 800);
      });

      document.getElementById('goto-register')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'BetaRegister.html';
      });

      document.querySelector('.forgot-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Función de recuperación de contraseña próximamente');
      });
    })();