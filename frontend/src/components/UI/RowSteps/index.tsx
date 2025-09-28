"use client";

import React from "react";
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import ButtonGradient from '@/components/UI/ButtonGradient';
import styles from './style.module.scss';

type Step = {
  title: string;
  description?: string;
  content?: React.ReactNode;
};

type Props = {
  steps: Step[];
  currentStep: number;
  onNext?: () => void;
  onPrevious?: () => void;
  canProceedToNext?: boolean;
  isLastStep?: boolean;
  nextButtonText?: string;
  previousButtonText?: string;
};

export default function RowSteps({
  steps,
  currentStep,
  onNext,
  onPrevious,
  canProceedToNext = true,
  isLastStep = false,
  nextButtonText = "次へ",
  previousButtonText = "戻る"
}: Props) {
    const currentStepData = steps[currentStep];

    return (
        <div className={styles.wrapper}>
            {/* ステップ表示 */}
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

            {/* ステップコンテンツ */}
            {currentStepData && (
                <div className={styles.stepContent}>
                    {currentStepData.description && (
                        <div className={styles.stepDescription}>
                            <p>{currentStepData.description}</p>
                        </div>
                    )}

                    {currentStepData.content && (
                        <div className={styles.contentArea}>
                            {currentStepData.content}
                        </div>
                    )}
                </div>
            )}

            {/* ナビゲーションボタン */}
            {(onNext || onPrevious) && (
                <div className={styles.navigation}>
                    {onPrevious && currentStep > 0 && (
                        <ButtonGradient
                            onClick={onPrevious}
                            anotherStyle={styles.previousButton}
                            size="md"
                        >
                            <ChevronLeft size={16} />
                            {previousButtonText}
                        </ButtonGradient>
                    )}

                    <div className={styles.spacer} />

                    {onNext && (
                        <ButtonGradient
                            onClick={onNext}
                            anotherStyle={`${styles.nextButton} ${!canProceedToNext ? styles.disabledButton : ''}`}
                            size="md"
                        >
                            {nextButtonText}
                            {!isLastStep && <ChevronRight size={16} />}
                        </ButtonGradient>
                    )}
                </div>
            )}
        </div>
    );
}
