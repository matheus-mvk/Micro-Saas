'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';

import styles from './login-form.module.css';

import { Button } from '@/components/ui/button';
import { loginSchema, type LoginFormValues } from '@/schemas/login.schema';

export function LoginForm() {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  function onSubmit(): void {
    // Autenticacao real sera implementada no modulo especifico.
  }

  return (
    <form className={styles.form} onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
      <div>
        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register('email')} />
        {errors.email ? <p role="alert">{errors.email.message}</p> : null}
      </div>
      <div>
        <label htmlFor="password">Senha</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          {...register('password')}
        />
        {errors.password ? <p role="alert">{errors.password.message}</p> : null}
      </div>
      <Button type="submit">
        Entrar <ArrowRight size={18} aria-hidden="true" />
      </Button>
    </form>
  );
}
