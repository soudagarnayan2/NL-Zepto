
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
        } catch (e) {}
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
          { em: "🍎", nm: "Royal Gala Apples", wt: "4 pcs", pr: 149, was: 180 },
          { em: "🥭", nm: "Fresh Alphonso Mangoes", wt: "1 kg", pr: 399, was: 499 },
          { em: "🍅", nm: "Farm Fresh Hybrid Tomatoes", wt: "1 kg", pr: 38, was: 45 },
          { em: "🍌", nm: "Organic Robusta Bananas", wt: "6 pcs", pr: 42, was: 50 },
          { em: "🥬", nm: "Fresh Palak Spinach", wt: "250 g", pr: 25, was: 30 }
        ],
        "Dairy,Bread & Eggs": [
          { em: "🥛", nm: "Amul Taaza Toned Milk", wt: "1 L", pr: 54, was: 56 },
          { em: "🥚", nm: "Farm Fresh White Eggs", wt: "6 pcs", pr: 52, was: 60 },
          { em: "🧀", nm: "Amul Butter Pasteurised", wt: "100 g", pr: 56, was: 60 },
          { em: "🍞", nm: "Britannia Whole Wheat Bread", wt: "400 g", pr: 45, was: 50 },
          { em: "🧈", nm: "Fresh Malai Paneer", wt: "200 g", pr: 95, was: 110 }
        ],
        "Atta, Rice & Dals": [
          { em: "🌾", nm: "Fortune Chakki Fresh Atta", wt: "5 kg", pr: 220, was: 250 },
          { em: "🍚", nm: "India Gate Basmati Rice", wt: "1 kg", pr: 149, was: 180 },
          { em: "🥣", nm: "Tata Sampann Toor Dal", wt: "1 kg", pr: 165, was: 190 },
          { em: "🫘", nm: "Organic Yellow Moong Dal", wt: "500 g", pr: 89, was: 105 }
        ],
        "Munchies": [
          { em: "🍿", nm: "Lays Classic Salted Chips", wt: "115 g", pr: 50, was: 60 },
          { em: "🌶️", nm: "Kurkure Masala Munch", wt: "90 g", pr: 20, was: 25 },
          { em: "🧀", nm: "Doritos Nacho Cheese Chips", wt: "100 g", pr: 50, was: 60 },
          { em: "🥔", nm: "Pringles Sour Cream & Onion", wt: "107 g", pr: 109, was: 125 }
        ],
        "Zepto Cafe": [
          { em: "☕", nm: "Classic Cold Brew Coffee", wt: "250 ml", pr: 79, was: 99 },
          { em: "☕", nm: "Vietnamese Iced Coffee", wt: "250 ml", pr: 99, was: 120 },
          { em: "🥐", nm: "Fresh Butter Croissant", wt: "1 pc", pr: 49, was: 59 },
          { em: "🥪", nm: "Classic Veg Cheese Sandwich", wt: "1 pc", pr: 79, was: 99 },
          { em: "🥟", nm: "Hot Samosa with Mint Chutney", wt: "2 pcs", pr: 45, was: 55 }
        ],
        "Cold Drinks & Juices": [
          { em: "🥤", nm: "Real Fruit Power Mixed Fruit", wt: "1 L", pr: 115, was: 135 },
          { em: "🥤", nm: "Coca-Cola Original Taste", wt: "750 ml", pr: 40, was: 45 },
          { em: "🥭", nm: "Paper Boat Aamras Juice", wt: "250 ml", pr: 35, was: 40 },
          { em: "⚡", nm: "Red Bull Energy Drink", wt: "250 ml", pr: 125, was: 135 }
        ],
        "Biscuits & Cookies": [
          { em: "🍪", nm: "Sunfeast Dark Fantasy Fills", wt: "150 g", pr: 89, was: 100 },
          { em: "🍪", nm: "Oreo Chocolate Sandwich Cookies", wt: "120 g", pr: 35, was: 40 },
          { em: "🍪", nm: "Britannia Good Day Cashew", wt: "200 g", pr: 50, was: 60 },
          { em: "🍪", nm: "Mom's Magic Butter Cookies", wt: "200 g", pr: 45, was: 55 }
        ],
        "Sweet Craving": [
          { em: "🍫", nm: "Cadbury Dairy Milk Silk", wt: "150 g", pr: 165, was: 180 },
          { em: "🍬", nm: "Ferrero Rocher Chocolates", wt: "4 pcs", pr: 149, was: 175 },
          { em: "🍫", nm: "Amul 55% Dark Chocolate", wt: "150 g", pr: 110, was: 125 },
          { em: "🍦", nm: "Baskin Robbins Mississippi Mud", wt: "450 ml", pr: 279, was: 325 }
        ],
        "Breakfast & Sauce": [
          { em: "🥣", nm: "Kellogg's Crunchy Muesli", wt: "500 g", pr: 189, was: 240 },
          { em: "🍯", nm: "Hershey's Chocolate Syrup", wt: "200 g", pr: 99, was: 120 },
          { em: "🥫", nm: "Kissan Fresh Tomato Ketchup", wt: "1 kg", pr: 130, was: 155 },
          { em: "🌾", nm: "Quaker Rolled Oats", wt: "1 kg", pr: 179, was: 215 }
        ],
        "Packaged Food": [
          { em: "🍜", nm: "Maggi 2-Minute Masala Noodles", wt: "4 pack", pr: 56, was: 64 },
          { em: "🍜", nm: "Sunfeast Yippee Masala Noodles", wt: "4 pack", pr: 52, was: 60 },
          { em: "🍲", nm: "Nissin Cup Noodles Seafood", wt: "70 g", pr: 55, was: 65 },
          { em: "🍝", nm: "Ching's Secret Hakka Noodles", wt: "300 g", pr: 45, was: 55 }
        ],
        "Meat, Fish & Eggs": [
          { em: "🍗", nm: "Fresh Chicken Breast Boneless", wt: "500 g", pr: 199, was: 240 },
          { em: "🥩", nm: "Fresh Mutton Curry Cut", wt: "500 g", pr: 449, was: 520 },
          { em: "🐟", nm: "Fresh Basa Fish Fillet", wt: "500 g", pr: 299, was: 360 },
          { em: "🥚", nm: "Organic Brown Protein Eggs", wt: "6 pcs", pr: 75, was: 90 }
        ],
        "Masala & Dry Fruits": [
          { em: "🥜", nm: "Nutraj Premium Almonds", wt: "100 g", pr: 149, was: 199 },
          { em: "🌰", nm: "Whole Premium Cashews", wt: "100 g", pr: 159, was: 210 },
          { em: "🧂", nm: "Everest Royal Garam Masala", wt: "100 g", pr: 85, was: 100 },
          { em: "🍇", nm: "Green Seedless Raisins", wt: "200 g", pr: 99, was: 130 }
        ],
        "Ice Creams & More": [
          { em: "🍦", nm: "Amul Real Vanilla Ice Cream", wt: "500 ml", pr: 120, was: 150 },
          { em: "🍨", nm: "Kwality Wall's Chocolate Fudge", wt: "700 ml", pr: 189, was: 240 },
          { em: "🍦", nm: "Havmor Butterscotch Ice Cream", wt: "500 ml", pr: 135, was: 165 }
        ],
        "Frozen Food": [
          { em: "🍟", nm: "McCain French Fries", wt: "420 g", pr: 110, was: 135 },
          { em: "🍗", nm: "Godrej Yummiez Chicken Nuggets", wt: "500 g", pr: 220, was: 270 },
          { em: "🥟", nm: "Prasuma Steamed Pork Momos", wt: "10 pcs", pr: 199, was: 249 }
        ],
        "Tea, Coffee & More": [
          { em: "🍵", nm: "Red Label Natural Care Tea", wt: "500 g", pr: 230, was: 270 },
          { em: "☕", nm: "Nescafe Classic Instant Coffee", wt: "100 g", pr: 310, was: 360 },
          { em: "🍃", nm: "Organic India Green Tea Lemon", wt: "25 bags", pr: 175, was: 210 }
        ],
        "Skincare": [
          { em: "🧴", nm: "The Derma Co Sunscreen SPF50", wt: "50 g", pr: 289, was: 349 },
          { em: "🧼", nm: "Himalaya Neem Face Wash", wt: "150 ml", pr: 149, was: 210 },
          { em: "💧", nm: "Minimalist 10% Niacinamide Serum", wt: "30 ml", pr: 499, was: 599 }
        ],
        "Makeup & Beauty": [
          { em: "💄", nm: "Maybelline Color Sensational Ruby", wt: "1 pc", pr: 349, was: 450 },
          { em: "👁️", nm: "Lakme Absolute Eyeliner Black", wt: "1 pc", pr: 299, was: 375 },
          { em: "✨", nm: "Sugar Cosmetics Compact Powder", wt: "1 pc", pr: 249, was: 320 }
        ],
        "Bath & Body": [
          { em: "🧼", nm: "Nivea Shower Gel Care & Oil", wt: "250 ml", pr: 175, was: 220 },
          { em: "🧴", nm: "Dove Cream Beauty Soap 3x", wt: "3x100g", pr: 160, was: 190 },
          { em: "🧴", nm: "Vaseline Deep Moisture Body Lotion", wt: "400 ml", pr: 299, was: 380 }
        ],
        "Haircare": [
          { em: "💇", nm: "L'Oreal Paris Argan Oil Shampoo", wt: "250 ml", pr: 220, was: 299 },
          { em: "✨", nm: "Tresemme Keratin Smooth Conditioner", wt: "190 ml", pr: 199, was: 250 },
          { em: "🌿", nm: "Biotique Bio Bhringraj Hair Oil", wt: "200 ml", pr: 149, was: 199 }
        ],
        "Self care Studio": [
          { em: "💅", nm: "Glow & Groom Facial Sheet Mask Set", wt: "3 pcs", pr: 249, was: 320 },
          { em: "💎", nm: "Rose Quartz Facial Massage Roller", wt: "1 pc", pr: 399, was: 550 },
          { em: "✨", nm: "Nail Care & Cuticle Nourishing Oil", wt: "15 ml", pr: 199, was: 275 }
        ],
        "Fragrance": [
          { em: "✨", nm: "Bella Vita Organic Luxury Perfume", wt: "100 ml", pr: 499, was: 699 },
          { em: "💨", nm: "Fogg Scent Body Spray Deodorant", wt: "150 ml", pr: 199, was: 250 },
          { em: "🌸", nm: "Plum BodyMist Hawaiian Rumba", wt: "150 ml", pr: 325, was: 425 }
        ],
        "Baby care": [
          { em: "🍼", nm: "Pampers Active Baby Diapers M", wt: "20 pcs", pr: 349, was: 420 },
          { em: "👶", nm: "Himalaya Gentle Baby Lotion", wt: "200 ml", pr: 165, was: 210 },
          { em: "🧻", nm: "Johnson's Baby Gentle Wipes", wt: "80 pcs", pr: 199, was: 250 }
        ],
        "Pet care": [
          { em: "🦴", nm: "Pedigree Chicken Dog Treats", wt: "200 g", pr: 199, was: 260 },
          { em: "🐱", nm: "Drools Dry Cat Food Ocean Fish", wt: "1.2 kg", pr: 449, was: 520 },
          { em: "🥣", nm: "Stainless Steel Anti-Skid Pet Bowl", wt: "1 pc", pr: 129, was: 150 }
        ],
        "Cleaning Essentials": [
          { em: "🧴", nm: "Lizol Floor Cleaner Citrus", wt: "500 ml", pr: 99, was: 130 },
          { em: "🧼", nm: "Vim Dishwash Gel Lemon", wt: "500 ml", pr: 105, was: 125 },
          { em: "🚽", nm: "Harpic Power Plus Toilet Cleaner", wt: "1 L", pr: 180, was: 210 }
        ],
        "Home needs": [
          { em: "🧻", nm: "Kitchen Tissue Roll (2 Rolls)", wt: "2 pcs", pr: 99, was: 120 },
          { em: "🧹", nm: "Microfiber Cleaning Cloth Set", wt: "3 pcs", pr: 149, was: 199 },
          { em: "🍱", nm: "Heavy Duty Aluminium Foil", wt: "1 kg", pr: 189, was: 230 },
          { em: "🗑️", nm: "Medium Garbage Bags (30s)", wt: "30 pcs", pr: 119, was: 150 },
          { em: "💡", nm: "LED Cool Day Bulb 9W", wt: "1 pc", pr: 99, was: 140 }
        ],
        "Kitchen & Dining": [
          { em: "🍽️", nm: "Airtight Stainless Steel Container 1L", wt: "1 pc", pr: 149, was: 199 },
          { em: "🍳", nm: "Non-Stick Granite Frying Pan 24cm", wt: "1 pc", pr: 499, was: 699 },
          { em: "☕", nm: "Ceramic Coffee Mug Set", wt: "2 pcs", pr: 299, was: 399 }
        ],
        "Pharmacy & Wellness": [
          { em: "💊", nm: "Fast&Up Vitamin C 1000mg Effervescent", wt: "20 tabs", pr: 149, was: 199 },
          { em: "🫀", nm: "Revital H Daily Health Supplement", wt: "30 caps", pr: 299, was: 360 },
          { em: "🌿", nm: "Himalaya Liv 52 Liver Care", wt: "100 tabs", pr: 165, was: 195 }
        ],
        "Protein & Nutrition": [
          { em: "🫈", nm: "RiteBite Max Protein Bar 20g", wt: "60 g", pr: 99, was: 125 },
          { em: "💪", nm: "Optimum Nutrition Whey Protein", wt: "1 kg", pr: 2899, was: 3499 },
          { em: "🥜", nm: "MuscleBlaze High Protein Peanut Butter", wt: "1 kg", pr: 499, was: 649 }
        ],
        "Stationery& Books": [
          { em: "📚", nm: "Executive Hardbound Notebook & Pen", wt: "1 set", pr: 149, was: 199 },
          { em: "🖊️", nm: "Pastel Highlighter Set", wt: "6 pack", pr: 129, was: 169 },
          { em: "📝", nm: "Sticky Notes & Desk Organizer Kit", wt: "1 set", pr: 179, was: 220 }
        ],
        "Toys & games": [
          { em: "🧸", nm: "Creative Building Blocks 120 Pcs", wt: "1 set", pr: 399, was: 499 },
          { em: "🧩", nm: "Wooden Brain Teaser 3D Puzzle", wt: "1 pc", pr: 249, was: 320 },
          { em: "🏎️", nm: "High-Speed Remote Control Car", wt: "1 pc", pr: 599, was: 799 }
        ],
        "Apparel": [
          { em: "👕", nm: "Premium Cotton Crew Neck T-Shirt", wt: "1 pc", pr: 399, was: 499 },
          { em: "🧥", nm: "Casual Unisex Oversized Hoodie", wt: "1 pc", pr: 799, was: 999 },
          { em: "🩳", nm: "Comfort Stretch Denim Shorts", wt: "1 pc", pr: 499, was: 650 }
        ],
        "Jewellery": [
          { em: "💍", nm: "Minimalist Gold-Plated Pendant Set", wt: "1 set", pr: 299, was: 399 },
          { em: "💎", nm: "Elegant Silver Zircon Stud Earrings", wt: "1 pair", pr: 349, was: 450 },
          { em: "📿", nm: "Boho Layered Charm Necklace", wt: "1 pc", pr: 249, was: 350 }
        ],
        "Gourmet": [
          { em: "🍳", nm: "Chilli Garlic Artisanal Sauce", wt: "200 g", pr: 89, was: 120 },
          { em: "🫒", nm: "Borges Extra Virgin Olive Oil", wt: "500 ml", pr: 649, was: 799 },
          { em: "🍝", nm: "Barilla Penne Rigate Italian Pasta", wt: "500 g", pr: 189, was: 230 }
        ],
        "Gifting": [
          { em: "🎁", nm: "Cadbury Celebrations Gift Pack", wt: "286 g", pr: 220, was: 250 },
          { em: "🕯️", nm: "Scented Soy Candle & Mug Gift Box", wt: "1 set", pr: 499, was: 650 },
          { em: "☕", nm: "Exotic Gourmet Coffee Sampler Pack", wt: "1 set", pr: 399, was: 499 }
        ],
        "Plants": [
          { em: "🌿", nm: "Indoor Money Plant in Ceramic Pot", wt: "1 pc", pr: 249, was: 320 },
          { em: "🪴", nm: "Air Purifier Snake Plant Indoor", wt: "1 pc", pr: 299, was: 399 },
          { em: "🌵", nm: "Succulent Desk Plant Collection", wt: "2 pcs", pr: 349, was: 450 }
        ],
        "Electronics store": [
          { em: "🎧", nm: "Wireless TWS Earbuds with ENC", wt: "1 pc", pr: 899, was: 1299 },
          { em: "🔋", nm: "Fast Charging Power Bank 10000mAh", wt: "1 pc", pr: 999, was: 1499 },
          { em: "🔌", nm: "Type-C Braided Cable 1.5m", wt: "1 pc", pr: 199, was: 299 }
        ],
        "Home Decor": [
          { em: "🕯️", nm: "Scented Soy Candle in Glass Jar", wt: "1 pc", pr: 249, was: 340 },
          { em: "🏺", nm: "Ceramic Minimalist Flower Vase", wt: "1 pc", pr: 349, was: 450 },
          { em: "✨", nm: "Warm LED Fairy String Lights 10m", wt: "1 pc", pr: 199, was: 280 }
        ],
        "Paan Corner": [
          { em: "🍃", nm: "Sweet Meetha Paan (Fresh Pack)", wt: "2 pcs", pr: 49, was: 60 },
          { em: "🍬", nm: "Paan Pasand Mouth Freshener Candy", wt: "100 g", pr: 35, was: 45 },
          { em: "🫙", nm: "Shahi Gulkand Fresh Paan Jar", wt: "200 g", pr: 120, was: 150 },
          { em: "🍫", nm: "Choco Paan Bites & Freshener", wt: "150 g", pr: 99, was: 125 },
          { em: "🍃", nm: "Banarasi Flavored Sweet Paan", wt: "1 pc", pr: 40, was: 50 },
          { em: "🥜", nm: "Silver Coated Paan Supari Drops", wt: "50 g", pr: 65, was: 80 }
        ]
      };

      function getProductsForCategory(cat) {
        if (!cat) return [{ ...defaultProduct("Explore"), cat: "Explore" }];
        if (categoryProductsCatalog[cat]) {
          return categoryProductsCatalog[cat].map(p => ({ ...p, cat }));
        }
        const catLower = cat.toLowerCase();
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

      const API = "http://127.0.0.1:8000";
      let idx = 0;
      let userId = "user_Nayan";
      let variant = "CONTROL";
      let apiLive = false;
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
      async function logEvent(eventType, category) {
        if (!apiLive) return;
        const payload = {
          event_id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          user_id: userId,
          event_type: eventType,
          category: category || "Discover",
          timestamp: new Date().toISOString(),
          variant: variant
        };
        try {
          await fetch(`${API}/telemetry/event`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        } catch (e) {
          console.error("Telemetry failed:", e);
        }
      }

      /* Check API status and update recommendations */
      async function checkApiHealth() {
        try {
          const r = await fetch(`${API}/analytics/metrics`, { signal: AbortSignal.timeout(2000) });
          if (r.ok) {
            apiLive = true;
            $("#api-status-bar").classList.remove("offline");
            $("#api-indicator").textContent = "Live AI · personalised for you";
            await fetchVariantAndRecommendations();
          } else {
            throw new Error();
          }
        } catch (e) {
          apiLive = false;
          $("#api-status-bar").classList.add("offline");
          $("#api-indicator").textContent = "Preview mode · tap to reconnect";
          updateVariantOffline();
        }
      }

      async function fetchVariantAndRecommendations() {
        try {
          const locParams = `&pincode=${encodeURIComponent(currentLocation.pincode)}&location=${encodeURIComponent(currentLocation.name)}`;
          const res = await fetch(`${API}/recommend?user_id=${encodeURIComponent(userId)}${locParams}`);
          if (res.ok) {
            const data = await res.json();
            variant = data.variant;
            updateVariantLabels(variant);
            await fetchAllLiveSlides();
          } else {
            updateVariantOffline();
          }
        } catch (e) {
          updateVariantOffline();
        }
      }

      function updateVariantOffline() {
        // Client-side deterministic MD5 sticky hashing to mirror backend
        try {
          const hashVal = BigInt("0x" + md5(userId));
          const variantIdx = Number(hashVal % 3n);
          variant = ["CONTROL", "TREATMENT_A", "TREATMENT_B"][variantIdx];
        } catch (e) {
          variant = "CONTROL";
        }
        updateVariantLabels(variant);
        liveRecos = {};
        render();
      }

      function updateVariantLabels(v) {
        const labels = {
          "CONTROL": "⬛ Basic",
          "TREATMENT_A": "🔵 Smart",
          "TREATMENT_B": "🟣 Smart+Memory"
        };
        const label = labels[v] || v;
        $("#variant-label").textContent = label;
        const groupCodeEl = $("#group-code");
        if (groupCodeEl) {
          groupCodeEl.textContent = label;
        }
      }

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

      function updateCartTotal() {
        if (cart.size > 0) {
          let total = 0;
          let newCats = new Set();

          for (const key in cartItemsList) {
            const p = cartItemsList[key];
            total += parseInt(p.pr.replace(/[^\d]/g, "")) || 0;
            newCats.add(p.cat || getCurrentCategory());
          }

          $("#cart-item-count").textContent = `${cart.size} item${cart.size > 1 ? 's' : ''} · ${newCats.size} new category`;
          $("#cart-total-price").textContent = `₹${total}`;
          $("#cart-bar").classList.add("show");
        } else {
          $("#cart-bar").classList.remove("show");
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

      window.dismissProductCard = function(event, deckIdx, prodIdx, prodName, catName) {
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

      /* -------- AI Chat Drawer integration -------- */
      let chatMessages = [
        { role: "bot", content: "" }
      ];

      function updateChatWelcomeMessage() {
        const area = getAreaName();
        const eta = currentLocation.eta ? currentLocation.eta : "8 mins ⚡";
        chatMessages[0] = {
          role: "bot",
          content: `Hey Nayan 👋 Delivery set to <b>${area}</b> (${eta}). Ask me what's worth trying next near you — or tap a suggestion!`
        };
      }

      function openChat(initialMsg = null) {
        updateChatWelcomeMessage();
        $("#chat-overlay").classList.add("show");
        renderChatMessages();
        if (initialMsg) {
          sendChatMessage(initialMsg);
        }
      }

      function closeChat() {
        $("#chat-overlay").classList.remove("show");
      }

      function renderChatMessages() {
        const chatBody = $("#chat-body");
        chatBody.innerHTML = chatMessages.map(m => `
    <div class="msg ${m.role}">
      ${m.content}
    </div>
  `).join("");

        // Sync the ADD buttons in the chat message history with current cart state
        chatBody.querySelectorAll("button[data-cat]").forEach(btn => {
          const catName = btn.dataset.cat;
          const key = `chat-${catName}`;
          const isAdded = cart.has(key);
          if (isAdded) {
            btn.classList.add("in");
            btn.textContent = "✓ ADDED";
          } else {
            btn.classList.remove("in");
            btn.textContent = "ADD";
          }
        });

        chatBody.scrollTop = chatBody.scrollHeight;
      }

      async function sendChatMessage(text) {
        if (!text || text.trim() === "") return;
        chatMessages.push({ role: "user", content: text });
        renderChatMessages();

        const chatBody = $("#chat-body");
        const thinkingDiv = document.createElement("div");
        thinkingDiv.className = "msg bot thinking";
        thinkingDiv.innerHTML = "<span></span><span></span><span></span>";
        chatBody.appendChild(thinkingDiv);
        chatBody.scrollTop = chatBody.scrollHeight;

        logEvent("reco_clicked", "Ask Zepto Realtime");

        if (apiLive) {
          try {
            const locParams = `&pincode=${encodeURIComponent(currentLocation.pincode)}&location=${encodeURIComponent(currentLocation.name)}`;
            const sseUrl = `${API}/realtime/zepto-stream?user_id=${encodeURIComponent(userId)}&query=${encodeURIComponent(text)}${locParams}`;
            const es = new EventSource(sseUrl);

            let streamDiv = null;
            let finalExplanation = "";
            let finalRecos = [];

            es.onmessage = (event) => {
              const data = JSON.parse(event.data);
              if (data.type === "telemetry") {
                thinkingDiv.remove();
                streamDiv = document.createElement("div");
                streamDiv.className = "msg bot";
                streamDiv.innerHTML = `<span style="font-size:10px;font-weight:900;color:var(--zepto-pink);background:#FBF0FF;padding:2px 6px;border-radius:4px;display:inline-flex;align-items:center;gap:4px;margin-bottom:4px;">⚡ REALTIME ZEPTO STREAM (${data.dark_store} · ${data.eta})</span><br><span class="stext">...</span>`;
                chatBody.appendChild(streamDiv);
                chatBody.scrollTop = chatBody.scrollHeight;
              } else if (data.type === "text_chunk") {
                if (streamDiv) {
                  streamDiv.querySelector(".stext").textContent = data.text;
                  chatBody.scrollTop = chatBody.scrollHeight;
                }
              } else if (data.type === "complete") {
                es.close();
                finalExplanation = data.text;
                finalRecos = data.recommendations || [];
                if (streamDiv) streamDiv.remove();
                finishBotResponse(finalExplanation, finalRecos, text);
              }
            };

            es.onerror = (err) => {
              es.close();
              if (streamDiv) streamDiv.remove();
              thinkingDiv.remove();
              const fallback = getOfflineChatResponse(text);
              finishBotResponse(fallback, [], text);
            };
            return;
          } catch (e) {
            thinkingDiv.remove();
            const fallback = getOfflineChatResponse(text);
            finishBotResponse(fallback, [], text);
            return;
          }
        }

        await new Promise(r => setTimeout(r, 600));
        thinkingDiv.remove();
        const explanation = getOfflineChatResponse(text);
        finishBotResponse(explanation, [], text);
      }

      function finishBotResponse(explanation, recos, text) {
        let botContent = explanation;
        const ql = text.toLowerCase();
        const suggestedCats = getQueryCategories(ql);
        const stripLabel = getStripLabel(ql);

        const isCafeQuery = (ql.includes("cafe") || ql.includes("zepto cafe") || ql.includes("coffee") || ql.includes("cold brew") || ql.includes("chai") || ql.includes("croissant") || ql.includes("samosa") || ql.includes("sandwich") || ql.includes("muffin"));

        if (isCafeQuery) {
          botContent += `
    <div style="margin-top: 10px; border-top: 1px solid var(--line); padding-top: 10px;">
      <div style="font-size: 11px; font-weight: 800; color: var(--zepto-pink); margin-bottom: 8px; display:flex; align-items:center; gap:5px;">☕ Fresh Zepto Cafe Menu (Delivered in 8 mins):</div>
      <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; -webkit-overflow-scrolling: touch;">
  `;
          zeptoCafeMenu.forEach(item => {
            const key = `cafe-${item.id}`;
            const isAdded = cart.has(key);
            botContent += `
      <div style="flex: 0 0 108px; background: #fff; border: 1px solid #EBE5F5; border-radius: 14px; padding: 8px 6px; display: flex; flex-direction: column; align-items: center; text-align: center; box-shadow: 0 2px 8px rgba(75,0,130,0.06);">
        <div style="font-size: 24px; margin-bottom: 4px; background:#F8F5FC; width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center;">${item.em}</div>
        <div style="font-size: 9.5px; font-weight: 800; line-height: 1.25; height: 26px; overflow: hidden; margin-bottom: 2px; color: var(--ink); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${item.nm}</div>
        <div style="font-size: 8.5px; color: var(--ink-3); font-weight: 700; margin-bottom: 4px;">${item.wt}</div>
        <div style="font-size: 10.5px; font-weight: 900; color: var(--zepto-purple-2); margin-bottom: 6px; margin-top: auto;">
          ${item.pr}${item.was ? ` <s style="font-size:8px;color:var(--ink-3);font-weight:700;">${item.was}</s>` : ""}
        </div>
        <button class="add${isAdded ? ' in' : ''}" onclick="addCafeProductToCart(this, '${item.id}')" style="width:100%;font-size:9px;padding:4px 0;border-radius:8px;">${isAdded ? '✓ ADDED' : '+ ADD'}</button>
      </div>
    `;
          });
          botContent += `
      </div>
      <div style="margin-top:10px; display:flex; gap:6px; overflow-x:auto; padding-bottom:4px; flex-wrap:nowrap; -webkit-overflow-scrolling:touch; scrollbar-width:none; justify-content: flex-start;">
        ${suggestedCats.map(cat => `
          <button onclick="openCategoryFromChat('${cat.replace(/'/g, "&apos;")}')" style="flex:0 0 auto; white-space:nowrap; background:linear-gradient(135deg,#5A00A0,#7B1FA2); color:#fff; border:none; font-size:10px; font-weight:900; padding:7px 13px; border-radius:16px; cursor:pointer; letter-spacing:0.3px; box-shadow:0 2px 6px rgba(90,0,160,0.2);">
            Explore ${cat} →
          </button>
        `).join("")}
      </div>
    </div>
  `;
        } else {
          botContent += `
    <div style="margin-top: 10px; border-top: 1px solid var(--line); padding-top: 10px;">
      <div style="font-size: 11px; font-weight: 800; color: var(--ink-2); margin-bottom: 8px; display:flex; align-items:center; gap:5px;">${stripLabel}</div>
      <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; -webkit-overflow-scrolling: touch;">
  `;

          suggestedCats.forEach(cat => {
            const productsList = getProductsForCategory(cat);
            productsList.forEach(item => {
              const safeCat = cat.replace(/'/g, "\\'");
              const safeNm = item.nm.replace(/'/g, "\\'");
              const itemKey = `chat-${cat}-${item.nm.replace(/\s+/g, '-')}`;
              const isAdded = cart.has(itemKey) || cart.has(`chat-${cat}`);
              botContent += `
      <div style="flex: 0 0 108px; background: #fff; border: 1px solid #EBE5F5; border-radius: 14px; padding: 8px 6px; display: flex; flex-direction: column; align-items: center; text-align: center; box-shadow: 0 2px 8px rgba(75,0,130,0.06);">
        <div style="font-size: 24px; margin-bottom: 4px; background:#F8F5FC; width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center;">${item.em}</div>
        <div style="font-size: 9.5px; font-weight: 800; line-height: 1.25; height: 26px; overflow: hidden; margin-bottom: 2px; color: var(--ink); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${item.nm}</div>
        <div style="font-size: 8.5px; color: var(--ink-3); font-weight: 700; margin-bottom: 4px;">${item.wt}</div>
        <div style="font-size: 10.5px; font-weight: 900; color: var(--zepto-purple-2); margin-bottom: 6px; margin-top: auto;">
          ₹${item.pr}${item.was ? ` <s style="font-size:8px;color:var(--ink-3);font-weight:700;">₹${item.was}</s>` : ""}
        </div>
        <button class="add${isAdded ? ' in' : ''}" onclick="addChatProductItemToCart(this, '${safeCat}', '${safeNm}', ${item.pr}, '${item.em}', '${item.wt}')" style="width:100%;font-size:9px;padding:4px 0;border-radius:8px;">${isAdded ? '✓ ADDED' : '+ ADD'}</button>
      </div>
    `;
            });
          });

          botContent += `
      </div>
      <div style="margin-top:10px; display:flex; gap:6px; overflow-x:auto; padding-bottom:4px; flex-wrap:nowrap; -webkit-overflow-scrolling:touch; scrollbar-width:none; justify-content: flex-start;">
        ${suggestedCats.map(cat => `
          <button onclick="openCategoryFromChat('${cat.replace(/'/g, "&apos;")}')" style="flex:0 0 auto; white-space:nowrap; background:linear-gradient(135deg,#5A00A0,#7B1FA2); color:#fff; border:none; font-size:10px; font-weight:900; padding:7px 13px; border-radius:16px; cursor:pointer; letter-spacing:0.3px; box-shadow:0 2px 6px rgba(90,0,160,0.2);">
            Explore ${cat} →
          </button>
        `).join("")}
      </div>
    </div>
  `;
        }

        chatMessages.push({ role: "bot", content: botContent });
        renderChatMessages();
      }

      function getOfflineChatResponse(query) {
        const ql = query.toLowerCase();
        const area = getAreaName();

        // 0. Other Categories (Non-Grocery)
        if (ql.includes("paan") || ql.includes("mouth freshener") || ql.includes("gulkand") || ql.includes("supari")) {
          return `Welcome to 🍃 <b>Paan Corner</b>! Enjoy fresh sweet meetha paan, mouth fresheners, gulkand jars, paan candies & supari delivered in 8 mins to ${area}:`;
        }
        if (ql.includes("other categories") || ql.includes("other category") || ql.includes("categories")) {
          return `Explore recommendations across Zepto's non-grocery categories! 🛍️ Discover top-rated items in 🧻 <b>Home Needs</b>, 👔 <b>Apparel</b>, 💍 <b>Jewellery</b>, 🍽️ <b>Kitchen & Dining</b>, and 🎧 <b>Electronics</b> available near ${area}:`;
        }

        // 0B. Apparel & Fashion
        if (ql.includes("apparel") || ql.includes("apparels") || ql.includes("clothing") || ql.includes("fashion") || ql.includes("t-shirt") || ql.includes("hoodie")) {
          return `Explore Zepto's Fashion & Apparel collection! 👔 Premium Cotton T-Shirts, Hoodies, Shorts, Lounge Pyjamas & Casual Shirts delivered in 8-10 mins to ${area}:`;
        }

        // 0C. Jewellery & Accessories
        if (ql.includes("jewellery") || ql.includes("jewelry") || ql.includes("necklace") || ql.includes("pendant") || ql.includes("earring") || ql.includes("choker")) {
          return `Discover Zepto's Fashion Jewellery collection! 💍 Gold-plated pendant sets, Zircon stud earrings, Charm necklaces & Statement chokers curated for ${area}:`;
        }

        // 0D. Home Needs & Household
        if (ql.includes("home needs") || ql.includes("tissue") || ql.includes("tissues") || ql.includes("foil") || ql.includes("garbage bag") || ql.includes("extension")) {
          return `Stock up on Home Needs & Household Essentials! 🧻 Kitchen tissues, Aluminium foils, Garbage bags, Microfiber cloths & Multi-plug socket strips delivered to ${area}:`;
        }

        // 0E. Electronics Store
        if (ql.includes("electronics") || ql.includes("earbuds") || ql.includes("power bank") || ql.includes("speaker")) {
          return `Upgrade with Zepto Electronics & Gadgets! 🎧 Wireless TWS Earbuds, Power Banks, Fast-charging braided cables & Bluetooth speakers delivered fast to ${area}:`;
        }

        // 1. Noodles / Pasta
        if (ql.includes("noodle") || ql.includes("pasta") || ql.includes("maggi") || ql.includes("ramen")) {
          return `Instant noodles pair best with 🥚 <b>Meat, Fish & Eggs</b>, 🍳 <b>Breakfast & Sauce</b>, 🍜 <b>Packaged Food</b>, and a chilled 🥤 <b>Cold Drinks & Juices</b>! Here are top-rated pairings near ${area}:`;
        }

        // 2. Dairy / Milk / Bread
        if (ql.includes("milk") || ql.includes("dairy") || ql.includes("egg") || ql.includes("bread") || ql.includes("butter") || ql.includes("curd") || ql.includes("paneer")) {
          return `Fresh bread & eggs pair best with 🥛 <b>Dairy,Bread & Eggs</b>, 🥣 <b>Breakfast & Sauce</b>, ☕ <b>Tea, Coffee & More</b>, and refreshing 🥤 <b>Cold Drinks & Juices</b>!`;
        }

        // 3. Pet Care
        if (ql.includes("pet") || ql.includes("dog") || ql.includes("cat") || ql.includes("puppy") || ql.includes("kitten")) {
          return `Looking for pet supplies? 🐾 48 pet parents near ${area} ordered treats today! Try <b>Pet care</b>, <b>Cleaning Essentials</b>, and <b>Home needs</b>.`;
        }

        // 4. Baby Care
        if (ql.includes("baby") || ql.includes("infant") || ql.includes("diaper") || ql.includes("pamper") || ql.includes("toddler")) {
          return `For baby care, try <b>Baby care</b> essentials, <b>Bath & Body</b>, and <b>Pharmacy & Wellness</b>. 520 homes near ${area} trust these weekly.`;
        }

        // 5. Zepto Cafe / Coffee
        if (ql.includes("cafe") || ql.includes("coffee") || ql.includes("cold brew") || ql.includes("croissant") || ql.includes("zepto cafe") || ql.includes("chai") || ql.includes("tea")) {
          return `Craving a brew break? ☕ Try <b>Zepto Cafe</b>, <b>Tea, Coffee & More</b>, <b>Biscuits & Cookies</b>, and <b>Cold Drinks & Juices</b> delivered in 8 mins to ${area}!`;
        }

        // 6. Gifting
        if (ql.includes("gift") || ql.includes("gifting")) {
          return `Gift ideas for loved ones: 🍫 <b>Sweet Craving</b> hampers, ☕ <b>Zepto Cafe</b> boxes, and 💍 <b>Jewellery</b> curated for ${area}.`;
        }

        // 7. Home Care & Cleaning
        if (ql.includes("clean") || ql.includes("home care") || ql.includes("dishwash") || ql.includes("vim") || ql.includes("harpic") || ql.includes("mop") || ql.includes("floor") || ql.includes("lizol") || ql.includes("broom") || ql.includes("sweep")) {
          return `Based on your home routine, try <b>Cleaning Essentials</b>, <b>Home needs</b>, and <b>Kitchen & Dining</b> restocked by 2,400+ homes near ${area} this week.`;
        }

        // 8. Wellness
        if (ql.includes("wellness") || ql.includes("vitamin") || ql.includes("supplement") || ql.includes("multivitamin") || ql.includes("immunity") || ql.includes("protein")) {
          return `Based on your health profile, try <b>Pharmacy & Wellness</b> and <b>Protein & Nutrition</b> added by 900+ people near ${area} this month.`;
        }

        // 9. Seasonal / Monsoon
        if (ql.includes("monsoon") || ql.includes("rain") || ql.includes("season") || ql.includes("festive") || ql.includes("festival") || ql.includes("diwali") || ql.includes("holi")) {
          return `For this season, try <b>Munchies</b>, <b>Zepto Cafe</b>, <b>Tea, Coffee & More</b>, and <b>Cleaning Essentials</b>. 3,100+ people near ${area} are stocking up right now!`;
        }

        // 10. Trending / What’s popular
        if (ql.includes("trending") || ql.includes("popular") || ql.includes("buying") || ql.includes("people near") || ql.includes("neighbours")) {
          return `🔥 Top trending near ${area} this week: <b>Dairy,Bread & Eggs</b>, <b>Munchies</b> & <b>Zepto Cafe</b> — combined 12,000+ orders in your neighborhood!`;
        }

        // 11. Personal Care
        if (ql.includes("personal care") || ql.includes("face wash") || ql.includes("sunscreen") || ql.includes("lotion") || ql.includes("shampoo") || ql.includes("beauty") || ql.includes("skin")) {
          return `Based on your interest, try <b>Self care Studio</b>, <b>Skincare</b>, and <b>Bath & Body</b> essentials loved by shoppers near ${area}.`;
        }

        // 12. Healthy Snacks
        if (ql.includes("healthy") || ql.includes("makhana") || ql.includes("nuts") || ql.includes("dry fruit")) {
          return `Smart choice! 🌰 Here are healthy options — <b>Masala & Dry Fruits</b> and <b>Protein & Nutrition</b> bars that 2,800+ health-conscious shoppers near ${area} love.`;
        }

        // 13. Snacks
        if (ql.includes("snack") || ql.includes("munch") || ql.includes("biscuit") || ql.includes("cookie") || ql.includes("chips") || ql.includes("popcorn")) {
          return `Based on your snacking habit, try <b>Munchies</b>, <b>Snacks & Packaged Foods</b>, and <b>Biscuits & Cookies</b>.`;
        }

        // 14. Fresh Fruits & Veggies
        if (ql.includes("fruit") || ql.includes("veggie") || ql.includes("vegetable") || ql.includes("fresh") || ql.includes("apple") || ql.includes("banana") || ql.includes("tomato")) {
          return `Based on your cart, you might love <b>Fruits & vegetables</b> freshly sourced every morning for ${area}.`;
        }

        // 15. Breakfast
        if (ql.includes("breakfast") || ql.includes("cereal") || ql.includes("morning") || ql.includes("muesli") || ql.includes("oats")) {
          return `Good morning! 🥣 Try <b>Breakfast & Sauce</b>, <b>Dairy,Bread & Eggs</b>, and <b>Tea, Coffee & More</b> loved by 1,800+ families near ${area}.`;
        }

        // 16. Cold Drinks
        if (ql.includes("drink") || ql.includes("juice") || ql.includes("soda") || ql.includes("cold drink") || ql.includes("thirsty")) {
          return `Feeling thirsty? 🥤 Try <b>Cold Drinks & Juices</b>, <b>Tea, Coffee & More</b>, and <b>Zepto Cafe</b> — 4,200+ orders near ${area} this week.`;
        }

        // Generic fallback
        return `Based on your last orders, I’ve curated these picks for you — trending right now near ${area}! 🔥`;
      }

      /* Map a query to relevant product categories to show as cards */
            function getQueryCategories(ql) {
        if (ql.includes("paan") || ql.includes("mouth freshener") || ql.includes("gulkand") || ql.includes("supari")) return ["Paan Corner", "Sweet Craving", "Munchies"];
        if (ql.includes("plants") || ql.includes("gardening") || ql.includes("pot") || ql.includes("succulent")) return ["Plants", "Home Decor", "Kitchen & Dining"];
        if (ql.includes("home decor") || ql.includes("candle") || ql.includes("vase") || ql.includes("lights")) return ["Home Decor", "Plants", "Kitchen & Dining"];
        if (ql.includes("atta, rice") || ql.includes("atta") || ql.includes("rice") || ql.includes("dal") || ql.includes("dals")) return ["Atta, Rice & Dals", "Groceries & Staples", "Masala & Dry Fruits"];
        if (ql.includes("biscuits") || ql.includes("cookies") || ql.includes("oreo")) return ["Biscuits & Cookies", "Tea, Coffee & More", "Sweet Craving"];
        if (ql.includes("sweet craving") || ql.includes("chocolate") || ql.includes("silk") || ql.includes("ferrero")) return ["Sweet Craving", "Ice Creams & More", "Biscuits & Cookies"];
        if (ql.includes("packaged food") || ql.includes("yippee") || ql.includes("ramen")) return ["Packaged Food", "Munchies", "Breakfast & Sauce"];
        if (ql.includes("meat") || ql.includes("chicken") || ql.includes("mutton") || ql.includes("fish")) return ["Meat, Fish & Eggs", "Dairy,Bread & Eggs", "Groceries & Staples"];
        if (ql.includes("masala") || ql.includes("dry fruit") || ql.includes("almond") || ql.includes("cashew") || ql.includes("raisin")) return ["Masala & Dry Fruits", "Groceries & Staples", "Atta, Rice & Dals"];
        if (ql.includes("ice cream") || ql.includes("baskin") || ql.includes("havmor")) return ["Ice Creams & More", "Sweet Craving", "Frozen Food"];
        if (ql.includes("frozen") || ql.includes("mccain") || ql.includes("fries") || ql.includes("nuggets")) return ["Frozen Food", "Ice Creams & More", "Zepto Cafe"];
        if (ql.includes("skincare") || ql.includes("serum") || ql.includes("derma")) return ["Skincare", "Self care Studio", "Bath & Body"];
        if (ql.includes("makeup") || ql.includes("lipstick") || ql.includes("eyeliner") || ql.includes("cosmetics")) return ["Makeup & Beauty", "Skincare", "Fragrance"];
        if (ql.includes("bath") || ql.includes("shower gel") || ql.includes("soap") || ql.includes("body wash")) return ["Bath & Body", "Skincare", "Self care Studio"];
        if (ql.includes("haircare") || ql.includes("shampoo") || ql.includes("hair oil") || ql.includes("conditioner")) return ["Haircare", "Bath & Body", "Self care Studio"];
        if (ql.includes("self care") || ql.includes("sheet mask") || ql.includes("roller")) return ["Self care Studio", "Skincare", "Bath & Body"];
        if (ql.includes("fragrance") || ql.includes("perfume") || ql.includes("body mist") || ql.includes("deo")) return ["Fragrance", "Self care Studio", "Makeup & Beauty"];
        if (ql.includes("protein") || ql.includes("nutrition") || ql.includes("whey") || ql.includes("peanut butter")) return ["Protein & Nutrition", "Pharmacy & Wellness", "Masala & Dry Fruits"];
        if (ql.includes("stationery") || ql.includes("notebook") || ql.includes("highlighter") || ql.includes("books")) return ["Stationery& Books", "Home needs", "Toys & games"];
        if (ql.includes("toys") || ql.includes("games") || ql.includes("blocks") || ql.includes("puzzle")) return ["Toys & games", "Stationery& Books", "Home Decor"];
        if (ql.includes("gourmet") || ql.includes("olive oil") || ql.includes("barilla")) return ["Gourmet", "Breakfast & Sauce", "Kitchen & Dining"];
        if (ql.includes("kitchen & dining") || ql.includes("frying pan") || ql.includes("container") || ql.includes("mug")) return ["Kitchen & Dining", "Home needs", "Cleaning Essentials"];
        if (ql.includes("other categories") || ql.includes("other category") || ql.includes("categories")) return ["Home needs", "Apparel", "Jewellery", "Kitchen & Dining", "Electronics store"];
        if (ql.includes("apparel") || ql.includes("apparels") || ql.includes("clothing") || ql.includes("fashion")) return ["Apparel", "Self care Studio", "Fragrance"];
        if (ql.includes("jewellery") || ql.includes("jewelry") || ql.includes("pendant") || ql.includes("necklace")) return ["Jewellery", "Sweet Craving", "Zepto Cafe"];
        if (ql.includes("home needs") || ql.includes("tissue") || ql.includes("tissues")) return ["Home needs", "Kitchen & Dining", "Cleaning Essentials"];
        if (ql.includes("electronics") || ql.includes("earbuds")) return ["Electronics store", "Home needs", "Stationery& Books"];
        if (ql.includes("gift") || ql.includes("gifting")) return ["Gifting", "Sweet Craving", "Jewellery"];
        if (ql.includes("noodle") || ql.includes("pasta") || ql.includes("maggi") || ql.includes("ramen")) return ["Meat, Fish & Eggs", "Breakfast & Sauce", "Packaged Food", "Cold Drinks & Juices"];
        if (ql.includes("milk") || ql.includes("dairy") || ql.includes("egg") || ql.includes("bread") || ql.includes("butter") || ql.includes("curd") || ql.includes("paneer")) return ["Dairy,Bread & Eggs", "Breakfast & Sauce", "Tea, Coffee & More", "Cold Drinks & Juices"];
        if (ql.includes("pet") || ql.includes("dog") || ql.includes("cat") || ql.includes("puppy") || ql.includes("kitten")) return ["Pet care", "Cleaning Essentials", "Home needs"];
        if (ql.includes("baby") || ql.includes("infant") || ql.includes("diaper") || ql.includes("pamper") || ql.includes("toddler")) return ["Baby care", "Bath & Body", "Pharmacy & Wellness"];
        if (ql.includes("cafe") || ql.includes("coffee") || ql.includes("cold brew") || ql.includes("croissant") || ql.includes("zepto cafe") || ql.includes("chai") || ql.includes("tea")) return ["Zepto Cafe", "Tea, Coffee & More", "Biscuits & Cookies", "Cold Drinks & Juices"];
        if (ql.includes("clean") || ql.includes("mop") || ql.includes("floor") || ql.includes("lizol") || ql.includes("broom") || ql.includes("home care") || ql.includes("dishwash") || ql.includes("vim") || ql.includes("harpic")) return ["Cleaning Essentials", "Home needs", "Kitchen & Dining"];
        if (ql.includes("wellness") || ql.includes("vitamin") || ql.includes("supplement") || ql.includes("multivitamin") || ql.includes("immunity")) return ["Pharmacy & Wellness", "Protein & Nutrition", "Self care Studio"];
        if (ql.includes("personal care") || ql.includes("face wash") || ql.includes("sunscreen") || ql.includes("shampoo") || ql.includes("beauty") || ql.includes("skin")) return ["Self care Studio", "Skincare", "Bath & Body"];
        if (ql.includes("healthy") || ql.includes("makhana") || ql.includes("nuts")) return ["Masala & Dry Fruits", "Protein & Nutrition", "Snacks & Packaged Foods"];
        if (ql.includes("snack") || ql.includes("munch") || ql.includes("chips") || ql.includes("popcorn")) return ["Munchies", "Snacks & Packaged Foods", "Biscuits & Cookies"];
        if (ql.includes("fruit") || ql.includes("veggie") || ql.includes("vegetable") || ql.includes("fresh") || ql.includes("apple") || ql.includes("banana") || ql.includes("tomato")) return ["Fruits & vegetables", "Groceries & Staples", "Cold Drinks & Juices"];
        if (ql.includes("breakfast") || ql.includes("cereal") || ql.includes("morning") || ql.includes("muesli") || ql.includes("oats")) return ["Breakfast & Sauce", "Dairy,Bread & Eggs", "Tea, Coffee & More"];
        if (ql.includes("drink") || ql.includes("juice") || ql.includes("soda") || ql.includes("thirsty")) return ["Cold Drinks & Juices", "Tea, Coffee & More", "Zepto Cafe"];
        if (ql.includes("monsoon") || ql.includes("rain") || ql.includes("season") || ql.includes("festive") || ql.includes("festival")) return ["Munchies", "Zepto Cafe", "Tea, Coffee & More"];
        if (ql.includes("trending") || ql.includes("popular") || ql.includes("buying") || ql.includes("people near") || ql.includes("neighbours")) return ["Dairy,Bread & Eggs", "Munchies", "Zepto Cafe"];
        return ["Dairy,Bread & Eggs", "Munchies", "Cold Drinks & Juices"];
      }

      /* Get strip label emoji + text based on query type */
            function getStripLabel(ql) {
        if (ql.includes("paan") || ql.includes("mouth freshener") || ql.includes("gulkand") || ql.includes("supari")) return "🍃 Paan Corner Picks:";
        if (ql.includes("plants") || ql.includes("gardening")) return "🌿 Plants & Gardening Picks:";
        if (ql.includes("home decor")) return "🏡 Home Decor Picks:";
        if (ql.includes("atta, rice") || ql.includes("atta") || ql.includes("rice") || ql.includes("dal")) return "🌾 Atta, Rice & Dals:";
        if (ql.includes("biscuits") || ql.includes("cookies")) return "🍪 Biscuits & Cookies:";
        if (ql.includes("sweet craving") || ql.includes("chocolate")) return "🍫 Sweet Craving Picks:";
        if (ql.includes("packaged food")) return "🍜 Packaged Food Picks:";
        if (ql.includes("meat") || ql.includes("chicken") || ql.includes("mutton") || ql.includes("fish")) return "🥩 Meat, Fish & Eggs:";
        if (ql.includes("masala") || ql.includes("dry fruit")) return "🥜 Masala & Dry Fruits:";
        if (ql.includes("ice cream")) return "🍦 Ice Creams & Desserts:";
        if (ql.includes("frozen")) return "🍟 Frozen Foods:";
        if (ql.includes("skincare")) return "🧴 Skincare Essentials:";
        if (ql.includes("makeup")) return "💄 Makeup & Cosmetics:";
        if (ql.includes("bath")) return "🧼 Bath & Body Picks:";
        if (ql.includes("haircare")) return "💇 Haircare Studio:";
        if (ql.includes("self care")) return "💅 Self Care Studio:";
        if (ql.includes("fragrance") || ql.includes("perfume")) return "✨ Fragrances & Deos:";
        if (ql.includes("protein") || ql.includes("nutrition")) return "💪 Protein & Nutrition:";
        if (ql.includes("stationery") || ql.includes("books")) return "✏️ Stationery & Books:";
        if (ql.includes("toys") || ql.includes("games")) return "🧸 Toys & Games:";
        if (ql.includes("gourmet")) return "🍝 Gourmet & World Food:";
        if (ql.includes("kitchen & dining")) return "🍽️ Kitchen & Dining:";
        if (ql.includes("other categories") || ql.includes("other category") || ql.includes("categories")) return "🛍️ Other Categories (Non-Grocery Picks):";
        if (ql.includes("apparel") || ql.includes("apparels") || ql.includes("clothing") || ql.includes("fashion")) return "👔 Apparel & Fashion Picks:";
        if (ql.includes("jewel")) return "💍 Jewellery & Accessories:";
        if (ql.includes("home needs")) return "🧻 Home Needs & Household Essentials:";
        if (ql.includes("electronics")) return "🎧 Electronics & Accessories:";
        if (ql.includes("clean") || ql.includes("mop") || ql.includes("floor") || ql.includes("lizol") || ql.includes("broom") || ql.includes("cleaning")) return "🧹 Cleaning Essentials:";
        if (ql.includes("gift") || ql.includes("gifting")) return "🎁 Suggested Gifting Items:";
        if (ql.includes("noodle") || ql.includes("pasta") || ql.includes("maggi")) return "🍜 Noodle Pairings:";
        if (ql.includes("milk") || ql.includes("dairy") || ql.includes("egg") || ql.includes("bread") || ql.includes("butter") || ql.includes("curd") || ql.includes("paneer")) return "🥛 Dairy,Bread & Eggs Picks:";
        if (ql.includes("pet") || ql.includes("dog") || ql.includes("cat") || ql.includes("puppy")) return "🐾 Top Pet Picks:";
        if (ql.includes("baby") || ql.includes("infant") || ql.includes("diaper")) return "🍼 Baby Essentials:";
        if (ql.includes("cafe") || ql.includes("coffee") || ql.includes("cold brew") || ql.includes("chai") || ql.includes("tea")) return "☕ Zepto Cafe Picks:";
        if (ql.includes("wellness") || ql.includes("vitamin") || ql.includes("supplement") || ql.includes("immunity")) return "💊 Wellness Picks:";
        if (ql.includes("healthy") || ql.includes("makhana") || ql.includes("nuts")) return "🌰 Healthy Picks Under ₹150:";
        if (ql.includes("snack") || ql.includes("munch") || ql.includes("chips") || ql.includes("popcorn")) return "🍿 Munchies & Snacks:";
        if (ql.includes("fruit") || ql.includes("veggie") || ql.includes("fresh") || ql.includes("vegetable")) return "🥦 Fresh Fruits & Vegetables:";
        if (ql.includes("breakfast") || ql.includes("cereal") || ql.includes("morning") || ql.includes("oats")) return "🥣 Morning Essentials:";
        if (ql.includes("drink") || ql.includes("juice") || ql.includes("soda") || ql.includes("thirsty")) return "🥤 Cold Drinks & Juices:";
        if (ql.includes("monsoon") || ql.includes("rain") || ql.includes("season")) return "🌧️ Monsoon Picks:";
        if (ql.includes("festive") || ql.includes("festival") || ql.includes("diwali") || ql.includes("holi")) return "🎉 Festive Essentials:";
        if (ql.includes("trending") || ql.includes("popular") || ql.includes("buying")) return "🔥 Trending Near You:";
        return "🔥 Trending Near You:";
      }


      window.addCafeProductToCart = function(btn, itemId) {
        const item = zeptoCafeMenu.find(x => x.id === itemId) || masterProductCatalog.find(x => x.id === itemId);
        if (!item) return;
        const key = `cafe-${item.id}`;

        if (cart.has(key)) {
          cart.delete(key);
          btn.classList.remove("in");
          btn.textContent = "+ ADD";
          delete cartItemsList[key];
          updateCartTotal();
          toast(`Removed ${item.nm} from cart`);
          return;
        }

        cart.add(key);
        btn.classList.add("in");
        btn.textContent = "✓ ADDED";
        cartItemsList[key] = item;
        updateCartTotal();
        markCategoryExplored("Zepto Cafe");
        logEvent("cart_added", "Zepto Cafe");
        toast(`Added ${item.nm} from Zepto Cafe 🎉`);
      };

      window.addChatProductItemToCart = function(btn, catName, itemNm, itemPr, itemEm, itemWt) {
        const key = `chat-${catName}-${itemNm.replace(/\s+/g, '-')}`;
        const p = {
          em: itemEm || "📦",
          nm: itemNm,
          wt: itemWt || "1 unit",
          pr: typeof itemPr === 'number' ? itemPr : parseInt(String(itemPr).replace(/[^0-9]/g, '')),
          cat: catName
        };

        if (cart.has(key) || cart.has(`chat-${catName}`)) {
          cart.delete(key);
          cart.delete(`chat-${catName}`);
          btn.classList.remove("in");
          btn.textContent = "+ ADD";
          delete cartItemsList[key];
          delete cartItemsList[`chat-${catName}`];
          updateCartTotal();
          toast(`Removed ${itemNm} from cart`);
        } else {
          cart.add(key);
          btn.classList.add("in");
          btn.textContent = "✓ ADDED";
          cartItemsList[key] = p;
          updateCartTotal();
          markCategoryExplored(catName);
          logEvent("cart_added", catName);
          toast(`Added ${itemNm} (₹${p.pr}) from ${catName} 🎉`);
        }
      };

      window.addChatProductToCart = function (btn, catName) {
        const template = categoryProducts[catName] || defaultProduct(catName);
        const key = `chat-${catName}`;
        const p = {
          em: template.em,
          nm: template.nm,
          wt: template.wt,
          pr: `₹${template.pr}`,
          was: template.was ? `₹${template.was}` : "",
          cat: catName
        };

        if (cart.has(key)) {
          cart.delete(key);
          delete cartItemsList[key];
          updateCartTotal();
          toast(`Removed ${p.nm} from cart`);
        } else {
          cart.add(key);
          cartItemsList[key] = p;
          updateCartTotal();
          logEvent("cart_added", catName);
          toast(`Added ${p.nm} — a first from ${catName} 🎉`);
        }

        renderChatMessages();
        render();
      };

      window.openCategoryFromChat = function (catName) {
        closeChat();
        markCategoryExplored(catName);
        const lowerCat = catName.toLowerCase();
        if (lowerCat.includes("paan")) {
          executeProductSearch("Paan");
          openProductSearch();
        } else if (((lowerCat.includes("gourmet") && !lowerCat.includes("chocolate")) || lowerCat.includes("pasta") || lowerCat.includes("sauce") || lowerCat.includes("snacks") || lowerCat.includes("munchies")) && !lowerCat.includes("gifting")) {
          changeSlide(0);
        } else if (lowerCat.includes("personal") || lowerCat.includes("wash") || lowerCat.includes("cheese") || lowerCat.includes("butter")) {
          changeSlide(1);
        } else if (lowerCat.includes("cereal") || lowerCat.includes("breakfast") || lowerCat.includes("dairy")) {
          changeSlide(2);
        } else {
          executeProductSearch(catName);
          openProductSearch();
        }
      };

      /* ---------- ZEPTO CAFE OFFICIAL MENU ITEMS ---------- */
      const zeptoCafeMenu = [
        { id: "zc1", em: "☕", nm: "Classic Cold Brew Coffee", wt: "250 ml", pr: "₹79", was: "₹99", cat: "Zepto Cafe" },
        { id: "zc2", em: "☕", nm: "Vietnamese Iced Coffee", wt: "250 ml", pr: "₹99", was: "₹120", cat: "Zepto Cafe" },
        { id: "zc3", em: "☕", nm: "Hazelnut Iced Latte", wt: "250 ml", pr: "₹109", was: "₹135", cat: "Zepto Cafe" },
        { id: "zc4", em: "☕", nm: "Hot Cappuccino", wt: "200 ml", pr: "₹69", was: "₹85", cat: "Zepto Cafe" },
        { id: "zc5", em: "🫖", nm: "Masala Cutting Chai", wt: "150 ml", pr: "₹39", was: "₹49", cat: "Zepto Cafe" },
        { id: "zc6", em: "🫖", nm: "Ginger Kulhad Chai", wt: "150 ml", pr: "₹45", was: "₹55", cat: "Zepto Cafe" },
        { id: "zc7", em: "🥐", nm: "Fresh Butter Croissant", wt: "1 pc", pr: "₹49", was: "₹59", cat: "Zepto Cafe" },
        { id: "zc8", em: "🥐", nm: "Chocolate Almond Croissant", wt: "1 pc", pr: "₹89", was: "₹110", cat: "Zepto Cafe" },
        { id: "zc9", em: "🫐", nm: "Blueberry Muffin", wt: "1 pc", pr: "₹65", was: "₹80", cat: "Zepto Cafe" },
        { id: "zc10", em: "🍪", nm: "Choco Chip Cookies", wt: "2 pcs", pr: "₹49", was: "₹60", cat: "Zepto Cafe" },
        { id: "zc11", em: "🥪", nm: "Classic Veg Cheese Sandwich", wt: "1 pc", pr: "₹79", was: "₹99", cat: "Zepto Cafe" },
        { id: "zc12", em: "🥪", nm: "Veg Corn & Cheese Grilled Sandwich", wt: "1 pc", pr: "₹99", was: "₹120", cat: "Zepto Cafe" },
        { id: "zc13", em: "🌯", nm: "Crispy Paneer Wrap", wt: "1 pc", pr: "₹119", was: "₹145", cat: "Zepto Cafe" },
        { id: "zc14", em: "🥟", nm: "Hot Samosa with Mint Chutney", wt: "2 pcs", pr: "₹45", was: "₹55", cat: "Zepto Cafe" },
        { id: "zc15", em: "🧆", nm: "Potato Cheese Balls", wt: "6 pcs", pr: "₹89", was: "₹110", cat: "Zepto Cafe" },
        { id: "zc16", em: "🍫", nm: "Belgian Chocolate Brownie", wt: "1 pc", pr: "₹89", was: "₹110", cat: "Zepto Cafe" },
        { id: "zc17", em: "🍰", nm: "Tiramisu Dessert Cup", wt: "1 pc", pr: "₹129", was: "₹150", cat: "Zepto Cafe" },
        { id: "zc18", em: "🧀", nm: "Garlic Cheese Toast", wt: "2 pcs", pr: "₹69", was: "₹85", cat: "Zepto Cafe" }
      ];

            /* Dynamically build masterProductCatalog from zeptoCafeMenu and categoryProductsCatalog */
      const catalogItemsFromCategories = Object.keys(categoryProductsCatalog).flatMap((catName, catIdx) => {
        return categoryProductsCatalog[catName].map((item, itemIdx) => ({
          id: `catprod-${catIdx}-${itemIdx}`,
          em: item.em,
          nm: item.nm,
          wt: item.wt,
          pr: typeof item.pr === 'number' ? `₹${item.pr}` : item.pr,
          was: item.was ? (typeof item.was === 'number' ? `₹${item.was}` : item.was) : "",
          cat: catName
        }));
      });

      const masterProductCatalog = [
        ...zeptoCafeMenu,
        ...catalogItemsFromCategories
      ];

      window.openProductSearch = function() {
        const overlay = $("#search-modal-overlay");
        if (overlay) {
          overlay.classList.add("show");
          const input = $("#prod-search-input");
          if (input) {
            input.value = "";
            renderSearchPopular();
            $("#search-default-view").style.display = "block";
            $("#search-results-view").style.display = "none";
            $("#prod-search-clear").style.display = "none";
            setTimeout(() => input.focus(), 100);
          }
        }
      };

      window.closeProductSearch = function() {
        const overlay = $("#search-modal-overlay");
        if (overlay) overlay.classList.remove("show");
      };

      window.executeProductSearch = function(query) {
        const input = $("#prod-search-input");
        if (input) {
          input.value = query;
          performProductSearchFilter(query);
        }
      };

      function renderSearchPopular() {
        const popularList = $("#search-popular-list");
        if (!popularList) return;
        const popularItems = masterProductCatalog.slice(0, 6);
        popularList.innerHTML = renderSearchProductCards(popularItems);
        bindSearchAddButtons(popularList, popularItems);
      }

      function performProductSearchFilter(query) {
        const q = query.trim().toLowerCase();
        const clearBtn = $("#prod-search-clear");
        if (clearBtn) clearBtn.style.display = q ? "flex" : "none";

        if (!q) {
          $("#search-default-view").style.display = "block";
          $("#search-results-view").style.display = "none";
          return;
        }

        $("#search-default-view").style.display = "none";
        $("#search-results-view").style.display = "block";

        const matches = masterProductCatalog.filter(p => 
          p.nm.toLowerCase().includes(q) || 
          p.cat.toLowerCase().includes(q) ||
          p.wt.toLowerCase().includes(q)
        );

        const countEl = $("#search-results-count");
        const listEl = $("#search-results-list");

        if (matches.length === 0) {
          if (countEl) countEl.textContent = `No products found for "${query}"`;
          if (listEl) {
            listEl.innerHTML = `
              <div class="search-empty-state">
                <div class="icon">🔍</div>
                <h4>No matching items found</h4>
                <p>Try searching for staples like "milk", "atta", "eggs", "coffee", or "maggi"</p>
              </div>`;
          }
        } else {
          if (countEl) countEl.textContent = `Found ${matches.length} product${matches.length > 1 ? 's' : ''} for "${query}"`;
          if (listEl) {
            listEl.innerHTML = renderSearchProductCards(matches);
            bindSearchAddButtons(listEl, matches);
          }
        }
      }

      function renderSearchProductCards(items) {
        return items.map((p) => {
          const itemKey = `search-${p.id}`;
          const isAdded = cart.has(itemKey);
          return `
            <div class="search-prod-card">
              <div class="search-prod-emoji">${p.em}</div>
              <div class="search-prod-info">
                <div class="search-prod-name">${p.nm}</div>
                <div class="search-prod-meta">${p.wt} <span class="search-prod-cat">${p.cat}</span></div>
                <div class="search-prod-price">${p.pr}${p.was ? `<s>${p.was}</s>` : ''}</div>
              </div>
              <button class="search-add-btn ${isAdded ? 'in' : ''}" data-key="${itemKey}" data-id="${p.id}">${isAdded ? '✓ ADDED' : '+ ADD'}</button>
            </div>`;
        }).join("");
      }

      function bindSearchAddButtons(containerEl, itemsList) {
        containerEl.querySelectorAll(".search-add-btn").forEach(btn => {
          btn.onclick = () => {
            const itemKey = btn.dataset.key;
            const pId = btn.dataset.id;
            const item = itemsList.find(x => x.id === pId) || masterProductCatalog.find(x => x.id === pId);
            if (!item) return;

            if (cart.has(itemKey)) {
              cart.delete(itemKey);
              btn.classList.remove("in");
              btn.textContent = "+ ADD";
              delete cartItemsList[itemKey];
              updateCartTotal();
              return;
            }

            cart.add(itemKey);
            btn.classList.add("in");
            btn.textContent = "✓ ADDED";
            cartItemsList[itemKey] = item;
            updateCartTotal();

            markCategoryExplored(item.cat);
            logEvent("cart_added", item.cat);
            toast(`Added ${item.nm} to cart 🎉`);
          };
        });
      }

      /* Bind Search Box click handler to open Product Search */
      const searchBoxEl = $("#search-box");
      if (searchBoxEl) {
        searchBoxEl.onclick = () => openProductSearch();
      }

      const closeSearchModalBtn = $("#close-search-modal");
      if (closeSearchModalBtn) {
        closeSearchModalBtn.onclick = () => closeProductSearch();
      }

      const prodSearchInputBtn = $("#prod-search-input");
      if (prodSearchInputBtn) {
        prodSearchInputBtn.oninput = (e) => performProductSearchFilter(e.target.value);
      }

      const prodSearchClearBtn = $("#prod-search-clear");
      if (prodSearchClearBtn) {
        prodSearchClearBtn.onclick = () => {
          if (prodSearchInputBtn) {
            prodSearchInputBtn.value = "";
            performProductSearchFilter("");
            prodSearchInputBtn.focus();
          }
        };
      }

      /* User Profile Avatar click handler - prevent opening AI Chat or Location modal */
      const headerAvatar = $("#header-avatar");
      if (headerAvatar) {
        headerAvatar.onclick = (e) => {
          e.stopPropagation();
        };
      }

      document.querySelectorAll(".ask .q button").forEach(b => {
        b.onclick = (e) => {
          e.stopPropagation();
          openChat(b.dataset.a);
        };
      });



      document.querySelectorAll(".q-chip-btn").forEach(btn => {
        btn.onclick = () => {
          const text = btn.textContent;
          sendChatMessage(text);
        };
      });

      $("#close-chat").onclick = closeChat;
      $("#chat-overlay").onclick = (e) => {
        if (e.target === $("#chat-overlay")) closeChat();
      };

      $("#send-chat").onclick = () => {
        const val = $("#chat-input").value;
        $("#chat-input").value = "";
        sendChatMessage(val);
      };

      $("#chat-input").onkeydown = (e) => {
        if (e.key === "Enter") {
          const val = $("#chat-input").value;
          $("#chat-input").value = "";
          sendChatMessage(val);
        }
      };

      /* Trending discovery rotating placeholders for passive category discovery */
      const trendingDiscoveryWords = [
        "try: monsoon snacks",
        "try: baby care essentials",
        "try: cold brew coffee",
        "try: gourmet pasta sauces",
        "try: health & wellness boosters",
        "try: artisan butter & cheese"
      ];
      let wi = 0;
      setInterval(() => {
        wi = (wi + 1) % trendingDiscoveryWords.length;
        const typedEl = $("#typed");
        if (typedEl) typedEl.textContent = trendingDiscoveryWords[wi];
      }, 2200);

      /* Location Selector Logic */
      function renderDarkStoresList(filteredList = null) {
        const container = $("#dark-stores-list");
        if (!container) return;
        
        if (!filteredList || filteredList.length === 0) {
          container.innerHTML = `<div style="text-align:center; padding: 20px 16px; color: var(--ink-3); font-size:13px; font-weight:600;">📍 Use GPS auto-detection above or search by pincode/area to set your location.</div>`;
          return;
        }
        
        container.innerHTML = filteredList.map(ds => {
          const isActive = (ds.pincode === currentLocation.pincode);
          return `
            <div class="loc-card ${isActive ? 'active' : ''}" onclick="selectLocation('${ds.pincode}')">
              <div class="loc-info">
                <h4>📍 ${ds.name} ${isActive ? '✓' : ''}</h4>
              </div>
              <div class="loc-badge">${ds.eta}</div>
            </div>
          `;
        }).join("");
      }

      window.selectLocation = function(pincode) {
        const target = DARK_STORES_FRONTEND.find(ds => ds.pincode === pincode) || {
          pincode: pincode,
          name: `Area (${pincode})`,
          address: `Location · ${pincode}`,
          eta: "8 mins ⚡",
          riders: 20
        };
        
        currentLocation = target;
        
        // Update header UI
        const cleanEta = currentLocation.eta.replace(/⚡/g, "").trim();
        $("#header-eta").innerHTML = `Delivery in ${cleanEta} <span class="flash">⚡</span>`;
        $("#header-loc-name").textContent = `${currentLocation.address} ▾`;

        // Update social proof text dynamically
        const areaName = currentLocation.name.split(',')[0].trim();
        const proofEl = $("#proof-txt");
        if (proofEl) {
          proofEl.textContent = `2,300+ people near ${areaName} tried this category first through Discover.`;
        }
        
        // Render active selection, card proof text, and category entry strips across all 4 rows
        render();
        renderNewCatsEntry();
        renderTrendingAreaSection();
        renderSeasonalNudgeSection();
        renderDarkStoresList(null);
        
        // Close modal
        closeLocationModal();
        
        // Refresh recommendations from API
        if (apiLive) {
          fetchVariantAndRecommendations();
        }
        
        toast(`📍 Location updated to ${currentLocation.name} (${currentLocation.eta})`);
      };

      function openLocationModal() {
        const inputEl = $("#loc-search-input");
        if (inputEl) inputEl.value = "";
        renderDarkStoresList(null);
        $("#loc-overlay").classList.add("show");
      }

      function closeLocationModal() {
        $("#loc-overlay").classList.remove("show");
      }

      // Bind location trigger events
      const locTrigger = $("#loc-selector-trigger");
      if (locTrigger) locTrigger.onclick = openLocationModal;

      const closeLocBtn = $("#close-loc");
      if (closeLocBtn) closeLocBtn.onclick = closeLocationModal;

      const locOverlay = $("#loc-overlay");
      if (locOverlay) {
        locOverlay.onclick = (e) => {
          if (e.target === locOverlay) closeLocationModal();
        };
      }

      // Search / Pincode lookup
      const btnSearchLoc = $("#btn-search-loc");
      if (btnSearchLoc) btnSearchLoc.onclick = performLocSearch;

      const locSearchInput = $("#loc-search-input");
      if (locSearchInput) {
        locSearchInput.onkeyup = (e) => {
          if (e.key === "Enter") performLocSearch();
        };
      }

      function performLocSearch() {
        const inputEl = $("#loc-search-input");
        if (!inputEl) return;
        const query = inputEl.value.trim().toLowerCase();
        if (!query) {
          renderDarkStoresList(null);
          return;
        }
        const filtered = DARK_STORES_FRONTEND.filter(ds => 
          ds.pincode.includes(query) || ds.name.toLowerCase().includes(query) || ds.address.toLowerCase().includes(query)
        );
        if (filtered.length > 0) {
          renderDarkStoresList(filtered);
        } else {
          renderDarkStoresList([{
            pincode: query,
            name: `Custom Location (${query})`,
            address: `Custom · ${query}`,
            eta: "9 mins ⚡",
            riders: 15
          }]);
        }
      }

      // Precise Address Extraction Utility
      function extractPreciseAddress(data, fallbackNearest) {
        const addr = data.address || {};
        const street = addr.road || addr.pedestrian || addr.footway || addr.building || addr.amenity || "";
        const area = addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || addr.hamlet || addr.village || addr.city_district || addr.subdistrict || addr.locality || "";
        const city = addr.city || addr.town || addr.municipality || addr.state_district || "";
        const pincode = addr.postcode || fallbackNearest.pincode;

        let localName = "";
        if (street && area) {
          localName = `${street}, ${area}`;
        } else if (area) {
          localName = area;
        } else if (street) {
          localName = street;
        } else if (city) {
          localName = city;
        } else {
          localName = data.display_name ? data.display_name.split(',')[0].trim() : fallbackNearest.name;
        }

        const locationName = (city && !localName.toLowerCase().includes(city.toLowerCase())) ? `${localName}, ${city}` : localName;
        return { locationName, pincode };
      }

      // Multi-Source Reverse Geocoding Helper
      async function reverseGeocodePrecise(lat, lon, fallbackNearest) {
        // Attempt 1: OpenStreetMap Nominatim zoom=18 (Street/Block Level Precision)
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=18&addressdetails=1`, { 
            headers: { 'Accept-Language': 'en' },
            signal: AbortSignal.timeout(3500) 
          });
          if (res.ok) {
            const data = await res.json();
            const parsed = extractPreciseAddress(data, fallbackNearest);
            if (parsed && parsed.locationName) return parsed;
          }
        } catch (e) {
          console.log("Nominatim reverse geocode attempt failed, trying fallback...", e);
        }

        // Attempt 2: BigDataCloud Reverse Geocoding Client API (Fast locality resolution)
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`, {
            signal: AbortSignal.timeout(3500)
          });
          if (res.ok) {
            const data = await res.json();
            const locality = data.locality || data.city || data.principalSubdivision || "";
            const city = (data.city && data.city !== locality) ? data.city : "";
            const postcode = data.postcode || fallbackNearest.pincode;
            const locationName = city ? `${locality}, ${city}` : locality;
            if (locationName) return { locationName, pincode: postcode };
          }
        } catch (e) {
          console.log("BigDataCloud reverse geocode attempt failed", e);
        }

        // Fallback: Return Nearest Dark Store Hub
        return { locationName: fallbackNearest.name, pincode: fallbackNearest.pincode };
      }

      // High-Precision GPS Geolocation Handler
      const btnDetectLoc = $("#btn-detect-location");
      if (btnDetectLoc) {
        btnDetectLoc.onclick = () => {
          if ("geolocation" in navigator) {
            $("#detect-loc-txt").textContent = "Acquiring High-Precision GPS Fix...";
            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                $("#detect-loc-txt").textContent = "Use Current Location (GPS)";
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                const accuracyMeters = Math.round(pos.coords.accuracy || 0);
                
                // Calculate distance to nearest registered Dark Store Hub using Haversine formula
                let nearestStore = DARK_STORES_FRONTEND[0];
                let minDistance = calculateDistance(lat, lon, nearestStore.lat, nearestStore.lon);
                for (const store of DARK_STORES_FRONTEND) {
                  const dist = calculateDistance(lat, lon, store.lat, store.lon);
                  if (dist < minDistance) {
                    minDistance = dist;
                    nearestStore = store;
                  }
                }
                
                // High-precision reverse geocoding
                const geocoded = await reverseGeocodePrecise(lat, lon, nearestStore);
                const locationName = geocoded.locationName;
                const pincode = geocoded.pincode;
                
                const calculatedEta = minDistance < 15 ? `${Math.max(6, Math.round(minDistance * 1.2 + 5))} mins ⚡` : nearestStore.eta;
                
                currentLocation = {
                  pincode: pincode,
                  name: locationName,
                  address: `GPS · ${locationName}`,
                  eta: calculatedEta,
                  riders: Math.max(15, Math.round(30 - minDistance * 0.3))
                };
                
                const cleanEta = currentLocation.eta.replace(/⚡/g, "").trim();
                $("#header-eta").innerHTML = `Delivery in ${cleanEta} <span class="flash">⚡</span>`;
                $("#header-loc-name").textContent = `${currentLocation.address} ▾`;
                render();
                renderNewCatsEntry();
                renderTrendingAreaSection();
                renderSeasonalNudgeSection();
                renderDarkStoresList(null);
                closeLocationModal();
                if (apiLive) fetchVariantAndRecommendations();
                toast(`📍 GPS Fixed (±${accuracyMeters}m): ${locationName} (${currentLocation.eta})`);
              },
              (err) => {
                $("#detect-loc-txt").textContent = "Use Current Location (GPS)";
                toast("⚠️ GPS access denied or unavailable. Please select your area manually.");
              },
              { 
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 10000 
              }
            );
          } else {
            toast("⚠️ GPS not supported in browser.");
          }
        };
      }

      /* ---------- Row 1: Categories you haven't explored ---------- */
      const untriedCategories = [
        { em: "🍎", name: "Fruits & Vegetables", query: "Show me recommendations in Fruits & vegetables" },
        { em: "🥛", name: "Dairy, Bread & Eggs", query: "Show me recommendations in Dairy,Bread & Eggs" },
        { em: "🌾", name: "Atta, Rice & Dals",    query: "Show me recommendations in Atta, Rice & Dals" },
        { em: "🍿", name: "Munchies & Snacks",   query: "Show me recommendations in Munchies" },
        { em: "☕", name: "Zepto Cafe",         query: "Show me recommendations in Zepto Cafe" },
        { em: "🥤", name: "Cold Drinks & Juices",query: "Show me recommendations in Cold Drinks & Juices" },
        { em: "🍪", name: "Biscuits & Cookies",  query: "Show me recommendations in Biscuits & Cookies" },
        { em: "🍫", name: "Sweet Craving",       query: "Show me recommendations in Sweet Craving" },
        { em: "🍳", name: "Breakfast & Sauces", query: "Show me recommendations in Breakfast & Sauce" },
        { em: "🍜", name: "Packaged Foods",      query: "Show me recommendations in Packaged Food" },
        { em: "🥩", name: "Meat, Fish & Eggs",   query: "Show me recommendations in Meat, Fish & Eggs" },
        { em: "🥜", name: "Masala & Dry Fruits", query: "Show me recommendations in Masala & Dry Fruits" },
        { em: "🍦", name: "Ice Creams & More",   query: "Show me recommendations in Ice Creams & More" },
        { em: "🍟", name: "Frozen Foods",        query: "Show me recommendations in Frozen Food" },
        { em: "🍵", name: "Tea & Coffee",        query: "Show me recommendations in Tea, Coffee & More" },
        { em: "🧴", name: "Skincare & Beauty",   query: "Show me recommendations in Skincare" },
        { em: "💄", name: "Makeup & Cosmetics",  query: "Show me recommendations in Makeup & Beauty" },
        { em: "🧼", name: "Bath & Body",         query: "Show me recommendations in Bath & Body" },
        { em: "💇", name: "Haircare Studio",     query: "Show me recommendations in Haircare" },
        { em: "💅", name: "Self Care Studio",    query: "Show me recommendations in Self care Studio" },
        { em: "✨", name: "Fragrances",          query: "Show me recommendations in Fragrance" },
        { em: "🍼", name: "Baby Care",           query: "Show me recommendations in Baby care" },
        { em: "🐾", name: "Pet Care",            query: "I've never bought pet supplies — where do I start?" },
        { em: "🧹", name: "Cleaning Essentials",query: "Show me recommendations in Cleaning Essentials" },
        { em: "🍽️", name: "Kitchen & Dining",    query: "Show me recommendations in Kitchen & Dining" },
        { em: "🏠", name: "Home Needs",          query: "Show me recommendations in Home needs" },
        { em: "💊", name: "Pharmacy & Wellness",query: "Show me recommendations in Pharmacy & Wellness" },
        { em: "💪", name: "Protein & Nutrition", query: "Show me recommendations in Protein & Nutrition" },
        { em: "✏️", name: "Stationery & Books",  query: "Show me recommendations in Stationery& Books" },
        { em: "🧸", name: "Toys & Games",        query: "Show me recommendations in Toys & games" },
        { em: "👕", name: "Apparel & Lifestyle", query: "Show me recommendations in Apparel" },
        { em: "💍", name: "Jewellery",           query: "Show me recommendations in Jewellery" },
        { em: "🍝", name: "Gourmet & World Food",query: "Show me recommendations in Gourmet" },
        { em: "🎁", name: "Gifting",             query: "Show me recommendations in Gifting" },
        { em: "🌿", name: "Plants & Gardening",  query: "Show me recommendations in Plants" },
        { em: "⚡", name: "Electronics",         query: "Show me recommendations in Electronics" },
        { em: "🏡", name: "Home Decor",          query: "Show me recommendations in Home Decor" },
        { em: "🍃", name: "Paan Corner",         query: "Show me recommendations in Paan Corner" }
      ];

      function renderNewCatsEntry() {
        const container = $("#new-cats-entry");
        if (!container) return;
        if (typeof loadExploredCategories === "function") loadExploredCategories();

        let filtered = untriedCategories.filter(c => {
          if (userPreferences.noPet && c.name.toLowerCase().includes("pet")) return false;
          const cleanName = c.name.toLowerCase();
          for (let exp of exploredCategories) {
            const cleanExp = exp.toLowerCase();
            if (cleanName === cleanExp) {
              return false;
            }
          }
          return true;
        });

        if (filtered.length < 6) {
          filtered = untriedCategories.filter(c => !(userPreferences.noPet && c.name.toLowerCase().includes("pet")));
        }

        const pills = filtered.map((c, i) => `
          <div class="cat-pill" onclick="openChat('${c.query.replace(/'/g, "&apos;")}')" title="${c.name}">
            <span class="new-dot"></span>
            <span class="pem">${c.em}</span>
            <span class="pnm">${c.name}</span>
          </div>
        `).join("");

        container.innerHTML = `
          <div class="nce-head">
            <h2>Categories you haven't explored</h2>
            <p>Tap to explore new picks in 8m</p>
          </div>
          <div class="nce-strip">${pills}</div>
        `;
      }

      /* ---------- Row 3: Trending in your building/area ---------- */
      const trendingData = [
        { icon: "🍝", title: "Gourmet & Sauces", desc: "Chilli Garlic & Artisan Sauces", stat: "🔥 1,420 orders near you", badge: "TOP PAIRING", query: "Show me recommendations in Gourmet & World Food" },
        { icon: "🍼", title: "Baby Care Essentials", desc: "Diapers, Wipes & Baby Food", stat: "🍼 520 homes this week", badge: "FASTEST GROWING", query: "Show me recommendations in Baby Care" },
        { icon: "☕", title: "Zepto Cafe Brews", desc: "Fresh Cold Brew & Croissants", stat: "☕ 1,800+ orders today", badge: "DELIVERED IN 8M", query: "Show me recommendations in Zepto Cafe" },
        { icon: "💊", title: "Wellness & Immunity", desc: "Effervescent Vit C & Proteins", stat: "💊 900+ health boosters", badge: "HEALTH BOOST", query: "Show me recommendations in Wellness" }
      ];

      function renderTrendingAreaSection() {
        const container = $("#trending-area-section");
        if (!container) return;
        const area = getAreaName();
        const cards = trendingData.map(t => {
          const statLocalized = t.stat.replace(/near you/g, `near ${area}`);
          return `
            <div class="t-card" onclick="openChat('${t.query}')">
              <span class="t-badge">${t.badge}</span>
              <span class="t-icon">${t.icon}</span>
              <span class="t-title">${t.title}</span>
              <span class="t-desc">${t.desc}</span>
              <span class="t-stat">${statLocalized}</span>
            </div>
          `;
        }).join("");

        container.innerHTML = `
          <div class="trending-sec">
            <div class="t-head">
              <h2>🏢 Trending near ${area}</h2>
              <p>Top ordered categories across your neighborhood this week</p>
            </div>
            <div class="t-cards">${cards}</div>
          </div>
        `;
      }

      /* ---------- Row 4: Seasonal / Occasion-based category nudge ---------- */
      const seasonalProducts = [
        { key: "sn-1", em: "🫖", nm: "Ginger Chai & Samosa Mix", wt: "2 servings", pr: "₹89", was: "₹110", cat: "Zepto Cafe" },
        { key: "sn-2", em: "🌧️", nm: "Waterproof Shoe Covers", wt: "1 pair", pr: "₹149", was: "₹199", cat: "Home Care" },
        { key: "sn-3", em: "🌽", nm: "Spiced Roasted Corn", wt: "150 g", pr: "₹79", was: "₹99", cat: "Healthy Snacks" },
        { key: "sn-4", em: "🍪", nm: "Fresh Baked Oat Cookies", wt: "150 g", pr: "₹80", was: "₹95", cat: "Biscuits & Cookies" }
      ];

      function renderSeasonalNudgeSection() {
        const container = $("#seasonal-nudge-section");
        if (!container) return;
        const area = getAreaName();
        const items = seasonalProducts.map(p => {
          const isAdded = cart.has(p.key);
          return `
            <div class="s-item">
              <div class="img">${p.em}</div>
              <div class="nm">${p.nm}</div>
              <div class="cat-tag">${p.cat}</div>
              <div class="row">
                <div class="pr">${p.pr}${p.was ? `<s>${p.was}</s>` : ""}</div>
                <button class="add ${isAdded ? 'in' : ''}" onclick="addSeasonalProductToCart(this, '${p.key}')">${isAdded ? '✓ ADDED' : 'ADD'}</button>
              </div>
            </div>
          `;
        }).join("");

        container.innerHTML = `
          <div class="seasonal-sec">
            <div class="s-head">
              <h2>🌧️ Monsoon Evening Snacks</h2>
              <p>Curated for tea breaks & rainy afternoons in ${area}</p>
            </div>
            <div class="s-grid">${items}</div>
          </div>
        `;
      }

      window.addSeasonalProductToCart = function(btn, key) {
        const p = seasonalProducts.find(item => item.key === key);
        if (!p) return;
        if (cart.has(key)) {
          cart.delete(key);
          delete cartItemsList[key];
          btn.classList.remove("in");
          btn.textContent = "ADD";
          toast(`Removed ${p.nm} from cart`);
        } else {
          cart.add(key);
          cartItemsList[key] = p;
          btn.classList.add("in");
          btn.textContent = "✓ ADDED";
          markCategoryExplored(p.cat);
          logEvent("cart_added", p.cat);
          toast(`Added ${p.nm} — monsoon treat! 🌧️`);
        }
        updateCartTotal();
        render();
      };

      /* ---------- Price-Drop & Restock Discovery Triggers ---------- */
      const discoveryAlerts = [
        {
          key: "alert-1",
          type: "price-drop",
          badge: "📉 PRICE DROP -26%",
          badgeClass: "price-drop",
          em: "🍳",
          title: "Chilli Garlic Sauce",
          wt: "200 g",
          pr: "₹89",
          was: "₹120",
          cat: "Gourmet",
          sub: "Price dropped on items like this"
        },
        {
          key: "alert-2",
          type: "restock",
          badge: "📦 BACK IN STOCK",
          badgeClass: "restock",
          em: "🧀",
          title: "Amul Butter 100g",
          wt: "1 pc",
          pr: "₹56",
          was: "₹60",
          cat: "Dairy & Bread",
          sub: "Restocked 10m ago in area"
        },
        {
          key: "alert-3",
          type: "price-drop",
          badge: "📉 PRICE DROP -21%",
          badgeClass: "price-drop",
          em: "🥣",
          title: "Crunchy Muesli",
          wt: "500 g",
          pr: "₹189",
          was: "₹240",
          cat: "Breakfast Cereals",
          sub: "Price dropped today"
        },
        {
          key: "alert-4",
          type: "restock",
          badge: "⚡ HIGH DEMAND",
          badgeClass: "restock",
          em: "☕",
          title: "Cold Brew Coffee 250ml",
          wt: "250 ml",
          pr: "₹79",
          was: "₹99",
          cat: "Zepto Cafe",
          sub: "Restocked for evening"
        }
      ];

      function renderAlertsDiscoverySection() {
        const container = $("#alerts-discovery-section");
        if (!container) return;
        const area = getAreaName();

        const cards = discoveryAlerts.map(a => {
          const isAdded = cart.has(a.key);
          const subLocalized = a.sub.replace(/in area/g, `at ${area}`);
          return `
            <div class="a-card">
              <span class="a-badge ${a.badgeClass}">${a.badge}</span>
              <div class="a-icon">${a.em}</div>
              <div class="a-title">${a.title}</div>
              <div style="font-size:9.5px;color:var(--ink-3);font-weight:700;margin-top:2px;">${subLocalized}</div>
              <div class="a-price">${a.pr}<s>${a.was}</s></div>
              <button class="a-add-btn ${isAdded ? 'in' : ''}" onclick="addAlertProductToCart(this, '${a.key}')">
                ${isAdded ? '✓ ADDED' : 'ADD'}
              </button>
            </div>
          `;
        }).join("");

        container.innerHTML = `
          <div class="alerts-sec">
            <div class="a-head">
              <h2>⚡ Price Drop & Restock Triggers</h2>
              <p>Freshly price-dropped & restocked items near ${area}</p>
            </div>
            <div class="alerts-grid">${cards}</div>
          </div>
        `;
      }

      window.addAlertProductToCart = function(btn, key) {
        const p = discoveryAlerts.find(item => item.key === key);
        if (!p) return;
        if (cart.has(key)) {
          cart.delete(key);
          delete cartItemsList[key];
          btn.classList.remove("in");
          btn.textContent = "ADD";
          toast(`Removed ${p.title} from cart`);
        } else {
          cart.add(key);
          cartItemsList[key] = { em: p.em, nm: p.title, wt: p.wt, pr: p.pr, was: p.was, cat: p.cat };
          btn.classList.add("in");
          btn.textContent = "✓ ADDED";
          markCategoryExplored(p.cat);
          logEvent("cart_added", p.cat);
          toast(`Added ${p.title} — ${p.type === 'price-drop' ? 'Price drop deal!' : 'Back in stock pick!'}`);
        }
        updateCartTotal();
        render();
      };

      /* ---------- Category Exploration Gamification ---------- */
      let exploredCategories = new Set(["Instant Noodles", "Dairy & Bread", "Fresh Fruits"]);

      function loadExploredCategories() {
        try {
          const stored = localStorage.getItem(`zepto_explored_cats_${userId}`);
          if (stored) {
            const arr = JSON.parse(stored);
            arr.forEach(c => exploredCategories.add(c));
          }
        } catch (e) {}
      }

      function markCategoryExplored(catName) {
        if (!catName) return;
        const cleanCat = catName.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "").trim();
        const prevSize = exploredCategories.size;
        exploredCategories.add(cleanCat);
        try {
          localStorage.setItem(`zepto_explored_cats_${userId}`, JSON.stringify(Array.from(exploredCategories)));
        } catch (e) {}

        if (exploredCategories.size > prevSize) {
          renderGamificationCard();
          renderNewCatsEntry();
          toast(`🎉 Category Unlocked: ${cleanCat}! (${exploredCategories.size} of 12 explored this month)`);
        }
      }

      function renderGamificationCard() {
        const container = $("#gamification-card-container");
        if (!container) return;

        loadExploredCategories();
        const totalTarget = 12;
        const count = Math.min(totalTarget, exploredCategories.size);
        const pct = Math.min(100, Math.round((count / totalTarget) * 100));

        let tierLabel = "🥉 Beginner Explorer";
        if (count >= 10) tierLabel = "🏆 Master Explorer";
        else if (count >= 6) tierLabel = "🥇 Pro Explorer";
        else if (count >= 4) tierLabel = "🥈 Rising Explorer";

        container.innerHTML = `
          <div class="gamification-card">
            <div class="g-header">
              <div class="g-title">
                <span>🎯</span> Monthly Category Explorer
              </div>
              <span class="g-tier">${tierLabel}</span>
            </div>
            <div class="g-sub">
              You've explored <strong>${count} of ${totalTarget} categories</strong> this month
            </div>
            <div class="p-track">
              <div class="p-fill" style="width: ${pct}%;"></div>
            </div>
            <div class="p-meta">
              <span>${pct}% completed</span>
              <span>Next reward: ${count >= 6 ? 'Free Delivery Pass 🎉' : 'Unlock 6 categories for ₹50 cashback'}</span>
            </div>
            <button class="g-cta-btn" onclick="scrollToUntriedCategories()">
              <span>✨ Explore untried categories →</span>
            </button>
          </div>
        `;
      }

      window.scrollToUntriedCategories = function() {
        const untriedEl = $("#new-cats-entry");
        if (untriedEl) {
          untriedEl.scrollIntoView({ behavior: "smooth", block: "center" });
          toast("Tap any category pill above to explore new picks!");
        }
      };

      /* Initialize */
      renderNewCatsEntry();
      renderTrendingAreaSection();
      renderAlertsDiscoverySection();
      renderSeasonalNudgeSection();
      renderGamificationCard();
      checkApiHealth();
      setupViewportObserver();
    