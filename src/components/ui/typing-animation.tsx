import React, { useState, useEffect } from 'react';

interface TypingAnimationProps {
    text: string;
    speed?: number;
    className?: string;
}

const TypingAnimation: React.FC<TypingAnimationProps> = ({ 
    text, 
    speed = 100, 
    className = "" 
}) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, speed);

            return () => clearTimeout(timeout);
        } else if (currentIndex >= text.length) {
            // Add a delay before starting over
            const timeout = setTimeout(() => {
                setDisplayedText('');
                setCurrentIndex(0);
            }, 2000);

            return () => clearTimeout(timeout);
        }
    }, [currentIndex, text, speed]);

    return (
        <span className={className}>
            {displayedText}
            <span className="animate-pulse">|</span>
        </span>
    );
};

export default TypingAnimation; 