/* Ask Zepto AI — Chat Drawer & Recipe System */

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

      // Session Memory Store for Zepto AI (Retains Preferred Brands, Diet, Budget, Family Size, Cuisines during session)
      const userSessionPreferences = {
        preferredBrands: ["Amul", "Aashirvaad", "Tata Sampann", "Mother Dairy", "Everest"],
        diet: "Vegetarian",
        budget: "₹600",
        familySize: "4 people",
        favoriteCuisines: ["North Indian", "South Indian", "Indo-Chinese", "Italian"]
      };

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
                if (finalExplanation.includes("encountered an error") || finalExplanation.includes("Error code") || finalExplanation.includes("authentication_error") || finalExplanation.includes("invalid x-api-key")) {
                  const fallback = getOfflineChatResponse(text);
                  finishBotResponse(fallback, [], text);
                } else {
                  finishBotResponse(finalExplanation, finalRecos, text);
                }
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

      /* ---------- UNIVERSAL CALORIE & RECIPES SYSTEM ---------- */
      

      

      

      

      

      function getProductCalories(item) {
        if (!item) return "";
        const cat = (item.cat || "").toLowerCase();

        // Non-food categories MUST NEVER display calorie information
        const isNonFood = (
          cat.includes("apparel") ||
          cat.includes("jewel") ||
          cat.includes("baby") ||
          cat.includes("pet") ||
          cat.includes("home") ||
          cat.includes("electronic") ||
          cat.includes("clean") ||
          cat.includes("kitchen") ||
          cat.includes("skin") ||
          cat.includes("makeup") ||
          cat.includes("beauty") ||
          cat.includes("bath") ||
          cat.includes("hair") ||
          cat.includes("self care") ||
          cat.includes("fragrance") ||
          cat.includes("stationery") ||
          cat.includes("toy") ||
          cat.includes("plant") ||
          cat.includes("decor") ||
          cat.includes("paan") ||
          cat.includes("pharmacy")
        );

        if (isNonFood) return "";

        if (item.cals) return item.cals;
        const nm = (item.nm || "").toLowerCase();

        if (nm.includes("bread")) return "~70 kcal / slice";
        if (nm.includes("butter")) return "~102 kcal / tbsp";
        if (nm.includes("cheese")) return "~65 kcal / slice";
        if (nm.includes("paneer")) return "~265 kcal / 100g";
        if (nm.includes("milk")) return "~62 kcal / 100ml";
        if (nm.includes("egg")) return "~78 kcal / egg";
        if (nm.includes("mayo")) return "~95 kcal / tbsp";
        if (nm.includes("noodle") || nm.includes("maggi")) return "~310 kcal / pack";
        if (nm.includes("pasta")) return "~220 kcal / 100g";
        if (nm.includes("coffee") || nm.includes("brew")) return "~85 kcal / cup";
        if (nm.includes("chai") || nm.includes("tea")) return "~65 kcal / cup";
        if (nm.includes("croissant") || nm.includes("muffin")) return "~240 kcal / pc";
        if (nm.includes("samosa")) return "~180 kcal / pc";
        if (nm.includes("brownie")) return "~290 kcal / pc";
        if (nm.includes("juice") || nm.includes("coke") || nm.includes("soda")) return "~95 kcal / 250ml";
        if (nm.includes("chips") || nm.includes("kurkure") || nm.includes("snack")) return "~140 kcal / 30g";
        if (nm.includes("chocolate") || nm.includes("silk")) return "~210 kcal / 40g";
        if (nm.includes("apple") || nm.includes("fruit")) return "~52 kcal / 100g";
        if (nm.includes("tomato") || nm.includes("cucumber")) return "~18 kcal / 100g";
        if (nm.includes("protein") || nm.includes("whey")) return "~120 kcal / scoop";
        if (nm.includes("almond") || nm.includes("cashew") || nm.includes("nut")) return "~160 kcal / 30g";

        if (cat.includes("dairy")) return "~85 kcal / serving";
        if (cat.includes("drink") || cat.includes("juice")) return "~90 kcal / 250ml";
        if (cat.includes("cafe")) return "~180 kcal / item";
        if (cat.includes("fruit") || cat.includes("veg")) return "~45 kcal / 100g";
        if (cat.includes("munch") || cat.includes("biscuit") || cat.includes("sweet")) return "~130 kcal / 30g";

        return "";
      }

      function getRecipesForTopic(ql) {
        const isExplicitRecipeQuery = (ql.includes("recipe") || ql.includes("pairing") || ql.includes("pair") || ql.includes("how to make") || ql.includes("guide") || ql.includes("combo") || ql.includes("cravings") || ql.includes("prep") || ql.includes("biryani") || ql.includes("briyani"));
        if (!isExplicitRecipeQuery) return [];

        if (ql.includes("biryani") || ql.includes("briyani") || ql.includes("biriyani")) {
          return [
            {
              id: "rec_biryani_hyderabadi",
              title: "Hyderabadi Chicken / Veg Dum Biryani",
              em: "🍲",
              time: "25 mins ⚡",
              cals: "~520 kcal",
              desc: "Fragrant long-grain Basmati rice layered with aromatic Shahi biryani spices, golden fried onions, cow ghee & yogurt marinade.",
              price: "₹345",
              items: ["bp1", "bp2", "bp3", "bp4", "bp5", "bp6"],
              ingredientsDetail: [
                { name: "Long Grain Basmati Rice (150g cooked)", cal: "210 kcal" },
                { name: "Marinated Chicken / Paneer (150g)", cal: "185 kcal" },
                { name: "Pure Cow Ghee (1 tbsp)", cal: "112 kcal" },
                { name: "Biryani Masala & Fried Onions", cal: "45 kcal" },
                { name: "Fresh Curd & Mint Raita", cal: "38 kcal" }
              ],
              steps: [
                "Soak long-grain Basmati rice for 30 mins and cook with whole cardamom & bay leaf until 70% done.",
                "Marinate chicken/paneer with ginger-garlic paste, fresh curd, Shahi biryani masala & chopped mint.",
                "Layer rice over marinated base in a heavy-bottom pot.",
                "Top with hot pure cow ghee, golden fried onions & saffron milk.",
                "Cover tightly and cook on slow dum for 15-20 mins until steam rises & rice fluffs up!"
              ]
            },
            {
              id: "rec_biryani_paneer",
              title: "Shahi Paneer Dum Biryani & Burani Raita",
              em: "🍲",
              time: "20 mins ⚡",
              cals: "~460 kcal",
              desc: "Rich vegetarian dum biryani loaded with soft malai paneer cubes, saffron Basmati rice & garlic curd raita.",
              price: "₹320",
              items: ["bp1", "bp2", "bp3", "bp4", "bp8"],
              ingredientsDetail: [
                { name: "Basmati Rice (150g cooked)", cal: "210 kcal" },
                { name: "Fresh Malai Paneer (100g)", cal: "170 kcal" },
                { name: "Ghee & Spices", cal: "112 kcal" }
              ],
              steps: [
                "Lightly sauté fresh paneer cubes in cow ghee with turmeric.",
                "Prepare aromatic tomato-curd gravy infused with biryani masala.",
                "Layer paneer gravy with parboiled Basmati rice and simmer on low heat.",
                "Garnish with mint leaves and serve hot with garlic curd raita!"
              ]
            }
          ];
        }

        if (ql.includes("noodle") || ql.includes("pasta") || ql.includes("maggi") || ql.includes("ramen")) {
          return [
            {
              id: "rec_maggi",
              title: "Classic Masala Maggi with Cheese & Eggs",
              em: "🍜",
              time: "6 mins ⚡",
              cals: "~360 kcal",
              desc: "Instant noodles cooked with butter, spices, fried eggs & grated cheese.",
              price: "₹185",
              items: ["sw2", "sw3", "sw8"],
              ingredientsDetail: [
                { name: "Maggi Masala Noodles (1 pack)", cal: "310 kcal" },
                { name: "Amul Butter (1/2 tbsp)", cal: "50 kcal" },
                { name: "Cheese Slice (1 pc)", cal: "65 kcal" }
              ],
              steps: [
                "Boil 1.5 cups water and add Maggi taste maker.",
                "Add noodles and cook for 2 mins.",
                "Top with Amul butter and cheese slice.",
                "Serve piping hot with a fried egg on top!"
              ]
            },
            {
              id: "rec_pasta",
              title: "Creamy Garlic Butter Penne Pasta",
              em: "🍝",
              time: "12 mins ⚡",
              cals: "~450 kcal",
              desc: "Penne pasta tossed in garlic butter, cream, chili flakes & oregano.",
              price: "₹240",
              items: ["sw2", "sw3"],
              ingredientsDetail: [
                { name: "Penne Pasta (100g cooked)", cal: "220 kcal" },
                { name: "Amul Butter (1 tbsp)", cal: "102 kcal" },
                { name: "Fresh Cream & Cheese", cal: "128 kcal" }
              ],
              steps: [
                "Boil penne pasta with salt and oil until al dente.",
                "Saute minced garlic in butter until fragrant.",
                "Add cream, boiled pasta, and chili flakes.",
                "Toss well and serve warm with grated cheese!"
              ]
            },
            {
              id: "rec_ramen",
              title: "Spicy Chilli Garlic Ramen Bowl",
              em: "🍜",
              time: "8 mins ⚡",
              cals: "~390 kcal",
              desc: "Korean style spicy ramen topped with soft boiled egg & spring onions.",
              price: "₹199",
              items: ["sw8"],
              ingredientsDetail: [
                { name: "Ramen Noodles (1 pack)", cal: "310 kcal" },
                { name: "Boiled Egg (1 pc)", cal: "78 kcal" }
              ],
              steps: [
                "Cook spicy ramen in broth for 3 mins.",
                "Add chili oil and garlic soy paste.",
                "Top with halved soft boiled egg and sesame seeds."
              ]
            }
          ];
        }

        if (ql.includes("misal")) {
          return [
            {
              id: "rec_misal_pav",
              title: "Puneri Spiced Misal Pav & Fiery Kat",
              em: "🥣",
              time: "12 mins ⚡",
              cals: "~380 kcal",
              desc: "Sprouted moth beans curry topped with crunchy spicy farsan, red onions, coriander & served with hot buttered pav.",
              price: "₹140",
              items: ["mp1", "mp2", "mp3"],
              ingredientsDetail: [
                { name: "Sprouted Matki / Moth Beans (100g)", cal: "105 kcal" },
                { name: "Spicy Misal Farsan (50g)", cal: "150 kcal" },
                { name: "Soft Ladi Pav Buns (2 pcs)", cal: "140 kcal" },
                { name: "Kat/Tarri Gravy & Onions", cal: "85 kcal" }
              ],
              steps: [
                "Boil sprouted matki with turmeric and salt until tender.",
                "Prepare spicy tarri/kat gravy using onions, tomatoes, ginger-garlic & goda masala in oil.",
                "Bowl assembly: Add boiled matki, pour hot spicy tarri, top with generous crispy farsan & finely chopped red onions.",
                "Garnish with coriander & fresh lemon squeeze; serve with warm buttered pav!"
              ]
            }
          ];
        }

        if (ql.includes("puran") || ql.includes("poli") || ql.includes("puranpoli")) {
          return [
            {
              id: "rec_puran_poli",
              title: "Authentic Maharashtrian Puran Poli & Cow Ghee",
              em: "🫓",
              time: "15 mins ⚡",
              cals: "~310 kcal",
              desc: "Traditional sweet flatbread stuffed with spiced jaggery chana dal puran & roasted with pure cow ghee.",
              price: "₹185",
              items: ["sw2"],
              ingredientsDetail: [
                { name: "Chakki Wheat Flour (100g)", cal: "110 kcal" },
                { name: "Sweet Chana Dal & Jaggery (50g)", cal: "140 kcal" },
                { name: "Amul Pure Cow Ghee (1/2 tbsp)", cal: "60 kcal" }
              ],
              steps: [
                "Boil chana dal until soft, mash with organic jaggery, cardamom & nutmeg powder until thick ('Puran').",
                "Knead soft pliable dough using wheat flour, oil and warm water.",
                "Take a dough ball, stuff generous portion of sweet puran inside and seal edges.",
                "Roll gently into thin flatbread and roast on hot tawa with pure cow ghee until golden spots appear!"
              ]
            }
          ];
        }

        if (ql.includes("monsoon") || ql.includes("chai") || ql.includes("tea") || ql.includes("rain") || ql.includes("cravings") || ql.includes("vada") || ql.includes("pav") || ql.includes("corn") || ql.includes("bhajji") || ql.includes("pakoda")) {
          return [
            {
              id: "rec_sweet_corn",
              title: "Boiled Sweet Corn Butter Masala",
              em: "🌽",
              time: "6 mins ⚡",
              cals: "~145 kcal",
              desc: "Warm boiled sweet corn kernels tossed with melted Amul butter, red chilli, chaat masala & fresh lemon juice.",
              price: "₹149",
              items: ["sw2"],
              ingredientsDetail: [
                { name: "Sweet Corn Kernels (150g)", cal: "86 kcal" },
                { name: "Amul Butter (1/2 tbsp)", cal: "50 kcal" },
                { name: "Chaat Masala & Lemon", cal: "9 kcal" }
              ],
              steps: [
                "Boil sweet corn kernels in salted water for 4 mins until tender.",
                "Drain water and add 1/2 tbsp melted Amul butter immediately.",
                "Sprinkle chaat masala, red chilli powder and squeeze fresh lemon.",
                "Mix well and serve piping hot in a cup!"
              ]
            },
            {
              id: "rec_bhajji",
              title: "Crispy Kanda Bhajji (Onion Pakoda)",
              em: "🧅",
              time: "10 mins ⚡",
              cals: "~260 kcal",
              desc: "Golden crunchy sliced onion fritters seasoned with carom seeds, green chillies & served with mint chutney.",
              price: "₹120",
              items: ["sw9"],
              ingredientsDetail: [
                { name: "Thinly Sliced Onions (100g)", cal: "40 kcal" },
                { name: "Besan / Gram Flour (40g)", cal: "145 kcal" },
                { name: "Green Chilli & Spices", cal: "40 kcal" },
                { name: "Mint Chutney (1 tbsp)", cal: "35 kcal" }
              ],
              steps: [
                "Slice onions thinly and massage with salt to release moisture.",
                "Add besan, ajwain, chopped green chillies, and rice flour for crispiness.",
                "Drop small portions into hot oil and fry until golden brown & crispy.",
                "Drain on paper towel and serve hot with green mint chutney!"
              ]
            },
            {
              id: "rec_chai_samosa",
              title: "Kadak Ginger Masala Chai & Hot Samosa",
              em: "☕",
              time: "5 mins ⚡",
              cals: "~240 kcal",
              desc: "Piping hot ginger cardamom tea paired with crispy potato samosas on a rainy day.",
              price: "₹130",
              items: ["sw9"],
              ingredientsDetail: [
                { name: "Masala Ginger Chai (1 cup)", cal: "65 kcal" },
                { name: "Hot Potato Samosa (1 pc)", cal: "175 kcal" }
              ],
              steps: [
                "Crush fresh ginger and cardamom pods into boiling water.",
                "Add tea leaves, milk and sugar; boil for 3 mins.",
                "Strain into cups and serve with hot crispy samosas!"
              ]
            },
            {
              id: "rec_vada_pav",
              title: "Mumbai Style Batata Vada Pav & Garlic Chutney",
              em: "🍔",
              time: "8 mins ⚡",
              cals: "~290 kcal",
              desc: "Hot spiced potato vada stuffed inside fresh pav bun with fiery red garlic chutney & fried green chilli.",
              price: "₹99",
              items: ["sw1", "sw9"],
              ingredientsDetail: [
                { name: "Fresh Ladi Pav (2 pcs)", cal: "140 kcal" },
                { name: "Crispy Batata Vada (1 pc)", cal: "110 kcal" },
                { name: "Red Garlic Chutney (1 tbsp)", cal: "40 kcal" }
              ],
              steps: [
                "Mash boiled potatoes and season with mustard seeds, curry leaves, ginger & green chillies.",
                "Dip potato balls into chickpea flour (besan) batter and deep fry until golden crisp.",
                "Slice fresh pav bun, spread dry red garlic chutney and green mint chutney.",
                "Place hot fried vada inside, press gently and serve with fried green chillies!"
              ]
            },
            {
              id: "rec_momos",
              title: "Steamed Veg Momos with Spicy Schezwan Dip",
              em: "🥟",
              time: "8 mins ⚡",
              cals: "~220 kcal",
              desc: "Soft steamed vegetable dumplings served with fiery garlic red chilli chutney.",
              price: "₹169",
              items: [],
              ingredientsDetail: [
                { name: "Steamed Veg Dumplings (6 pcs)", cal: "170 kcal" },
                { name: "Fiery Schezwan Dip (2 tbsp)", cal: "50 kcal" }
              ],
              steps: [
                "Steam momos in steamer for 7-8 mins until skin becomes translucent.",
                "Serve hot with spicy garlic chilli chutney!"
              ]
            }
          ];
        }

        if (ql.includes("protein") || ql.includes("healthy") || ql.includes("fitness") || ql.includes("nuts") || ql.includes("gym")) {
          return [
            {
              id: "rec_smoothie",
              title: "Whey Protein Peanut Butter Smoothie Bowl",
              em: "🥤",
              time: "3 mins ⚡",
              cals: "~350 kcal",
              desc: "Blend of whey protein, peanut butter, banana & almond milk.",
              price: "₹290",
              items: ["sw7"],
              ingredientsDetail: [
                { name: "Whey Protein (1 scoop)", cal: "120 kcal" },
                { name: "Peanut Butter (1 tbsp)", cal: "95 kcal" },
                { name: "Banana & Almond Milk", cal: "135 kcal" }
              ],
              steps: [
                "Add 1 scoop whey protein, 1 tbsp peanut butter and almond milk into blender.",
                "Blend for 45 seconds until thick and creamy.",
                "Top with sliced banana and chia seeds!"
              ]
            },
            {
              id: "rec_trailmix",
              title: "Roasted Dry Fruit & Nut Energy Mix Bowl",
              em: "🌰",
              time: "2 mins ⚡",
              cals: "~220 kcal",
              desc: "Crunchy mix of almonds, cashews, raisins, makhana & pumpkin seeds.",
              price: "₹199",
              items: [],
              ingredientsDetail: [
                { name: "Almonds & Cashews (20g)", cal: "130 kcal" },
                { name: "Roasted Makhana & Seeds (15g)", cal: "90 kcal" }
              ],
              steps: [
                "Dry roast makhana and nuts on low heat for 2 mins.",
                "Sprinkle rock salt and chaat masala.",
                "Enjoy healthy guilt-free snacking!"
              ]
            }
          ];
        }

        if (ql.includes("cafe") || ql.includes("coffee") || ql.includes("cold brew") || ql.includes("croissant")) {
          return [
            {
              id: "rec_viet_coffee",
              title: "Vietnamese Iced Coffee with Chocolate Almond Croissant",
              em: "☕",
              time: "4 mins ⚡",
              cals: "~380 kcal",
              desc: "Dark roast drip coffee with condensed milk paired with warm chocolate croissant.",
              price: "₹249",
              items: [],
              ingredientsDetail: [
                { name: "Vietnamese Iced Coffee", cal: "140 kcal" },
                { name: "Chocolate Croissant", cal: "240 kcal" }
              ],
              steps: [
                "Pour cold brew over ice and condensed milk.",
                "Warm croissant in oven for 1 min.",
                "Enjoy a premium Cafe pairing in 4 mins!"
              ]
            },
            {
              id: "rec_coldbrew_float",
              title: "Cold Brew Vanilla Cream Float",
              em: "🥤",
              time: "3 mins ⚡",
              cals: "~290 kcal",
              desc: "Smooth cold brew coffee topped with a scoop of vanilla ice cream.",
              price: "₹189",
              items: [],
              ingredientsDetail: [
                { name: "Cold Brew Coffee", cal: "70 kcal" },
                { name: "Vanilla Ice Cream (1 scoop)", cal: "220 kcal" }
              ],
              steps: [
                "Fill glass with ice cold brew.",
                "Top with a generous scoop of vanilla ice cream.",
                "Drizzle chocolate sauce and enjoy!"
              ]
            }
          ];
        }

        if (ql.includes("bread") || ql.includes("sandwich") || ql.includes("toast") || ql.includes("pairing") || ql.includes("recipe") || ql.includes("cook") || ql.includes("dish")) {
          return sandwichRecipes;
        }

        // Return empty array for direct stock/price/product questions so no irrelevant recipes appear
        return [];
      }

      

      window.addSandwichIngredientToCart = function (btn, itemId) {
        const p = sandwichIngredients.find(item => item.id === itemId);
        if (!p) return;
        const key = `sw-${p.id}`;
        if (cart.has(key)) {
          cart.delete(key);
          delete cartItemsList[key];
          btn.classList.remove("in");
          btn.textContent = "+ ADD";
          toast(`Removed ${p.nm} from cart`);
        } else {
          cart.add(key);
          cartItemsList[key] = { em: p.em, nm: p.nm, wt: p.wt, pr: `₹${p.pr}`, was: p.was ? `₹${p.was}` : "", cat: p.cat };
          btn.classList.add("in");
          btn.textContent = "✓ ADDED";
          markCategoryExplored(p.cat);
          logEvent("cart_added", p.cat);
          toast(`Added ${p.nm} (${p.cals}) 🎉`);
        }
        updateCartTotal();
      };

      window.addPuranPoliIngredientToCart = function (btn, itemId) {
        const p = puranPoliPairingIngredients.find(item => item.id === itemId);
        if (!p) return;
        const key = `pp-${p.id}`;
        if (cart.has(key)) {
          cart.delete(key);
          delete cartItemsList[key];
          btn.classList.remove("in");
          btn.textContent = "+ ADD";
          toast(`Removed ${p.nm} from cart`);
        } else {
          cart.add(key);
          cartItemsList[key] = { em: p.em, nm: p.nm, wt: p.wt, pr: `₹${p.pr}`, was: p.was ? `₹${p.was}` : "", cat: p.cat };
          btn.classList.add("in");
          btn.textContent = "✓ ADDED";
          markCategoryExplored(p.cat);
          logEvent("cart_added", p.cat);
          toast(`Added ${p.nm} (${p.cals}) 🎉`);
        }
        updateCartTotal();
      };

      window.addMisalPavIngredientToCart = function (btn, itemId) {
        const p = misalPavPairingIngredients.find(item => item.id === itemId);
        if (!p) return;
        const key = `mp-${p.id}`;
        if (cart.has(key)) {
          cart.delete(key);
          delete cartItemsList[key];
          btn.classList.remove("in");
          btn.textContent = "+ ADD";
          toast(`Removed ${p.nm} from cart`);
        } else {
          cart.add(key);
          cartItemsList[key] = { em: p.em, nm: p.nm, wt: p.wt, pr: `₹${p.pr}`, was: p.was ? `₹${p.was}` : "", cat: p.cat };
          btn.classList.add("in");
          btn.textContent = "✓ ADDED";
          markCategoryExplored(p.cat);
          logEvent("cart_added", p.cat);
          toast(`Added ${p.nm} (${p.cals}) 🎉`);
        }
        updateCartTotal();
      };

      window.addBiryaniIngredientToCart = function (btn, itemId) {
        const p = biryaniPrepIngredients.find(item => item.id === itemId);
        if (!p) return;
        const key = `bp-${p.id}`;
        if (cart.has(key)) {
          cart.delete(key);
          delete cartItemsList[key];
          btn.classList.remove("in");
          btn.textContent = "+ ADD";
          toast(`Removed ${p.nm} from cart`);
        } else {
          cart.add(key);
          cartItemsList[key] = { em: p.em, nm: p.nm, wt: p.wt, pr: `₹${p.pr}`, was: p.was ? `₹${p.was}` : "", cat: p.cat };
          btn.classList.add("in");
          btn.textContent = "✓ ADDED";
          markCategoryExplored(p.cat);
          logEvent("cart_added", p.cat);
          toast(`Added ${p.nm} (${p.cals}) 🎉`);
        }
        updateCartTotal();
      };

      window.toggleSingleComboItem = function (btn, itemId) {
        const item = sandwichIngredients.find(i => i.id === itemId) ||
          puranPoliPairingIngredients.find(i => i.id === itemId) ||
          misalPavPairingIngredients.find(i => i.id === itemId) ||
          biryaniPrepIngredients.find(i => i.id === itemId);
        if (!item) return;
        const key = `rec-${item.id}`;
        if (cart.has(key)) {
          cart.delete(key);
          delete cartItemsList[key];
          btn.classList.remove("in");
          btn.textContent = "+ ADD";
          toast(`Removed ${item.nm} from cart`);
        } else {
          cart.add(key);
          cartItemsList[key] = {
            em: item.em,
            nm: item.nm,
            wt: item.wt,
            pr: `₹${item.pr}`,
            was: item.was ? `₹${item.was}` : "",
            cat: item.cat
          };
          btn.classList.add("in");
          btn.textContent = "✓ ADDED";
          toast(`Added ${item.nm} to cart 🎉`);
        }
        updateCartTotal();
      };

      window.addRecipeComboToCart = function (recipeId) {
        let allRecipes = getAllMasterRecipes();
        let rec = allRecipes.find(r => r.id === recipeId);
        if (!rec) {
          const topics = ["biryani", "misal", "noodle", "puran", "monsoon", "protein", "cafe", "sandwich", "maggi", "pasta", "ramen"];
          for (const t of topics) {
            const list = getRecipesForTopic(t);
            if (list && list.length) {
              const match = list.find(r => r.id === recipeId);
              if (match) { rec = match; break; }
            }
          }
        }
        if (!rec) return;

        let countAdded = 0;
        if (rec.items && rec.items.length > 0) {
          rec.items.forEach(itemId => {
            const item = sandwichIngredients.find(i => i.id === itemId) ||
              puranPoliPairingIngredients.find(i => i.id === itemId) ||
              misalPavPairingIngredients.find(i => i.id === itemId) ||
              biryaniPrepIngredients.find(i => i.id === itemId);
            if (item) {
              const key = `rec-${item.id}`;
              cart.add(key);
              cartItemsList[key] = {
                em: item.em,
                nm: item.nm,
                wt: item.wt,
                pr: `₹${item.pr}`,
                was: item.was ? `₹${item.was}` : "",
                cat: item.cat
              };
              countAdded++;
            }
          });
        }
        updateCartTotal();
        toast(`🛒 Added all ${countAdded} combo items for ${rec.title} to cart! 🎉`);
        openRecipeModal(recipeId, true);
      };

      window.openRecipeModal = function (recipeId, autoAdded = false) {
        let allRecipes = getAllMasterRecipes();
        let rec = allRecipes.find(r => r.id === recipeId);
        if (!rec) {
          const topics = ["biryani", "misal", "noodle", "puran", "monsoon", "protein", "cafe", "sandwich", "maggi", "pasta", "ramen"];
          for (const t of topics) {
            const list = getRecipesForTopic(t);
            if (list && list.length) {
              const match = list.find(r => r.id === recipeId);
              if (match) { rec = match; break; }
            }
          }
        }
        if (!rec) return;

        $("#recipe-modal-em").textContent = rec.em;
        $("#recipe-modal-title").textContent = rec.title;
        $("#recipe-modal-time").textContent = rec.time;
        $("#recipe-modal-cals").textContent = rec.cals;
        $("#recipe-modal-desc").textContent = rec.desc;

        // Added banner
        const banner = $("#recipe-modal-added-banner");
        if (autoAdded) {
          banner.style.display = "block";
          banner.textContent = `🎉 All required items for ${rec.title} have been added to your cart!`;
        } else {
          banner.style.display = "none";
        }

        // Required Store Items List
        const itemsListDiv = $("#recipe-modal-items-list");
        const itemsCountSpan = $("#recipe-modal-items-count");
        const resolvedItems = (rec.items || []).map(id => {
          return sandwichIngredients.find(i => i.id === id) ||
            puranPoliPairingIngredients.find(i => i.id === id) ||
            misalPavPairingIngredients.find(i => i.id === id) ||
            biryaniPrepIngredients.find(i => i.id === id);
        }).filter(Boolean);

        if (resolvedItems.length > 0) {
          let totalPrice = 0;
          itemsListDiv.innerHTML = resolvedItems.map(item => {
            totalPrice += item.pr;
            const isAdded = cart.has(`rec-${item.id}`) || cart.has(`sw-${item.id}`) || cart.has(`bp-${item.id}`) || cart.has(`mp-${item.id}`) || cart.has(`pp-${item.id}`);
            return `
              <div style="display:flex; align-items:center; justify-content:space-between; background:#fff; border:1px solid #EFEFEF; border-radius:10px; padding:6px 10px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <div style="width:34px; height:34px; border-radius:8px; background:#F8F5FC; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;">
                    ${item.img ? `<img src="${item.img}" alt="${item.nm}" style="width:100%; height:100%; object-fit:contain; padding:2px;" onerror="this.outerHTML='<span style=\\'font-size:20px;\\'>${item.em}</span>'"/>` : `<span style="font-size:20px;">${item.em}</span>`}
                  </div>
                  <div>
                    <div style="font-size:10.5px; font-weight:800; color:var(--ink);">${item.nm}</div>
                    <div style="font-size:9px; color:var(--ink-3); font-weight:700;">${item.wt} · ${item.cals}</div>
                  </div>
                </div>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-size:11px; font-weight:900; color:var(--zepto-purple-2);">₹${item.pr}</span>
                  <button class="add${isAdded ? ' in' : ''}" onclick="toggleSingleComboItem(this, '${item.id}')" style="font-size:9px; font-weight:900; padding:3px 8px; border-radius:6px; cursor:pointer;">
                    ${isAdded ? '✓ ADDED' : '+ ADD'}
                  </button>
                </div>
              </div>
            `;
          }).join("");
          itemsCountSpan.textContent = `Combo Price: ₹${totalPrice}`;
          $("#recipe-modal-items-container").style.display = "block";
        } else {
          $("#recipe-modal-items-container").style.display = "none";
        }

        // Calorie table
        const tableHtml = rec.ingredientsDetail ? rec.ingredientsDetail.map(ing => `
          <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #FCD34D; padding: 4px 0;">
            <span style="color:var(--ink); font-weight:700;">${ing.name}</span>
            <span style="color:#D97706; font-weight:900;">🔥 ${ing.cal}</span>
          </div>
        `).join("") : "";
        $("#recipe-modal-cals-table").innerHTML = tableHtml;

        // Steps
        const stepsHtml = rec.steps ? rec.steps.map(step => `
          <li style="margin-bottom:6px;">${step}</li>
        `).join("") : "";
        $("#recipe-modal-steps").innerHTML = stepsHtml;

        // Buy button
        const buyBtn = $("#recipe-modal-buy-btn");
        buyBtn.textContent = `🛒 Add All Combo Items to Cart`;
        buyBtn.onclick = () => {
          addRecipeComboToCart(recipeId);
        };

        $("#recipe-modal").classList.add("show");
      };

      window.closeRecipeModal = function () {
        $("#recipe-modal").classList.remove("show");
      };

      function finishBotResponse(explanation, recos, text) {
        let botContent = explanation;
        const ql = text.toLowerCase();
        const suggestedCats = getQueryCategories(ql);
        const stripLabel = getStripLabel(ql);

        const isBiryaniQuery = (ql.includes("biryani") || ql.includes("briyani") || ql.includes("biriyani"));
        const isMisalQuery = ql.includes("misal");
        const isPuranPoliQuery = (ql.includes("puran") || ql.includes("poli") || ql.includes("puranpoli"));
        const isBreadQuery = (ql.includes("bread") || ql.includes("sandwich") || ql.includes("pairing") || ql.includes("toast"));
        const isCafeQuery = (ql.includes("cafe") || ql.includes("zepto cafe") || ql.includes("coffee") || ql.includes("cold brew") || ql.includes("chai") || ql.includes("croissant") || ql.includes("samosa") || ql.includes("muffin"));

        if (isBiryaniQuery) {
          botContent += `
    <div style="margin-top: 10px; border-top: 1px solid var(--line); padding-top: 10px;">
      <div style="font-size: 11px; font-weight: 900; color: #D97706; margin-bottom: 8px; display:flex; align-items:center; gap:5px;">
        🍲 Royal Dum Biryani Prep Ingredients & Calorie Breakdown:
      </div>
      <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; -webkit-overflow-scrolling: touch;">
  `;
          biryaniPrepIngredients.forEach(item => {
            const itemKey = `bp-${item.id}`;
            const isAdded = cart.has(itemKey);
            botContent += `
      <div style="flex: 0 0 120px; background: #fff; border: 1.5px solid #FDE68A; border-radius: 14px; padding: 8px 6px; display: flex; flex-direction: column; align-items: center; text-align: center; box-shadow: 0 2px 8px rgba(217,119,6,0.08); position:relative;">
        <span style="position:absolute; top:4px; right:4px; font-size:7.5px; font-weight:900; background:#FEF3C7; color:#D97706; padding:1px 4px; border-radius:4px;">${item.cals}</span>
        <div style="margin-top:10px; margin-bottom:4px; background:#FFFBEB; width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
          ${item.img ? `<img src="${item.img}" alt="${item.nm}" style="width:100%; height:100%; object-fit:contain; padding:2px;" onerror="this.outerHTML='<span style=\\'font-size:26px;\\'>${item.em}</span>'"/>` : `<span style="font-size: 26px;">${item.em}</span>`}
        </div>
        <div style="font-size: 9.5px; font-weight: 800; line-height: 1.25; height: 26px; overflow: hidden; margin-bottom: 2px; color: var(--ink); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${item.nm}</div>
        <div style="font-size: 8.5px; color: var(--ink-3); font-weight: 700; margin-bottom: 4px;">${item.wt}</div>
        <div style="font-size: 10.5px; font-weight: 900; color: var(--zepto-purple-2); margin-bottom: 6px; margin-top: auto;">
          ₹${item.pr}${item.was ? ` <s style="font-size:8px;color:var(--ink-3);font-weight:700;">₹${item.was}</s>` : ""}
        </div>
        <button class="add${isAdded ? ' in' : ''}" onclick="addBiryaniIngredientToCart(this, '${item.id}')" style="width:100%;font-size:9px;padding:4px 0;border-radius:8px;">${isAdded ? '✓ ADDED' : '+ ADD'}</button>
      </div>
    `;
          });
          botContent += `</div>`;
        } else if (isMisalQuery) {
          botContent += `
    <div style="margin-top: 10px; border-top: 1px solid var(--line); padding-top: 10px;">
      <div style="font-size: 11px; font-weight: 900; color: #D97706; margin-bottom: 8px; display:flex; align-items:center; gap:5px;">
        🥣 Misal Pav Ingredients & Calorie Breakdown:
      </div>
      <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; -webkit-overflow-scrolling: touch;">
  `;
          misalPavPairingIngredients.forEach(item => {
            const itemKey = `mp-${item.id}`;
            const isAdded = cart.has(itemKey);
            botContent += `
      <div style="flex: 0 0 120px; background: #fff; border: 1.5px solid #FDE68A; border-radius: 14px; padding: 8px 6px; display: flex; flex-direction: column; align-items: center; text-align: center; box-shadow: 0 2px 8px rgba(217,119,6,0.08); position:relative;">
        <span style="position:absolute; top:4px; right:4px; font-size:7.5px; font-weight:900; background:#FEF3C7; color:#D97706; padding:1px 4px; border-radius:4px;">${item.cals}</span>
        <div style="margin-top:10px; margin-bottom:4px; background:#FFFBEB; width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
          ${item.img ? `<img src="${item.img}" alt="${item.nm}" style="width:100%; height:100%; object-fit:contain; padding:2px;" onerror="this.outerHTML='<span style=\\'font-size:26px;\\'>${item.em}</span>'"/>` : `<span style="font-size: 26px;">${item.em}</span>`}
        </div>
        <div style="font-size: 9.5px; font-weight: 800; line-height: 1.25; height: 26px; overflow: hidden; margin-bottom: 2px; color: var(--ink); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${item.nm}</div>
        <div style="font-size: 8.5px; color: var(--ink-3); font-weight: 700; margin-bottom: 4px;">${item.wt}</div>
        <div style="font-size: 10.5px; font-weight: 900; color: var(--zepto-purple-2); margin-bottom: 6px; margin-top: auto;">
          ₹${item.pr}${item.was ? ` <s style="font-size:8px;color:var(--ink-3);font-weight:700;">₹${item.was}</s>` : ""}
        </div>
        <button class="add${isAdded ? ' in' : ''}" onclick="addMisalPavIngredientToCart(this, '${item.id}')" style="width:100%;font-size:9px;padding:4px 0;border-radius:8px;">${isAdded ? '✓ ADDED' : '+ ADD'}</button>
      </div>
    `;
          });
          botContent += `</div>`;
        } else if (isPuranPoliQuery) {
          botContent += `
    <div style="margin-top: 10px; border-top: 1px solid var(--line); padding-top: 10px;">
      <div style="font-size: 11px; font-weight: 900; color: #D97706; margin-bottom: 8px; display:flex; align-items:center; gap:5px;">
        🫓 Pairing with Puran Poli (Katachi Amti, Cow Ghee & Milk):
      </div>
      <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; -webkit-overflow-scrolling: touch;">
  `;
          puranPoliPairingIngredients.forEach(item => {
            const itemKey = `pp-${item.id}`;
            const isAdded = cart.has(itemKey);
            botContent += `
      <div style="flex: 0 0 120px; background: #fff; border: 1.5px solid #FDE68A; border-radius: 14px; padding: 8px 6px; display: flex; flex-direction: column; align-items: center; text-align: center; box-shadow: 0 2px 8px rgba(217,119,6,0.08); position:relative;">
        <span style="position:absolute; top:4px; right:4px; font-size:7.5px; font-weight:900; background:#FEF3C7; color:#D97706; padding:1px 4px; border-radius:4px;">${item.cals}</span>
        <div style="margin-top:10px; margin-bottom:4px; background:#FFFBEB; width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
          ${item.img ? `<img src="${item.img}" alt="${item.nm}" style="width:100%; height:100%; object-fit:contain; padding:2px;" onerror="this.outerHTML='<span style=\\'font-size:26px;\\'>${item.em}</span>'"/>` : `<span style="font-size: 26px;">${item.em}</span>`}
        </div>
        <div style="font-size: 9.5px; font-weight: 800; line-height: 1.25; height: 26px; overflow: hidden; margin-bottom: 2px; color: var(--ink); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${item.nm}</div>
        <div style="font-size: 8.5px; color: var(--ink-3); font-weight: 700; margin-bottom: 4px;">${item.wt}</div>
        <div style="font-size: 10.5px; font-weight: 900; color: var(--zepto-purple-2); margin-bottom: 6px; margin-top: auto;">
          ₹${item.pr}${item.was ? ` <s style="font-size:8px;color:var(--ink-3);font-weight:700;">₹${item.was}</s>` : ""}
        </div>
        <button class="add${isAdded ? ' in' : ''}" onclick="addPuranPoliIngredientToCart(this, '${item.id}')" style="width:100%;font-size:9px;padding:4px 0;border-radius:8px;">${isAdded ? '✓ ADDED' : '+ ADD'}</button>
      </div>
    `;
          });
          botContent += `</div>`;
        } else if (isBreadQuery) {
          botContent += `
    <div style="margin-top: 10px; border-top: 1px solid var(--line); padding-top: 10px;">
      <div style="font-size: 11px; font-weight: 900; color: #D97706; margin-bottom: 8px; display:flex; align-items:center; gap:5px;">
        🥪 Sandwich Ingredients & Calorie Breakdown:
      </div>
      <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; -webkit-overflow-scrolling: touch;">
  `;
          sandwichIngredients.forEach(item => {
            const itemKey = `sw-${item.id}`;
            const isAdded = cart.has(itemKey);
            botContent += `
      <div style="flex: 0 0 120px; background: #fff; border: 1.5px solid #FDE68A; border-radius: 14px; padding: 8px 6px; display: flex; flex-direction: column; align-items: center; text-align: center; box-shadow: 0 2px 8px rgba(217,119,6,0.08); position:relative;">
        <span style="position:absolute; top:4px; right:4px; font-size:7.5px; font-weight:900; background:#FEF3C7; color:#D97706; padding:1px 4px; border-radius:4px;">${item.cals}</span>
        <div style="margin-top:10px; margin-bottom:4px; background:#FFFBEB; width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
          ${item.img ? `<img src="${item.img}" alt="${item.nm}" style="width:100%; height:100%; object-fit:contain; padding:2px;" onerror="this.outerHTML='<span style=\\'font-size:26px;\\'>${item.em}</span>'"/>` : `<span style="font-size: 26px;">${item.em}</span>`}
        </div>
        <div style="font-size: 9.5px; font-weight: 800; line-height: 1.25; height: 26px; overflow: hidden; margin-bottom: 2px; color: var(--ink); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${item.nm}</div>
        <div style="font-size: 8.5px; color: var(--ink-3); font-weight: 700; margin-bottom: 4px;">${item.wt}</div>
        <div style="font-size: 10.5px; font-weight: 900; color: var(--zepto-purple-2); margin-bottom: 6px; margin-top: auto;">
          ₹${item.pr}${item.was ? ` <s style="font-size:8px;color:var(--ink-3);font-weight:700;">₹${item.was}</s>` : ""}
        </div>
        <button class="add${isAdded ? ' in' : ''}" onclick="addSandwichIngredientToCart(this, '${item.id}')" style="width:100%;font-size:9px;padding:4px 0;border-radius:8px;">${isAdded ? '✓ ADDED' : '+ ADD'}</button>
      </div>
    `;
          });
          botContent += `</div>`;
        } else if (isCafeQuery) {
          botContent += `
    <div style="margin-top: 10px; border-top: 1px solid var(--line); padding-top: 10px;">
      <div style="font-size: 11px; font-weight: 800; color: var(--zepto-pink); margin-bottom: 8px; display:flex; align-items:center; gap:5px;">☕ Fresh Zepto Cafe Menu (Delivered in 8 mins):</div>
      <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; -webkit-overflow-scrolling: touch;">
  `;
          zeptoCafeMenu.forEach(item => {
            const key = `cafe-${item.id}`;
            const isAdded = cart.has(key);
            const cals = getProductCalories(item);
            botContent += `
      <div style="flex: 0 0 114px; background: #fff; border: 1px solid #EBE5F5; border-radius: 14px; padding: 8px 6px; display: flex; flex-direction: column; align-items: center; text-align: center; box-shadow: 0 2px 8px rgba(75,0,130,0.06); position:relative;">
        <span style="position:absolute; top:4px; right:4px; font-size:7.5px; font-weight:900; background:#FEF3C7; color:#D97706; padding:1px 4px; border-radius:4px;">${cals}</span>
        <div style="font-size: 24px; margin-top:10px; margin-bottom: 4px; background:#F8F5FC; width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center;">${item.em}</div>
        <div style="font-size: 9.5px; font-weight: 800; line-height: 1.25; height: 26px; overflow: hidden; margin-bottom: 2px; color: var(--ink); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${item.nm}</div>
        <div style="font-size: 8.5px; color: var(--ink-3); font-weight: 700; margin-bottom: 4px;">${item.wt}</div>
        <div style="font-size: 10.5px; font-weight: 900; color: var(--zepto-purple-2); margin-bottom: 6px; margin-top: auto;">
          ₹${item.pr}${item.was ? ` <s style="font-size:8px;color:var(--ink-3);font-weight:700;">₹${item.was}</s>` : ""}
        </div>
        <button class="add${isAdded ? ' in' : ''}" onclick="addCafeProductToCart(this, '${item.id}')" style="width:100%;font-size:9px;padding:4px 0;border-radius:8px;">${isAdded ? '✓ ADDED' : '+ ADD'}</button>
      </div>
    `;
          });
          botContent += `</div>`;
        } else {
          botContent += `
    <div style="margin-top: 10px; border-top: 1px solid var(--line); padding-top: 10px;">
      <div style="font-size: 11px; font-weight: 800; color: var(--ink-2); margin-bottom: 8px; display:flex; align-items:center; gap:5px;">${stripLabel}</div>
      <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; -webkit-overflow-scrolling: touch;">
  `;

          let allRecoProducts = [];
          suggestedCats.forEach(cat => {
            const productsList = getProductsForCategory(cat);
            productsList.forEach(item => {
              allRecoProducts.push({ ...item, cat });
            });
          });

          // Rank by Availability, Rating, and limit to MAXIMUM 5 products
          allRecoProducts.sort((a, b) => (b.rating || 4.8) - (a.rating || 4.8));
          const top5Products = allRecoProducts.slice(0, 5);

          top5Products.forEach(item => {
            const cat = item.cat || "Groceries & Staples";
            const safeCat = cat.replace(/'/g, "\\'");
            const safeNm = item.nm.replace(/'/g, "\\'");
            const itemKey = `chat-${cat}-${item.nm.replace(/\s+/g, '-')}`;
            const isAdded = cart.has(itemKey) || cart.has(`chat-${cat}`);
            const ratingVal = item.rating || (4.7 + (item.nm.length % 3) * 0.1).toFixed(1);
            const discountPct = item.was ? Math.round(((item.was - item.pr) / item.was) * 100) : 0;

            botContent += `
      <div style="flex: 0 0 118px; background: #fff; border: 1px solid #EBE5F5; border-radius: 14px; padding: 8px 6px; display: flex; flex-direction: column; align-items: center; text-align: center; box-shadow: 0 2px 8px rgba(75,0,130,0.06); position:relative;">
        <span style="position:absolute; top:4px; left:4px; font-size:7.5px; font-weight:900; background:#FEF3C7; color:#D97706; padding:1px 4px; border-radius:4px;">★ ${ratingVal}</span>
        ${discountPct > 0 ? `<span style="position:absolute; top:4px; right:4px; font-size:7.5px; font-weight:900; background:#DC2626; color:#fff; padding:1px 4px; border-radius:4px;">${discountPct}% OFF</span>` : ""}
        <div style="margin-top:14px; margin-bottom:4px; background:#F8F5FC; width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
          ${item.img ? `<img src="${item.img}" alt="${item.nm}" style="width:100%; height:100%; object-fit:contain; padding:2px;" onerror="this.outerHTML='<span style=\\'font-size:24px;\\'>${item.em}</span>'"/>` : `<span style="font-size: 24px;">${item.em}</span>`}
        </div>
        <div style="font-size: 9.5px; font-weight: 800; line-height: 1.25; height: 26px; overflow: hidden; margin-bottom: 2px; color: var(--ink); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${item.nm}</div>
        <div style="font-size: 8.5px; color: var(--ink-3); font-weight: 700; margin-bottom: 4px;">${item.wt}</div>
        <div style="font-size: 10.5px; font-weight: 900; color: var(--zepto-purple-2); margin-bottom: 6px; margin-top: auto;">
          ₹${item.pr}${item.was ? ` <s style="font-size:8px;color:var(--ink-3);font-weight:700;">₹${item.was}</s>` : ""}
        </div>
        <button class="add${isAdded ? ' in' : ''}" onclick="addChatProductItemToCart(this, '${safeCat}', '${safeNm}', ${item.pr}, '${item.em}', '${item.wt}')" style="width:100%;font-size:9px;padding:4px 0;border-radius:8px;">${isAdded ? '✓ ADDED' : '+ ADD'}</button>
      </div>
    `;
          });

          botContent += `</div>`;
        }

        // RENDER HORIZONTAL RECIPE CAROUSEL FOR ALL TOPICS
        const topicRecipes = getRecipesForTopic(ql);
        if (topicRecipes && topicRecipes.length > 0) {
          botContent += `
      <!-- HORIZONTAL RECIPES & PAIRING GUIDES SECTION -->
      <div style="margin-top: 12px; background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%); border: 1.5px solid #FDE68A; border-radius: 14px; padding: 10px;">
        <div style="font-size: 11.5px; font-weight: 900; color: #B45309; margin-bottom: 8px; display:flex; align-items:center; gap:5px;">
          📖 Popular Recipes & Quick Pairing Guides:
        </div>
        <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; -webkit-overflow-scrolling: touch; scrollbar-width: none;">
          ${topicRecipes.map(rec => `
            <div style="flex: 0 0 215px; background: #fff; border: 1px solid #FCD34D; border-radius: 12px; padding: 10px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 2px 8px rgba(217,119,6,0.06);">
              <div>
                <div style="display:flex; gap:6px; align-items:center; margin-bottom:4px;">
                  <span style="font-size: 22px;">${rec.em}</span>
                  <div>
                    <div style="font-size: 11px; font-weight: 900; color: var(--ink); line-height: 1.2;">${rec.title}</div>
                    <div style="font-size: 9px; font-weight: 800; color: #D97706; margin-top: 2px;">${rec.time} · ${rec.cals}</div>
                  </div>
                </div>
                <div style="font-size: 9.5px; color: var(--ink-2); line-height: 1.3; margin-bottom: 8px;">${rec.desc}</div>
              </div>
              <div style="display:flex; flex-direction:column; gap:4px; margin-top: auto;">
                <button onclick="addRecipeComboToCart('${rec.id}')" style="width:100%; background: linear-gradient(135deg,#16A34A,#15803D); color:#fff; border:none; font-size:9.5px; font-weight:900; padding:5px 0; border-radius:8px; cursor:pointer;">
                  🛒 Add Combo Ingredients
                </button>
                <button onclick="openRecipeModal('${rec.id}')" style="width:100%; background:#fff; border:1px solid #D97706; color:#B45309; font-size:9px; font-weight:900; padding:4px 0; border-radius:8px; cursor:pointer;">
                  📖 View Recipe & Calorie Table
                </button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
        }

        if (ql.includes("i have") || botContent.includes("Custom Recipe from Your Ingredients")) {
          botContent += `
      <div style="margin-top:10px; display:flex; flex-direction:column; gap:6px;">
        <button onclick="addMissingIngredientsToCart(this)" style="width:100%; background:linear-gradient(135deg,#16A34A,#15803D); color:#fff; border:none; font-size:11px; font-weight:900; padding:8px; border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 2px 8px rgba(22,163,74,0.25);">
          🛒 Add Missing Ingredients (Cow Ghee & Everest Masala - ₹193)
        </button>
        <div style="display:flex; gap:6px;">
          <button onclick="sendChatMessage('Swap recipe for my ingredients')" style="flex:1; background:#FFFBEB; border:1px solid #FCD34D; color:#B45309; font-size:10px; font-weight:900; padding:6px; border-radius:8px; cursor:pointer;">
            🔄 Swap Recipe
          </button>
          <button onclick="sendChatMessage('Vegetarian alternative for recipe')" style="flex:1; background:#F0FDF4; border:1px solid #86EFAC; color:#15803D; font-size:10px; font-weight:900; padding:6px; border-radius:8px; cursor:pointer;">
            🌱 Vegetarian Alternative
          </button>
        </div>
      </div>
    `;
        } else if (ql.includes("replace") || ql.includes("swap") || botContent.includes("Replaced Meal Plan")) {
          botContent += `
      <div style="margin-top:10px; display:flex; flex-direction:column; gap:6px;">
        <button onclick="addReplacedMealComboToCart(this)" style="width:100%; background:linear-gradient(135deg,#16A34A,#15803D); color:#fff; border:none; font-size:11px; font-weight:900; padding:8px; border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 2px 8px rgba(22,163,74,0.25);">
          🛒 Add Replaced Ingredients (Chicken/Mushrooms, Atta, Moong Dal, Tomatoes, Onions, Ghee)
        </button>
        <div style="display:flex; gap:6px;">
          <button onclick="sendChatMessage('Plan a dinner for 4 people under ₹600')" style="flex:1; background:#FFFBEB; border:1px solid #FCD34D; color:#B45309; font-size:10px; font-weight:900; padding:6px; border-radius:8px; cursor:pointer;">
            🧀 Swap back to Paneer
          </button>
          <button onclick="sendChatMessage('Change cuisine for meal plan')" style="flex:1; background:#FBF0FF; border:1px solid #E9D5FF; color:#7E22CE; font-size:10px; font-weight:900; padding:6px; border-radius:8px; cursor:pointer;">
            🍲 Change Cuisine
          </button>
        </div>
      </div>
    `;
        } else if (ql.includes("cuisine") || botContent.includes("Select Your Preferred Cuisine")) {
          botContent += `
      <div style="margin-top:10px; display:flex; flex-direction:column; gap:6px;">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px;">
          <button onclick="addCuisineComboToCart(this, 'north')" style="background:#FFFBEB; border:1px solid #FCD34D; color:#B45309; font-size:10px; font-weight:900; padding:7px; border-radius:8px; cursor:pointer;">
            🇮🇳 Add North Indian (₹520)
          </button>
          <button onclick="addCuisineComboToCart(this, 'south')" style="background:#F0FDF4; border:1px solid #86EFAC; color:#15803D; font-size:10px; font-weight:900; padding:7px; border-radius:8px; cursor:pointer;">
            🌴 Add South Indian (₹410)
          </button>
          <button onclick="addCuisineComboToCart(this, 'chinese')" style="background:#FEF2F2; border:1px solid #FCA5A5; color:#B91C1C; font-size:10px; font-weight:900; padding:7px; border-radius:8px; cursor:pointer;">
            🥢 Add Indo-Chinese (₹380)
          </button>
          <button onclick="addCuisineComboToCart(this, 'italian')" style="background:#FBF0FF; border:1px solid #E9D5FF; color:#7E22CE; font-size:10px; font-weight:900; padding:7px; border-radius:8px; cursor:pointer;">
            🍝 Add Italian (₹460)
          </button>
        </div>
      </div>
    `;
        } else if (ql.includes("meal") || ql.includes("dinner") || ql.includes("lunch") || ql.includes("ingredient") || botContent.includes("With options to:")) {
          botContent += `
      <div style="margin-top:10px; display:flex; flex-direction:column; gap:6px;">
        <button onclick="addMealPlanComboToCart(this)" style="width:100%; background:linear-gradient(135deg,#16A34A,#15803D); color:#fff; border:none; font-size:11px; font-weight:900; padding:8px; border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 2px 8px rgba(22,163,74,0.25);">
          🛒 Add All (Paneer, Tomatoes, Onions, Rice, Curd, Spices)
        </button>
        <div style="display:flex; gap:6px;">
          <button onclick="sendChatMessage('Replace items in meal plan')" style="flex:1; background:#FFFBEB; border:1px solid #FCD34D; color:#B45309; font-size:10px; font-weight:900; padding:6px; border-radius:8px; cursor:pointer;">
            🔄 Replace Items
          </button>
          <button onclick="sendChatMessage('Change cuisine for meal plan')" style="flex:1; background:#FBF0FF; border:1px solid #E9D5FF; color:#7E22CE; font-size:10px; font-weight:900; padding:6px; border-radius:8px; cursor:pointer;">
            🍲 Change Cuisine
          </button>
        </div>
      </div>
    `;
        }

        botContent += `
      <div style="margin-top:10px; display:flex; gap:6px; overflow-x:auto; padding-bottom:4px; flex-wrap:nowrap; -webkit-overflow-scrolling:touch; scrollbar-width:none; justify-content: flex-start;">
        ${suggestedCats.map(cat => `
          <button onclick="openCategoryFromChat('${cat.replace(/'/g, "&apos;")}')" style="flex:0 0 auto; white-space:nowrap; background:linear-gradient(135deg,#5A00A0,#7B1FA2); color:#fff; border:none; font-size:10px; font-weight:900; padding:7px 13px; border-radius:16px; cursor:pointer; letter-spacing:0.3px; box-shadow:0 2px 6px rgba(90,0,160,0.2);">
            Explore ${cat} →
          </button>
        `).join("")}
      </div>
    </div>
  `;

        chatMessages.push({ role: "bot", content: botContent });
        renderChatMessages();
      }

      window.addMealPlanComboToCart = function (btn) {
        const mealItems = [
          { id: "mp_pnr", em: "🧀", nm: "Amul Fresh Malai Paneer", wt: "200 g", pr: 95, was: 110, cat: "Dairy,Bread & Eggs" },
          { id: "mp_tom", em: "🍅", nm: "Farm Fresh Hybrid Tomatoes", wt: "1 kg", pr: 38, was: 45, cat: "Fruits & vegetables" },
          { id: "mp_oni", em: "🧅", nm: "Fresho Fresh Red Onions", wt: "1 kg", pr: 32, was: 45, cat: "Fruits & vegetables" },
          { id: "mp_rce", em: "🍚", nm: "Fortune Everyday Basmati Rice", wt: "5 kg", pr: 149, was: 180, cat: "Atta, Rice & Dals" },
          { id: "mp_crd", em: "🫙", nm: "Mother Dairy Fresh Curd", wt: "400 g", pr: 52, was: 65, cat: "Dairy,Bread & Eggs" },
          { id: "mp_spc", em: "🧂", nm: "Everest Shahi Biryani Masala", wt: "50 g", pr: 45, was: 55, cat: "Masala & Dry Fruits" }
        ];

        let addedCount = 0;
        mealItems.forEach(item => {
          const key = `meal-${item.id}`;
          cart.add(key);
          cartItemsList[key] = { em: item.em, nm: item.nm, wt: item.wt, pr: `₹${item.pr}`, was: item.was ? `₹${item.was}` : "", cat: item.cat };
          addedCount++;
        });

        updateCartTotal();
        if (btn) {
          btn.innerHTML = "✓ ADDED ALL INGREDIENTS TO CART!";
          btn.style.background = "#059669";
        }
      };
      window.addMissingIngredientsToCart = function (btn) {
        const missing = [
          { id: "ms_ghe", em: "🧈", nm: "Amul Pure Cow Ghee Jar", wt: "200 ml", pr: 145, was: 160, cat: "Dairy,Bread & Eggs" },
          { id: "ms_mas", em: "🧂", nm: "Everest Shahi Paneer Masala", wt: "50 g", pr: 48, was: 55, cat: "Masala & Dry Fruits" }
        ];

        missing.forEach(item => {
          const key = `msg-${item.id}`;
          cart.add(key);
          cartItemsList[key] = { em: item.em, nm: item.nm, wt: item.wt, pr: `₹${item.pr}`, was: item.was ? `₹${item.was}` : "", cat: item.cat };
        });

        updateCartTotal();
        if (btn) {
          btn.innerHTML = "✓ ADDED MISSING INGREDIENTS TO CART!";
          btn.style.background = "#059669";
        }
        toast(`Awesome! Added missing recipe ingredients to your cart.`);
      };

      window.addReplacedMealComboToCart = function (btn) {
        const replacedItems = [
          { id: "rm_chk", em: "🍗", nm: "Fresh Chicken Curry Cut", wt: "500 g", pr: 199, was: 240, cat: "Meat, Fish & Eggs" },
          { id: "rm_att", em: "🌾", nm: "Aashirvaad Shuddh Chakki Atta", wt: "5 kg", pr: 245, was: 285, cat: "Atta, Rice & Dals" },
          { id: "rm_dal", em: "🫘", nm: "Organic Yellow Moong Dal", wt: "500 g", pr: 89, was: 105, cat: "Atta, Rice & Dals" },
          { id: "rm_tom", em: "🍅", nm: "Farm Fresh Hybrid Tomatoes", wt: "1 kg", pr: 38, was: 45, cat: "Fruits & vegetables" },
          { id: "rm_oni", em: "🧅", nm: "Fresho Fresh Red Onions", wt: "1 kg", pr: 32, was: 45, cat: "Fruits & vegetables" },
          { id: "rm_ghe", em: "🧈", nm: "Amul Pure Cow Ghee Jar", wt: "200 ml", pr: 145, was: 160, cat: "Dairy,Bread & Eggs" }
        ];

        let addedCount = 0;
        replacedItems.forEach(item => {
          const key = `rep-${item.id}`;
          cart.add(key);
          cartItemsList[key] = { em: item.em, nm: item.nm, wt: item.wt, pr: `₹${item.pr}`, was: item.was ? `₹${item.was}` : "", cat: item.cat };
          addedCount++;
        });

        updateCartTotal();
        if (btn) {
          btn.innerHTML = "✓ ADDED REPLACED INGREDIENTS TO CART!";
          btn.style.background = "#059669";
        }
        toast(`Awesome! Your replaced meal basket is ready in your cart.`);
      };

      window.addCuisineComboToCart = function (btn, type) {
        if (typeof btn === "string" && !type) {
          type = btn;
          btn = null;
        }
        const cuisineMap = {
          north: {
            name: "North Indian Dinner", items: [
              { id: "c_pnr", em: "🧀", nm: "Amul Fresh Malai Paneer", wt: "200 g", pr: 95, cat: "Dairy,Bread & Eggs" },
              { id: "c_dal", em: "🫘", nm: "Tata Sampann Toor Dal", wt: "1 kg", pr: 175, cat: "Atta, Rice & Dals" },
              { id: "c_att", em: "🌾", nm: "Aashirvaad Shuddh Chakki Atta", wt: "5 kg", pr: 245, cat: "Atta, Rice & Dals" }
            ]
          },
          south: {
            name: "South Indian Dinner", items: [
              { id: "c_btr", em: "🥣", nm: "iD Fresh Dosa & Idli Batter", wt: "1 kg", pr: 99, cat: "Dairy,Bread & Eggs" },
              { id: "c_dal", em: "🫘", nm: "Organic Yellow Moong Dal", wt: "500 g", pr: 89, cat: "Atta, Rice & Dals" },
              { id: "c_cof", em: "☕", nm: "Davidoff Instant Coffee", wt: "100 g", pr: 225, cat: "Tea, Coffee & More" }
            ]
          },
          chinese: {
            name: "Indo-Chinese Dinner", items: [
              { id: "c_ndl", em: "🍜", nm: "Masala Noodles Pack", wt: "280 g", pr: 55, cat: "Packaged Food" },
              { id: "c_pnr", em: "🧀", nm: "Amul Fresh Malai Paneer", wt: "200 g", pr: 95, cat: "Dairy,Bread & Eggs" },
              { id: "c_sau", em: "🥢", nm: "Chilli Soy Garlic Sauce", wt: "200 g", pr: 65, cat: "Breakfast & Sauce" }
            ]
          },
          italian: {
            name: "Italian Dinner", items: [
              { id: "c_pst", em: "🍝", nm: "Penne Durum Wheat Pasta", wt: "500 g", pr: 125, cat: "Packaged Food" },
              { id: "c_btr", em: "🧈", nm: "Amul Butter Pasteurised", wt: "100 g", pr: 56, cat: "Dairy,Bread & Eggs" },
              { id: "c_brd", em: "🥖", nm: "English Oven Garlic Bread Stick", wt: "150 g", pr: 55, cat: "Dairy,Bread & Eggs" }
            ]
          }
        };

        const choice = cuisineMap[type];
        if (!choice) return;

        let addedCount = 0;
        choice.items.forEach(item => {
          const key = `cui-${item.id}`;
          cart.add(key);
          cartItemsList[key] = { em: item.em, nm: item.nm, wt: item.wt, pr: `₹${item.pr}`, cat: item.cat };
          addedCount++;
        });

        updateCartTotal();
        if (btn) {
          btn.innerHTML = `✓ ADDED ${choice.name.toUpperCase()}!`;
          btn.style.background = "#059669";
          btn.style.color = "#fff";
          btn.style.borderColor = "#059669";
        }
        toast(`Awesome! Your ${choice.name} basket is ready in your cart.`);
      };

      function getOfflineChatResponse(query) {
        const ql = query.toLowerCase().trim();
        const area = getAreaName();

        // 0G. Greeting & Conversational Identity
        if (ql.includes("hi") || ql.includes("hello") || ql.includes("hey") || ql.includes("namaste") || ql.includes("who are you") || ql.includes("what can you do") || ql.includes("help") || ql.includes("start")) {
          return `👋 <b>Hi! I'm Zepto AI — your friendly & intelligent grocery shopping assistant.</b><br><br>` +
            `My goal is to help you shop faster with fewer clicks in <b>${area}</b>!<br><br>` +
            `• Build grocery lists & complete shopping baskets<br>` +
            `• Recommend top-rated in-stock items & recipes<br>` +
            `• Suggest healthier alternatives & save you money<br><br>` +
            `What are we shopping for today?`;
        }

        // Rule: Alcohol restriction for minors
        if (ql.includes("alcohol") || ql.includes("beer") || ql.includes("wine") || ql.includes("whisky") || ql.includes("liquor") || ql.includes("vodka") || ql.includes("rum")) {
          return `🔞 <b>Age Restriction Policy</b>:<br><br>` +
            `Zepto AI cannot recommend or display alcohol products to minors. Please verify legal drinking age compliance.<br><br>` +
            `Explore our refreshing non-alcoholic mocktail mixers, juices, and cold brews instead!`;
        }

        // Rule: No medical advice or medical claims
        if (ql.includes("cure") || ql.includes("treat disease") || ql.includes("medical advice") || ql.includes("prescription medicine")) {
          return `🩺 <b>Medical Advice Disclaimer</b>:<br><br>` +
            `Zepto AI does not provide medical advice or make health claims. Please consult a qualified doctor or healthcare professional for medical guidance.<br><br>` +
            `I can help you find fresh groceries and healthy nutrition products!`;
        }

        // Rule 1: Follow-up question when dinner/food information is missing (5 Parameters: People, Cuisine, Budget, Diet, Cooking time)
        if (ql === "dinner" || ql === "cook dinner" || ql === "make dinner" || ql === "plan dinner" || ql === "meal" || ql === "food ideas" || ql === "food idea" || ql === "recipe ideas") {
          return `🍲 <b>Food Ideas & Recipe Discovery Protocol</b>:<br><br>` +
            `Before generating your recipe card & ingredient basket, please tell me:<br>` +
            `1. <b>Number of people</b> (e.g. 4 people)<br>` +
            `2. <b>Cuisine</b> (e.g. North Indian, South Indian, Indo-Chinese, Italian)<br>` +
            `3. <b>Budget limit</b> (e.g. under ₹600)<br>` +
            `4. <b>Diet</b> (Vegetarian / Non-Veg / Vegan / Jain)<br>` +
            `5. <b>Cooking time limit</b> (e.g. 25 mins)<br><br>` +
            `Or tap below to view our ready dinner plan for 4 people under ₹600!`;
        }

        // Grocery Basket Protocol: Collects Family size, Budget, Diet, Preferred brands, Shopping frequency
        if (ql === "groceries" || ql === "buy groceries" || ql === "grocery list" || ql === "restock" || ql === "weekly groceries" || ql.includes("grocery")) {
          return `🛒 <b>Grocery Shopping & Basket Building Protocol</b>:<br><br>` +
            `To curate your complete single shopping basket, please tell me:<br>` +
            `1. <b>Family size</b> (e.g. 4 members)<br>` +
            `2. <b>Budget limit</b> (e.g. ₹1500)<br>` +
            `3. <b>Diet</b> (Vegetarian / Non-Veg / Organic)<br>` +
            `4. <b>Preferred brands</b> (e.g. Amul, Aashirvaad, Surf Excel, or Any)<br>` +
            `5. <b>Shopping frequency</b> (Weekly / Monthly)<br><br>` +
            `Once collected, I'll generate your complete shopping basket containing Vegetables, Fruits, Dairy, Snacks, Cleaning & Personal Care with Total Cost & 8-min delivery!`;
        }

        // Cart Optimization Protocol: Analyzes cart, offers, combo discounts, cheaper alternatives, frequently bought together
        if (ql.includes("optimize cart") || ql.includes("optimize my cart") || ql.includes("save money") || ql.includes("cart suggestions") || ql.includes("cheaper alternatives") || ql.includes("optimize")) {
          return `⚡ <b>Cart Optimization Analysis</b> for <b>${area}</b>:<br><br>` +
            `• 💰 <b>Price Savings</b>: Save <b>₹64</b> by choosing 5kg Aashirvaad Chakki Atta (lower cost per kg vs 1kg packs).<br>` +
            `• 🏷️ <b>Combo Savings</b>: Pairing Amul Butter with Bread unlocks an extra <b>₹20</b> breakfast combo discount.<br>` +
            `• 🌟 <b>Better Brand Recommendation</b>: Epigamia Greek Yogurt provides 2x higher protein at 100% natural quality.<br>` +
            `• 🛒 <b>Missing Essential Pick</b>: Fresh Lemons & Mint leaves for your daily meals.<br><br>` +
            `<i>Note: I will never remove any items from your cart without your explicit permission!</i><br><br>` +
            `With options to:`;
        }

        // Purchase History Protocol: Analyzes previous orders, restock cycles, monthly essentials & seasonal picks
        if (ql.includes("previous purchases") || ql.includes("past orders") || ql.includes("reorder") || ql.includes("history") || ql.includes("repeat") || ql.includes("frequently bought")) {
          return `📊 <b>Purchase History Analysis for ${area}</b>:<br><br>` +
            `• 🔄 <b>Frequently Purchased</b>: Amul Fresh Cow Milk (500ml) & Whole Wheat Bread<br>` +
            `• 📅 <b>Monthly Essentials Restock</b>: Aashirvaad Shuddh Chakki Atta (5kg) & Tata Sampann Toor Dal (1kg)<br>` +
            `• 🌧️ <b>Monsoon Season Special</b>: Kadak Masala Ginger Tea & Everest Shahi Biryani Masala<br><br>` +
            `<i>Personalized for your exact household needs without unsolicited luxury items.</i><br><br>` +
            `With options to:`;
        }

        // Health & Dietary Goals Protocol: Handles Weight loss, Muscle gain, Diabetes, Heart healthy, High protein
        if (ql.includes("weight loss") || ql.includes("muscle gain") || ql.includes("diabetes") || ql.includes("heart healthy") || ql.includes("high protein") || ql.includes("health goal") || ql.includes("nutrition")) {
          return `🥗 <b>Health & Nutrition Goal Recommendations</b> for <b>${area}</b>:<br><br>` +
            `• <b>Healthy Alternatives</b>: Whole Wheat Atta & Rolled Oats (complex carbs for sustained energy)<br>` +
            `• <b>Higher Protein Options</b>: Amul Fresh Malai Paneer (18g protein/100g) & Organic Moong Dal<br>` +
            `• <b>Lower Sugar Options</b>: Epigamia Plain Unsweetened Greek Yogurt & Almond Milk<br><br>` +
            `<i>⚠️ Disclaimer: Please consult a qualified healthcare professional or dietitian for personalized medical advice.</i><br><br>` +
            `With options to:`;
        }

        // Budget Grocery Basket Protocol: Generates basket within strict budget prioritizing Staples, Veggies, Dairy, Proteins, Household
        if (ql.includes("under ₹") || ql.includes("under rs") || ql.includes("budget basket") || ql.includes("budget grocery")) {
          return `💵 <b>Strict Budget Grocery Basket (Target: ₹500)</b> for <b>${area}</b>:<br><br>` +
            `• 🌾 <b>Staples</b>: Fortune Everyday Basmati Rice (1kg) — ₹149<br>` +
            `• 🥦 <b>Vegetables</b>: Hybrid Tomatoes (1kg) & Red Onions (1kg) — ₹70<br>` +
            `• 🥛 <b>Dairy</b>: Mother Dairy Cow Milk (500ml) & Amul Paneer (200g) — ₹123<br>` +
            `• 🥩 <b>Proteins</b>: Organic Yellow Moong Dal (500g) — ₹89<br>` +
            `• 🧻 <b>Household</b>: Kitchen Tissue 2-Ply Roll — ₹45<br><br>` +
            `📊 <b>Cost Breakdown</b>:<br>` +
            `• Total Basket Cost: <b>₹476</b><br>` +
            `• Remaining Budget: <b>₹24</b> (Strictly under ₹500 budget limit)<br>` +
            `• Estimated Savings: <b>₹65</b> (via MRP discounts)<br><br>` +
            `With options to:`;
        }

        // Ingredient-Based Recipe Protocol: Generates recipe using given ingredients, identifies missing ingredients, cooking steps, YouTube link
        if (ql.includes("i have") || ql.includes("ingredients:") || ql.includes("using ingredients") || ql.includes("with ingredients")) {
          return `🍳 <b>Custom Recipe from Your Ingredients</b>:<br><br>` +
            `<b>Shahi Paneer & Jeera Rice Delight</b> (Prep time: 20 mins)<br><br>` +
            `<b>Cooking Instructions:</b><br>` +
            `1. Sauté onions & tomatoes in Ghee until golden brown.<br>` +
            `2. Blend into smooth gravy, add paneer cubes & spices.<br>` +
            `3. Temper Basmati rice with cumin seeds & serve hot.<br><br>` +
            `🛒 <b>Missing Ingredients (In stock on Zepto):</b><br>` +
            `• Amul Cow Ghee Jar (200ml) — ₹145<br>` +
            `• Everest Shahi Paneer Masala (50g) — ₹48<br><br>` +
            `▶️ <b>Watch Video Tutorial</b>: <a href="https://www.youtube.com/results?search_query=Shahi+Paneer+Jeera+Rice+Recipe" target="_blank" style="color:var(--zepto-purple-2);font-weight:800;text-decoration:underline;">YouTube Recipe Video Guide 🎥</a><br><br>` +
            `With options to:`;
        }

        // 0R. Replace Items in Meal Plan
        if (ql.includes("replace") || ql.includes("swap")) {
          return `🔄 <b>Replaced Meal Plan (Dinner for 4 under ₹600)</b><br><br>` +
            `Substituted Paneer & Basmati Rice with Fresh Mushrooms / Chicken, Wheat Atta & Yellow Moong Dal:<br><br>` +
            `• Fresh Mushrooms / Chicken Cut<br>` +
            `• Whole Wheat Chakki Atta (Fresh Chapatis)<br>` +
            `• Organic Yellow Moong Dal<br>` +
            `• Hybrid Tomatoes & Green Capsicum<br>` +
            `• Fresh Red Onions<br>` +
            `• Pure Cow Ghee & Whole Spices<br><br>` +
            `With options to:`;
        }

        // 0C. Change Cuisine for Meal Plan
        if (ql.includes("cuisine")) {
          return `🍲 <b>Select Your Preferred Cuisine (Dinner for 4 under ₹600)</b><br><br>` +
            `Choose a fresh regional or international dinner option:<br><br>` +
            `• <b>🇮🇳 North Indian (₹520)</b>: Shahi Paneer, Dal Makhani, Whole Wheat Roti, Jeera Rice<br>` +
            `• <b>🌴 South Indian (₹410)</b>: Dosa & Idli Batter, Sambhar Veggies, Coconut & Filter Coffee<br>` +
            `• <b>🥢 Indo-Chinese (₹380)</b>: Hakka Noodles, Chilli Paneer Cubes, Soy & Garlic Sauce<br>` +
            `• <b>🍝 Italian / Continental (₹460)</b>: Penne Pasta, Amul Butter, Garlic Bread & Cheese<br><br>` +
            `With options to:`;
        }

        // 0M. Complete Meal Generation & Dinner Planning
        if (ql.includes("meal") || ql.includes("dinner") || ql.includes("lunch") || ql.includes("ingredient") || ql.includes("plan")) {
          return `<b>Plan a dinner for 4 people under ₹600.</b><br><br>` +
            `The AI could recommend:<br><br>` +
            `• Paneer<br>` +
            `• Tomatoes<br>` +
            `• Onions<br>` +
            `• Rice<br>` +
            `• Curd<br>` +
            `• Spices<br><br>` +
            `With options to:`;
        }

        // 0D. Dietary & Health Bundles
        if (ql.includes("keto") || ql.includes("vegan") || ql.includes("sugar free") || ql.includes("low carb") || ql.includes("diet") || ql.includes("fitness")) {
          return `🥗 <b>Curated Health & Dietary Picks</b> for <b>${area}</b>:<br><br>` +
            `• 🧀 Amul Fresh Malai Paneer (200g) — ₹95<br>` +
            `• 🫘 Organic Yellow Moong Dal (500g) — ₹89<br>` +
            `• 🥜 Happilo Roasted Salted Cashews & Almonds (200g) — ₹249<br>` +
            `• 🫙 Epigamia Greek Yogurt (90g) — ₹50<br><br>` +
            `High protein, zero added sugar & 100% fresh! Delivered in 8 mins:`;
        }

        // 0B. Budget & Price Deals Search
        if (ql.includes("under 100") || ql.includes("under 200") || ql.includes("under 500") || ql.includes("cheap") || ql.includes("deal") || ql.includes("discount") || ql.includes("offer")) {
          return `🏷️ <b>Top Value Deals & Price Drop Picks in ${area}</b>:<br><br>` +
            `• 🍌 Fresho Banana Robusta (6 pcs) — ₹37 (<s>₹45</s>, 18% off)<br>` +
            `• 🥛 Mother Dairy Cow Milk Pouch (500ml) — ₹28 (<s>₹30</s>, 7% off)<br>` +
            `• 🍿 Lay's India's Magic Masala (73g) — ₹20 (<s>₹25</s>, 20% off)<br>` +
            `• 🍞 Britannia Whole Wheat Bread (400g) — ₹45 (<s>₹52</s>, 13% off)<br><br>` +
            `In stock and ready for guaranteed 8-minute delivery!`;
        }

        // 0A. Direct Live Catalog Product Search & Price/Stock Lookup
        const directMatch = masterProductCatalog.find(p => p.nm && ql.includes(p.nm.toLowerCase()));
        if (directMatch) {
          return `🟢 <b>Live Catalog Verified Match</b>:<br><b>${directMatch.em || '🛍️'} ${directMatch.nm}</b> (${directMatch.wt}) is live in stock at <b>₹${directMatch.pr}</b> ${directMatch.was ? `<s style="font-size:10px;opacity:0.7">₹${directMatch.was}</s>` : ''}! Guaranteed 8 mins ⚡ delivery to ${area}:`;
        }

        // 0P. Puran Poli / Maharashtrian Sweet Special
        if (ql.includes("puran") || ql.includes("poli") || ql.includes("puranpoli")) {
          return `🫓 <b>Authentic Maharashtrian Puran Poli Special</b>:<br>Craving hot, ghee-dripping Puran Poli? Made with soft wheat dough stuffed with sweet chana dal & jaggery filling! Below are all essential ingredients with exact calorie counts and the traditional recipe guide for ${area}:`;
        }

        // 0B. Biryani / Briyani Prep Kit
        if (ql.includes("biryani") || ql.includes("briyani") || ql.includes("biriyani")) {
          return `🍲 <b>Authentic Royal Dum Biryani Prep Kit</b>:<br>Cooking homemade Biryani? Get long-grain Basmati Rice, Everest Shahi Biryani Masala, Pure Cow Ghee, Fresh Curd, Ginger-Garlic Paste, Fresh Chicken/Paneer & Mint delivered in 8 mins to ${area}:`;
        }

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

        // 2. Dairy / Milk / Bread / Sandwich
        if (ql.includes("milk") || ql.includes("dairy") || ql.includes("egg") || ql.includes("bread") || ql.includes("butter") || ql.includes("curd") || ql.includes("paneer") || ql.includes("sandwich") || ql.includes("pairing") || ql.includes("toast")) {
          if (ql.includes("bread") || ql.includes("sandwich") || ql.includes("pairing") || ql.includes("toast")) {
            return `🥪 <b>Bread & Sandwich Pairing Guide</b> (Calories & Ingredients):<br>Fresh bread pairs best with 🧈 <b>Amul Butter</b>, 🧀 <b>Cheese Slices</b>, 🍅 <b>Fresh Veggies</b>, 🥗 <b>Veg Mayo</b> & 🫙 <b>Mint Chutney</b>! Below are top sandwich ingredients with exact calorie counts and 4 quick recipe guides for ${area}:`;
          }
          return `Fresh bread & eggs pair best with 🥛 <b>Dairy,Bread & Eggs</b>, 🥣 <b>Breakfast & Sauce</b>, ☕ <b>Tea, Coffee & More</b>, and refreshing 🥤 <b>Cold Drinks & Juices</b>!`;
        }

        // 3. Pet Care
        if (ql.includes("pet") || ql.includes("dog") || ql.includes("cat") || ql.includes("puppy") || ql.includes("kitten")) {
          return `Looking for pet supplies? 🐾 48 pet parents near ${area} ordered treats today! Try <b>Pet care</b>, <b>Cleaning Essentials</b>, and <b>Home needs</b>.`;
        }

        // 4. Baby Care
        if (ql.includes("baby") || ql.includes("infant") || ql.includes("diaper") || ql.includes("pamper") || ql.includes("toddler")) {
          return `🍼 <b>Gentle Baby Care & Diapering Essentials</b>:<br>Dermatologist-tested, gentle baby essentials for your little one! Discover <b>Pampers Diapers</b>, <b>Himalaya Gentle Wipes</b>, <b>Johnson's Baby Lotion</b>, <b>Johnson's Top-To-Toe Wash</b> & <b>Nestle Cerelac Cereal</b> delivered in 8 mins to ${area}:`;
        }

        // 5. Zepto Cafe / Coffee & Tea
        if (ql.includes("cafe") || ql.includes("coffee") || ql.includes("cold brew") || ql.includes("croissant") || ql.includes("zepto cafe") || ql.includes("chai") || ql.includes("tea")) {
          return `☕ <b>Tea, Coffee & Cafe Specials</b>:<br>Discover premium tea leaves, roasted coffee beans, instant coffee, cold brews, herbal teas & fresh bakery pairs delivered in 8 mins to ${area}:`;
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

        // 0M. Misal Pav Special
        if (ql.includes("misal")) {
          return `🥣 <b>Authentic Puneri / Kolhapuri Misal Pav Special</b>:<br>Craving fiery, mouth-watering Misal Pav? Made with sprouted moth beans (matki), spicy kat/tarri gravy, crunchy farsan, fresh red onions & soft pav! Below are all essential ingredients with exact calorie counts and recipe guide for ${area}:`;
        }

        // 9. Seasonal / Monsoon / Rainy Cravings
        if (ql.includes("monsoon") || ql.includes("rain") || ql.includes("cravings") || ql.includes("vada pav") || ql.includes("corn") || ql.includes("bhajji") || ql.includes("pakoda") || ql.includes("season")) {
          return `🌧️ <b>Monsoon Rain & Cravings Special</b>:<br>Nothing pairs better with monsoon rains than 🍔 <b>Mumbai Style Vada Pav</b>, 🌽 <b>Boiled Sweet Corn Butter Masala</b>, 🧅 <b>Crispy Kanda Bhajji</b>, ☕ <b>Kadak Ginger Masala Chai</b> & 🥟 <b>Hot Steamed Momos</b>! Below are top rainy day recipes with exact calorie counts and ingredients delivered in 8 mins to ${area}:`;
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

        // Intelligent Zero Match Fallback Protocol (Never says "No products found")
        return `🔍 <b>No exact match for "${query}"</b> in <b>${area}</b> right now.<br><br>` +
          `Here are great ways to find what you need:<br>` +
          `• 📍 <b>Nearby Alternatives</b>: Top related picks in adjacent categories below<br>` +
          `• 🏷️ <b>Different Brands</b>: Popular matching items from trusted local brands<br>` +
          `• 📈 <b>Higher Budget Options</b>: Premium pack sizes available for delivery<br>` +
          `• 📉 <b>Lower Budget Options</b>: Value economy packs in stock<br><br>` +
          `🔔 <i>Tap "Notify Me" below to get alerted when this item is restocked!</i>`;
      }

      /* Map a query to relevant product categories to show as cards */
      function getQueryCategories(ql) {
        if (ql.includes("biryani") || ql.includes("briyani") || ql.includes("biriyani")) return ["Atta, Rice & Dals", "Masala & Dry Fruits", "Meat, Fish & Eggs", "Dairy,Bread & Eggs"];
        if (ql.includes("puran") || ql.includes("poli")) return ["Sweet Craving", "Atta, Rice & Dals", "Dairy,Bread & Eggs", "Masala & Dry Fruits"];
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
        if (ql.includes("baby") || ql.includes("infant") || ql.includes("diaper") || ql.includes("pamper") || ql.includes("toddler")) return ["Baby care"];
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
        if (ql.includes("biryani") || ql.includes("briyani") || ql.includes("biriyani")) return "🍲 Biryani Prep & Essential Ingredients:";
        if (ql.includes("puran") || ql.includes("poli")) return "🫓 Pairing with Puran Poli:";
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


      window.addCafeProductToCart = function (btn, itemId) {
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

      window.addChatProductItemToCart = function (btn, catName, itemNm, itemPr, itemEm, itemWt) {
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
        // Map category name to catalog key
        let searchTerm = catName;
        if (lowerCat.includes("paan")) searchTerm = "Paan Corner";
        else if (lowerCat.includes("fruit") || lowerCat.includes("vegetable")) searchTerm = "Fruits & vegetables";
        else if (lowerCat.includes("dairy")) searchTerm = "Dairy,Bread & Eggs";
        else if (lowerCat.includes("atta") || lowerCat.includes("rice") || lowerCat.includes("dal")) searchTerm = "Atta, Rice & Dals";
        else if (lowerCat.includes("munch") || lowerCat.includes("snack")) searchTerm = "Munchies";
        else if (lowerCat.includes("zepto cafe") || lowerCat.includes("cafe")) searchTerm = "Zepto Cafe";
        else if (lowerCat.includes("cold drink") || lowerCat.includes("juice")) searchTerm = "Cold Drinks & Juices";
        else if (lowerCat.includes("biscuit") || lowerCat.includes("cookie")) searchTerm = "Biscuits & Cookies";
        else if (lowerCat.includes("sweet")) searchTerm = "Sweet Craving";
        else if (lowerCat.includes("breakfast") || lowerCat.includes("sauce")) searchTerm = "Breakfast & Sauce";
        else if (lowerCat.includes("packaged")) searchTerm = "Packaged Food";
        else if (lowerCat.includes("meat") || lowerCat.includes("fish")) searchTerm = "Meat, Fish & Eggs";
        else if (lowerCat.includes("masala") || lowerCat.includes("dry fruit")) searchTerm = "Masala & Dry Fruits";
        else if (lowerCat.includes("ice cream")) searchTerm = "Ice Creams & More";
        else if (lowerCat.includes("frozen")) searchTerm = "Frozen Food";
        else if (lowerCat.includes("tea") || lowerCat.includes("coffee")) searchTerm = "Tea, Coffee & More";
        else if (lowerCat.includes("skincare")) searchTerm = "Skincare";
        else if (lowerCat.includes("makeup") || lowerCat.includes("beauty")) searchTerm = "Makeup & Beauty";
        else if (lowerCat.includes("bath")) searchTerm = "Bath & Body";
        else if (lowerCat.includes("haircare") || lowerCat.includes("hair")) searchTerm = "Haircare";
        else if (lowerCat.includes("self care")) searchTerm = "Self care Studio";
        else if (lowerCat.includes("fragrance")) searchTerm = "Fragrance";
        else if (lowerCat.includes("baby")) searchTerm = "Baby care";
        else if (lowerCat.includes("pet")) searchTerm = "Pet care";
        else if (lowerCat.includes("cleaning")) searchTerm = "Cleaning Essentials";
        else if (lowerCat.includes("home need")) searchTerm = "Home needs";
        else if (lowerCat.includes("kitchen")) searchTerm = "Kitchen & Dining";
        else if (lowerCat.includes("pharma") || lowerCat.includes("wellness")) searchTerm = "Pharmacy & Wellness";
        else if (lowerCat.includes("protein") || lowerCat.includes("nutrition")) searchTerm = "Protein & Nutrition";
        else if (lowerCat.includes("station") || lowerCat.includes("book")) searchTerm = "Stationery& Books";
        else if (lowerCat.includes("toy") || lowerCat.includes("game")) searchTerm = "Toys & games";
        else if (lowerCat.includes("apparel") || lowerCat.includes("lifestyle")) searchTerm = "Apparel";
        else if (lowerCat.includes("jewel")) searchTerm = "Jewellery";
        else if (lowerCat.includes("gourmet") || lowerCat.includes("world food")) searchTerm = "Gourmet";
        else if (lowerCat.includes("gift")) searchTerm = "Gifting";
        else if (lowerCat.includes("plant") || lowerCat.includes("garden")) searchTerm = "Plants";
        else if (lowerCat.includes("electron")) searchTerm = "Electronics store";
        else if (lowerCat.includes("decor")) searchTerm = "Home Decor";
        openCategoryPage(searchTerm);
      };

      /* ---------- ZEPTO CAFE OFFICIAL MENU ITEMS ---------- */
      const zeptoCafeMenu = [
        { id: "zc1", em: "☕", nm: "Classic Cold Brew Coffee", wt: "250 ml", pr: "₹79", was: "₹99", cat: "Zepto Cafe", img: "https://images.bigbasket.com/media/uploads/p/l/40194883_2-sleepy-owl-cold-brew-coffee-classic.jpg" },
        { id: "zc2", em: "☕", nm: "Vietnamese Iced Coffee", wt: "250 ml", pr: "₹99", was: "₹120", cat: "Zepto Cafe", img: "https://images.bigbasket.com/media/uploads/p/l/40194883_2-sleepy-owl-cold-brew-coffee-classic.jpg" },
        { id: "zc3", em: "☕", nm: "Hazelnut Iced Latte", wt: "250 ml", pr: "₹109", was: "₹135", cat: "Zepto Cafe", img: "https://images.bigbasket.com/media/uploads/p/l/40194883_2-sleepy-owl-cold-brew-coffee-classic.jpg" },
        { id: "zc4", em: "☕", nm: "Hot Cappuccino", wt: "200 ml", pr: "₹69", was: "₹85", cat: "Zepto Cafe", img: "https://images.bigbasket.com/media/uploads/p/l/40194883_2-sleepy-owl-cold-brew-coffee-classic.jpg" },
        { id: "zc5", em: "🫖", nm: "Masala Cutting Chai", wt: "150 ml", pr: "₹39", was: "₹49", cat: "Zepto Cafe", img: "https://images.bigbasket.com/media/uploads/p/l/40000774_2-amul-taaza-toned-milk.jpg" },
        { id: "zc6", em: "🫖", nm: "Ginger Kulhad Chai", wt: "150 ml", pr: "₹45", was: "₹55", cat: "Zepto Cafe", img: "https://images.bigbasket.com/media/uploads/p/l/40000774_2-amul-taaza-toned-milk.jpg" },
        { id: "zc7", em: "🥐", nm: "Fresh Butter Croissant", wt: "1 pc", pr: "₹49", was: "₹59", cat: "Zepto Cafe", img: "https://images.bigbasket.com/media/uploads/p/l/40212345_1-fresh-butter-croissant.jpg" },
        { id: "zc8", em: "🥐", nm: "Chocolate Almond Croissant", wt: "1 pc", pr: "₹89", was: "₹110", cat: "Zepto Cafe", img: "https://images.bigbasket.com/media/uploads/p/l/40212345_1-fresh-butter-croissant.jpg" },
        { id: "zc9", em: "🫐", nm: "Blueberry Muffin", wt: "1 pc", pr: "₹65", was: "₹80", cat: "Zepto Cafe", img: "https://images.bigbasket.com/media/uploads/p/l/40132748_2-epigamia-greek-yogurt.jpg" },
        { id: "zc10", em: "🍪", nm: "Choco Chip Cookies", wt: "2 pcs", pr: "₹49", was: "₹60", cat: "Zepto Cafe", img: "https://images.bigbasket.com/media/uploads/p/l/40000755-1-amul-butter.jpg" },
        { id: "zc11", em: "🥪", nm: "Classic Veg Cheese Sandwich", wt: "1 pc", pr: "₹79", was: "₹99", cat: "Zepto Cafe", img: "https://images.bigbasket.com/media/uploads/p/l/40069497-2-britannia-100-whole-wheat-bread.jpg" },
        { id: "zc12", em: "🥪", nm: "Veg Corn & Cheese Grilled Sandwich", wt: "1 pc", pr: "₹99", was: "₹120", cat: "Zepto Cafe", img: "https://images.bigbasket.com/media/uploads/p/l/40069497-2-britannia-100-whole-wheat-bread.jpg" },
        { id: "zc13", em: "🌯", nm: "Crispy Paneer Wrap", wt: "1 pc", pr: "₹119", was: "₹145", cat: "Zepto Cafe", img: "https://images.bigbasket.com/media/uploads/p/l/40012869_1-amul-fresh-paneer.jpg" },
        { id: "zc14", em: "🥟", nm: "Hot Samosa with Mint Chutney", wt: "2 pcs", pr: "₹45", was: "₹55", cat: "Zepto Cafe", img: "https://images.bigbasket.com/media/uploads/p/l/40002672_3-mothers-recipe-green-chutney.jpg" },
        { id: "zc15", em: "🧆", nm: "Potato Cheese Balls", wt: "6 pcs", pr: "₹89", was: "₹110", cat: "Zepto Cafe", img: "https://images.bigbasket.com/media/uploads/p/l/40000768_2-amul-processed-cheese.jpg" },
        { id: "zc16", em: "🍫", nm: "Belgian Chocolate Brownie", wt: "1 pc", pr: "₹89", was: "₹110", cat: "Zepto Cafe", img: "https://images.bigbasket.com/media/uploads/p/l/40000768_2-amul-processed-cheese.jpg" },
        { id: "zc17", em: "🍰", nm: "Tiramisu Dessert Cup", wt: "1 pc", pr: "₹129", was: "₹150", cat: "Zepto Cafe", img: "https://images.bigbasket.com/media/uploads/p/l/40194883_2-sleepy-owl-cold-brew-coffee-classic.jpg" },
        { id: "zc18", em: "🧀", nm: "Garlic Cheese Toast", wt: "2 pcs", pr: "₹69", was: "₹85", cat: "Zepto Cafe", img: "https://images.bigbasket.com/media/uploads/p/l/40069497-2-britannia-100-whole-wheat-bread.jpg" }
      ];

      /* Dynamically build masterProductCatalog from zeptoCafeMenu and categoryProductsCatalog */
      const catalogItemsFromCategories = Object.keys(categoryProductsCatalog).flatMap((catName, catIdx) => {
        return categoryProductsCatalog[catName].map((item, itemIdx) => ({
          id: `catprod-${catIdx}-${itemIdx}`,
          em: item.em,
          img: item.img,
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

      window.openProductSearch = function (prefilledQuery) {
        const overlay = $("#search-modal-overlay");
        if (overlay) {
          overlay.classList.add("show");
          const input = $("#prod-search-input");
          if (input) {
            if (prefilledQuery) {
              input.value = prefilledQuery;
              performProductSearchFilter(prefilledQuery);
              $("#search-default-view").style.display = "none";
              $("#search-results-view").style.display = "block";
              const clearBtn = $("#prod-search-clear");
              if (clearBtn) clearBtn.style.display = "flex";
            } else {
              input.value = "";
              renderSearchPopular();
              $("#search-default-view").style.display = "block";
              $("#search-results-view").style.display = "none";
              $("#prod-search-clear").style.display = "none";
              setTimeout(() => input.focus(), 100);
            }
          }
        }
      };

      window.closeProductSearch = function () {
        const overlay = $("#search-modal-overlay");
        if (overlay) overlay.classList.remove("show");
      };

      window.executeProductSearch = function (query) {
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
          const text = btn.dataset.query || btn.textContent.trim();
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