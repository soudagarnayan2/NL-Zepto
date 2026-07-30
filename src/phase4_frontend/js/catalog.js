/* Ask Zepto AI — Catalog & Recipe Data Module */

const sandwichIngredients = [
  { id: "sw1", em: "🍞", nm: "Britannia Whole Wheat Bread", wt: "400 g", pr: 45, was: 52, cals: "~70 kcal/slice", cat: "Dairy,Bread & Eggs", img: "https://images.bigbasket.com/media/uploads/p/l/40069497-2-britannia-100-whole-wheat-bread.jpg" },
  { id: "sw2", em: "🧈", nm: "Amul Butter Pasteurised", wt: "100 g", pr: 55, was: 62, cals: "~102 kcal/tbsp", cat: "Dairy,Bread & Eggs", img: "https://images.bigbasket.com/media/uploads/p/l/40000755-1-amul-butter.jpg" },
  { id: "sw3", em: "🧀", nm: "Amul Cheese Slices Processed", wt: "200 g", pr: 125, was: 145, cals: "~65 kcal/slice", cat: "Dairy,Bread & Eggs", img: "https://images.bigbasket.com/media/uploads/p/l/40000768_2-amul-processed-cheese.jpg" },
  { id: "sw4", em: "🍅", nm: "Farm Fresh Hybrid Tomatoes", wt: "1 kg", pr: 38, was: 45, cals: "~22 kcal/100g", cat: "Fruits & vegetables", img: "https://upload.wikimedia.org/wikipedia/commons/8/88/Salad_garden_Tomato_je.jpg" },
  { id: "sw5", em: "🥒", nm: "Fresho Local Green Cucumber", wt: "500 g", pr: 25, was: 35, cals: "~15 kcal/100g", cat: "Fruits & vegetables", img: "https://images.bigbasket.com/media/uploads/p/l/10000067_23-fresho-capsicum-green.jpg" },
  { id: "sw6", em: "🥗", nm: "Veeba Classic Veg Mayonnaise", wt: "250 g", pr: 89, was: 99, cals: "~95 kcal/tbsp", cat: "Breakfast & Sauce", img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
  { id: "sw7", em: "🧀", nm: "Amul Fresh Paneer", wt: "200 g", pr: 98, was: 120, cals: "~265 kcal/100g", cat: "Dairy,Bread & Eggs", img: "https://images.bigbasket.com/media/uploads/p/l/40012869_1-amul-fresh-paneer.jpg" },
  { id: "sw8", em: "🥚", nm: "Farm Raised Fresh Brown Eggs", wt: "6 pcs", pr: 72, was: 90, cals: "~78 kcal/egg", cat: "Dairy,Bread & Eggs", img: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Single_fresh_egg.jpg" },
  { id: "sw9", em: "🫙", nm: "Mother's Recipe Mint Chutney", wt: "200 g", pr: 59, was: 70, cals: "~35 kcal/20g", cat: "Breakfast & Sauce", img: "https://images.bigbasket.com/media/uploads/p/l/40002672_3-mothers-recipe-green-chutney.jpg" }
];

const puranPoliPairingIngredients = [
  { id: "pp1", em: "🫓", nm: "Shree Ganesh Fresh Wheat Puran Poli", wt: "Pack of 4", pr: 160, was: 180, cals: "~280 kcal/pc", cat: "Sweet Craving", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Puran_Poli_1.jpg/640px-Puran_Poli_1.jpg" },
  { id: "pp2", em: "🧈", nm: "Amul Pure Cow Ghee Jar", wt: "200 ml", pr: 145, was: 160, cals: "~112 kcal/tbsp", cat: "Dairy,Bread & Eggs", img: "https://images.bigbasket.com/media/uploads/p/l/274120_14-amul-pure-ghee.jpg" },
  { id: "pp3", em: "🥣", nm: "Maharashtrian Katachi Amti Spice Mix", wt: "100 g", pr: 45, was: 55, cals: "~35 kcal/serv", cat: "Groceries & Staples", img: "https://images.bigbasket.com/media/uploads/p/l/40000289_5-tata-sampann-unpolished-toor-dal.jpg" },
  { id: "pp4", em: "🟡", nm: "Fortune Unpolished Chana Dal", wt: "500 g", pr: 65, was: 75, cals: "~160 kcal/100g", cat: "Atta, Rice & Dals", img: "https://images.bigbasket.com/media/uploads/p/l/40000293_5-tata-sampann-chana-dal.jpg" },
  { id: "pp5", em: "🍯", nm: "Organic Pure Solid Jaggery / Gud", wt: "500 g", pr: 50, was: 60, cals: "~95 kcal/25g", cat: "Atta, Rice & Dals", img: "https://images.bigbasket.com/media/uploads/p/l/40000289_5-tata-sampann-unpolished-toor-dal.jpg" },
  { id: "pp6", em: "🥛", nm: "Amul Taaza T-Special Fresh Milk", wt: "500 ml", pr: 28, was: 30, cals: "~62 kcal/100ml", cat: "Dairy,Bread & Eggs", img: "https://images.bigbasket.com/media/uploads/p/l/40000774_2-amul-taaza-toned-milk.jpg" },
  { id: "pp7", em: "🥛", nm: "MTR Saffron Badam Drink Mix", wt: "200 g", pr: 110, was: 125, cals: "~90 kcal/glass", cat: "Dairy,Bread & Eggs", img: "https://images.bigbasket.com/media/uploads/p/l/40000773_2-amul-gold-full-cream-milk.jpg" },
  { id: "pp8", em: "🫘", nm: "Everest Jaiphal Elaichi Powder", wt: "50 g", pr: 85, was: 95, cals: "~15 kcal", cat: "Masala & Dry Fruits", img: "https://images.bigbasket.com/media/uploads/p/l/240066_12-everest-shahi-biryani-masala.jpg" }
];

const misalPavPairingIngredients = [
  { id: "mp1", em: "🫓", nm: "Fresh Soft Ladi Pav Buns", wt: "Pack of 6", pr: 25, was: 30, cals: "~140 kcal / 2 pcs", cat: "Dairy,Bread & Eggs", img: "https://images.bigbasket.com/media/uploads/p/l/40069497-2-britannia-100-whole-wheat-bread.jpg" },
  { id: "mp2", em: "🥣", nm: "Puneri Spicy Misal Farsan Mix", wt: "200 g", pr: 55, was: 65, cals: "~150 kcal / 50g", cat: "Munchies", img: "https://images.bigbasket.com/media/uploads/p/l/40000297_4-tata-sampann-moong-dal.jpg" },
  { id: "mp3", em: "🫘", nm: "Fresh Sprouted Matki (Moth Beans)", wt: "250 g", pr: 40, was: 48, cals: "~105 kcal / 100g", cat: "Fruits & vegetables", img: "https://images.bigbasket.com/media/uploads/p/l/40000297_4-tata-sampann-moong-dal.jpg" },
  { id: "mp4", em: "🧅", nm: "Fresho Fresh Red Onions", wt: "500 g", pr: 18, was: 25, cals: "~40 kcal / 100g", cat: "Fruits & vegetables", img: "https://upload.wikimedia.org/wikipedia/commons/8/80/Onions_together.jpg" },
  { id: "mp5", em: "🍋", nm: "Fresh Lemons & Green Coriander", wt: "Combo Pack", pr: 20, was: 25, cals: "~10 kcal", cat: "Fruits & vegetables", img: "https://images.bigbasket.com/media/uploads/p/l/10000098_17-fresho-coriander-leaves.jpg" },
  { id: "mp6", em: "🧈", nm: "Amul Butter Pasteurised", wt: "100 g", pr: 55, was: 62, cals: "~102 kcal / tbsp", cat: "Dairy,Bread & Eggs", img: "https://images.bigbasket.com/media/uploads/p/l/40000755-1-amul-butter.jpg" }
];

const biryaniPrepIngredients = [
  { id: "bp1", em: "🍚", nm: "India Gate Royal Basmati Rice", wt: "1 kg", pr: 149, was: 180, cals: "~350 kcal/100g", cat: "Atta, Rice & Dals", img: "https://images.bigbasket.com/media/uploads/p/l/40000244_6-india-gate-basmati-rice-feast-rozzana.jpg" },
  { id: "bp2", em: "🧂", nm: "Everest Shahi Biryani Masala", wt: "50 g", pr: 45, was: 55, cals: "~15 kcal/tbsp", cat: "Masala & Dry Fruits", img: "https://images.bigbasket.com/media/uploads/p/l/240066_12-everest-shahi-biryani-masala.jpg" },
  { id: "bp3", em: "🧈", nm: "Amul Pure Cow Ghee Jar", wt: "200 ml", pr: 145, was: 160, cals: "~112 kcal/tbsp", cat: "Dairy,Bread & Eggs", img: "https://images.bigbasket.com/media/uploads/p/l/274120_14-amul-pure-ghee.jpg" },
  { id: "bp4", em: "🥛", nm: "Mother Dairy Fresh Thick Curd", wt: "400 g", pr: 52, was: 65, cals: "~60 kcal/100g", cat: "Dairy,Bread & Eggs", img: "https://images.bigbasket.com/media/uploads/p/l/40003613_1-mother-dairy-curd.jpg" },
  { id: "bp5", em: "🧅", nm: "Fresho Fresh Red Onions", wt: "1 kg", pr: 32, was: 45, cals: "~40 kcal/100g", cat: "Fruits & vegetables", img: "https://upload.wikimedia.org/wikipedia/commons/8/80/Onions_together.jpg" },
  { id: "bp6", em: "🧄", nm: "Dabur Homemade Ginger Garlic Paste", wt: "200 g", pr: 55, was: 65, cals: "~25 kcal/tbsp", cat: "Groceries & Staples", img: "https://images.bigbasket.com/media/uploads/p/l/268940_4-dabur-hommade-ginger-garlic-paste.jpg" },
  { id: "bp7", em: "🍗", nm: "Fresh Chicken Curry Cut", wt: "500 g", pr: 199, was: 240, cals: "~165 kcal/100g", cat: "Meat, Fish & Eggs", img: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Raw_chicken_meat.jpg" },
  { id: "bp8", em: "🧀", nm: "Fresh Malai Paneer Cubes", wt: "200 g", pr: 98, was: 120, cals: "~265 kcal/100g", cat: "Dairy,Bread & Eggs", img: "https://images.bigbasket.com/media/uploads/p/l/40012869_1-amul-fresh-paneer.jpg" },
  { id: "bp9", em: "🌿", nm: "Fresh Mint & Coriander Combo", wt: "100 g", pr: 20, was: 25, cals: "~10 kcal", cat: "Fruits & vegetables", img: "https://images.bigbasket.com/media/uploads/p/l/10000098_17-fresho-coriander-leaves.jpg" }
];

const sandwichRecipes = [
  {
    id: "rec1",
    title: "Bombay Veg Masala Grilled Sandwich",
    em: "🥪",
    time: "8 mins ⚡",
    cals: "~340 kcal",
    desc: "Layered with butter, mint chutney, potatoes, tomatoes, cucumbers & melted cheese.",
    price: "₹282",
    items: ["sw1", "sw2", "sw3", "sw4", "sw5", "sw9"],
    ingredientsDetail: [
      { name: "Whole Wheat Bread (2 slices)", cal: "140 kcal" },
      { name: "Amul Butter (1 tbsp)", cal: "102 kcal" },
      { name: "Cheese Slice (1 pc)", cal: "65 kcal" },
      { name: "Tomato & Cucumber slices", cal: "18 kcal" },
      { name: "Mint Chutney (1 tbsp)", cal: "15 kcal" }
    ],
    steps: [
      "Butter both sides of whole wheat bread slices.",
      "Spread fresh mint chutney evenly on one side.",
      "Layer thin slices of tomato and cucumber.",
      "Place an Amul Cheese slice on top and press gently.",
      "Grill or toast on tawa for 3-4 mins until golden & crispy!"
    ]
  },
  {
    id: "rec2",
    title: "Classic Garlic Butter & Cheese Toast",
    em: "🧀",
    time: "5 mins ⚡",
    cals: "~280 kcal",
    desc: "Crispy toasted bread loaded with melted Amul cheese and aromatic garlic butter.",
    price: "₹225",
    items: ["sw1", "sw2", "sw3"],
    ingredientsDetail: [
      { name: "Whole Wheat Bread (2 slices)", cal: "140 kcal" },
      { name: "Amul Butter (1 tbsp)", cal: "102 kcal" },
      { name: "Cheese Slice (1 pc)", cal: "65 kcal" }
    ],
    steps: [
      "Mix softened Amul butter with minced garlic and herbs.",
      "Spread garlic butter generously on bread slices.",
      "Top with Amul Cheese slice.",
      "Toast on pan until cheese melts into gooey perfection!"
    ]
  },
  {
    id: "rec3",
    title: "Paneer Tikka Club Sandwich",
    em: "🥪",
    time: "10 mins ⚡",
    cals: "~410 kcal",
    desc: "High protein club sandwich packed with spiced paneer, veggies & creamy mayo.",
    price: "₹270",
    items: ["sw1", "sw6", "sw7", "sw4", "sw5"],
    ingredientsDetail: [
      { name: "Whole Wheat Bread (3 slices)", cal: "210 kcal" },
      { name: "Fresh Paneer (50g)", cal: "132 kcal" },
      { name: "Veg Mayonnaise (1 tbsp)", cal: "50 kcal" },
      { name: "Tomato & Cucumber", cal: "18 kcal" }
    ],
    steps: [
      "Saute paneer cubes with tikka masala for 2 mins.",
      "Spread mayonnaise on bread slices.",
      "Assemble 3-layer club sandwich with paneer and crunchy veggies.",
      "Slice diagonally and serve fresh!"
    ]
  },
  {
    id: "rec4",
    title: "Egg & Black Pepper Mayo Sandwich",
    em: "🥚",
    time: "7 mins ⚡",
    cals: "~330 kcal",
    desc: "Protein-rich boiled egg salad sandwich with creamy mayonnaise and cracked pepper.",
    price: "₹206",
    items: ["sw1", "sw6", "sw8"],
    ingredientsDetail: [
      { name: "Whole Wheat Bread (2 slices)", cal: "140 kcal" },
      { name: "Boiled Eggs (2 pcs)", cal: "156 kcal" },
      { name: "Veg Mayonnaise (1 tbsp)", cal: "50 kcal" }
    ],
    steps: [
      "Mash 2 boiled eggs with 1 tbsp Veg Mayonnaise and black pepper.",
      "Spread filling evenly between 2 toasted bread slices.",
      "Enjoy a protein-packed quick meal in 7 mins!"
    ]
  }
];

function getAllMasterRecipes() {
  return [
    ...sandwichRecipes,
    {
      id: "rec_biryani",
      title: "Royal Chicken / Paneer Dum Biryani",
      em: "🍲",
      time: "25 mins ⚡",
      cals: "~520 kcal",
      desc: "Fragrant Basmati rice cooked with caramelized onions, saffron milk & rich spices.",
      price: "₹487",
      items: ["bp1", "bp2", "bp3", "bp4", "bp5", "bp6"],
      ingredientsDetail: [
        { name: "Basmati Rice (100g)", cal: "350 kcal" },
        { name: "Pure Cow Ghee (1 tbsp)", cal: "112 kcal" },
        { name: "Thick Curd (2 tbsp)", cal: "30 kcal" },
        { name: "Biryani Masala & Spices", cal: "28 kcal" }
      ],
      steps: [
        "Marinate chicken/paneer in curd, ginger-garlic paste & biryani masala for 15 mins.",
        "Parboil Basmati rice with whole spices (bay leaf, cloves, cardamom).",
        "Layer marinated gravy and half-cooked rice in a heavy pot.",
        "Drizzle cow ghee & saffron milk, seal lid and cook on low flame (dum) for 12 mins!"
      ]
    },
    {
      id: "rec_misal",
      title: "Puneri Spicy Misal Pav Feast",
      em: "🥣",
      time: "15 mins ⚡",
      cals: "~440 kcal",
      desc: "Spicy moth bean curry topped with crunchy farsan, chopped onions, lemon & butter pav.",
      price: "₹216",
      items: ["mp1", "mp2", "mp3", "mp4", "mp5", "mp6"],
      ingredientsDetail: [
        { name: "Ladi Pav (2 pcs)", cal: "140 kcal" },
        { name: "Misal Farsan (50g)", cal: "150 kcal" },
        { name: "Sprouted Matki (100g)", cal: "105 kcal" },
        { name: "Amul Butter (1 tbsp)", cal: "45 kcal" }
      ],
      steps: [
        "Cook sprouted matki with onions, tomatoes & misal masala to make spicy tarri (rassa).",
        "Toast soft ladi pav buns with generous Amul butter on tawa.",
        "In a bowl, layer cooked matki, pour hot spicy rassa, top with farsan & coriander.",
        "Serve hot with lemon wedges and toasted butter pav!"
      ]
    },
    {
      id: "rec_puranpoli",
      title: "Traditional Maharashtrian Puran Poli & Katachi Amti",
      em: "🫓",
      time: "20 mins ⚡",
      cals: "~490 kcal",
      desc: "Sweet chana dal & jaggery stuffed flatbread served with pure cow ghee & spicy katachi amti.",
      price: "₹370",
      items: ["pp1", "pp2", "pp3", "pp4", "pp5", "pp6"],
      ingredientsDetail: [
        { name: "Puran Poli (1 pc)", cal: "280 kcal" },
        { name: "Pure Cow Ghee (1 tbsp)", cal: "112 kcal" },
        { name: "Katachi Amti (1 bowl)", cal: "98 kcal" }
      ],
      steps: [
        "Warm fresh wheat puran poli on tawa.",
        "Generously smear pure warm cow ghee over the puran poli.",
        "Simmer chana dal broth with Katachi Amti spice mix, mustard seeds & curry leaves.",
        "Enjoy authentic festive Maharashtrian puran poli with warm ghee & milk!"
      ]
    }
  ];
}
