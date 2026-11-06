import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { mealImages } from '../utils/mealImages';

const dishes = [
    { name: 'Puri with Potato Curry', note: 'Breakfast', image: mealImages.puri },
    { name: 'Saag Aloo & Roti', note: 'Lunch', image: mealImages.saag },
    { name: 'Sprouted Moong Chaat', note: 'Snack', image: mealImages.sprouts },
    { name: 'Tofu Tikka Masala', note: 'Dinner', image: mealImages.tikka },
];

const rise = {
    hidden: { opacity: 0, y: 24 },
    show: (delay = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay },
    }),
};

export default function Landing() {
    return (
        <div className="min-h-screen bg-[#F4DC4A] text-[#1E2A12] font-['Inter',sans-serif]">
            <nav className="sticky top-0 z-50 bg-[#F4DC4A]/90 backdrop-blur-md">
                <div className="max-w-6xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
                    <Link to="/" className="text-lg font-semibold tracking-tight">
                        ArogyaMitra
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link to="/login" className="text-sm font-medium text-[#3E4C22]">
                            Log in
                        </Link>
                        <Link
                            to="/register"
                            className="inline-flex h-11 items-center rounded-full bg-[#2C3A14] px-5 text-sm font-semibold text-[#F7F3D8]"
                        >
                            Get started
                        </Link>
                    </div>
                </div>
            </nav>

            <header className="px-6 lg:px-10 pt-8 pb-20 lg:pt-12 lg:pb-28">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                    <motion.div
                        initial="hidden"
                        animate="show"
                        className="max-w-xl"
                    >
                        <motion.p
                            variants={rise}
                            custom={0.05}
                            className="text-sm font-medium tracking-[0.2em] uppercase text-[#3E4C22]"
                        >
                            Personalised meals
                        </motion.p>
                        <motion.h1
                            variants={rise}
                            custom={0.15}
                            className="mt-6 text-5xl sm:text-6xl lg:text-[4.25rem] font-semibold leading-[1.02] tracking-tight text-[#1E2A12]"
                        >
                            A balanced plate, planned for you.
                        </motion.h1>
                        <motion.p
                            variants={rise}
                            custom={0.28}
                            className="mt-6 text-lg leading-8 text-[#3E4C22] max-w-md"
                        >
                            Indian breakfast, lunch, snack, and dinner chosen for your goal, with a photo of the real dish.
                        </motion.p>
                        <motion.div variants={rise} custom={0.4} className="mt-10">
                            <Link
                                to="/register"
                                className="inline-flex h-12 items-center gap-2 rounded-full bg-[#2C3A14] px-7 text-sm font-semibold text-[#F7F3D8] transition-transform duration-300 hover:-translate-y-0.5"
                            >
                                Build my plan
                                <ArrowRight size={16} />
                            </Link>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                        className="w-full"
                    >
                        <div className="aspect-[5/4] w-full overflow-hidden rounded-[28px] bg-[#2C3A14]">
                            <motion.img
                                src={mealImages.thali}
                                alt="Indian thali with rice, dal, sabzi, and roti"
                                className="h-full w-full object-cover"
                                initial={{ scale: 1.08 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                            />
                        </div>
                    </motion.div>
                </div>
            </header>

            <section id="meals" className="px-6 lg:px-10 pb-24 lg:pb-32">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.6 }}
                        className="mb-12 lg:mb-16 max-w-lg"
                    >
                        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Today’s plates</h2>
                        <p className="mt-4 text-base leading-7 text-[#3E4C22]">
                            Four meals. The picture matches the name.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {dishes.map((dish, index) => (
                            <motion.article
                                key={dish.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-40px' }}
                                transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                                whileHover={{ y: -6 }}
                                className="flex h-full flex-col overflow-hidden rounded-[24px] bg-white"
                            >
                                <div className="h-52 w-full overflow-hidden bg-[#E7D56A]">
                                    <img
                                        src={dish.image}
                                        alt={dish.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="flex h-[108px] flex-col justify-between px-5 py-5">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6A7848]">
                                        {dish.note}
                                    </p>
                                    <h3 className="text-base font-semibold leading-6 text-[#1E2A12] line-clamp-2">
                                        {dish.name}
                                    </h3>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </section>

            <footer className="px-6 lg:px-10 pb-10">
                <div className="max-w-6xl mx-auto flex items-center justify-between border-t border-[#1E2A12]/10 pt-8 text-sm text-[#3E4C22]">
                    <span className="font-medium">ArogyaMitra</span>
                    <Link to="/login" className="font-medium hover:text-[#1E2A12]">
                        Log in
                    </Link>
                </div>
            </footer>
        </div>
    );
}
