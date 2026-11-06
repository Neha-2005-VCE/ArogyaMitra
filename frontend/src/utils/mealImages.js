/**
 * Dish photos chosen so the picture matches the meal name.
 * Local copies of Wikimedia Commons files:
 * puri — Breakfast with Puri Sabji
 * saag — Chapathi with palak curry
 * tikka — Paneer Tikka masala (same gravy style as tofu tikka masala)
 * sprouts — Sprouts salad
 * idli — Idli Sambar
 * rice — Jeera rice
 * thali — Vegetarian thali
 */

export const mealImages = {
    puri: '/meals/puri.jpg',
    saag: '/meals/saag.jpg',
    tikka: '/meals/tikka.jpg',
    sprouts: '/meals/sprouts.jpg',
    banana: '/meals/banana.jpg',
    curd: '/meals/curd.jpg',
    makhana: '/meals/makhana.jpg',
    idli: '/meals/idli.jpg',
    rice: '/meals/rice.jpg',
    thali: '/meals/thali.jpg',
};

const rules = [
    { test: /puri|poori|bhaji|bhajji|kachori/, image: mealImages.puri },
    { test: /idli|dosa|sambar|sambhar|uttapam/, image: mealImages.idli },
    { test: /makhana|fox nut/, image: mealImages.makhana },
    { test: /banana|shake/, image: mealImages.banana },
    { test: /curd|yogurt|dahi/, image: mealImages.curd },
    { test: /sprout|moong chaat|chaat|bhel/, image: mealImages.sprouts },
    { test: /tikka|tofu|paneer|masala|tandoori|butter chicken|korma/, image: mealImages.tikka },
    { test: /saag|palak|spinach|methi|phulka|roti|chapati|chapathi/, image: mealImages.saag },
    { test: /jeera rice|biryani|pulao|khichdi|dal/, image: mealImages.rice },
];

/**
 * Resolves a photo from the dish name first, then the meal slot.
 */
export function resolveMealImage(name = '', type = '') {
    const q = `${name} ${type}`.toLowerCase();
    const match = rules.find((rule) => rule.test.test(q));
    return match ? match.image : mealImages.thali;
}

export default mealImages;
