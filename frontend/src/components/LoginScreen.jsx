import { V, c } from '../utils.js';

const LoginScreen = V.memo(function LoginScreen({ form, error, onChange, onSubmit }) {
  return c.jsxs('main', {
    className: 'login-screen modern-ui min-h-[100dvh] w-full bg-background-light text-text-main dark:bg-background-dark dark:text-white',
    children: [
      c.jsxs('section', {
        className: 'login-screen__intro hidden lg:flex',
        children: [
          c.jsx('div', { className: 'login-screen__glow login-screen__glow--one' }),
          c.jsx('div', { className: 'login-screen__glow login-screen__glow--two' }),
          c.jsxs('div', {
            className: 'relative z-10 max-w-md',
            children: [
              c.jsx('span', {
                className: 'material-symbols-outlined text-5xl text-white',
                children: 'shopping_bag',
              }),
              c.jsx('h1', {
                className: 'mt-8 text-5xl font-bold tracking-[-0.045em] text-white',
                children: 'Compratelo con Pao',
              }),
              c.jsx('p', {
                className: 'mt-5 max-w-sm text-lg leading-8 text-violet-100',
                children: 'La mesa de trabajo para compras, clientes y envíos en un solo lugar.',
              }),
            ],
          }),
        ],
      }),
      c.jsx('section', {
        className: 'login-screen__form-area',
        children: c.jsxs('div', {
          className: 'login-screen__form-card',
          children: [
            c.jsxs('div', {
              className: 'lg:hidden',
              children: [
                c.jsx('span', {
                  className: 'material-symbols-outlined text-4xl text-primary',
                  children: 'shopping_bag',
                }),
                c.jsx('p', {
                  className: 'mt-5 text-sm font-bold uppercase tracking-[0.12em] text-primary',
                  children: 'Compratelo con Pao',
                }),
              ],
            }),
            c.jsx('h2', {
              className: 'mt-7 text-3xl font-bold tracking-[-0.035em] text-text-main dark:text-white lg:mt-0',
              children: 'Bienvenid@ de vuelta',
            }),
            c.jsx('p', {
              className: 'mt-2 text-sm leading-6 text-text-sub dark:text-slate-300',
              children: 'Inicia sesión para continuar con tu trabajo.',
            }),
            error &&
              c.jsx('div', {
                role: 'alert',
                className: 'mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 dark:border-rose-900 dark:bg-rose-950/35 dark:text-rose-100',
                children: error,
              }),
            c.jsxs('form', {
              onSubmit,
              className: 'mt-8 space-y-5',
              children: [
                c.jsxs('label', {
                  className: 'block',
                  children: [
                    c.jsx('span', { className: 'login-screen__label', children: 'Usuario' }),
                    c.jsxs('div', {
                      className: 'login-screen__field',
                      children: [
                        c.jsx('span', { className: 'material-symbols-outlined text-[20px]', children: 'person' }),
                        c.jsx('input', {
                          placeholder: 'Tu usuario',
                          value: form.username,
                          onChange: (event) => onChange({ ...form, username: event.target.value }),
                          className: 'min-w-0 flex-1 bg-transparent outline-none',
                          autoComplete: 'username',
                          required: true,
                        }),
                      ],
                    }),
                  ],
                }),
                c.jsxs('label', {
                  className: 'block',
                  children: [
                    c.jsx('span', { className: 'login-screen__label', children: 'Contraseña' }),
                    c.jsxs('div', {
                      className: 'login-screen__field',
                      children: [
                        c.jsx('span', { className: 'material-symbols-outlined text-[20px]', children: 'lock' }),
                        c.jsx('input', {
                          type: 'password',
                          placeholder: 'Tu contraseña',
                          value: form.password,
                          onChange: (event) => onChange({ ...form, password: event.target.value }),
                          className: 'min-w-0 flex-1 bg-transparent outline-none',
                          autoComplete: 'current-password',
                          required: true,
                        }),
                      ],
                    }),
                  ],
                }),
                c.jsx('button', {
                  type: 'submit',
                  className: 'login-screen__submit',
                  children: 'Iniciar sesión',
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  });
});

export default LoginScreen;
