"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Tooltip } from "@/components/tooltip/tooltip";
import { OptionButton } from "@/components/option-button";
import { FeedbackSlider } from "./feedback";
import { CoinIcon } from "@/components/icons/coin";
import { SelectModeIcon } from "@/components/icons/selectModeIcon";
import confetti from "canvas-confetti";

import styles from "./play.module.css";
import { useQuizStore } from "@/lib/zustand";
import { Confetti, ConfettiRef } from "@/components/magicui/confetti";
import { ScoreDisplay } from "@/components/scoreDisplay/scoreDisplay";
const LibrasCardClient = dynamic(
	() =>
		import("../../components/vlibras/LibrasCard/LibrasCard").then(
			(mod) => mod.LibrasCard,
		),
	{ ssr: false },
);

const getOptionLetter = (index: number): string => String.fromCharCode(65 + index);

export default function Play() {
	const router = useRouter();

	const quizState = useQuizStore((state) => state.quizState);
	const currentQuestionIndex = useQuizStore((state) => state.currentQuestionIndex);
	const quizQuestions = useQuizStore((state) => state.quizQuestions);
	const userAnswers = useQuizStore((state) => state.userAnswers);
	const sessionCoins = useQuizStore((state) => state.sessionCoins);
	const answerQuestion = useQuizStore((state) => state.answerQuestion);
	const nextQuestion = useQuizStore((state) => state.nextQuestion);

	const confettiRef = useRef<ConfettiRef>(null);

	const [hoveredOptionIndex, setHoveredOptionIndex] = useState<number | null>(null);
	const [selectMode, setSelectMode] = useState<boolean>(false);
	const [currentLibrasText, setCurrentLibrasText] = useState<string>("");
	const [showFeedback, setShowFeedback] = useState<boolean>(false);
	const [isCorrect, setIsCorrect] = useState<boolean>(false);

	const currentQuestion = quizQuestions[currentQuestionIndex];
	const totalQuestions = quizQuestions.length;
	const selectedOptionIndex = userAnswers[currentQuestionIndex] ?? null;
	const answered = selectedOptionIndex !== null;

	useEffect(() => {
		if (quizState !== 'playing') {
			console.log("Redirecting from Play page, state:", quizState);
			router.replace(quizState === 'finished' ? '/results' : '/');
		}
	}, [quizState, router]);

	useEffect(() => {
		if (currentQuestion) {
			if (!showFeedback) {
				setCurrentLibrasText(currentQuestion.enunciado);
			}

		}
	}, [currentQuestion, showFeedback]);

	useEffect(() => {
		if (selectMode) {
			document.body.classList.add("vlibras-cursor");
		} else {
			document.body.classList.remove("vlibras-cursor");
		}
		return () => document.body.classList.remove("vlibras-cursor");
	}, [selectMode]);

	const toggleSelectMode = () => {
		const nextMode = !selectMode;
		setSelectMode(nextMode);
		if (currentQuestion && !showFeedback) {
			setCurrentLibrasText(currentQuestion.enunciado);
		}
	};

	const updateLibrasText = (text: string) => {
		if (selectMode && !showFeedback) {
			setCurrentLibrasText(text);
		}
	};

	const handleOptionHover = (index: number, text: string | undefined) => {
		setHoveredOptionIndex(index);
		if (text) {
			updateLibrasText(`Alternativa ${getOptionLetter(index)}: ${text}`);
		}
	};

	const handleQuestionHover = () => {
		if (currentQuestion) {
			updateLibrasText(currentQuestion.enunciado);
		}
	};

	const displayConffetti = () => {

		const duration = 1.5 * 1000;
		const end = Date.now() + duration;
		const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];

		const confettiDefaults = {
			zIndex: 10000,
			colors: colors,
		};

		const frame = () => {
			if (Date.now() > end) {
				console.log("Confetti animation finished.");
				return;
			}

			confetti({
				...confettiDefaults,
				particleCount: 5,
				angle: 50,
				spread: 80,
				startVelocity: 50,
				origin: { x: 0, y: 0.8 },
			});

			confetti({
				...confettiDefaults,
				particleCount: 5,
				angle: 130,
				spread: 80,
				startVelocity: 50,
				origin: { x: 1, y: 0.8 },
			});

			requestAnimationFrame(frame);
		};

		frame();
	};

	const handleOptionClick = (index: number) => {
		if (answered || !currentQuestion) return;

		answerQuestion(currentQuestionIndex, index);

		const correct = index === currentQuestion.respostaCorreta;
		setIsCorrect(correct);
		if (correct) {
			setCurrentLibrasText("Parabéns! Resposta Correta!");
			displayConffetti();
		} else {
			const correctAnswerIndex = currentQuestion.respostaCorreta;
			const correctAnswerText = currentQuestion.opcoes[correctAnswerIndex] || "Desconhecida";
			setCurrentLibrasText(
				`Incorreto. A resposta certa é: ${getOptionLetter(correctAnswerIndex)}) ${correctAnswerText}`,
			);
		}

		setShowFeedback(true);
	};

	const handleNextQuestion = () => {
		setShowFeedback(false);

		setTimeout(() => {
			nextQuestion();

			setIsCorrect(false);
			setHoveredOptionIndex(null);

		}, 300);
	};

	if (quizState !== 'playing' || !currentQuestion) {

		return <div>Carregando Quiz...</div>;
	}

	return (
		<main className={`${styles.grid}`}>
			<Confetti
				ref={confettiRef}
				manualstart // Important: Prevent auto-fire on mount
				// key={currentQuestionIndex} // Option 1: Uncomment to force remount
				style={{ // Option 2: Ensure visibility
					position: 'fixed',
					top: 0,
					left: 0,
					width: '100%',
					height: '100%',
					pointerEvents: 'none',
					zIndex: 10000, // High z-index
				}}
			/>
			<motion.header className="sticky top-0 z-30 flex w-full items-center justify-between px-4 py-3 shadow-md sm:px-6 sm:py-2">

				<div className="flex items-center gap-2 ">
					<div className="rounded-lg bg-indigo-600 px-3 py-1.5 font-bold text-sm text-white sm:text-base">
						Questão {currentQuestionIndex + 1} / {totalQuestions}
					</div>
					<Tooltip
						text={
							selectMode
								? "Desativar tradução por hover"
								: "Ativar tradução por hover"
						}
					>
						<SelectModeIcon
							isActive={selectMode}
							size={36}
							activeColor="#4f46e5"
							defaultColor="#a5b4fc"
							onClick={toggleSelectMode}
						/>
					</Tooltip>
				</div>

				<div
					className={styles.progressBarContainer}
					aria-label={`Progresso: ${currentQuestionIndex + 1} de ${totalQuestions} questões`}
				>
					<div
						className={styles.progressBar}
						style={
							{
								"--total-questions": totalQuestions,
								"--current-question": currentQuestionIndex + 1,
							} as React.CSSProperties
						}
					>
						{Array.from({ length: totalQuestions }).map((_, index) => (
							<motion.div
								key={index}
								className={`${styles.progressSegment} ${index < currentQuestionIndex + 1 ? styles.progressSegmentActive : ""}`}
							/>
						))}
					</div>
				</div>
				<ScoreDisplay score={sessionCoins} />
			</motion.header>

			<div className={styles.avatarArea}>
				<motion.div>
					<LibrasCardClient textToTranslate={currentLibrasText} />
				</motion.div>
			</div>

			<motion.div
				key={currentQuestionIndex + "-question"}
				className="mx-auto w-full max-w-[700px] px-4 sm:px-6"
				onMouseEnter={handleQuestionHover}
				onMouseLeave={() => setHoveredOptionIndex(null)}
			>
				<div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-lg sm:p-6">
					<h2 className={`text-center font-bold text-gray-800 text-lg leading-tight sm:text-xl lg:text-2xl ${selectMode && "hover:underline"}`}>
						{currentQuestion.enunciado}
					</h2>
				</div>
			</motion.div>

			<div className="grid w-full max-w-[700px] grid-cols-1 gap-3 px-4 pb-6 sm:grid-cols-2 sm:gap-4 sm:px-6 sm:pb-0 md:gap-6">
				{ }
				{currentQuestion.opcoes.map((optionText, index) => (
					<motion.div
						key={index}
						onMouseEnter={() => handleOptionHover(index, optionText)}
						onMouseLeave={() => setHoveredOptionIndex(null)}
					>
						<OptionButton

							optionText={optionText}
							index={index}
							answered={answered}
							selected={selectedOptionIndex === index}
							isCorrectAnswer={answered && index === currentQuestion.respostaCorreta}
							onClick={handleOptionClick}
							theme={{
								buttonGradient:
									"linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
								buttonShadow: "#4338ca",
							}}
							selectMode={selectMode}

						/>
					</motion.div>
				))}
			</div>

			<AnimatePresence>
				{showFeedback && (
					<FeedbackSlider
						isCorrect={isCorrect}
						correctAnswerText={
							!isCorrect
								? `${getOptionLetter(currentQuestion.respostaCorreta)}) ${currentQuestion.opcoes[currentQuestion.respostaCorreta]}`
								: undefined
						}
						pointsEarned={isCorrect ? (sessionCoins - (userAnswers[currentQuestionIndex - 1] !== undefined ? useQuizStore.getState().sessionCoins - 50 : 0)) : undefined}

						onNext={handleNextQuestion}
						isLastQuestion={currentQuestionIndex === totalQuestions - 1}
					/>
				)}
			</AnimatePresence>
		</main>
	);

}
