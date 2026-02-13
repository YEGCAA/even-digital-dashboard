import { useEffect, useState } from 'react';

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

    useEffect(() => {
        // Reset to 0 when target changes
        setCurrentValue(0);

        // If target is 0, no animation needed
        if (targetValue === 0) {
            return;
        }

        const startTime = Date.now();
        const startValue = 0;
        const endValue = targetValue;

        // Use easeOutExpo for a fast start and smooth landing
        const easeOutExpo = (t: number): number => {
            return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        };

        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Apply easing function
            const easedProgress = easeOutExpo(progress);
            const newValue = startValue + (endValue - startValue) * easedProgress;

            // Round to specified decimal places
            const roundedValue = decimals > 0
                ? Math.round(newValue * Math.pow(10, decimals)) / Math.pow(10, decimals)
                : Math.round(newValue);

            setCurrentValue(roundedValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Ensure we end exactly at target value
                setCurrentValue(endValue);
            }
        };

        requestAnimationFrame(animate);
    }, [targetValue, duration, decimals]);

    return currentValue;
};
