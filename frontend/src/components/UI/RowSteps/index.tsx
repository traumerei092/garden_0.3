"use client";

import React from "react";
import { Check } from 'lucide-react';
import styles from './style.module.scss';

type Step = { title: string };

type Props = {
  steps: Step[];
  currentStep: number;
};

export default function RowSteps({ steps, currentStep }: Props) {
    return (
        <div className={styles.wrapper}>
            <div className={styles.stepsContainer}>
                {steps.map((step, index) => (
                    <div key={index} className={styles.stepWrapper}>
                        <div
                            className={
                                index < currentStep
                                  ? `${styles.circle} ${styles.completed}`
                                  : index === currentStep
                                      ? `${styles.circle} ${styles.active}`
                                      : `${styles.circle} ${styles.inactive}`
                            }
                        >
                            {index < currentStep ? (
                              <Check className={styles.checkIcon} size={18}/>
                            ) : (
                              <span className={styles.number}>{index + 1}</span>
                            )}
                        </div>
                        <div
                          className={`${styles.stepTitle} ${
                              index <= currentStep ? styles.activeText : ''
                          }`}
                        >
                          {step.title}
                        </div>
                        {index < steps.length - 1 && (
                            <div
                                className={
                                    index <= currentStep - 1
                                    ? `${styles.stepLine} ${styles.stepLineActive}`
                                    : styles.stepLine
                                }
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
