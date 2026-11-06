import confetti from 'canvas-confetti';

/**
 * Fires vibrant particle bursts using canvas-confetti
 */
export const triggerConfetti = (origin = { x: 0.5, y: 0.6 }) => {
    try {
        confetti({
            particleCount: 80,
            spread: 70,
            origin,
            colors: ['#10B981', '#06B6D4', '#FF6B6B', '#F59E0B', '#8B5CF6'],
            ticks: 200,
            gravity: 1.2,
            decay: 0.94,
            startVelocity: 30,
        });
    } catch (e) {
        console.warn('Confetti error:', e);
    }
};

export const triggerSuperConfetti = () => {
    try {
        const count = 200;
        const defaults = {
            origin: { y: 0.7 },
            colors: ['#10B981', '#06B6D4', '#FF6B6B', '#FBBF24', '#A855F7'],
        };

        const fire = (particleRatio, opts) => {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio)
            });
        };

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    } catch (e) {}
};
