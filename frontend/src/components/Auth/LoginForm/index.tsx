"use client";

import React, { useState } from "react";
import styles from "./style.module.scss";
import {Button, Checkbox, Link, Form, Divider} from "@nextui-org/react";
import { Icon } from "@iconify/react";
import Logo from "@/components/UI/Logo";
import InputDefault from "@/components/UI/InputDefault";
import ButtonGradient from "@/components/UI/ButtonGradient";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser } from "@/actions/auth/login";
import { useAuthStore } from '@/store/useAuthStore';
import {getUserClient} from "@/actions/auth/getUserClient";
import {showLoginToast} from "@/utils/toasts";

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/';

  const [isVisible, setIsVisible] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  const { setTokens } = useAuthStore();

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const res = await loginUser(form);

    // トークンの保存
    if (res.success && typeof window !== 'undefined') {
      localStorage.setItem('access', res.data.access);
      localStorage.setItem('refresh', res.data.refresh);
      setTokens(res.data.access, res.data.refresh); // Zustand に保存

      // ✅ ユーザー情報をAPI経由で取得 → Zustandに保存
      await getUserClient();

      router.push(nextUrl);
      showLoginToast();
    } else {
      if (res.error?.non_field_errors) {
        setError(res.error.non_field_errors[0]);
      } else {
        setError('ログインに失敗しました。');
      }
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
          >
            Continue with Google
          </Button>
          <Button
              startContent={<Icon icon="ri:line" width={24} className={styles.icon}/>}
              variant="bordered"
              className={styles.socialButton}
          >
            Continue with LINE
          </Button>
          <Button
              startContent={<Icon icon="mdi:instagram" width={24} className={styles.icon}/>}
              variant="bordered"
              className={styles.socialButton}
          >
            Continue with Instagram
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
