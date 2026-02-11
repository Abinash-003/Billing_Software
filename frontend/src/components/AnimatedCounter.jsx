import React, { useEffect, useState } from 'react';

export default function AnimatedCounter({ value, duration = 600, prefix = '', suffix = '', decimals = 0 }) {
    const num = Number(value);
    const isNum = !isNaN(num);
    const [display, setDisplay] = useState(isNum ? (decimals > 0 ? num.toFixed(decimals) : Math.round(num)) : value);

    useEffect(() => {
        if (!isNum) {
            setDisplay(value);
            return;
        }
        const start = Number(display) || 0;
        const end = num;
        if (start === end) return;
        const startTime = performance.now();
        const step = (now) => {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            const eased = 1 - (1 - t) * (1 - t);
            const current = start + (end - start) * eased;
            setDisplay(decimals > 0 ? current.toFixed(decimals) : Math.round(current));
            if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [num, duration, decimals, isNum]);

    return <span>{prefix}{display}{suffix}</span>;
}
