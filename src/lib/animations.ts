export const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
};

export const cardTransition = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 }
};

export const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.08
        }
    }
};

export const staggerItem = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 }
};