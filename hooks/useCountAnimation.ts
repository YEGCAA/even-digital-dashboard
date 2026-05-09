import { useEffect, useRef, useState } from 'react';

interface UseCountAnimationOptions {
    duration?: number; // duration in milliseconds
    decimals?: number; // number of decimal places to preserve
}

export const useCountAnimation = (
    targetValue: number,
    options: UseCountAnimationOptions = {}
): number => {
    const { duration = 1500, decimals = 0 } = options;
    const [currentValue, setCurrentValue] = useState(0);
    const lastTargetRef = useRef(targetValue);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        // Anima do ultimo valor exibido ate o novo target — funciona pra cima OU pra baixo
        const startValue = lastTargetRef.current === targetValue ? 0 : currentValue;
        const endValue = targetValue;
        lastTargetRef.current = targetValue;

        if (startValue === endValue) {
            setCurrentValue(endValue);
            return;
        }

        const startTime = Date.now();

        // easeOutExpo: rapido no comeco, suave no final
        const easeOutExpo = (t: number): number => {
            return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        };

        // Cancela animacao anterior em voo
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutExpo(progress);
            const newValue = startValue + (endValue - startValue) * eased;
            const rounded = decimals > 0
                ? Math.round(newValue * Math.pow(10, decimals)) / Math.pow(10, decimals)
                : Math.round(newValue);
            setCurrentValue(rounded);
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
            } else {
                setCurrentValue(endValue);
                rafRef.current = null;
            }
        };

        rafRef.current = requestAnimationFrame(animate);
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetValue, duration, decimals]);

    return currentValue;
};
