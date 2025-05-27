import React from 'react';
import styles from './style.module.scss';
import SignupForm from "@/components/Auth/SignupForm";

const Signup = () => {
    return (
        <div className={styles.container}>
            <SignupForm />
        </div>
    );
};

export default Signup;