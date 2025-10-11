"use client";

import React, { useState } from "react";
import styles from "./style.module.scss";
import {Button, Checkbox, Link, Form, Divider} from "@nextui-org/react";
import { Icon } from "@iconify/react";
import Logo from "@/components/UI/Logo";
import InputDefault from "@/components/UI/InputDefault";
import ButtonGradient from "@/components/UI/ButtonGradient";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import {showLoginToast} from "@/utils/toasts";

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/';

  const [isVisible, setIsVisible] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError('ログインに失敗しました。メールアドレスとパスワードを確認してください。');
      } else if (result?.ok) {
        showLoginToast();
        router.push(nextUrl);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('ログインに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'line') => {
    try {
      setIsLoading(true);
      await signIn(provider, { callbackUrl: nextUrl });
    } catch (error) {
      console.error(`${provider} login error:`, error);
      setError(`${provider}ログインに失敗しました。`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <Logo width={240} height={120} />
      <div className={styles.formContainer}>
        <div className={styles.headerSection}>
          <h1 className={styles.title}>WELCOME BACK !!</h1>
        </div>

        <Form className={styles.form} validationBehavior="native" onSubmit={handleSubmit}>
          <InputDefault
              isRequired
              label="Email Address"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
          />
          <InputDefault
              isRequired
              label="Password"
              name="password"
              type={isVisible ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              endContent={
                <button type="button" onClick={toggleVisibility} className={styles.iconButton}>
                  <Icon
                      className={styles.icon}
                      icon={isVisible ? "solar:eye-closed-linear" : "solar:eye-bold"}
                  />
                </button>
              }
          />

          <div className={styles.optionsRow}>
            <Checkbox name="remember" size="sm">Remember me</Checkbox>
            <Link href="#" size="sm" className={styles.forgot}>Forgot password?</Link>
          </div>

          {error && (
            <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>
          )}

          <ButtonGradient
              type="submit"
              isLoading={isLoading}
              anotherStyle={styles.submitButton}>
            LOG IN
          </ButtonGradient>
        </Form>

        <div className={styles.dividerRow}>
          <Divider className={styles.divider}/>
          <p className={styles.orText}>OR</p>
          <Divider className={styles.divider}/>
        </div>

        <div className={styles.socialButtons}>
          <Button
              startContent={<Icon icon="flat-color-icons:google" width={24}/>}
              variant="bordered"
              className={styles.socialButton}
              isLoading={isLoading}
              onClick={() => handleSocialLogin('google')}
          >
            Continue with Google
          </Button>
          <Button
              startContent={<Icon icon="ri:line" width={24} className={styles.icon}/>}
              variant="bordered"
              className={styles.socialButton}
              isLoading={isLoading}
              onClick={() => handleSocialLogin('line')}
          >
            Continue with LINE
          </Button>
          <Button
              startContent={<Icon icon="mdi:facebook" width={24} className={styles.icon}/>}
              variant="bordered"
              className={styles.socialButton}
              isLoading={isLoading}
              onClick={() => handleSocialLogin('facebook')}
          >
            Continue with Facebook
          </Button>
        </div>

        <p className={styles.signupPrompt}>
          Need to create an account?&nbsp;
          <Link href="/signup" size="sm">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
