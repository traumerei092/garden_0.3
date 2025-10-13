"use client";

import React, { useState } from "react";
import styles from "./style.module.scss";
import {Checkbox, Link, Form, Divider} from "@nextui-org/react";
import { Icon } from "@iconify/react";
import Logo from "@/components/UI/Logo";
import InputDefault from "@/components/UI/InputDefault";
import ButtonGradient from "@/components/UI/ButtonGradient";
import ButtonGradientWrapper from "@/components/UI/ButtonGradientWrapper";
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
  const [showEmailForm, setShowEmailForm] = useState(false);

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

        {!showEmailForm ? (
          // 初期表示：メールログインボタン + SNSボタン
          <div className={styles.initialView}>
            <ButtonGradient
              anotherStyle={styles.submitButton}
              onClick={() => setShowEmailForm(true)}
            >
              メールアドレスでログイン
            </ButtonGradient>

            <div className={styles.dividerRow}>
              <Divider className={styles.divider}/>
              <p className={styles.orText}>OR</p>
              <Divider className={styles.divider}/>
            </div>

            <div className={styles.socialButtons}>
              <ButtonGradientWrapper
                anotherStyle={styles.socialButton}
                onClick={() => handleSocialLogin('google')}
              >
                <Icon icon="flat-color-icons:google" width={24} />
                Continue with Google
              </ButtonGradientWrapper>
              <ButtonGradientWrapper
                anotherStyle={styles.socialButton}
                onClick={() => handleSocialLogin('line')}
              >
                <Icon icon="ri:line" width={24} className={styles.icon} />
                Continue with LINE
              </ButtonGradientWrapper>
              <ButtonGradientWrapper
                anotherStyle={styles.socialButton}
                onClick={() => handleSocialLogin('facebook')}
              >
                <Icon icon="mdi:facebook" width={24} className={styles.icon} />
                Continue with Facebook
              </ButtonGradientWrapper>
            </div>

            <p className={styles.signupPrompt}>
              Need to create an account?&nbsp;
              <Link href="/signup" size="sm">Sign Up</Link>
            </p>
          </div>
        ) : (
          // メールフォーム表示
          <div className={styles.emailView}>
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

            <ButtonGradientWrapper
              anotherStyle={styles.backButton}
              onClick={() => setShowEmailForm(false)}
            >
              <Icon icon="material-symbols:arrow-back" width={18} />
              Back
            </ButtonGradientWrapper>

            <p className={styles.signupPrompt}>
              Need to create an account?&nbsp;
              <Link href="/signup" size="sm">Sign Up</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginForm;
