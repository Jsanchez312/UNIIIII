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
      const confirmInput = document.getElementById('confirm-password');
      const toggleBtn = document.getElementById('toggle-password');
      const toggleConfirmBtn = document.getElementById('toggle-confirm');
      
      function setupToggle(btn, input) {
        btn?.addEventListener('click', () => {
          const type = input.type === 'password' ? 'text' : 'password';
          input.type = type;
          btn.innerHTML = type === 'password' 
            ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'
            : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
        });
      }

      setupToggle(toggleBtn, passwordInput);
      setupToggle(toggleConfirmBtn, confirmInput);

      const strengthBar = document.getElementById('strength-bar');
      const strengthText = document.getElementById('strength-text');

      passwordInput?.addEventListener('input', () => {
        const password = passwordInput.value;
        let strength = 0;

        if (password.length >= 8) strength++;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^a-zA-Z0-9]/)) strength++;

        if (strength === 0) {
          strengthBar.className = 'password-strength-bar';
          strengthBar.style.width = '0';
          strengthText.textContent = 'Usa al menos 8 caracteres';
        } else if (strength <= 2) {
          strengthBar.className = 'password-strength-bar weak';
          strengthText.textContent = 'Contraseña débil';
        } else if (strength === 3) {
          strengthBar.className = 'password-strength-bar medium';
          strengthText.textContent = 'Contraseña media';
        } else {
          strengthBar.className = 'password-strength-bar strong';
          strengthText.textContent = 'Contraseña fuerte';
        }
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

      function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      }


      function validateJaverianaEmail(email) {
        return email.toLowerCase().endsWith('@javeriana.edu.co');
      }

      const registerForm = document.getElementById('register-form');
      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');
      const termsCheckbox = document.getElementById('terms');
      const submitBtn = document.getElementById('submit-btn');

      registerForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        hideMessages();

        const name = nameInput.value.trim();
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;
        const confirmPassword = confirmInput.value;
        const termsAccepted = termsCheckbox.checked;

        if (!name || name.length < 2) {
          showError('Por favor ingresa tu nombre completo');
          nameInput.classList.add('error');
          return;
        }
        nameInput.classList.remove('error');

        if (!validateEmail(email)) {
          showError('Por favor ingresa un correo electrónico válido');
          emailInput.classList.add('error');
          return;
        }

        if (!validateJaverianaEmail(email)) {
          showError('Debes usar tu correo institucional (@javeriana.edu.co)');
          emailInput.classList.add('error');
          return;
        }
        emailInput.classList.remove('error');

        if (password.length < 8) {
          showError('La contraseña debe tener al menos 8 caracteres');
          passwordInput.classList.add('error');
          return;
        }
        passwordInput.classList.remove('error');

        if (password !== confirmPassword) {
          showError('Las contraseñas no coinciden');
          confirmInput.classList.add('error');
          return;
        }
        confirmInput.classList.remove('error');

        if (!termsAccepted) {
          showError('Debes aceptar los términos y condiciones');
          return;
        }

        submitBtn.disabled = true;
        submitBtn.classList.add('loading');

        setTimeout(() => {
          try {
            const usersData = localStorage.getItem(USERS_KEY);
            let users = [];
            if (usersData) users = JSON.parse(usersData);

            // HU-01: Verificar si el correo ya existe
            const existingUser = users.find(u => u.email === email);
            if (existingUser) {
              showError('Ya existe una cuenta con este correo electrónico');
              submitBtn.disabled = false;
              submitBtn.classList.remove('loading');
              return;
            }

            const newUser = {
              id: String(Date.now()),
              name: name,
              email: email,
              password: password,
              createdAt: new Date().toISOString()
            };

            users.push(newUser);
            localStorage.setItem(USERS_KEY, JSON.stringify(users));

            const existingProfile = localStorage.getItem('userProfile');
            if (!existingProfile) {
              const emptyProfile = { username: name, bio: '' };
              localStorage.setItem('userProfile', JSON.stringify(emptyProfile));
            }

            const sessionData = {
              email: newUser.email,
              name: newUser.name,
              loginTime: new Date().toISOString(),
              remember: true
            };
            localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));

            showSuccess(`¡Cuenta creada exitosamente! Bienvenido, ${name}!`);
            submitBtn.textContent = '✓ Cuenta creada!';
            submitBtn.style.background = 'linear-gradient(90deg,#10b981,#059669)';

            setTimeout(() => {
              window.location.href = 'prueba.html';
            }, 1500);

          } catch (err) {
            console.error('Registration error:', err);
            showError('Error al crear la cuenta. Por favor intenta de nuevo.');
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
          }
        }, 800);
      });

      document.getElementById('goto-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'betalogin.html';
      });

      document.querySelectorAll('.terms-checkbox a').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          showToast('Documentos legales próximamente');
        });
      });
    })();