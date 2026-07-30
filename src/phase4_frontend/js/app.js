/* Ask Zepto AI — Core Application Logic & UI Manager */

/* -------- MD5 JavaScript implementation -------- */
      function md5(string) {
        function RotateLeft(lValue, iShiftBits) {
          return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
        }
        function AddUnsigned(lX, lY) {
          var lX4, lY4, lX8, lY8, lResult;
          lX8 = (lX & 0x80000000);
          lY8 = (lY & 0x80000000);
          lX4 = (lX & 0x40000000);
          lY4 = (lY & 0x40000000);
          lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
          if (lX4 & lY4) {
            return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
          }
          if (lX4 | lY4) {
            if (lResult & 0x40000000) {
              return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
            } else {
              return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
            }
          } else {
            return (lResult ^ lX8 ^ lY8);
          }
        }
        function F(x, y, z) { return (x & y) | ((~x) & z); }
        function G(x, y, z) { return (x & z) | (y & (~z)); }
        function H(x, y, z) { return (x ^ y ^ z); }
        function I(x, y, z) { return (y ^ (x | (~z))); }
        function FF(a, b, c, d, x, s, ac) {
          a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
          return AddUnsigned(RotateLeft(a, s), b);
        }
        function GG(a, b, c, d, x, s, ac) {
          a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
          return AddUnsigned(RotateLeft(a, s), b);
        }
        function HH(a, b, c, d, x, s, ac) {
          a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
          return AddUnsigned(RotateLeft(a, s), b);
        }
        function II(a, b, c, d, x, s, ac) {
          a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
          return AddUnsigned(RotateLeft(a, s), b);
        }
        function ConvertToWordArray(string) {
          var lWordCount;
          var lMessageLength = string.length;
          var lNumberOfWords_temp1 = lMessageLength + 8;
          var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
          var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
          var lWordArray = Array(lNumberOfWords - 1);
          var lBytePosition = 0;
          var lByteCount = 0;
          while (lByteCount < lMessageLength) {
            lWordCount = (lByteCount - (lByteCount % 4)) / 4;
            lBytePosition = (lByteCount % 4) * 8;
            lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
            lByteCount++;
          }
          lWordCount = (lByteCount - (lByteCount % 4)) / 4;
          lBytePosition = (lByteCount % 4) * 8;
          lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
          lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
          lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
          return lWordArray;
        }
        function WordToHex(lValue) {
          var WordToHexValue = "", WordToHexValue_temp = "", lByte, lCount;
          for (lCount = 0; lCount <= 3; lCount++) {
            lByte = (lValue >>> (lCount * 8)) & 255;
            WordToHexValue_temp = "0" + lByte.toString(16);
            WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
          }
          return WordToHexValue;
        }
        function Utf8Encode(string) {
          string = string.replace(/\r\n/g, "\n");
          var utftext = "";
          for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);
            if (c < 128) {
              utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
              utftext += String.fromCharCode((c >> 6) | 192);
              utftext += String.fromCharCode((c & 63) | 128);
            } else {
              utftext += String.fromCharCode((c >> 12) | 224);
              utftext += String.fromCharCode(((c >> 6) & 63) | 128);
              utftext += String.fromCharCode((c & 63) | 128);
            }
          }
          return utftext;
        }
        var x = Array();
        var k, AA, BB, CC, DD, a, b, c, d;
        var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
        var S21 = 5, S22 = 9, S23 = 14, S24 = 20;
        var S31 = 4, S32 = 11, S33 = 16, S34 = 23;
        var S41 = 6, S42 = 10, S43 = 15, S44 = 21;
        string = Utf8Encode(string);
        x = ConvertToWordArray(string);
        a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
        for (k = 0; k < x.length; k += 16) {
          AA = a; BB = b; CC = c; DD = d;
          a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478); d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756); c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB); b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
          a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF); d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A); c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613); b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
          a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8); d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF); c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1); b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
          a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122); d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193); c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E); b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
          a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562); d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340); c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51); b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
          a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D); d = GG(d, a, b, c, x[k + 10], S22, 0x2441453); c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681); b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
          a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6); d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6); c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87); b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
          a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905); d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8); c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9); b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
          a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942); d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681); c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122); b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
          a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44); d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9); c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60); b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
          a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6); d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA); c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085); b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
          a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039); d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5); c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8); b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
          a = II(a, b, c, d, x[k + 0], S41, 0xF4292244); d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97); c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7); b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
          a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3); d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92); c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D); b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
          a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F); d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0); c = II(c, d, a, b, x[k + 6], S43, 0xA3014314); b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
          a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82); d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235); c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB); b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
          a = AddUnsigned(a, AA); b = AddUnsigned(b, BB); c = AddUnsigned(c, CC); d = AddUnsigned(d, DD);
        }
        var temp = WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d);
        return temp.toLowerCase();
      }

      /* -------- Real-Time Context Engine -------- */
      function getCurrentContext() {
        const now = new Date();
        const hours = now.getHours();
        const day = now.getDay();
        const isWeekend = (day === 0 || day === 6);

        let timeOfDay = "Evening";
        let timeEmoji = "🌆";
        let eyebrowTitle = "🌆 Evening & Dinner Picks";
        let defaultNudge = "Curated for evening orders — dinner in 8 mins & monsoon evening snacks";

        if (hours >= 5 && hours < 11) {
          timeOfDay = "Morning";
          timeEmoji = "🌅";
          eyebrowTitle = "🌅 Morning & Breakfast Picks";
          defaultNudge = "Fresh milk, eggs, muesli & breakfast essentials delivered in 8 mins";
        } else if (hours >= 11 && hours < 17) {
          timeOfDay = "Afternoon";
          timeEmoji = "☀️";
          eyebrowTitle = "☀️ Afternoon Lunch & Refreshments";
          defaultNudge = "Cold beverages, cafe bites & light snacks for your afternoon break";
        } else if (hours >= 17 && hours < 21) {
          timeOfDay = "Evening";
          timeEmoji = "🌆";
          eyebrowTitle = "🌆 Evening & Dinner Fixes";
          defaultNudge = "Monsoon tea-time snacks, pakodas & 10-minute dinner kits";
        } else {
          timeOfDay = "Late Night";
          timeEmoji = "🌙";
          eyebrowTitle = "🌙 Late Night Cravings & Quick Meals";
          defaultNudge = "Curated for 9 PM+ orders — quick 8-minute dinner & night snacks";
        }

        const formattedTime = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        const dayLabel = isWeekend ? "Weekend" : "Weekday";

        return {
          timeOfDay,
          season: "Monsoon",
          dayOfWeek: dayLabel,
          timeEmoji,
          formattedTime,
          eyebrowTitle: `${eyebrowTitle} (${formattedTime})`,
          defaultNudge,
          label: `🌧️ Monsoon ${timeOfDay} (${formattedTime}) · ${dayLabel}`
        };
      }

      /* -------- User Preference Engine -------- */
      let userPreferences = {
        noPet: false,
        dismissedCategories: [],
        dismissedProducts: []
      };

      function loadUserPreferences() {
        try {
          const stored = localStorage.getItem(`zepto_user_prefs_${userId}`);
          if (stored) {
            userPreferences = JSON.parse(stored);
            if (!userPreferences.dismissedCategories) userPreferences.dismissedCategories = [];
            if (!userPreferences.dismissedProducts) userPreferences.dismissedProducts = [];
          } else {
            userPreferences = { noPet: false, dismissedCategories: [], dismissedProducts: [] };
          }
        } catch (e) {
          userPreferences = { noPet: false, dismissedCategories: [], dismissedProducts: [] };
        }
      }

      function saveUserPreferences() {
        try {
          localStorage.setItem(`zepto_user_prefs_${userId}`, JSON.stringify(userPreferences));
        } catch (e) { }
      }

      /* -------- Data: cross-category recommendations tied to routine anchors -------- */
      const decks = [
        {
          id: "deck-rainy-cravings",
          contextTag: "🌧️ Monsoon Evening Cravings",
          title: "Monsoon evening cravings near you — hot pakodas, spicy noodles & chai",
          nudge: "Top tea-time & rainy evening picks ordered near you right now",
          anchor: "🌧️ Rainy Day Cravings",
          proof: "3,100+ people near Koregaon Park ordered monsoon evening snacks today.",
          freeSample: {
            cat: "Gourmet",
            text: "Get a free sample with your first Gourmet order",
            product: { em: "🍳", nm: "Chilli Garlic Dip 30g (Free Sample)", wt: "30 g", pr: "₹0", was: "₹25", cat: "Gourmet" }
          },
          why: [
            { ic: "🌧️", t: "Rainy Day Special" },
            { ic: "⏱️", t: "8-min delivery" },
            { ic: "🔥", t: "Hot & Crispy" }
          ],
          products: [
            { em: "🍳", nm: "Chilli Garlic Sauce", wt: "200 g", pr: "₹89", was: "₹120", cat: "Gourmet" },
            { em: "🥚", nm: "Farm Fresh Eggs", wt: "6 pcs", pr: "₹66", was: "₹75", cat: "Dairy & Bread" },
            { em: "🧅", nm: "Fried Onion Crunch", wt: "100 g", pr: "₹110", was: "", cat: "Gourmet" }
          ]
        },
        {
          id: "deck-quick-dinner",
          contextTag: "⚡ Dinner in 8 Mins",
          title: "Dinner in 8 mins — quick 10-minute weekday meal fixes near you",
          nudge: "74% of busy weekday shoppers near you order dinner staples after 8 PM",
          anchor: "⚡ Dinner Staples",
          proof: "2,400+ homes near Koregaon Park grab fresh dinner kits & bread.",
          freeSample: {
            cat: "Zepto Cafe",
            text: "Get a free Cold Brew sample with your first Cafe order",
            product: { em: "☕", nm: "Cold Brew Mini 100ml (Free Sample)", wt: "100 ml", pr: "₹0", was: "₹45", cat: "Zepto Cafe" }
          },
          why: [
            { ic: "⚡", t: "Dinner in 8 mins" },
            { ic: "🥛", t: "Fresh Daily" },
            { ic: "⭐", t: "4.8 avg rating" }
          ],
          products: [
            { em: "🥣", nm: "Crunchy Muesli", wt: "500 g", pr: "₹189", was: "₹240", cat: "Breakfast Cereals" },
            { em: "🧀", nm: "Amul Butter 100g", wt: "1 pc", pr: "₹56", was: "₹60", cat: "Dairy & Bread" },
            { em: "🥐", nm: "Butter Croissant", wt: "1 pc", pr: "₹49", was: "₹59", cat: "Zepto Cafe" }
          ]
        },
        {
          id: "deck-pet-care",
          contextTag: "🐾 Pet Care Essentials",
          title: "48 pet parents near you stocked up on pet treats today — new for you?",
          nudge: "Tap × to signal 'I don't have a pet' to stop pet recommendations",
          anchor: "🐾 Pet Care",
          proof: "Pet owners near Koregaon Park order treats & cat food weekly.",
          freeSample: {
            cat: "Pet Care",
            text: "Get a free sample with your first Pet Care order",
            product: { em: "🦴", nm: "High-Protein Pet Treat (Free Sample)", wt: "30 g", pr: "₹0", was: "₹40", cat: "Pet Care" }
          },
          why: [
            { ic: "🦴", t: "High Protein" },
            { ic: "⏱️", t: "8-min delivery" },
            { ic: "↩️", t: "Free returns" }
          ],
          products: [
            { em: "🦴", nm: "Dog Treats — Chicken", wt: "200 g", pr: "₹199", was: "₹260", cat: "Pet Care" },
            { em: "🐱", nm: "Drools Cat Food", wt: "1.2 kg", pr: "₹449", was: "₹520", cat: "Dog & Cat Food" },
            { em: "🥣", nm: "Steel Pet Bowl", wt: "1 pc", pr: "₹129", was: "₹150", cat: "Pet Grooming" }
          ]
        },
        {
          id: "deck-home-care",
          contextTag: "🧻 Home & Personal Routine",
          title: "48% of Home Care buyers near you also try Personal Care — new for you?",
          nudge: "48% of your neighbours who buy Home Care also use Personal Care",
          anchor: "🧻 Home Care",
          proof: "People who buy home care try personal care within 2 weeks, on average.",
          freeSample: {
            cat: "Personal Care",
            text: "Get a free Neem Face Wash sample with your first Personal Care order",
            product: { em: "🧴", nm: "Neem Face Wash (Free Sample)", wt: "20 ml", pr: "₹0", was: "₹35", cat: "Personal Care" }
          },
          why: [
            { ic: "🏷️", t: "30% off first try" },
            { ic: "🧪", t: "Dermat tested" },
            { ic: "↩️", t: "Free returns" }
          ],
          products: [
            { em: "🧴", nm: "Face Wash — Neem", wt: "150 ml", pr: "₹149", was: "₹210", cat: "Personal Care" },
            { em: "🪥", nm: "Charcoal Toothpaste", wt: "120 g", pr: "₹99", was: "₹140", cat: "Personal Care" },
            { em: "🧼", nm: "Body Wash — Citrus", wt: "250 ml", pr: "₹179", was: "₹240", cat: "Personal Care" }
          ]
        }
      ];

      function getActiveDecks() {
        return decks.filter(d => {
          if (userPreferences.noPet && (d.anchor.toLowerCase().includes("pet") || d.id.includes("pet"))) {
            return false;
          }
          const anchorClean = d.anchor.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "").trim();
          if (userPreferences.dismissedCategories.includes(anchorClean)) {
            return false;
          }
          return true;
        });
      }

      /* Category to Starter Product Mappings for Live AI Recommendations (Official Zepto Catalog) */
      const categoryProductsCatalog = {
        "Fruits & vegetables": [
          { em: "🍎", nm: "Royal Gala Apples", wt: "4 pcs", pr: 149, was: 180, img: "https://upload.wikimedia.org/wikipedia/commons/1/15/Red_Apple.jpg" },
          { em: "🥭", nm: "Fresh Alphonso Mangoes", wt: "1 kg", pr: 399, was: 499, img: "https://upload.wikimedia.org/wikipedia/commons/8/83/Jackfruit_or_Papaya_fruits_for_sale.jpg" },
          { em: "🍅", nm: "Farm Fresh Hybrid Tomatoes", wt: "1 kg", pr: 38, was: 45, img: "https://upload.wikimedia.org/wikipedia/commons/8/88/Salad_garden_Tomato_je.jpg" },
          { em: "🍌", nm: "Organic Robusta Bananas", wt: "6 pcs", pr: 42, was: 50, img: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Banana-Showing-Spotted-Peel.jpg" },
          { em: "🥬", nm: "Fresh Palak Spinach", wt: "250 g", pr: 25, was: 30, img: "https://images.bigbasket.com/media/uploads/p/l/10000098_17-fresho-coriander-leaves.jpg" },
          { em: "🥝", nm: "Fresho Kiwi", wt: "3 pcs (300g)", pr: 99, was: 129, img: "https://media.istockphoto.com/id/1141599874/photo/kiwi-isolated.jpg?s=612x612&w=0&k=20&c=vNnXV4PFuEIBBa1obIepAerNvGWF-iNLRJ3DQXB8RcA=" },
          { em: "🍉", nm: "Red Watermelon Whole", wt: "4-5 kg", pr: 149, was: 199, img: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Watermelon_seedless_%28Citrullus_lanatus%29.jpg" },
          { em: "🧅", nm: "Fresho Fresh Red Onions", wt: "1 kg", pr: 32, was: 45, img: "https://upload.wikimedia.org/wikipedia/commons/8/80/Onions_together.jpg" },
          { em: "🥔", nm: "Fresho Fresh Potato", wt: "1 kg", pr: 29, was: 39, img: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Potato_Je.jpg" },
          { em: "🥦", nm: "Fresh Exotic Broccoli", wt: "1 pc (400g)", pr: 69, was: 99, img: "https://upload.wikimedia.org/wikipedia/commons/0/03/Fresh_broccoli_and_cross_section.jpg" },
          { em: "🫑", nm: "Fresh Green Capsicum", wt: "500 g", pr: 45, was: 60, img: "https://images.bigbasket.com/media/uploads/p/l/10000067_23-fresho-capsicum-green.jpg" }
        ],
        "Dairy,Bread & Eggs": [
          { em: "🥛", nm: "Amul Taaza Toned Milk", wt: "1 L", pr: 54, was: 56, img: "https://images.bigbasket.com/media/uploads/p/l/40000774_2-amul-taaza-toned-milk.jpg" },
          { em: "🥛", nm: "Amul Gold Full Cream Milk", wt: "1 L", pr: 66, was: 68, img: "https://images.bigbasket.com/media/uploads/p/l/40000773_2-amul-gold-full-cream-milk.jpg" },
          { em: "🥚", nm: "Farm Fresh White Eggs", wt: "6 pcs", pr: 52, was: 60, img: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Single_fresh_egg.jpg" },
          { em: "🥚", nm: "Farm Raised Brown Protein Eggs", wt: "6 pcs", pr: 72, was: 90, img: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Single_fresh_egg.jpg" },
          { em: "🧀", nm: "Amul Butter Pasteurised", wt: "100 g", pr: 56, was: 60, img: "https://images.bigbasket.com/media/uploads/p/l/40000755-1-amul-butter.jpg" },
          { em: "🍞", nm: "Britannia Whole Wheat Bread", wt: "400 g", pr: 45, was: 50, img: "https://images.bigbasket.com/media/uploads/p/l/40069497-2-britannia-100-whole-wheat-bread.jpg" },
          { em: "🧈", nm: "Fresh Malai Paneer", wt: "200 g", pr: 95, was: 110, img: "https://images.bigbasket.com/media/uploads/p/l/40012869_1-amul-fresh-paneer.jpg" },
          { em: "🍦", nm: "Epigamia Greek Yogurt Strawberry", wt: "90 g", pr: 50, was: 60, img: "https://images.bigbasket.com/media/uploads/p/l/40132748_2-epigamia-greek-yogurt.jpg" },
          { em: "🫙", nm: "Mother Dairy Fresh Curd", wt: "400 g", pr: 52, was: 65, img: "https://images.bigbasket.com/media/uploads/p/l/40003613_1-mother-dairy-curd.jpg" },
          { em: "🧀", nm: "Amul Cheese Slices Processed", wt: "200 g", pr: 125, was: 145, img: "https://images.bigbasket.com/media/uploads/p/l/40000768_2-amul-processed-cheese.jpg" },
          { em: "🥛", nm: "Amul Masti Spiced Buttermilk", wt: "200 ml", pr: 15, was: 18, img: "https://images.bigbasket.com/media/uploads/p/l/40000765_3-amul-masti-spiced-buttermilk.jpg" }
        ],
        "Atta, Rice & Dals": [
          { em: "🌾", nm: "Fortune Chakki Fresh Atta", wt: "5 kg", pr: 220, was: 250, img: "https://images.bigbasket.com/media/uploads/p/l/126906_8-aashirvaad-atta-whole-wheat.jpg" },
          { em: "🌾", nm: "Aashirvaad Shuddh Chakki Atta", wt: "5 kg", pr: 245, was: 285, img: "https://images.bigbasket.com/media/uploads/p/l/126906_8-aashirvaad-atta-whole-wheat.jpg" },
          { em: "🍚", nm: "India Gate Basmati Rice", wt: "1 kg", pr: 149, was: 180, img: "https://images.bigbasket.com/media/uploads/p/l/40000244_6-india-gate-basmati-rice-feast-rozzana.jpg" },
          { em: "🍚", nm: "Fortune Everyday Basmati Rice", wt: "5 kg", pr: 399, was: 499, img: "https://images.bigbasket.com/media/uploads/p/l/40043236_5-fortune-everyday-basmati-rice.jpg" },
          { em: "🥣", nm: "Tata Sampann Toor Dal", wt: "1 kg", pr: 165, was: 190, img: "https://images.bigbasket.com/media/uploads/p/l/40000289_5-tata-sampann-unpolished-toor-dal.jpg" },
          { em: "🫘", nm: "Organic Yellow Moong Dal", wt: "500 g", pr: 89, was: 105, img: "https://images.bigbasket.com/media/uploads/p/l/40000297_4-tata-sampann-moong-dal.jpg" },
          { em: "🪔", nm: "Fortune Sunlite Sunflower Oil", wt: "1 L", pr: 145, was: 175, img: "https://images.bigbasket.com/media/uploads/p/l/274145_14-fortune-sunlite-refined-sunflower-oil.jpg" },
          { em: "🫘", nm: "Organic Tattva Chana Dal", wt: "1 kg", pr: 135, was: 160, img: "https://images.bigbasket.com/media/uploads/p/l/40000293_5-tata-sampann-chana-dal.jpg" }
        ],
        "Munchies": [
          { em: "🍿", nm: "Lays Classic Salted Chips", wt: "115 g", pr: 50, was: 60, img: "https://images.bigbasket.com/media/uploads/p/l/294297_15-lays-potato-chips-classic-salted.jpg" },
          { em: "🌶️", nm: "Kurkure Masala Munch", wt: "90 g", pr: 20, was: 25, img: "https://images.bigbasket.com/media/uploads/p/l/102758_16-kurkure-namkeen-masala-munch.jpg" },
          { em: "🧀", nm: "Doritos Nacho Cheese Chips", wt: "100 g", pr: 50, was: 60, img: "https://images.bigbasket.com/media/uploads/p/l/40087532_6-doritos-nacho-chips-cheese.jpg" },
          { em: "🥔", nm: "Pringles Sour Cream & Onion", wt: "107 g", pr: 109, was: 125, img: "https://images.bigbasket.com/media/uploads/p/l/40149955_4-pringles-potato-chips-sour-cream-onion.jpg" },
          { em: "🥨", nm: "Bikaji Bikaneri Bhujia Sev", wt: "200 g", pr: 65, was: 75, img: "https://images.bigbasket.com/media/uploads/p/l/102758_16-kurkure-namkeen-masala-munch.jpg" },
          { em: "🍿", nm: "Too Yumm Karare Veggie Stix", wt: "75 g", pr: 35, was: 40, img: "https://images.bigbasket.com/media/uploads/p/l/294297_15-lays-potato-chips-classic-salted.jpg" },
          { em: "🥜", nm: "Haldiram's Nagpur Aloo Bhujia", wt: "150 g", pr: 45, was: 55, img: "https://images.bigbasket.com/media/uploads/p/l/102758_16-kurkure-namkeen-masala-munch.jpg" }
        ],
        "Zepto Cafe": [
          { em: "☕", nm: "Classic Cold Brew Coffee", wt: "250 ml", pr: 79, was: 99, img: "https://images.bigbasket.com/media/uploads/p/l/40194883_2-sleepy-owl-cold-brew-coffee-classic.jpg" },
          { em: "☕", nm: "Vietnamese Iced Coffee", wt: "250 ml", pr: 99, was: 120, img: "https://images.bigbasket.com/media/uploads/p/l/40194883_2-sleepy-owl-cold-brew-coffee-classic.jpg" },
          { em: "☕", nm: "Hazelnut Iced Latte", wt: "250 ml", pr: 109, was: 135, img: "https://images.bigbasket.com/media/uploads/p/l/40194883_2-sleepy-owl-cold-brew-coffee-classic.jpg" },
          { em: "☕", nm: "Hot Cappuccino", wt: "200 ml", pr: 69, was: 85, img: "https://images.bigbasket.com/media/uploads/p/l/40194883_2-sleepy-owl-cold-brew-coffee-classic.jpg" },
          { em: "🫖", nm: "Masala Cutting Chai", wt: "150 ml", pr: 39, was: 49, img: "https://images.bigbasket.com/media/uploads/p/l/40000774_2-amul-taaza-toned-milk.jpg" },
          { em: "🥐", nm: "Fresh Butter Croissant", wt: "1 pc", pr: 49, was: 59, img: "https://images.bigbasket.com/media/uploads/p/l/40212345_1-fresh-butter-croissant.jpg" },
          { em: "🥐", nm: "Chocolate Almond Croissant", wt: "1 pc", pr: 89, was: 110, img: "https://images.bigbasket.com/media/uploads/p/l/40212345_1-fresh-butter-croissant.jpg" },
          { em: "🫐", nm: "Blueberry Muffin", wt: "1 pc", pr: 65, was: 80, img: "https://images.bigbasket.com/media/uploads/p/l/40132748_2-epigamia-greek-yogurt.jpg" },
          { em: "🥪", nm: "Classic Veg Cheese Sandwich", wt: "1 pc", pr: 79, was: 99, img: "https://images.bigbasket.com/media/uploads/p/l/40069497-2-britannia-100-whole-wheat-bread.jpg" },
          { em: "🌯", nm: "Crispy Paneer Wrap", wt: "1 pc", pr: 119, was: 145, img: "https://images.bigbasket.com/media/uploads/p/l/40012869_1-amul-fresh-paneer.jpg" },
          { em: "🥟", nm: "Hot Samosa with Mint Chutney", wt: "2 pcs", pr: 45, was: 55, img: "https://images.bigbasket.com/media/uploads/p/l/40002672_3-mothers-recipe-green-chutney.jpg" },
          { em: "🍫", nm: "Belgian Chocolate Brownie", wt: "1 pc", pr: 89, was: 110, img: "https://images.bigbasket.com/media/uploads/p/l/40000768_2-amul-processed-cheese.jpg" }
        ],
        "Cold Drinks & Juices": [
          { em: "🥤", nm: "Real Fruit Power Mixed Fruit", wt: "1 L", pr: 115, was: 135, img: "https://images.bigbasket.com/media/uploads/p/l/266050_22-real-fruit-power-mixed-fruit-juice.jpg" },
          { em: "🥤", nm: "Coca-Cola Original Taste", wt: "750 ml", pr: 40, was: 45, img: "https://images.bigbasket.com/media/uploads/p/l/251014_11-coca-cola-soft-drink.jpg" },
          { em: "🥤", nm: "Thums Up Charged Soft Drink", wt: "750 ml", pr: 40, was: 45, img: "https://images.bigbasket.com/media/uploads/p/l/251014_11-coca-cola-soft-drink.jpg" },
          { em: "🍋", nm: "Sprite Lemon Flavored Drink", wt: "750 ml", pr: 40, was: 45, img: "https://images.bigbasket.com/media/uploads/p/l/251014_11-coca-cola-soft-drink.jpg" },
          { em: "🥭", nm: "Paper Boat Aamras Juice", wt: "250 ml", pr: 35, was: 40, img: "https://images.bigbasket.com/media/uploads/p/l/40032549_8-paper-boat-aamras-mango-fruit-juice.jpg" },
          { em: "🥭", nm: "Maaza Mango Fruit Drink", wt: "1.2 L", pr: 65, was: 75, img: "https://images.bigbasket.com/media/uploads/p/l/40032549_8-paper-boat-aamras-mango-fruit-juice.jpg" },
          { em: "🍊", nm: "Tropicana 100% Orange Juice", wt: "1 L", pr: 125, was: 145, img: "https://images.bigbasket.com/media/uploads/p/l/266050_22-real-fruit-power-mixed-fruit-juice.jpg" },
          { em: "⚡", nm: "Red Bull Energy Drink", wt: "250 ml", pr: 125, was: 135, img: "https://images.bigbasket.com/media/uploads/p/l/267825_11-red-bull-energy-drink.jpg" },
          { em: "⚡", nm: "Monster Energy Drink Original", wt: "350 ml", pr: 125, was: 140, img: "https://images.bigbasket.com/media/uploads/p/l/267825_11-red-bull-energy-drink.jpg" }
        ],
        "Biscuits & Cookies": [
          { em: "🍪", nm: "Sunfeast Dark Fantasy Fills", wt: "150 g", pr: 89, was: 100, img: "https://images.bigbasket.com/media/uploads/p/l/40005391_9-sunfeast-dark-fantasy-choco-fills.jpg" },
          { em: "🍪", nm: "Oreo Chocolate Sandwich Cookies", wt: "120 g", pr: 35, was: 40, img: "https://images.bigbasket.com/media/uploads/p/l/100438_18-oreo-cream-biscuit-vanilla-original.jpg" },
          { em: "🍪", nm: "Britannia Good Day Cashew", wt: "200 g", pr: 50, was: 60, img: "https://images.bigbasket.com/media/uploads/p/l/281206_14-britannia-good-day-cashew-cookies.jpg" },
          { em: "🍪", nm: "Mom's Magic Butter Cookies", wt: "200 g", pr: 45, was: 55, img: "https://images.bigbasket.com/media/uploads/p/l/40049449_6-sunfeast-moms-magic-cashew-almond.jpg" },
          { em: "🍫", nm: "Parle Hide & Seek Choco Chips", wt: "120 g", pr: 40, was: 50, img: "https://images.bigbasket.com/media/uploads/p/l/40005391_9-sunfeast-dark-fantasy-choco-fills.jpg" },
          { em: "🍫", nm: "Britannia Bourbon Chocolate Cream", wt: "150 g", pr: 35, was: 42, img: "https://images.bigbasket.com/media/uploads/p/l/40005391_9-sunfeast-dark-fantasy-choco-fills.jpg" },
          { em: "🌾", nm: "NutriChoice Digestive High Fibre", wt: "250 g", pr: 60, was: 75, img: "https://images.bigbasket.com/media/uploads/p/l/281206_14-britannia-good-day-cashew-cookies.jpg" },
          { em: "❤️", nm: "Britannia Little Hearts Sweet Biscuits", wt: "75 g", pr: 20, was: 25, img: "https://images.bigbasket.com/media/uploads/p/l/281206_14-britannia-good-day-cashew-cookies.jpg" }
        ],
        "Sweet Craving": [
          { em: "🍫", nm: "Cadbury Dairy Milk Silk", wt: "150 g", pr: 165, was: 180, img: "https://images.bigbasket.com/media/uploads/p/l/40000768_2-amul-processed-cheese.jpg" },
          { em: "⭐", nm: "Cadbury 5 Star Chocolate Bar", wt: "40 g", pr: 20, was: 22, img: "https://images.bigbasket.com/media/uploads/p/l/40000768_2-amul-processed-cheese.jpg" },
          { em: "🍫", nm: "KitKat 4 Finger Chocolate", wt: "38 g", pr: 35, was: 40, img: "https://images.bigbasket.com/media/uploads/p/l/40000768_2-amul-processed-cheese.jpg" },
          { em: "🍬", nm: "Ferrero Rocher Chocolates", wt: "4 pcs", pr: 149, was: 175, img: "https://images.bigbasket.com/media/uploads/p/l/40000768_2-amul-processed-cheese.jpg" },
          { em: "🍫", nm: "Amul 55% Dark Chocolate", wt: "150 g", pr: 110, was: 125, img: "https://images.bigbasket.com/media/uploads/p/l/40000768_2-amul-processed-cheese.jpg" },
          { em: "🥜", nm: "Amul Fruit & Nut Dark Chocolate", wt: "150 g", pr: 120, was: 135, img: "https://images.bigbasket.com/media/uploads/p/l/40000768_2-amul-processed-cheese.jpg" },
          { em: "🍦", nm: "Baskin Robbins Mississippi Mud", wt: "450 ml", pr: 279, was: 325, img: "https://images.bigbasket.com/media/uploads/p/l/40132748_2-epigamia-greek-yogurt.jpg" },
          { em: "🍦", nm: "Kwality Wall's Feast Chocolate", wt: "70 ml", pr: 40, was: 45, img: "https://images.bigbasket.com/media/uploads/p/l/40132748_2-epigamia-greek-yogurt.jpg" }
        ],
        "Breakfast & Sauce": [
          { em: "🥣", nm: "Kellogg's Crunchy Muesli", wt: "500 g", pr: 189, was: 240, img: "https://images.bigbasket.com/media/uploads/p/l/40194883_2-sleepy-owl-cold-brew-coffee-classic.jpg" },
          { em: "🌾", nm: "Saffola Masala Oats Veggie", wt: "500 g", pr: 175, was: 210, img: "https://images.bigbasket.com/media/uploads/p/l/40194883_2-sleepy-owl-cold-brew-coffee-classic.jpg" },
          { em: "🍯", nm: "Hershey's Chocolate Syrup", wt: "200 g", pr: 99, was: 120, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🥫", nm: "Kissan Fresh Tomato Ketchup", wt: "1 kg", pr: 130, was: 155, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🥜", nm: "Pintola High Protein Peanut Butter", wt: "350 g", pr: 165, was: 199, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🍫", nm: "Nutella Hazelnut Cocoa Spread", wt: "350 g", pr: 349, was: 399, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🌾", nm: "Quaker Rolled Oats", wt: "1 kg", pr: 179, was: 215, img: "https://images.bigbasket.com/media/uploads/p/l/40194883_2-sleepy-owl-cold-brew-coffee-classic.jpg" }
        ],
        "Packaged Food": [
          { em: "🍜", nm: "Maggi 2-Minute Masala Noodles", wt: "4 pack", pr: 56, was: 64, img: "https://images.bigbasket.com/media/uploads/p/l/266050_22-real-fruit-power-mixed-fruit-juice.jpg" },
          { em: "🍜", nm: "Sunfeast Yippee Masala Noodles", wt: "4 pack", pr: 52, was: 60, img: "https://images.bigbasket.com/media/uploads/p/l/266050_22-real-fruit-power-mixed-fruit-juice.jpg" },
          { em: "🍲", nm: "Nissin Cup Noodles Seafood", wt: "70 g", pr: 55, was: 65, img: "https://images.bigbasket.com/media/uploads/p/l/266050_22-real-fruit-power-mixed-fruit-juice.jpg" },
          { em: "🍝", nm: "Ching's Secret Hakka Noodles", wt: "300 g", pr: 45, was: 55, img: "https://images.bigbasket.com/media/uploads/p/l/266050_22-real-fruit-power-mixed-fruit-juice.jpg" },
          { em: "🌶️", nm: "Ching's Secret Schezwan Chutney", wt: "250 g", pr: 85, was: 99, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🍛", nm: "MTR Ready to Eat Paneer Butter Masala", wt: "300 g", pr: 125, was: 145, img: "https://images.bigbasket.com/media/uploads/p/l/40012869_1-amul-fresh-paneer.jpg" },
          { em: "🥣", nm: "Knorr Classic Tomato Soup 4x", wt: "50 g", pr: 55, was: 65, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" }
        ],
        "Meat, Fish & Eggs": [
          { em: "🍗", nm: "Fresh Chicken Breast Boneless", wt: "500 g", pr: 199, was: 240, img: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Raw_chicken_meat.jpg" },
          { em: "🍗", nm: "Fresh Chicken Drumsticks", wt: "500 g", pr: 210, was: 250, img: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Raw_chicken_meat.jpg" },
          { em: "🥩", nm: "Fresh Mutton Curry Cut", wt: "500 g", pr: 449, was: 520, img: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Raw_chicken_meat.jpg" },
          { em: "🐟", nm: "Fresh Basa Fish Fillet", wt: "500 g", pr: 299, was: 360, img: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Raw_chicken_meat.jpg" },
          { em: "🐟", nm: "Fresh Rohu Fish Curry Cut", wt: "500 g", pr: 240, was: 290, img: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Raw_chicken_meat.jpg" },
          { em: "🦐", nm: "Fresh Cleaned Prawns medium", wt: "250 g", pr: 320, was: 380, img: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Raw_chicken_meat.jpg" },
          { em: "🥚", nm: "Organic Brown Protein Eggs", wt: "6 pcs", pr: 75, was: 90, img: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Single_fresh_egg.jpg" },
          { em: "🥚", nm: "Country Farm Eggs Value Pack", wt: "10 pcs", pr: 99, was: 120, img: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Single_fresh_egg.jpg" }
        ],
        "Masala & Dry Fruits": [
          { em: "🥜", nm: "Nutraj Premium Almonds", wt: "100 g", pr: 149, was: 199, img: "https://images.bigbasket.com/media/uploads/p/l/240066_12-everest-shahi-biryani-masala.jpg" },
          { em: "🌰", nm: "Whole Premium Cashews", wt: "100 g", pr: 159, was: 210, img: "https://images.bigbasket.com/media/uploads/p/l/240066_12-everest-shahi-biryani-masala.jpg" },
          { em: "🧠", nm: "Nutraj Premium Walnut Giri", wt: "200 g", pr: 289, was: 360, img: "https://images.bigbasket.com/media/uploads/p/l/240066_12-everest-shahi-biryani-masala.jpg" },
          { em: "🧂", nm: "Everest Royal Garam Masala", wt: "100 g", pr: 85, was: 100, img: "https://images.bigbasket.com/media/uploads/p/l/240066_12-everest-shahi-biryani-masala.jpg" },
          { em: "🌶️", nm: "Catch Red Chilli Powder", wt: "100 g", pr: 45, was: 55, img: "https://images.bigbasket.com/media/uploads/p/l/240066_12-everest-shahi-biryani-masala.jpg" },
          { em: "🟡", nm: "Everest Turmeric Powder", wt: "100 g", pr: 38, was: 45, img: "https://images.bigbasket.com/media/uploads/p/l/240066_12-everest-shahi-biryani-masala.jpg" },
          { em: "🍇", nm: "Green Seedless Raisins", wt: "200 g", pr: 99, was: 130, img: "https://images.bigbasket.com/media/uploads/p/l/240066_12-everest-shahi-biryani-masala.jpg" }
        ],
        "Ice Creams & More": [
          { em: "🍦", nm: "Amul Real Vanilla Ice Cream", wt: "500 ml", pr: 120, was: 150, img: "https://images.bigbasket.com/media/uploads/p/l/40132748_2-epigamia-greek-yogurt.jpg" },
          { em: "🍨", nm: "Kwality Wall's Chocolate Fudge", wt: "700 ml", pr: 189, was: 240, img: "https://images.bigbasket.com/media/uploads/p/l/40132748_2-epigamia-greek-yogurt.jpg" },
          { em: "🍦", nm: "Havmor Butterscotch Ice Cream", wt: "500 ml", pr: 135, was: 165, img: "https://images.bigbasket.com/media/uploads/p/l/40132748_2-epigamia-greek-yogurt.jpg" },
          { em: "🍧", nm: "Amul Tricone Choco Crunch", wt: "120 ml", pr: 40, was: 50, img: "https://images.bigbasket.com/media/uploads/p/l/40132748_2-epigamia-greek-yogurt.jpg" }
        ],
        "Frozen Food": [
          { em: "🍟", nm: "McCain French Fries", wt: "420 g", pr: 110, was: 135, img: "https://images.bigbasket.com/media/uploads/p/l/40000755-1-amul-butter.jpg" },
          { em: "🥔", nm: "McCain Aloo Tikki Mazedaar", wt: "400 g", pr: 95, was: 120, img: "https://images.bigbasket.com/media/uploads/p/l/40000755-1-amul-butter.jpg" },
          { em: "🍗", nm: "Godrej Yummiez Chicken Nuggets", wt: "500 g", pr: 220, was: 270, img: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Raw_chicken_meat.jpg" },
          { em: "🥟", nm: "Prasuma Steamed Pork Momos", wt: "10 pcs", pr: 199, was: 249, img: "https://images.bigbasket.com/media/uploads/p/l/40002672_3-mothers-recipe-green-chutney.jpg" },
          { em: "🥟", nm: "Prasuma Chicken Veggie Momos", wt: "10 pcs", pr: 189, was: 230, img: "https://images.bigbasket.com/media/uploads/p/l/40002672_3-mothers-recipe-green-chutney.jpg" }
        ],
        "Tea, Coffee & More": [
          { em: "🍵", nm: "Red Label Natural Care Tea", wt: "500 g", pr: 230, was: 270, img: "https://images.bigbasket.com/media/uploads/p/l/40000774_2-amul-taaza-toned-milk.jpg" },
          { em: "☕", nm: "Nescafe Classic Instant Coffee", wt: "100 g", pr: 310, was: 360, img: "https://images.bigbasket.com/media/uploads/p/l/40194883_2-sleepy-owl-cold-brew-coffee-classic.jpg" },
          { em: "☕", nm: "Tata Coffee Grand Premium", wt: "100 g", pr: 240, was: 280, img: "https://images.bigbasket.com/media/uploads/p/l/40194883_2-sleepy-owl-cold-brew-coffee-classic.jpg" },
          { em: "🍃", nm: "Organic India Green Tea Lemon", wt: "25 bags", pr: 175, was: 210, img: "https://images.bigbasket.com/media/uploads/p/l/10000098_17-fresho-coriander-leaves.jpg" }
        ],
        "Skincare": [
          { em: "🧴", nm: "The Derma Co Sunscreen SPF50", wt: "50 g", pr: 289, was: 349, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🧼", nm: "Himalaya Neem Face Wash", wt: "150 ml", pr: 149, was: 210, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "💧", nm: "Minimalist 10% Niacinamide Serum", wt: "30 ml", pr: 499, was: 599, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "☀️", nm: "Neutrogena Ultra Sheer Dry Touch Sunblock", wt: "88 ml", pr: 599, was: 675, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "✨", nm: "Plum Green Tea Alcohol-Free Toner", wt: "200 ml", pr: 315, was: 390, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🧴", nm: "Cetaphil Gentle Skin Cleanser", wt: "125 ml", pr: 330, was: 399, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🥒", nm: "Biotique Cucumber Pore Tightening Toner", wt: "120 ml", pr: 175, was: 220, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "💧", nm: "Garnier Skin Naturals Micellar Water", wt: "125 ml", pr: 199, was: 249, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🧴", nm: "Nivea Soft Light Moisturising Cream", wt: "100 ml", pr: 180, was: 220, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" }
        ],
        "Makeup & Beauty": [
          { em: "💄", nm: "Maybelline Color Sensational Ruby", wt: "1 pc", pr: 349, was: 450, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "👁️", nm: "Lakme Absolute Eyeliner Black", wt: "1 pc", pr: 299, was: 375, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "✨", nm: "Sugar Cosmetics Compact Powder", wt: "1 pc", pr: 249, was: 320, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "💄", nm: "Maybelline Superstay Matte Ink Liquid", wt: "5 ml", pr: 599, was: 699, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🌸", nm: "Lakme Rose Powder with Sunscreen", wt: "40 g", pr: 180, was: 220, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "💄", nm: "Sugar Matte As Hell Crayon Lipstick", wt: "2.8 g", pr: 799, was: 899, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "✨", nm: "Insight Cosmetics 3-in-1 Primer", wt: "30 ml", pr: 260, was: 320, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" }
        ],
        "Bath & Body": [
          { em: "🧼", nm: "Nivea Shower Gel Care & Oil", wt: "250 ml", pr: 175, was: 220, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🧴", nm: "Dove Cream Beauty Soap 3x", wt: "3x100g", pr: 160, was: 190, img: "https://images.bigbasket.com/media/uploads/p/l/40000755-1-amul-butter.jpg" },
          { em: "🧴", nm: "Vaseline Deep Moisture Body Lotion", wt: "400 ml", pr: 299, was: 380, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🧼", nm: "Pears Soft & Fresh Bathing Soap 3x", wt: "3x125g", pr: 185, was: 210, img: "https://images.bigbasket.com/media/uploads/p/l/40000755-1-amul-butter.jpg" },
          { em: "🥑", nm: "Fiama Gel Bathing Bar Peach 3x", wt: "3x125g", pr: 199, was: 240, img: "https://images.bigbasket.com/media/uploads/p/l/40000755-1-amul-butter.jpg" },
          { em: "🧼", nm: "Dettol Original Bathing Soap 4x", wt: "4x125g", pr: 240, was: 280, img: "https://images.bigbasket.com/media/uploads/p/l/40000755-1-amul-butter.jpg" },
          { em: "🧴", nm: "Palmolive Thermal Spa Massage Body Wash", wt: "250 ml", pr: 220, was: 275, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" }
        ],
        "Haircare": [
          { em: "💇", nm: "L'Oreal Paris Argan Oil Shampoo", wt: "250 ml", pr: 220, was: 299, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "✨", nm: "Tresemme Keratin Smooth Conditioner", wt: "190 ml", pr: 199, was: 250, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🌿", nm: "Biotique Bio Bhringraj Hair Oil", wt: "200 ml", pr: 149, was: 199, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "✨", nm: "Streax Walnut Hair Serum", wt: "100 ml", pr: 225, was: 260, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🕊️", nm: "Dove Intense Repair Shampoo", wt: "340 ml", pr: 290, was: 350, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🌿", nm: "Indulekha Bhringraj Ayurvedic Hair Oil", wt: "100 ml", pr: 432, was: 499, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "✨", nm: "Matrix Opti Care Smooth Hair Serum", wt: "100 ml", pr: 495, was: 575, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" }
        ],
        "Self care Studio": [
          { em: "💅", nm: "Glow & Groom Facial Sheet Mask Set", wt: "3 pcs", pr: 249, was: 320, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "💎", nm: "Rose Quartz Facial Massage Roller", wt: "1 pc", pr: 399, was: 550, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "✨", nm: "Nail Care & Cuticle Nourishing Oil", wt: "15 ml", pr: 199, was: 275, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" }
        ],
        "Fragrance": [
          { em: "✨", nm: "Bella Vita Organic Luxury Perfume", wt: "100 ml", pr: 499, was: 699, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "💨", nm: "Fogg Scent Body Spray Deodorant", wt: "150 ml", pr: 199, was: 250, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🌸", nm: "Plum BodyMist Hawaiian Rumba", wt: "150 ml", pr: 325, was: 425, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "💼", nm: "Denver Hamilton Deodorant Spray", wt: "150 ml", pr: 210, was: 260, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "✨", nm: "Park Avenue Voyage Deo Spray", wt: "150 ml", pr: 225, was: 280, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🌿", nm: "Yardley London English Lavender Deo", wt: "150 ml", pr: 240, was: 299, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" }
        ],
        "Baby care": [
          { em: "🍼", nm: "Pampers Active Baby Diapers M", wt: "20 pcs", pr: 349, was: 420, img: "https://images.bigbasket.com/media/uploads/p/l/40000774_2-amul-taaza-toned-milk.jpg" },
          { em: "👶", nm: "Himalaya Gentle Baby Lotion", wt: "200 ml", pr: 165, was: 210, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🧻", nm: "Johnson's Baby Gentle Wipes", wt: "80 pcs", pr: 199, was: 250, img: "https://images.bigbasket.com/media/uploads/p/l/40000755-1-amul-butter.jpg" },
          { em: "🧴", nm: "Sebamed Baby Gentle Wash", wt: "200 ml", pr: 425, was: 499, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🍼", nm: "Pampers Aloe Vera Gentle Baby Wipes", wt: "72 pcs", pr: 185, was: 230, img: "https://images.bigbasket.com/media/uploads/p/l/40000755-1-amul-butter.jpg" },
          { em: "☁️", nm: "Himalaya Herbal Baby Powder", wt: "200 g", pr: 140, was: 175, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🌿", nm: "Dabur Lal Tail Ayurvedic Baby Oil", wt: "100 ml", pr: 120, was: 145, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" }
        ],
        "Pet care": [
          { em: "🦴", nm: "Pedigree Chicken Dog Treats", wt: "200 g", pr: 199, was: 260, img: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Raw_chicken_meat.jpg" },
          { em: "🐱", nm: "Drools Dry Cat Food Ocean Fish", wt: "1.2 kg", pr: 449, was: 520, img: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Raw_chicken_meat.jpg" },
          { em: "🥣", nm: "Stainless Steel Anti-Skid Pet Bowl", wt: "1 pc", pr: 129, was: 150, img: "https://images.bigbasket.com/media/uploads/p/l/40000289_5-tata-sampann-unpolished-toor-dal.jpg" },
          { em: "🐶", nm: "Whiskas Wet Cat Food Gravy Pack", wt: "4x85g", pr: 180, was: 220, img: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Raw_chicken_meat.jpg" }
        ],
        "Cleaning Essentials": [
          { em: "🧴", nm: "Lizol Floor Cleaner Citrus", wt: "500 ml", pr: 99, was: 130, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🧼", nm: "Vim Dishwash Gel Lemon", wt: "500 ml", pr: 105, was: 125, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🚽", nm: "Harpic Power Plus Toilet Cleaner", wt: "1 L", pr: 180, was: 210, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🧼", nm: "Surf Excel Easy Wash Detergent Powder", wt: "1 kg", pr: 140, was: 160, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" }
        ],
        "Home needs": [
          { em: "🧻", nm: "Kitchen Tissue Roll (2 Rolls)", wt: "2 pcs", pr: 99, was: 120, img: "https://images.bigbasket.com/media/uploads/p/l/40069497-2-britannia-100-whole-wheat-bread.jpg" },
          { em: "🧹", nm: "Microfiber Cleaning Cloth Set", wt: "3 pcs", pr: 149, was: 199, img: "https://images.bigbasket.com/media/uploads/p/l/40069497-2-britannia-100-whole-wheat-bread.jpg" },
          { em: "🍱", nm: "Heavy Duty Aluminium Foil", wt: "1 kg", pr: 189, was: 230, img: "https://images.bigbasket.com/media/uploads/p/l/40069497-2-britannia-100-whole-wheat-bread.jpg" },
          { em: "🗑️", nm: "Medium Garbage Bags (30s)", wt: "30 pcs", pr: 119, was: 150, img: "https://images.bigbasket.com/media/uploads/p/l/40069497-2-britannia-100-whole-wheat-bread.jpg" },
          { em: "💡", nm: "LED Cool Day Bulb 9W", wt: "1 pc", pr: 99, was: 140, img: "https://images.bigbasket.com/media/uploads/p/l/40069497-2-britannia-100-whole-wheat-bread.jpg" }
        ],
        "Kitchen & Dining": [
          { em: "🍽️", nm: "Airtight Stainless Steel Container 1L", wt: "1 pc", pr: 149, was: 199, img: "https://images.bigbasket.com/media/uploads/p/l/40000289_5-tata-sampann-unpolished-toor-dal.jpg" },
          { em: "🍳", nm: "Non-Stick Granite Frying Pan 24cm", wt: "1 pc", pr: 499, was: 699, img: "https://images.bigbasket.com/media/uploads/p/l/40000289_5-tata-sampann-unpolished-toor-dal.jpg" },
          { em: "☕", nm: "Ceramic Coffee Mug Set", wt: "2 pcs", pr: 299, was: 399, img: "https://images.bigbasket.com/media/uploads/p/l/40194883_2-sleepy-owl-cold-brew-coffee-classic.jpg" }
        ],
        "Pharmacy & Wellness": [
          { em: "💊", nm: "Fast&Up Vitamin C 1000mg Effervescent", wt: "20 tabs", pr: 149, was: 199, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🫀", nm: "Revital H Daily Health Supplement", wt: "30 caps", pr: 299, was: 360, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🌿", nm: "Himalaya Liv 52 Liver Care", wt: "100 tabs", pr: 165, was: 195, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" }
        ],
        "Protein & Nutrition": [
          { em: "🫈", nm: "RiteBite Max Protein Bar 20g", wt: "60 g", pr: 99, was: 125, img: "https://images.bigbasket.com/media/uploads/p/l/40000768_2-amul-processed-cheese.jpg" },
          { em: "💪", nm: "Optimum Nutrition Whey Protein", wt: "1 kg", pr: 2899, was: 3499, img: "https://images.bigbasket.com/media/uploads/p/l/40000768_2-amul-processed-cheese.jpg" },
          { em: "🥜", nm: "MuscleBlaze High Protein Peanut Butter", wt: "1 kg", pr: 499, was: 649, img: "https://images.bigbasket.com/media/uploads/p/l/40000768_2-amul-processed-cheese.jpg" }
        ],
        "Stationery& Books": [
          { em: "📚", nm: "Executive Hardbound Notebook & Pen", wt: "1 set", pr: 149, was: 199, img: "https://images.bigbasket.com/media/uploads/p/l/40069497-2-britannia-100-whole-wheat-bread.jpg" },
          { em: "🖊️", nm: "Pastel Highlighter Set", wt: "6 pack", pr: 129, was: 169, img: "https://images.bigbasket.com/media/uploads/p/l/40069497-2-britannia-100-whole-wheat-bread.jpg" },
          { em: "📝", nm: "Sticky Notes & Desk Organizer Kit", wt: "1 set", pr: 179, was: 220, img: "https://images.bigbasket.com/media/uploads/p/l/40069497-2-britannia-100-whole-wheat-bread.jpg" }
        ],
        "Toys & games": [
          { em: "🧸", nm: "Creative Building Blocks 120 Pcs", wt: "1 set", pr: 399, was: 499, img: "https://images.bigbasket.com/media/uploads/p/l/40069497-2-britannia-100-whole-wheat-bread.jpg" },
          { em: "🧩", nm: "Wooden Brain Teaser 3D Puzzle", wt: "1 pc", pr: 249, was: 320, img: "https://images.bigbasket.com/media/uploads/p/l/40069497-2-britannia-100-whole-wheat-bread.jpg" },
          { em: "🏎️", nm: "High-Speed Remote Control Car", wt: "1 pc", pr: 599, was: 799, img: "https://images.bigbasket.com/media/uploads/p/l/40069497-2-britannia-100-whole-wheat-bread.jpg" }
        ],
        "Apparel": [
          { em: "👕", nm: "Jockey Men's Round Neck T-Shirt", wt: "1 pc", pr: 499, was: 625, img: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=300&h=300&fit=crop" },
          { em: "👕", nm: "Allen Solly Men's Polo T-Shirt", wt: "1 pc", pr: 999, was: 1299, img: "https://images.unsplash.com/photo-1625910513413-7422eb7a414e?w=300&h=300&fit=crop" },
          { em: "👖", nm: "Levi's 511 Slim Fit Jeans", wt: "1 pc", pr: 2499, was: 3199, img: "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=300&h=300&fit=crop" },
          { em: "👗", nm: "H&M Floral Wrap Summer Dress", wt: "1 pc", pr: 1499, was: 1899, img: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&h=300&fit=crop" },
          { em: "👗", nm: "W Printed Cotton Ethnic Kurti", wt: "1 pc", pr: 899, was: 1199, img: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=300&h=300&fit=crop" },
          { em: "🩴", nm: "Bata AirPro Casual Slip-Ons", wt: "1 pair", pr: 799, was: 999, img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop" },
          { em: "👟", nm: "Campus Men's Running Shoes", wt: "1 pair", pr: 1199, was: 1499, img: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=300&h=300&fit=crop" },
          { em: "🩲", nm: "Jockey Men's Cotton Trunks 2-Pack", wt: "2 pcs", pr: 429, was: 499, img: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=300&h=300&fit=crop" },
          { em: "👙", nm: "Jockey Women's Sports Bra", wt: "1 pc", pr: 699, was: 875, img: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=300&h=300&fit=crop" },
          { em: "🧦", nm: "Jockey Ankle Length Socks", wt: "3 pairs", pr: 349, was: 425, img: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=300&h=300&fit=crop" },
          { em: "🕶️", nm: "Polarized UV Protection Sunglasses", wt: "1 pc", pr: 599, was: 799, img: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=300&fit=crop" },
          { em: "👜", nm: "Casual Canvas Tote Bag", wt: "1 pc", pr: 299, was: 399, img: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&h=300&fit=crop" },
          { em: "👔", nm: "Tommy Hilfiger Leather Belt Men", wt: "1 pc", pr: 899, was: 1199, img: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=300&h=300&fit=crop" }
        ],
        "Jewellery": [
          { em: "💍", nm: "Minimalist Gold-Plated Pendant Set", wt: "1 set", pr: 299, was: 399, img: "https://images.bigbasket.com/media/uploads/p/l/40000768_2-amul-processed-cheese.jpg" },
          { em: "💎", nm: "Elegant Silver Zircon Stud Earrings", wt: "1 pair", pr: 349, was: 450, img: "https://images.bigbasket.com/media/uploads/p/l/40000768_2-amul-processed-cheese.jpg" },
          { em: "📿", nm: "Boho Layered Charm Necklace", wt: "1 pc", pr: 249, was: 350, img: "https://images.bigbasket.com/media/uploads/p/l/40000768_2-amul-processed-cheese.jpg" }
        ],
        "Gourmet": [
          { em: "🍳", nm: "Chilli Garlic Artisanal Sauce", wt: "200 g", pr: 89, was: 120, img: "https://images.bigbasket.com/media/uploads/p/l/40053913_5-veeba-chef-special-eggless-mayonnaise.jpg" },
          { em: "🫒", nm: "Borges Extra Virgin Olive Oil", wt: "500 ml", pr: 649, was: 799, img: "https://images.bigbasket.com/media/uploads/p/l/274145_14-fortune-sunlite-refined-sunflower-oil.jpg" },
          { em: "🍝", nm: "Barilla Penne Rigate Italian Pasta", wt: "500 g", pr: 189, was: 230, img: "https://images.bigbasket.com/media/uploads/p/l/266050_22-real-fruit-power-mixed-fruit-juice.jpg" }
        ],
        "Gifting": [
          { em: "🎁", nm: "Cadbury Celebrations Gift Pack", wt: "286 g", pr: 220, was: 250, img: "https://images.bigbasket.com/media/uploads/p/l/40000768_2-amul-processed-cheese.jpg" },
          { em: "🕯️", nm: "Scented Soy Candle & Mug Gift Box", wt: "1 set", pr: 499, was: 650, img: "https://images.bigbasket.com/media/uploads/p/l/40194883_2-sleepy-owl-cold-brew-coffee-classic.jpg" },
          { em: "☕", nm: "Exotic Gourmet Coffee Sampler Pack", wt: "1 set", pr: 399, was: 499, img: "https://images.bigbasket.com/media/uploads/p/l/40194883_2-sleepy-owl-cold-brew-coffee-classic.jpg" }
        ],
        "Plants": [
          { em: "🌿", nm: "Indoor Money Plant in Ceramic Pot", wt: "1 pc", pr: 249, was: 320, img: "https://images.bigbasket.com/media/uploads/p/l/10000098_17-fresho-coriander-leaves.jpg" },
          { em: "🪴", nm: "Air Purifier Snake Plant Indoor", wt: "1 pc", pr: 299, was: 399, img: "https://images.bigbasket.com/media/uploads/p/l/10000098_17-fresho-coriander-leaves.jpg" },
          { em: "🌵", nm: "Succulent Desk Plant Collection", wt: "2 pcs", pr: 349, was: 450, img: "https://images.bigbasket.com/media/uploads/p/l/10000098_17-fresho-coriander-leaves.jpg" }
        ],
        "Electronics store": [
          { em: "🎧", nm: "Wireless TWS Earbuds with ENC", wt: "1 pc", pr: 899, was: 1299, img: "https://images.bigbasket.com/media/uploads/p/l/40194883_2-sleepy-owl-cold-brew-coffee-classic.jpg" },
          { em: "🔋", nm: "Fast Charging Power Bank 10000mAh", wt: "1 pc", pr: 999, was: 1499, img: "https://images.bigbasket.com/media/uploads/p/l/40194883_2-sleepy-owl-cold-brew-coffee-classic.jpg" },
          { em: "🔌", nm: "Type-C Braided Cable 1.5m", wt: "1 pc", pr: 199, was: 299, img: "https://images.bigbasket.com/media/uploads/p/l/40194883_2-sleepy-owl-cold-brew-coffee-classic.jpg" }
        ],
        "Home Decor": [
          { em: "🕯️", nm: "Scented Soy Candle in Glass Jar", wt: "1 pc", pr: 249, was: 340, img: "https://images.bigbasket.com/media/uploads/p/l/40194883_2-sleepy-owl-cold-brew-coffee-classic.jpg" },
          { em: "🏺", nm: "Ceramic Minimalist Flower Vase", wt: "1 pc", pr: 349, was: 450, img: "https://images.bigbasket.com/media/uploads/p/l/40194883_2-sleepy-owl-cold-brew-coffee-classic.jpg" },
          { em: "✨", nm: "Warm LED Fairy String Lights 10m", wt: "1 pc", pr: 199, was: 280, img: "https://images.bigbasket.com/media/uploads/p/l/40194883_2-sleepy-owl-cold-brew-coffee-classic.jpg" }
        ],
        "Paan Corner": [
          { em: "🍃", nm: "Sweet Meetha Paan (Fresh Pack)", wt: "2 pcs", pr: 49, was: 60, img: "https://images.bigbasket.com/media/uploads/p/l/10000098_17-fresho-coriander-leaves.jpg" },
          { em: "🍬", nm: "Paan Pasand Mouth Freshener Candy", wt: "100 g", pr: 35, was: 45, img: "https://images.bigbasket.com/media/uploads/p/l/40000768_2-amul-processed-cheese.jpg" },
          { em: "🫙", nm: "Shahi Gulkand Fresh Paan Jar", wt: "200 g", pr: 120, was: 150, img: "https://images.bigbasket.com/media/uploads/p/l/40000289_5-tata-sampann-unpolished-toor-dal.jpg" },
          { em: "🍫", nm: "Choco Paan Bites & Freshener", wt: "150 g", pr: 99, was: 125, img: "https://images.bigbasket.com/media/uploads/p/l/40000768_2-amul-processed-cheese.jpg" },
          { em: "🍃", nm: "Banarasi Flavored Sweet Paan", wt: "1 pc", pr: 40, was: 50, img: "https://images.bigbasket.com/media/uploads/p/l/10000098_17-fresho-coriander-leaves.jpg" },
          { em: "🥜", nm: "Silver Coated Paan Supari Drops", wt: "50 g", pr: 65, was: 80, img: "https://images.bigbasket.com/media/uploads/p/l/240066_12-everest-shahi-biryani-masala.jpg" },
          { em: "🍫", nm: "Kolkata Chocolate Sweet Paan", wt: "2 pcs", pr: 65, was: 80, img: "https://images.bigbasket.com/media/uploads/p/l/10000098_17-fresho-coriander-leaves.jpg" },
          { em: "🍃", nm: "Pass Pass Sweet Mint Mouth Freshener", wt: "100 g", pr: 40, was: 50, img: "https://images.bigbasket.com/media/uploads/p/l/40000768_2-amul-processed-cheese.jpg" },
          { em: "🫙", nm: "Chandan Royal Mukhwas Jar", wt: "150 g", pr: 110, was: 135, img: "https://images.bigbasket.com/media/uploads/p/l/40000289_5-tata-sampann-unpolished-toor-dal.jpg" },
          { em: "🥜", nm: "Rajnigandha Silver Pearls Supari", wt: "50 g", pr: 85, was: 100, img: "https://images.bigbasket.com/media/uploads/p/l/240066_12-everest-shahi-biryani-masala.jpg" }
        ]
      };

      function getProductsForCategory(cat) {
        if (!cat) return [{ ...defaultProduct("Explore"), cat: "Explore" }];
        const catLower = cat.toLowerCase().trim();

        // 1. Check ZEPTO_CATALOG for rich products with real CDN images
        if (typeof ZEPTO_CATALOG !== "undefined") {
          if (ZEPTO_CATALOG[cat] && ZEPTO_CATALOG[cat].products) {
            return ZEPTO_CATALOG[cat].products;
          }
          for (const key in ZEPTO_CATALOG) {
            const keyLower = key.toLowerCase();
            if (keyLower === catLower || keyLower.includes(catLower) || catLower.includes(keyLower)) {
              if (ZEPTO_CATALOG[key] && ZEPTO_CATALOG[key].products) {
                return ZEPTO_CATALOG[key].products;
              }
            }
          }
        }

        // 2. Fallback to categoryProductsCatalog
        if (categoryProductsCatalog[cat]) {
          return categoryProductsCatalog[cat].map(p => ({ ...p, cat }));
        }
        for (const key in categoryProductsCatalog) {
          if (key.toLowerCase() === catLower || key.toLowerCase().includes(catLower) || catLower.includes(key.toLowerCase())) {
            return categoryProductsCatalog[key].map(p => ({ ...p, cat: key }));
          }
        }
        return [{ ...defaultProduct(cat), cat }];
      }

      function defaultProduct(cat) {
        return {
          em: "🎁",
          nm: `${cat} Starter Item`,
          wt: "1 unit",
          pr: 199,
          was: 250
        };
      }

      
      let idx = 0;
      
      
      
      let liveRecos = {}; // caches live recommendations per slide index
      const cart = new Set();
      let cartItemsList = {}; // maps key to product details
      let impressionTimer = null;

      let currentLocation = {
        pincode: "411001",
        name: "Koregaon Park, Pune",
        eta: "8 mins ⚡",
        address: "Home · Koregaon Park, Pune",
        riders: 22
      };

      function getAreaName() {
        return (currentLocation && currentLocation.name) ? currentLocation.name.split(',')[0].trim() : "Koregaon Park";
      }

      function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      }

      const DARK_STORES_FRONTEND = [
        { pincode: "411001", name: "Koregaon Park, Pune", address: "Home · Koregaon Park, Pune", eta: "8 mins ⚡", riders: 22, lat: 18.5362, lon: 73.8940 },
        { pincode: "560038", name: "Indiranagar, Bengaluru", address: "Office · Indiranagar, Bengaluru", eta: "7 mins ⚡", riders: 28, lat: 12.9784, lon: 77.6408 },
        { pincode: "400050", name: "Bandra West, Mumbai", address: "Home · Bandra West, Mumbai", eta: "9 mins ⚡", riders: 31, lat: 19.0596, lon: 72.8295 },
        { pincode: "110001", name: "Connaught Place, Delhi", address: "Home · Connaught Place, Delhi", eta: "10 mins ⚡", riders: 19, lat: 28.6315, lon: 77.2167 }
      ];

      const $ = s => document.querySelector(s);

      /* Setup Viewport Impression Observer */
      let impressionObservedCategories = new Set();
      function setupViewportObserver() {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              resetViewportTimer();
            } else {
              clearTimeout(impressionTimer);
            }
          });
        }, { threshold: 0.5 });
        observer.observe($(".discover"));
      }

      function resetViewportTimer() {
        clearTimeout(impressionTimer);
        impressionTimer = setTimeout(() => {
          const currentCategory = getCurrentCategory();
          if (!impressionObservedCategories.has(currentCategory)) {
            logEvent("reco_shown", currentCategory);
            impressionObservedCategories.add(currentCategory);
          }
        }, 1000); // 1.0s visibility threshold
      }

      function getCurrentCategory() {
        const d = decks[idx];
        const live = liveRecos[idx];
        if (apiLive && live && live.recommendations && live.recommendations.length > 0) {
          return live.recommendations[0].category; // primary recommendation category
        }
        return d.anchor.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "").trim();
      }

      /* Logging Telemetry Events */
      async 

      /* Check API status and update recommendations */
      

      

      

      

      async function fetchAllLiveSlides() {
        if (!apiLive) return;
        const locParams = `&pincode=${encodeURIComponent(currentLocation.pincode)}&location=${encodeURIComponent(currentLocation.name)}`;
        const p0 = fetchSlideReco(0, `${API}/recommend?user_id=${encodeURIComponent(userId)}&active_basket=pasta${locParams}`);
        const p1 = fetchSlideReco(1, `${API}/recommend?user_id=${encodeURIComponent(userId)}&query=care${locParams}`);
        const p2 = fetchSlideReco(2, `${API}/recommend?user_id=${encodeURIComponent(userId)}&query=pet${locParams}`);
        await Promise.all([p0, p1, p2]);
        render();
      }

      async function fetchSlideReco(slideIdx, url) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            liveRecos[slideIdx] = await res.json();
          }
        } catch (e) {
          console.error(`Reco fetch error for slide ${slideIdx}:`, e);
        }
      }

      /* Rendering the Discovery card */
      function render() {
        loadUserPreferences();
        const activeDecks = getActiveDecks();
        if (activeDecks.length === 0) {
          userPreferences.dismissedCategories = [];
          userPreferences.noPet = false;
          saveUserPreferences();
        }
        if (idx >= activeDecks.length) {
          idx = 0;
        }

        const d = activeDecks[idx] || decks[0];
        const live = liveRecos[idx];

        // Update context pill
        const ctx = getCurrentContext();
        const contextPillEl = $("#context-pill");
        if (contextPillEl) {
          contextPillEl.textContent = d.contextTag || ctx.label;
        }

        let title = d.title;
        let anchor = d.anchor;
        let productsData = d.products;
        let isTreatment = (variant !== "CONTROL");

        if (apiLive && live) {
          title = live.explanation;
          if (isTreatment && live.recommendations && live.recommendations.length > 0) {
            productsData = live.recommendations.slice(0, 3).map((r) => {
              const cat = r.category;
              const template = categoryProducts[cat] || defaultProduct(cat);
              return {
                em: template.em,
                nm: template.nm,
                wt: template.wt,
                pr: `₹${template.pr}`,
                was: template.was ? `₹${template.was}` : "",
                cat: cat,
                boosted: r.friction_boosted
              };
            });
          }
        }

        // Filter out products matching userPreferences
        const filteredProducts = productsData.filter(p => {
          if (userPreferences.dismissedProducts.includes(p.nm)) return false;
          if (userPreferences.noPet && (p.cat || "").toLowerCase().includes("pet")) return false;
          return true;
        });

        $("#d-title").innerHTML = title;
        $("#d-anchor").textContent = anchor;
        const areaName = getAreaName();
        const proofTxt = (d.proof || "").replace(/Koregaon Park|Indiranagar|Bandra West|Connaught Place/gi, areaName);
        $("#proof-txt").textContent = proofTxt;

        // Update eyebrow section header with per-slide social-proof nudge
        const nudge = d.nudge || "One fresh pick a day, matched to what you already buy";
        const nudgeLocalized = nudge.replace(/Koregaon Park|Indiranagar|Bandra West|Connaught Place/gi, areaName);
        const eyebrowSubEl = $("#eyebrow-sub");
        if (eyebrowSubEl) eyebrowSubEl.textContent = nudgeLocalized;
        const eyebrowTitleEl = $("#eyebrow-title");
        if (eyebrowTitleEl) eyebrowTitleEl.textContent = ctx.eyebrowTitle;

        // Render why relevant icons
        $("#why").innerHTML = d.why.map(w => `<span class="w"><span style="font-size:15px">${w.ic}</span>${w.t}</span>`).join("");

        // Render free-sample CTA if this deck has one
        const fscEl = $("#free-sample-cta");
        if (fscEl) {
          if (d.freeSample) {
            const fs = d.freeSample;
            const sampleKey = `sample-${fs.cat}`;
            const alreadyClaimed = cart.has(sampleKey);
            fscEl.innerHTML = `
              <div class="free-sample-cta" id="fsc-btn">
                <span class="fsc-icon">🎁</span>
                <div class="fsc-body">
                  <div class="fsc-label">First-order offer</div>
                  <div class="fsc-text">${alreadyClaimed ? '✓ Sample claimed — arrives with your order' : fs.text}</div>
                </div>
                <span class="fsc-arrow">${alreadyClaimed ? '' : '→'}</span>
              </div>`;
            if (!alreadyClaimed) {
              $("#fsc-btn").onclick = () => {
                cart.add(sampleKey);
                cartItemsList[sampleKey] = fs.product;
                updateCartTotal();
                logEvent("cart_added", fs.cat);
                toast(`🎁 Free ${fs.cat} sample added — arrives with your order!`);
                render();
              };
            }
          } else {
            fscEl.innerHTML = "";
          }
        }

        // Render products with per-card dismiss button (×)
        $("#products").innerHTML = filteredProducts.map((p, i) => {
          const key = idx + "-" + i;
          const isAdded = cart.has(key);

          const qualityTag = (isTreatment && p.boosted) ? `<span style="font-size:8px;font-weight:900;color:#D97706;background:#FEF3C7;padding:2px 5px;border-radius:4px;margin-left:4px;vertical-align:middle;display:inline-block;">⭐ QUALITY↑</span>` : "";
          const catName = p.cat || anchor.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "").trim();
          const safeProdNm = p.nm.replace(/'/g, "\\'");
          const safeCatNm = catName.replace(/'/g, "\\'");

          return `
      <div class="prod" id="prod-${idx}-${i}">
        <button class="card-dismiss-btn" title="Hide this item" onclick="dismissProductCard(event, ${idx}, ${i}, '${safeProdNm}', '${safeCatNm}')">×</button>
        <div class="img">${p.em}</div>
        <div class="nm">${p.nm}${qualityTag}</div>
        <div class="wt">${p.wt} · <span style="color:var(--zepto-pink);font-weight:900">${catName}</span></div>
        <div class="row">
          <div class="pr">${p.pr}${p.was ? `<s>${p.was}</s>` : ""}</div>
          <button class="add ${isAdded ? 'in' : ''}" data-i="${i}">${isAdded ? '✓ ADDED' : 'ADD'}</button>
        </div>
      </div>`;
        }).join("");

        // Render dots
        $("#dots").innerHTML = activeDecks.map((_, i) => `<i class="${i === idx ? 'on' : ''}"></i>`).join("");

        bindAdds(filteredProducts);
      }

      function bindAdds(productsData) {
        document.querySelectorAll(".products .add").forEach(btn => {
          btn.onclick = () => {
            const i = +btn.dataset.i;
            const p = productsData[i];
            const key = idx + "-" + i;

            const cat = p.cat || getCurrentCategory();

            if (cart.has(key)) {
              cart.delete(key);
              btn.classList.remove("in");
              btn.textContent = "ADD";
              delete cartItemsList[key];
              updateCartTotal();
              return;
            }

            cart.add(key);
            btn.classList.add("in");
            btn.textContent = "✓ ADDED";
            cartItemsList[key] = p;
            updateCartTotal();

            markCategoryExplored(cat);
            logEvent("cart_added", cat);
            toast(`Added ${p.nm} — a first from ${cat} 🎉`);
          };
        });
      }

      let _prevCartSize = 0;
      function updateCartTotal() {
        if (cart.size > 0) {
          let total = 0;
          let newCats = new Set();

          for (const key in cartItemsList) {
            const p = cartItemsList[key];
            total += parseInt(String(p.pr).replace(/[^\d]/g, "")) || 0;
            newCats.add(p.cat || getCurrentCategory());
          }

          $("#cart-item-count").textContent = `${cart.size} item${cart.size > 1 ? 's' : ''} · ${newCats.size} new category`;
          $("#cart-total-price").textContent = `₹${total}`;
          $("#cart-bar").classList.add("show");

          // Only reset dismissed if cart was previously empty (brand new cart session)
          if (_prevCartSize === 0) {
            window._cartBarDismissed = false;
          }
          _prevCartSize = cart.size;
          if (typeof showMealCartSlideupBar === "function") {
            showMealCartSlideupBar(null, cart.size, total);
          }
        } else {
          $("#cart-bar").classList.remove("show");
          const slideBar = document.querySelector("#cart-added-slideup-bar");
          if (slideBar) slideBar.classList.remove("show");
          window._cartBarDismissed = false;
          _prevCartSize = 0;
        }
      }

      /* Toast notification with action support */
      let toastTimer;
      function toast(msg, actionText = null, actionCallback = null) {
        $("#toast-txt").textContent = msg;
        const viewBtn = $("#toast-view-btn");
        if (actionText && actionCallback) {
          viewBtn.textContent = actionText;
          viewBtn.style.display = "inline-block";
          viewBtn.onclick = () => {
            actionCallback();
            $("#toast").classList.remove("show");
          };
        } else {
          viewBtn.textContent = cart.size > 0 ? "VIEW" : "";
          viewBtn.style.display = cart.size > 0 ? "inline-block" : "none";
          viewBtn.onclick = () => {
            if (cart.size > 0) {
              $("#scroll").scrollTo({ top: 0, behavior: "smooth" });
              toast("Opening checkout summary...");
            }
          };
        }
        $("#toast").classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 3200);
      }

      /* Slide controls */
      function changeSlide(nextIdx, isSkip = false) {
        const activeDecks = getActiveDecks();
        if (activeDecks.length === 0) return;
        if (isSkip) {
          logEvent("reco_clicked", getCurrentCategory());
        }
        idx = nextIdx % activeDecks.length;
        render();
        resetViewportTimer();
      }

      $("#next").onclick = () => {
        const activeDecks = getActiveDecks();
        if (activeDecks.length === 0) return;
        const nextIdx = (idx + 1) % activeDecks.length;
        changeSlide(nextIdx, true);
        $("#scroll").scrollTo({ top: $(".discover").offsetTop - 120, behavior: "smooth" });
      };

      $("#skip").onclick = () => {
        const activeDecks = getActiveDecks();
        if (activeDecks.length === 0) return;
        const nextIdx = (idx + 1) % activeDecks.length;
        changeSlide(nextIdx, true);
        toast("Got it — we'll show you a different pick");
      };

      /* -------- Dismiss Feedback Modal & Preferences Handlers -------- */
      function openDismissModal() {
        const activeDecks = getActiveDecks();
        const d = activeDecks[idx] || decks[0];
        const anchorClean = d.anchor.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "").trim();

        const subEl = $("#dismiss-modal-subtitle");
        if (subEl) {
          subEl.textContent = `Dismissing '${anchorClean}' shelf. Tell us why so we can improve recommendations:`;
        }

        $("#dismiss-modal").classList.add("show");
      }

      function closeDismissModal() {
        $("#dismiss-modal").classList.remove("show");
      }

      function handleDismissNoPet() {
        closeDismissModal();
        userPreferences.noPet = true;
        if (!userPreferences.dismissedCategories.includes("Pet Care")) userPreferences.dismissedCategories.push("Pet Care");
        if (!userPreferences.dismissedCategories.includes("Dog & Cat Food")) userPreferences.dismissedCategories.push("Dog & Cat Food");
        if (!userPreferences.dismissedCategories.includes("Pet Grooming")) userPreferences.dismissedCategories.push("Pet Grooming");
        saveUserPreferences();

        logEvent("reco_dismissed", "Pet Care");

        const dcardEl = $("#dcard");
        if (dcardEl) dcardEl.classList.add("dismissing");

        setTimeout(() => {
          if (dcardEl) dcardEl.classList.remove("dismissing");
          idx = 0;
          render();
          renderNewCatsEntry();
          renderTrendingAreaSection();
          toast("Got it! We won't show Pet recommendations again.", "UNDO", undoDismissNoPet);
        }, 280);
      }

      function undoDismissNoPet() {
        userPreferences.noPet = false;
        userPreferences.dismissedCategories = userPreferences.dismissedCategories.filter(c => !c.toLowerCase().includes("pet"));
        saveUserPreferences();
        render();
        renderNewCatsEntry();
        renderTrendingAreaSection();
        toast("Restored Pet Care recommendations!");
      }

      function handleDismissCategory(reason) {
        closeDismissModal();
        const activeDecks = getActiveDecks();
        const d = activeDecks[idx] || decks[0];
        const anchorClean = d.anchor.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "").trim();

        if (!userPreferences.dismissedCategories.includes(anchorClean)) {
          userPreferences.dismissedCategories.push(anchorClean);
        }
        saveUserPreferences();

        logEvent("reco_dismissed", anchorClean);

        const dcardEl = $("#dcard");
        if (dcardEl) dcardEl.classList.add("dismissing");

        setTimeout(() => {
          if (dcardEl) dcardEl.classList.remove("dismissing");
          idx = 0;
          render();
          renderNewCatsEntry();
          toast(`Hidden '${anchorClean}' shelf`, "UNDO", () => {
            userPreferences.dismissedCategories = userPreferences.dismissedCategories.filter(c => c !== anchorClean);
            saveUserPreferences();
            render();
            toast(`Restored '${anchorClean}' shelf`);
          });
        }, 280);
      }

      window.dismissProductCard = function (event, deckIdx, prodIdx, prodName, catName) {
        event.stopPropagation();

        if (catName.toLowerCase().includes("pet") || prodName.toLowerCase().includes("dog") || prodName.toLowerCase().includes("cat")) {
          handleDismissNoPet();
          return;
        }

        if (!userPreferences.dismissedProducts.includes(prodName)) {
          userPreferences.dismissedProducts.push(prodName);
        }
        saveUserPreferences();

        logEvent("card_dismissed", catName);

        const prodEl = document.getElementById(`prod-${deckIdx}-${prodIdx}`);
        if (prodEl) prodEl.classList.add("dismissing");

        setTimeout(() => {
          render();
          toast(`Hidden '${prodName}'`, "UNDO", () => {
            userPreferences.dismissedProducts = userPreferences.dismissedProducts.filter(p => p !== prodName);
            saveUserPreferences();
            render();
            toast(`Restored '${prodName}'`);
          });
        }, 250);
      };

      // Bind dismiss modal button events
      const shelfDismissBtn = $("#shelf-dismiss-btn");
      if (shelfDismissBtn) shelfDismissBtn.onclick = openDismissModal;

      const optNoPetBtn = $("#opt-no-pet");
      if (optNoPetBtn) optNoPetBtn.onclick = handleDismissNoPet;

      const optNotInterestedBtn = $("#opt-not-interested");
      if (optNotInterestedBtn) optNotInterestedBtn.onclick = () => handleDismissCategory('not_interested');

      const optAlreadyBoughtBtn = $("#opt-already-bought");
      if (optAlreadyBoughtBtn) optAlreadyBoughtBtn.onclick = () => handleDismissCategory('already_bought');

      const modalCancelBtn = $("#dismiss-modal-cancel");
      if (modalCancelBtn) modalCancelBtn.onclick = closeDismissModal;

      const dismissModalOverlay = $("#dismiss-modal");
      if (dismissModalOverlay) {
        dismissModalOverlay.onclick = (e) => {
          if (e.target === dismissModalOverlay) closeDismissModal();
        };
      }

      /* User Input Field Handler */
      const userIdInputEl = $("#user-id-input");
      if (userIdInputEl) {
        userIdInputEl.onchange = (e) => {
          userId = e.target.value.trim() || "user_Nayan";
          impressionObservedCategories.clear();
          checkApiHealth();
        };
        userIdInputEl.onkeydown = (e) => {
          if (e.key === "Enter") {
            userIdInputEl.blur();
          }
        };
      }

      /* Checkout Action */
      $("#checkout-btn").onclick = () => {
        const processedCats = new Set();
        for (const key in cartItemsList) {
          const p = cartItemsList[key];
          processedCats.add(p.cat || getCurrentCategory());
        }
        processedCats.forEach(cat => {
          logEvent("purchase_completed", cat);
        });

        cart.clear();
        cartItemsList = {};
        updateCartTotal();
        render();
        toast("✅ Order placed! Items arrive in 8 mins ⚡");
      };

      $("#toast-view-btn").onclick = () => {
        if (cart.size > 0) {
          $("#scroll").scrollTo({ top: 0, behavior: "smooth" });
          toast("Opening checkout summary...");
        }
      };

window.selectZeptoCatSubcat = function (idx, el, catKey) {
        document.querySelectorAll(".cat-sidebar-item").forEach(i => i.classList.remove("active"));
        el.classList.add("active");
        const catData = ZEPTO_CATALOG[catKey];
        const filterBtn = document.getElementById("cat-subcat-filter-btn");
        if (catData && filterBtn && catData.subcats[idx]) filterBtn.textContent = (catData.subcats[idx].em ? catData.subcats[idx].em + " " : "") + catData.subcats[idx].label;
        const gridEl = document.getElementById("cat-product-grid");
        if (!catData) return;

        let prods = [...catData.products];
        if (idx > 0 && catData.subcats[idx]) {
          const subLabel = catData.subcats[idx].label.toLowerCase();
          const filtered = prods.filter(p => {
            if (p.subcat) return p.subcat.toLowerCase().includes(subLabel) || subLabel.includes(p.subcat.toLowerCase());
            const pNm = (p.nm || "").toLowerCase();
            const pTag = (p.tag || "").toLowerCase();
            const words = subLabel.split(/[\s&,/]+/);
            return words.some(w => w.length > 2 && (pNm.includes(w) || pTag.includes(w)));
          });
          if (filtered.length > 0) prods = filtered;
        }

        renderZeptoCatGrid(gridEl, prods);
      };

      function renderZeptoCatGrid(gridEl, products) {
        if (!gridEl) return;
        const tags = ["Spill-Proof", "King Size", "Small", "Premium", "Best Seller", "Organic", "New", "Popular", "Top Rated", "Limited"];
        gridEl.innerHTML = products.map((p, i) => {
          const key = `zcat-${(p.cat || 'x').replace(/[^a-z]/gi, '')}-${i}`;
          const isAdded = cart.has(key);
          const rating = ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8"][i % 8];
          const reviews = ["1.2k", "1.5k", "1.8k", "2.0k", "2.3k", "2.6k", "3.1k", "4.0k"][i % 8];
          const tag = p.tag || tags[i % tags.length];
          const disc = p.disc || (p.was ? Math.round((1 - p.pr / p.was) * 100) + "% off" : "");
          const isAd = i % 5 === 0;
          const imgHtml = p.img
            ? `<img src="${p.img}" alt="${p.nm}" loading="lazy" onerror="this.parentElement.classList.add('has-error')" /><span class="cat-prod-img-fallback">${p.em}</span>`
            : `<span>${p.em}</span>`;
          return `
            <div class="cat-prod-card">
              <div class="cat-price-badge">\u20b9${p.pr}${p.was ? '<span class="cat-prod-mrp">\u20b9' + p.was + '</span>' : ''}</div>
              ${disc ? `<span class="cat-disc-badge">${disc}</span>` : ''}
              <div class="cat-prod-img-box">
                ${imgHtml}
                ${isAd ? '<span class="cat-prod-ad-tag">Ad</span>' : ''}
              </div>
              <button class="cat-add-btn${isAdded ? ' added' : ''}" onclick="catAddToCart('${key}',this)">
                ${isAdded ? '\u2713 ADDED' : '+ ADD'}
              </button>
              <div class="cat-prod-size">${p.wt}</div>
              <div class="cat-prod-name">${p.nm}</div>
              <div class="cat-prod-tag">${tag}</div>
              <div class="cat-prod-rating">
                <span class="star">\u2605</span> ${rating} (${reviews}) &nbsp;|&nbsp; 5 mins
              </div>
            </div>`;
        }).join("");
      }


      window.closeCategoryPage = function () {
        const overlay = document.getElementById("cat-page-overlay");
        if (overlay) overlay.classList.remove("open");
      };

      /* catAddToCart — used by renderZeptoCatGrid ADD buttons */
      window.catAddToCart = function (key, btn) {
        if (cart.has(key)) {
          cart.delete(key);
          btn.classList.remove("added");
          btn.innerHTML = "+ ADD";
        } else {
          cart.add(key);
          btn.classList.add("added");
          btn.innerHTML = "\u2713 ADDED";
          btn.style.transform = "scale(0.93)";
          setTimeout(() => { btn.style.transform = ""; }, 180);
        }
        // Update cart badge (same pattern as rest of app)
        const badge = document.getElementById("cart-item-count");
        if (badge) badge.textContent = cart.size + " item" + (cart.size !== 1 ? "s" : "");
        const cartBar = document.getElementById("cart-bar");
        if (cartBar) cartBar.style.display = cart.size > 0 ? "flex" : "none";
      };

      /* Wire category page back button */
      (function () {
        const btn = document.getElementById("cat-page-back-btn");
        if (btn) btn.onclick = window.closeCategoryPage;
      })();