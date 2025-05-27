import React from 'react';
import styles from './style.module.scss';
import LoginForm from "@/components/Auth/LoginForm";

const Login = () => {
    return (
        <div className={styles.container}>
            <LoginForm />
        </div>
    );
};

export default Login;