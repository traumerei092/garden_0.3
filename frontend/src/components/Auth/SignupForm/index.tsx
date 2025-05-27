"use client";

import React, { useState } from "react";
import styles from "./style.module.scss";
import { useRouter } from 'next/navigation';
import {Button, Checkbox, Link, Form, Divider} from "@nextui-org/react";
import { Icon } from "@iconify/react";
import Logo from "@/components/UI/Logo";
import InputDefault from "@/components/UI/InputDefault";
import ButtonGradient from "@/components/UI/ButtonGradient";
import {signupUser} from "@/actions/auth/signup";

type FormData = {
  name: string;
  email: string;
  password: string;
  re_password: string;
};

type FormErrors = {
  name: string[];
  email: string[];
  password: string[];
  re_password: string[];
};

const SignupForm = () => {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    re_password: ""
  });

  const [errors, setErrors] = useState<FormErrors>({
    name: [],
    email: [],
    password: [],
    re_password: [],
  });

  const [message, setMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors: FormErrors = {
      name: [],
      email: [],
      password: [],
      re_password: [],
    };

    if (!form.name) newErrors.name.push("ユーザー名は必須です。");
    if (!form.email.includes("@")) newErrors.email.push("正しいメールアドレスを入力してください。");
    if (form.password.length < 6) newErrors.password.push("パスワードは6文字以上にしてください。");
    if (!form.password.match(/[A-Z]/)) newErrors.password.push("1つ以上の大文字を含めてください。");
    if (!form.password.match(/[^a-zA-Z0-9]/)) newErrors.password.push("記号を1つ以上含めてください。");
    if (form.password !== form.re_password) newErrors.re_password.push("パスワードが一致しません。");

    console.log("🔍 validate() errors", newErrors);
    console.log("❗ password errors", newErrors.password);

    setErrors(newErrors);
    return Object.values(newErrors).every((arr) => arr.length === 0);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("✅ handleSubmit triggered");
    setMessage('');

    const isValid = validate();
    console.log("🧪 isValid:", isValid);
    if (!validate()) return;

    console.log("✅ Passed validation. Sending to signupUser()");
    const result = await signupUser(form);

    if (result.success) {
      router.push('/verify'); // 本登録完了案内ページへ
    } else {
      const errorData = result.error;
      const serverErrors: FormErrors = {
        name: result.error?.name || [],
        email: result.error?.email || [],
        password: result.error?.password || [],
        re_password: result.error?.re_password || [],
      };
      setErrors(serverErrors);
      setMessage(errorData.message || "サーバーエラーが発生しました。");
    }
  };

  return (
    <div className={styles.wrapper}>
      <Logo width={240} height={120} />
      <div className={styles.formContainer}>
        <div className={styles.headerSection}>
          <h1 className={styles.title}>Welcome to GARDEN !!</h1>
        </div>

        <Form className={styles.form} validationBehavior="native" onSubmit={handleSubmit}>
          <InputDefault
              isRequired
              label="User Name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              isInvalid={errors.name.length > 0}
              errorMessage={<ul>{errors.name.map((err, i) => <li key={i}>{err}</li>)}</ul>}
          />
          <InputDefault
              isRequired
              label="Email Address"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              isInvalid={errors.name.length > 0}
              errorMessage={<ul>{errors.name.map((err, i) => <li key={i}>{err}</li>)}</ul>}
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
              isInvalid={errors.name.length > 0}
              errorMessage={<ul>{errors.name.map((err, i) => <li key={i}>{err}</li>)}</ul>}
          />
          <InputDefault
              isRequired
              label="Confirm Password"
              name="re_password"
              type={isVisible ? "text" : "password"}
              value={form.re_password}
              onChange={handleChange}
              endContent={
                <button type="button" onClick={toggleVisibility} className={styles.iconButton}>
                  <Icon
                      className={styles.icon}
                      icon={isVisible ? "solar:eye-closed-linear" : "solar:eye-bold"}
                  />
                </button>
              }
              isInvalid={errors.name.length > 0}
              errorMessage={<ul>{errors.name.map((err, i) => <li key={i}>{err}</li>)}</ul>}
          />

          <div className={styles.optionsRow}>
            <Checkbox name="remember" size="sm">
              I agree with the&nbsp;
              <Link className="relative z-[1]" href="#" size="sm">
                Terms
              </Link>
              &nbsp; and&nbsp;
              <Link className="relative z-[1]" href="#" size="sm">
                Privacy Policy
              </Link>
            </Checkbox>
          </div>

          <ButtonGradient anotherStyle={styles.submitButton} type="submit">
            SEND MAIL
          </ButtonGradient>
          {message && <p className={styles.message}>{message}</p>}
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
            Sign up with Google
          </Button>
          <Button
              startContent={<Icon icon="ri:line" width={24} className={styles.icon}/>}
              variant="bordered"
              className={styles.socialButton}
          >
            Sign up with LINE
          </Button>
          <Button
              startContent={<Icon icon="mdi:instagram" width={24} className={styles.icon}/>}
              variant="bordered"
              className={styles.socialButton}
          >
            Sign up with Instagram
          </Button>
        </div>

        <p className={styles.signupPrompt}>
          既にアカウントをお持ちの場合はこちら&nbsp;
          <Link href="/login" size="sm">Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupForm;
