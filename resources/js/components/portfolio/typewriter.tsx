import React, { useState, useEffect } from 'react';

interface TypewriterProps {
    phrases: string[];
}

export const Typewriter: React.FC<TypewriterProps> = ({ phrases }) => {
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        const currentPhrase = phrases[currentPhraseIndex] || '';
        const typingSpeed = isDeleting ? 35 : 75;

        if (!isDeleting && displayedText === currentPhrase) {
            timer = setTimeout(() => setIsDeleting(true), 2500);
        } else if (isDeleting && displayedText === '') {
            setIsDeleting(false);
            setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        } else {
            timer = setTimeout(() => {
                setDisplayedText(
                    isDeleting
                        ? currentPhrase.substring(0, displayedText.length - 1)
                        : currentPhrase.substring(0, displayedText.length + 1)
                );
            }, typingSpeed);
        }

        return () => clearTimeout(timer);
    }, [displayedText, isDeleting, currentPhraseIndex, phrases]);

    return (
        <span className="border-r-2 border-indigo-500 dark:border-indigo-400 pr-1 animate-blink font-semibold text-indigo-600 dark:text-indigo-400">
            {displayedText}
        </span>
    );
};

export default Typewriter;

