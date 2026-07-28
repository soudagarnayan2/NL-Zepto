import os
import logging
import httpx
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
import json
import asyncio
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse
from fastapi import FastAPI, Query
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from phase1_ingestion.phase1_4_db_storage.database import get_db_connection

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("reco_service")

app = FastAPI(title="Zepto Discovery Recommendation Engine", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- STATIC RECOMMENDATIONS & DATA ---
STATIC_FALLBACKS = [
    {"category": "Fruits & vegetables", "url": "https://zepto.com/categories/fruits-vegetables?source=reco_fallback"},
    {"category": "Dairy,Bread & Eggs", "url": "https://zepto.com/categories/dairy-bread-eggs?source=reco_fallback"},
    {"category": "Munchies", "url": "https://zepto.com/categories/munchies?source=reco_fallback"},
    {"category": "Cold Drinks & Juices", "url": "https://zepto.com/categories/cold-drinks-juices?source=reco_fallback"}
]

QUERY_MAPPINGS = {
    "fruits": [
        {"category": "Fruits & vegetables", "url": "https://zepto.com/categories/fruits-vegetables?campaign=fresh_fruits"},
        {"category": "Groceries & Staples", "url": "https://zepto.com/categories/groceries-staples?campaign=fresh_fruits"},
        {"category": "Cold Drinks & Juices", "url": "https://zepto.com/categories/cold-drinks-juices?campaign=fresh_fruits"}
    ],
    "vegetables": [
        {"category": "Fruits & vegetables", "url": "https://zepto.com/categories/fruits-vegetables?campaign=fresh_veggies"},
        {"category": "Groceries & Staples", "url": "https://zepto.com/categories/groceries-staples?campaign=fresh_veggies"},
        {"category": "Atta, Rice & Dals", "url": "https://zepto.com/categories/atta-rice-dals?campaign=fresh_veggies"}
    ],
    "milk": [
        {"category": "Dairy,Bread & Eggs", "url": "https://zepto.com/categories/dairy-bread-eggs?campaign=breakfast"},
        {"category": "Breakfast & Sauce", "url": "https://zepto.com/categories/breakfast-sauce?campaign=breakfast"},
        {"category": "Cold Drinks & Juices", "url": "https://zepto.com/categories/cold-drinks-juices?campaign=breakfast"}
    ],
    "snacks": [
        {"category": "Munchies", "url": "https://zepto.com/categories/munchies?campaign=munchies"},
        {"category": "Snacks & Packaged Foods", "url": "https://zepto.com/categories/snacks-packaged-foods?campaign=munchies"},
        {"category": "Biscuits & Cookies", "url": "https://zepto.com/categories/biscuits-cookies?campaign=munchies"}
    ],
    "pet": [
        {"category": "Pet care", "url": "https://zepto.com/categories/pet-care?campaign=discover_pet"},
        {"category": "Cleaning Essentials", "url": "https://zepto.com/categories/cleaning-essentials?campaign=discover_pet"},
        {"category": "Home needs", "url": "https://zepto.com/categories/home-needs?campaign=discover_pet"}
    ],
    "care": [
        {"category": "Self care Studio", "url": "https://zepto.com/categories/self-care-studio?campaign=discover_care"},
        {"category": "Skincare", "url": "https://zepto.com/categories/skincare?campaign=discover_care"},
        {"category": "Bath & Body", "url": "https://zepto.com/categories/bath-body?campaign=discover_care"}
    ],
    "home": [
        {"category": "Home needs", "url": "https://zepto.com/categories/home-needs?campaign=discover_home"},
        {"category": "Kitchen & Dining", "url": "https://zepto.com/categories/kitchen-dining?campaign=discover_home"},
        {"category": "Cleaning Essentials", "url": "https://zepto.com/categories/cleaning-essentials?campaign=discover_home"}
    ],
    "wellness": [
        {"category": "Pharmacy & Wellness", "url": "https://zepto.com/categories/pharmacy-wellness?campaign=discover_wellness"},
        {"category": "Protein & Nutrition", "url": "https://zepto.com/categories/protein-nutrition?campaign=discover_wellness"},
        {"category": "Self care Studio", "url": "https://zepto.com/categories/self-care-studio?campaign=discover_wellness"}
    ],
    "baby": [
        {"category": "Baby care", "url": "https://zepto.com/categories/baby-care?campaign=discover_baby"},
        {"category": "Bath & Body", "url": "https://zepto.com/categories/bath-body?campaign=discover_baby"},
        {"category": "Pharmacy & Wellness", "url": "https://zepto.com/categories/pharmacy-wellness?campaign=discover_baby"}
    ],
    "kids": [
        {"category": "Baby care", "url": "https://zepto.com/categories/baby-care?campaign=discover_baby"},
        {"category": "Toys & games", "url": "https://zepto.com/categories/toys-games?campaign=discover_baby"},
        {"category": "Stationery& Books", "url": "https://zepto.com/categories/stationery-books?campaign=discover_baby"}
    ],
    "kid": [
        {"category": "Baby care", "url": "https://zepto.com/categories/baby-care?campaign=discover_baby"},
        {"category": "Toys & games", "url": "https://zepto.com/categories/toys-games?campaign=discover_baby"},
        {"category": "Stationery& Books", "url": "https://zepto.com/categories/stationery-books?campaign=discover_baby"}
    ],
    "gifting": [
        {"category": "Sweet Craving", "url": "https://zepto.com/categories/sweet-craving?campaign=discover_gifting"},
        {"category": "Zepto Cafe", "url": "https://zepto.com/categories/zepto-cafe?campaign=discover_gifting"},
        {"category": "Jewellery", "url": "https://zepto.com/categories/jewellery?campaign=discover_gifting"}
    ],
    "gift": [
        {"category": "Sweet Craving", "url": "https://zepto.com/categories/sweet-craving?campaign=discover_gifting"},
        {"category": "Zepto Cafe", "url": "https://zepto.com/categories/zepto-cafe?campaign=discover_gifting"},
        {"category": "Jewellery", "url": "https://zepto.com/categories/jewellery?campaign=discover_gifting"}
    ],
    "other categories": [
        {"category": "Home needs", "url": "https://zepto.com/categories/home-needs?campaign=other_categories"},
        {"category": "Apparel", "url": "https://zepto.com/categories/apparel?campaign=other_categories"},
        {"category": "Jewellery", "url": "https://zepto.com/categories/jewellery?campaign=other_categories"},
        {"category": "Kitchen & Dining", "url": "https://zepto.com/categories/kitchen-dining?campaign=other_categories"},
        {"category": "Electronics store", "url": "https://zepto.com/categories/electronics-store?campaign=other_categories"}
    ],
    "other category": [
        {"category": "Home needs", "url": "https://zepto.com/categories/home-needs?campaign=other_categories"},
        {"category": "Apparel", "url": "https://zepto.com/categories/apparel?campaign=other_categories"},
        {"category": "Jewellery", "url": "https://zepto.com/categories/jewellery?campaign=other_categories"},
        {"category": "Kitchen & Dining", "url": "https://zepto.com/categories/kitchen-dining?campaign=other_categories"},
        {"category": "Electronics store", "url": "https://zepto.com/categories/electronics-store?campaign=other_categories"}
    ],
    "apparel": [
        {"category": "Apparel", "url": "https://zepto.com/categories/apparel?campaign=discover_apparel"},
        {"category": "Self care Studio", "url": "https://zepto.com/categories/self-care-studio?campaign=discover_apparel"},
        {"category": "Fragrance", "url": "https://zepto.com/categories/fragrance?campaign=discover_apparel"}
    ],
    "apparels": [
        {"category": "Apparel", "url": "https://zepto.com/categories/apparel?campaign=discover_apparel"},
        {"category": "Self care Studio", "url": "https://zepto.com/categories/self-care-studio?campaign=discover_apparel"},
        {"category": "Fragrance", "url": "https://zepto.com/categories/fragrance?campaign=discover_apparel"}
    ],
    "jewellery": [
        {"category": "Jewellery", "url": "https://zepto.com/categories/jewellery?campaign=discover_jewellery"},
        {"category": "Sweet Craving", "url": "https://zepto.com/categories/sweet-craving?campaign=discover_jewellery"},
        {"category": "Zepto Cafe", "url": "https://zepto.com/categories/zepto-cafe?campaign=discover_jewellery"}
    ],
        "fruits": [
        {"category": "Fruits & vegetables", "url": "https://zepto.com/categories/fruits-vegetables?campaign=fruits"},
        {"category": "Groceries & Staples", "url": "https://zepto.com/categories/groceries-staples?campaign=fruits"}
    ],
    "dairy": [
        {"category": "Dairy,Bread & Eggs", "url": "https://zepto.com/categories/dairy-bread-eggs?campaign=dairy"},
        {"category": "Breakfast & Sauce", "url": "https://zepto.com/categories/breakfast-sauce?campaign=dairy"}
    ],
    "atta": [
        {"category": "Atta, Rice & Dals", "url": "https://zepto.com/categories/atta-rice-dals?campaign=staples"},
        {"category": "Groceries & Staples", "url": "https://zepto.com/categories/groceries-staples?campaign=staples"}
    ],
    "munchies": [
        {"category": "Munchies", "url": "https://zepto.com/categories/munchies?campaign=munchies"},
        {"category": "Snacks & Packaged Foods", "url": "https://zepto.com/categories/snacks-packaged-foods?campaign=munchies"}
    ],
    "cold drinks": [
        {"category": "Cold Drinks & Juices", "url": "https://zepto.com/categories/cold-drinks-juices?campaign=drinks"},
        {"category": "Tea, Coffee & More", "url": "https://zepto.com/categories/tea-coffee-more?campaign=drinks"}
    ],
    "biscuits": [
        {"category": "Biscuits & Cookies", "url": "https://zepto.com/categories/biscuits-cookies?campaign=biscuits"},
        {"category": "Sweet Craving", "url": "https://zepto.com/categories/sweet-craving?campaign=biscuits"}
    ],
    "sweet craving": [
        {"category": "Sweet Craving", "url": "https://zepto.com/categories/sweet-craving?campaign=sweets"},
        {"category": "Ice Creams & More", "url": "https://zepto.com/categories/ice-creams-more?campaign=sweets"}
    ],
    "meat": [
        {"category": "Meat, Fish & Eggs", "url": "https://zepto.com/categories/meat-fish-eggs?campaign=fresh_meat"},
        {"category": "Dairy,Bread & Eggs", "url": "https://zepto.com/categories/dairy-bread-eggs?campaign=fresh_meat"}
    ],
    "masala": [
        {"category": "Masala & Dry Fruits", "url": "https://zepto.com/categories/masala-dry-fruits?campaign=dry_fruits"},
        {"category": "Groceries & Staples", "url": "https://zepto.com/categories/groceries-staples?campaign=dry_fruits"}
    ],
    "ice cream": [
        {"category": "Ice Creams & More", "url": "https://zepto.com/categories/ice-creams-more?campaign=ice_creams"},
        {"category": "Sweet Craving", "url": "https://zepto.com/categories/sweet-craving?campaign=ice_creams"}
    ],
    "frozen": [
        {"category": "Frozen Food", "url": "https://zepto.com/categories/frozen-food?campaign=frozen"},
        {"category": "Zepto Cafe", "url": "https://zepto.com/categories/zepto-cafe?campaign=frozen"}
    ],
    "skincare": [
        {"category": "Skincare", "url": "https://zepto.com/categories/skincare?campaign=skincare"},
        {"category": "Self care Studio", "url": "https://zepto.com/categories/self-care-studio?campaign=skincare"}
    ],
    "makeup": [
        {"category": "Makeup & Beauty", "url": "https://zepto.com/categories/makeup-beauty?campaign=makeup"},
        {"category": "Fragrance", "url": "https://zepto.com/categories/fragrance?campaign=makeup"}
    ],
    "bath": [
        {"category": "Bath & Body", "url": "https://zepto.com/categories/bath-body?campaign=bath_body"},
        {"category": "Skincare", "url": "https://zepto.com/categories/skincare?campaign=bath_body"}
    ],
    "haircare": [
        {"category": "Haircare", "url": "https://zepto.com/categories/haircare?campaign=haircare"},
        {"category": "Bath & Body", "url": "https://zepto.com/categories/bath-body?campaign=haircare"}
    ],
    "self care": [
        {"category": "Self care Studio", "url": "https://zepto.com/categories/self-care-studio?campaign=self_care"},
        {"category": "Skincare", "url": "https://zepto.com/categories/skincare?campaign=self_care"}
    ],
    "fragrance": [
        {"category": "Fragrance", "url": "https://zepto.com/categories/fragrance?campaign=fragrance"},
        {"category": "Self care Studio", "url": "https://zepto.com/categories/self-care-studio?campaign=fragrance"}
    ],
    "baby care": [
        {"category": "Baby care", "url": "https://zepto.com/categories/baby-care?campaign=baby_care"},
        {"category": "Pharmacy & Wellness", "url": "https://zepto.com/categories/pharmacy-wellness?campaign=baby_care"}
    ],
    "pet care": [
        {"category": "Pet care", "url": "https://zepto.com/categories/pet-care?campaign=pet_care"},
        {"category": "Cleaning Essentials", "url": "https://zepto.com/categories/cleaning-essentials?campaign=pet_care"}
    ],
    "kitchen": [
        {"category": "Kitchen & Dining", "url": "https://zepto.com/categories/kitchen-dining?campaign=kitchen"},
        {"category": "Home needs", "url": "https://zepto.com/categories/home-needs?campaign=kitchen"}
    ],
    "home needs": [
        {"category": "Home needs", "url": "https://zepto.com/categories/home-needs?campaign=home_needs"},
        {"category": "Kitchen & Dining", "url": "https://zepto.com/categories/kitchen-dining?campaign=home_needs"}
    ],
    "pharmacy": [
        {"category": "Pharmacy & Wellness", "url": "https://zepto.com/categories/pharmacy-wellness?campaign=wellness"},
        {"category": "Protein & Nutrition", "url": "https://zepto.com/categories/protein-nutrition?campaign=wellness"}
    ],
    "protein": [
        {"category": "Protein & Nutrition", "url": "https://zepto.com/categories/protein-nutrition?campaign=protein"},
        {"category": "Pharmacy & Wellness", "url": "https://zepto.com/categories/pharmacy-wellness?campaign=protein"}
    ],
    "stationery": [
        {"category": "Stationery& Books", "url": "https://zepto.com/categories/stationery-books?campaign=stationery"},
        {"category": "Toys & games", "url": "https://zepto.com/categories/toys-games?campaign=stationery"}
    ],
    "toys": [
        {"category": "Toys & games", "url": "https://zepto.com/categories/toys-games?campaign=toys"},
        {"category": "Stationery& Books", "url": "https://zepto.com/categories/stationery-books?campaign=toys"}
    ],
    "apparel": [
        {"category": "Apparel", "url": "https://zepto.com/categories/apparel?campaign=apparel"},
        {"category": "Self care Studio", "url": "https://zepto.com/categories/self-care-studio?campaign=apparel"}
    ],
    "jewellery": [
        {"category": "Jewellery", "url": "https://zepto.com/categories/jewellery?campaign=jewellery"},
        {"category": "Sweet Craving", "url": "https://zepto.com/categories/sweet-craving?campaign=jewellery"}
    ],
    "gourmet": [
        {"category": "Gourmet", "url": "https://zepto.com/categories/gourmet?campaign=gourmet"},
        {"category": "Breakfast & Sauce", "url": "https://zepto.com/categories/breakfast-sauce?campaign=gourmet"}
    ],
    "gifting": [
        {"category": "Gifting", "url": "https://zepto.com/categories/gifting?campaign=gifting"},
        {"category": "Sweet Craving", "url": "https://zepto.com/categories/sweet-craving?campaign=gifting"}
    ],
    "plants": [
        {"category": "Plants", "url": "https://zepto.com/categories/plants?campaign=plants"},
        {"category": "Home Decor", "url": "https://zepto.com/categories/home-decor?campaign=plants"}
    ],
    "electronics": [
        {"category": "Electronics store", "url": "https://zepto.com/categories/electronics-store?campaign=electronics"},
        {"category": "Home needs", "url": "https://zepto.com/categories/home-needs?campaign=electronics"}
    ],
    "home decor": [
        {"category": "Home Decor", "url": "https://zepto.com/categories/home-decor?campaign=home_decor"},
        {"category": "Plants", "url": "https://zepto.com/categories/plants?campaign=home_decor"}
    ],
    "paan corner": [
        {"category": "Paan Corner", "url": "https://zepto.com/categories/paan-corner?campaign=discover_paan"},
        {"category": "Sweet Craving", "url": "https://zepto.com/categories/sweet-craving?campaign=discover_paan"},
        {"category": "Munchies", "url": "https://zepto.com/categories/munchies?campaign=discover_paan"}
    ],
    "paan": [
        {"category": "Paan Corner", "url": "https://zepto.com/categories/paan-corner?campaign=discover_paan"},
        {"category": "Sweet Craving", "url": "https://zepto.com/categories/sweet-craving?campaign=discover_paan"},
        {"category": "Munchies", "url": "https://zepto.com/categories/munchies?campaign=discover_paan"}
    ],
    "jewelry": [
        {"category": "Jewellery", "url": "https://zepto.com/categories/jewellery?campaign=discover_jewellery"},
        {"category": "Sweet Craving", "url": "https://zepto.com/categories/sweet-craving?campaign=discover_jewellery"},
        {"category": "Zepto Cafe", "url": "https://zepto.com/categories/zepto-cafe?campaign=discover_jewellery"}
    ],
    "home needs": [
        {"category": "Home needs", "url": "https://zepto.com/categories/home-needs?campaign=discover_home_needs"},
        {"category": "Kitchen & Dining", "url": "https://zepto.com/categories/kitchen-dining?campaign=discover_home_needs"},
        {"category": "Cleaning Essentials", "url": "https://zepto.com/categories/cleaning-essentials?campaign=discover_home_needs"}
    ],
    "electronics": [
        {"category": "Electronics store", "url": "https://zepto.com/categories/electronics-store?campaign=discover_electronics"},
        {"category": "Home needs", "url": "https://zepto.com/categories/home-needs?campaign=discover_electronics"},
        {"category": "Stationery& Books", "url": "https://zepto.com/categories/stationery-books?campaign=discover_electronics"}
    ],
    "stationery": [
        {"category": "Stationery& Books", "url": "https://zepto.com/categories/stationery-books?campaign=discover_stationery"},
        {"category": "Toys & games", "url": "https://zepto.com/categories/toys-games?campaign=discover_stationery"},
        {"category": "Electronics store", "url": "https://zepto.com/categories/electronics-store?campaign=discover_stationery"}
    ],
    "toys": [
        {"category": "Toys & games", "url": "https://zepto.com/categories/toys-games?campaign=discover_toys"},
        {"category": "Baby care", "url": "https://zepto.com/categories/baby-care?campaign=discover_toys"},
        {"category": "Stationery& Books", "url": "https://zepto.com/categories/stationery-books?campaign=discover_toys"}
    ],
    "other": [
        {"category": "Dairy,Bread & Eggs", "url": "https://zepto.com/categories/dairy-bread-eggs?campaign=discover_trending"},
        {"category": "Munchies", "url": "https://zepto.com/categories/munchies?campaign=discover_trending"},
        {"category": "Zepto Cafe", "url": "https://zepto.com/categories/zepto-cafe?campaign=discover_trending"},
        {"category": "Fruits & vegetables", "url": "https://zepto.com/categories/fruits-vegetables?campaign=discover_trending"}
    ],
    "healthy snacks": [
        {"category": "Masala & Dry Fruits", "url": "https://zepto.com/categories/masala-dry-fruits?campaign=healthy_snacks"},
        {"category": "Protein & Nutrition", "url": "https://zepto.com/categories/protein-nutrition?campaign=healthy_snacks"},
        {"category": "Snacks & Packaged Foods", "url": "https://zepto.com/categories/snacks-packaged-foods?campaign=healthy_snacks"}
    ],
    "healthy": [
        {"category": "Pharmacy & Wellness", "url": "https://zepto.com/categories/pharmacy-wellness?campaign=healthy_snacks"},
        {"category": "Protein & Nutrition", "url": "https://zepto.com/categories/protein-nutrition?campaign=healthy_snacks"},
        {"category": "Masala & Dry Fruits", "url": "https://zepto.com/categories/masala-dry-fruits?campaign=healthy_snacks"}
    ],
    "bread": [
        {"category": "Dairy,Bread & Eggs", "url": "https://zepto.com/categories/dairy-bread-eggs?campaign=bread_cross"},
        {"category": "Breakfast & Sauce", "url": "https://zepto.com/categories/breakfast-sauce?campaign=bread_cross"},
        {"category": "Cold Drinks & Juices", "url": "https://zepto.com/categories/cold-drinks-juices?campaign=bread_cross"},
        {"category": "Tea, Coffee & More", "url": "https://zepto.com/categories/tea-coffee-more?campaign=bread_cross"}
    ],
    "noodle": [
        {"category": "Meat, Fish & Eggs", "url": "https://zepto.com/categories/meat-fish-eggs?campaign=noodles_cross"},
        {"category": "Breakfast & Sauce", "url": "https://zepto.com/categories/breakfast-sauce?campaign=noodles_cross"},
        {"category": "Packaged Food", "url": "https://zepto.com/categories/packaged-food?campaign=noodles_cross"},
        {"category": "Cold Drinks & Juices", "url": "https://zepto.com/categories/cold-drinks-juices?campaign=noodles_cross"}
    ],
    "noodles": [
        {"category": "Meat, Fish & Eggs", "url": "https://zepto.com/categories/meat-fish-eggs?campaign=noodles_cross"},
        {"category": "Breakfast & Sauce", "url": "https://zepto.com/categories/breakfast-sauce?campaign=noodles_cross"},
        {"category": "Packaged Food", "url": "https://zepto.com/categories/packaged-food?campaign=noodles_cross"},
        {"category": "Cold Drinks & Juices", "url": "https://zepto.com/categories/cold-drinks-juices?campaign=noodles_cross"}
    ],
    "maggi": [
        {"category": "Meat, Fish & Eggs", "url": "https://zepto.com/categories/meat-fish-eggs?campaign=noodles_cross"},
        {"category": "Breakfast & Sauce", "url": "https://zepto.com/categories/breakfast-sauce?campaign=noodles_cross"},
        {"category": "Packaged Food", "url": "https://zepto.com/categories/packaged-food?campaign=noodles_cross"},
        {"category": "Cold Drinks & Juices", "url": "https://zepto.com/categories/cold-drinks-juices?campaign=noodles_cross"}
    ],
    "pasta": [
        {"category": "Packaged Food", "url": "https://zepto.com/categories/packaged-food?campaign=pasta_cross"},
        {"category": "Breakfast & Sauce", "url": "https://zepto.com/categories/breakfast-sauce?campaign=pasta_cross"},
        {"category": "Dairy,Bread & Eggs", "url": "https://zepto.com/categories/dairy-bread-eggs?campaign=pasta_cross"},
        {"category": "Cold Drinks & Juices", "url": "https://zepto.com/categories/cold-drinks-juices?campaign=pasta_cross"}
    ],
    "zepto cafe": [
        {"category": "Zepto Cafe", "url": "https://zepto.com/categories/zepto-cafe?campaign=discover_cafe"},
        {"category": "Tea, Coffee & More", "url": "https://zepto.com/categories/tea-coffee-more?campaign=discover_cafe"},
        {"category": "Biscuits & Cookies", "url": "https://zepto.com/categories/biscuits-cookies?campaign=discover_cafe"},
        {"category": "Cold Drinks & Juices", "url": "https://zepto.com/categories/cold-drinks-juices?campaign=discover_cafe"}
    ],
    "cafe": [
        {"category": "Zepto Cafe", "url": "https://zepto.com/categories/zepto-cafe?campaign=discover_cafe"},
        {"category": "Biscuits & Cookies", "url": "https://zepto.com/categories/biscuits-cookies?campaign=discover_cafe"},
        {"category": "Cold Drinks & Juices", "url": "https://zepto.com/categories/cold-drinks-juices?campaign=discover_cafe"},
        {"category": "Tea, Coffee & More", "url": "https://zepto.com/categories/tea-coffee-more?campaign=discover_cafe"}
    ],
    "coffee": [
        {"category": "Zepto Cafe", "url": "https://zepto.com/categories/zepto-cafe?campaign=discover_cafe"},
        {"category": "Tea, Coffee & More", "url": "https://zepto.com/categories/tea-coffee-more?campaign=discover_cafe"},
        {"category": "Biscuits & Cookies", "url": "https://zepto.com/categories/biscuits-cookies?campaign=discover_cafe"},
        {"category": "Cold Drinks & Juices", "url": "https://zepto.com/categories/cold-drinks-juices?campaign=discover_cafe"}
    ],
    "croissant": [
        {"category": "Zepto Cafe", "url": "https://zepto.com/categories/zepto-cafe?campaign=discover_cafe"},
        {"category": "Tea, Coffee & More", "url": "https://zepto.com/categories/tea-coffee-more?campaign=discover_cafe"},
        {"category": "Biscuits & Cookies", "url": "https://zepto.com/categories/biscuits-cookies?campaign=discover_cafe"}
    ],
    "chai": [
        {"category": "Zepto Cafe", "url": "https://zepto.com/categories/zepto-cafe?campaign=discover_cafe"},
        {"category": "Tea, Coffee & More", "url": "https://zepto.com/categories/tea-coffee-more?campaign=discover_cafe"},
        {"category": "Munchies", "url": "https://zepto.com/categories/munchies?campaign=discover_cafe"}
    ],
    "samosa": [
        {"category": "Zepto Cafe", "url": "https://zepto.com/categories/zepto-cafe?campaign=discover_cafe"},
        {"category": "Munchies", "url": "https://zepto.com/categories/munchies?campaign=discover_cafe"}
    ],
    "cereal": [
        {"category": "Breakfast & Sauce", "url": "https://zepto.com/categories/breakfast-sauce?campaign=breakfast"},
        {"category": "Dairy,Bread & Eggs", "url": "https://zepto.com/categories/dairy-bread-eggs?campaign=breakfast"},
        {"category": "Fruits & vegetables", "url": "https://zepto.com/categories/fruits-vegetables?campaign=breakfast"},
        {"category": "Biscuits & Cookies", "url": "https://zepto.com/categories/biscuits-cookies?campaign=breakfast"}
    ],
    "breakfast": [
        {"category": "Breakfast & Sauce", "url": "https://zepto.com/categories/breakfast-sauce?campaign=breakfast"},
        {"category": "Dairy,Bread & Eggs", "url": "https://zepto.com/categories/dairy-bread-eggs?campaign=breakfast"},
        {"category": "Fruits & vegetables", "url": "https://zepto.com/categories/fruits-vegetables?campaign=breakfast"},
        {"category": "Tea, Coffee & More", "url": "https://zepto.com/categories/tea-coffee-more?campaign=breakfast"}
    ],
    "rainy": [
        {"category": "Zepto Cafe", "url": "https://zepto.com/categories/zepto-cafe?campaign=rainy_cravings"},
        {"category": "Munchies", "url": "https://zepto.com/categories/munchies?campaign=rainy_cravings"},
        {"category": "Tea, Coffee & More", "url": "https://zepto.com/categories/tea-coffee-more?campaign=rainy_cravings"},
        {"category": "Snacks & Packaged Foods", "url": "https://zepto.com/categories/snacks-packaged-foods?campaign=rainy_cravings"}
    ],
    "monsoon": [
        {"category": "Zepto Cafe", "url": "https://zepto.com/categories/zepto-cafe?campaign=monsoon_cravings"},
        {"category": "Munchies", "url": "https://zepto.com/categories/munchies?campaign=monsoon_cravings"},
        {"category": "Tea, Coffee & More", "url": "https://zepto.com/categories/tea-coffee-more?campaign=monsoon_cravings"},
        {"category": "Cleaning Essentials", "url": "https://zepto.com/categories/cleaning-essentials?campaign=monsoon_cravings"}
    ],
    "dinner": [
        {"category": "Groceries & Staples", "url": "https://zepto.com/categories/groceries-staples?campaign=quick_dinner"},
        {"category": "Atta, Rice & Dals", "url": "https://zepto.com/categories/atta-rice-dals?campaign=quick_dinner"},
        {"category": "Fruits & vegetables", "url": "https://zepto.com/categories/fruits-vegetables?campaign=quick_dinner"},
        {"category": "Dairy,Bread & Eggs", "url": "https://zepto.com/categories/dairy-bread-eggs?campaign=quick_dinner"}
    ],
    "evening": [
        {"category": "Munchies", "url": "https://zepto.com/categories/munchies?campaign=evening_break"},
        {"category": "Zepto Cafe", "url": "https://zepto.com/categories/zepto-cafe?campaign=evening_break"},
        {"category": "Biscuits & Cookies", "url": "https://zepto.com/categories/biscuits-cookies?campaign=evening_break"},
        {"category": "Cold Drinks & Juices", "url": "https://zepto.com/categories/cold-drinks-juices?campaign=evening_break"}
    ],
    "cravings": [
        {"category": "Munchies", "url": "https://zepto.com/categories/munchies?campaign=cravings"},
        {"category": "Sweet Craving", "url": "https://zepto.com/categories/sweet-craving?campaign=cravings"},
        {"category": "Zepto Cafe", "url": "https://zepto.com/categories/zepto-cafe?campaign=cravings"},
        {"category": "Biscuits & Cookies", "url": "https://zepto.com/categories/biscuits-cookies?campaign=cravings"}
    ],
    "drink": [
        {"category": "Cold Drinks & Juices", "url": "https://zepto.com/categories/cold-drinks-juices?campaign=drinks"},
        {"category": "Tea, Coffee & More", "url": "https://zepto.com/categories/tea-coffee-more?campaign=drinks"},
        {"category": "Munchies", "url": "https://zepto.com/categories/munchies?campaign=drinks"},
        {"category": "Zepto Cafe", "url": "https://zepto.com/categories/zepto-cafe?campaign=drinks"}
    ],
    "clean": [
        {"category": "Cleaning Essentials", "url": "https://zepto.com/categories/cleaning-essentials?campaign=home_care"},
        {"category": "Home needs", "url": "https://zepto.com/categories/home-needs?campaign=home_care"},
        {"category": "Kitchen & Dining", "url": "https://zepto.com/categories/kitchen-dining?campaign=home_care"}
    ],
    "paan": [
        {"category": "Paan Corner", "url": "https://zepto.com/categories/paan-corner?campaign=paan_corner"},
        {"category": "Sweet Craving", "url": "https://zepto.com/categories/sweet-craving?campaign=paan_corner"},
        {"category": "Munchies", "url": "https://zepto.com/categories/munchies?campaign=paan_corner"}
    ],
        "fruits": [
        {"category": "Fruits & vegetables", "url": "https://zepto.com/categories/fruits-vegetables?campaign=fruits"},
        {"category": "Groceries & Staples", "url": "https://zepto.com/categories/groceries-staples?campaign=fruits"}
    ],
    "dairy": [
        {"category": "Dairy,Bread & Eggs", "url": "https://zepto.com/categories/dairy-bread-eggs?campaign=dairy"},
        {"category": "Breakfast & Sauce", "url": "https://zepto.com/categories/breakfast-sauce?campaign=dairy"}
    ],
    "atta": [
        {"category": "Atta, Rice & Dals", "url": "https://zepto.com/categories/atta-rice-dals?campaign=staples"},
        {"category": "Groceries & Staples", "url": "https://zepto.com/categories/groceries-staples?campaign=staples"}
    ],
    "munchies": [
        {"category": "Munchies", "url": "https://zepto.com/categories/munchies?campaign=munchies"},
        {"category": "Snacks & Packaged Foods", "url": "https://zepto.com/categories/snacks-packaged-foods?campaign=munchies"}
    ],
    "cold drinks": [
        {"category": "Cold Drinks & Juices", "url": "https://zepto.com/categories/cold-drinks-juices?campaign=drinks"},
        {"category": "Tea, Coffee & More", "url": "https://zepto.com/categories/tea-coffee-more?campaign=drinks"}
    ],
    "biscuits": [
        {"category": "Biscuits & Cookies", "url": "https://zepto.com/categories/biscuits-cookies?campaign=biscuits"},
        {"category": "Sweet Craving", "url": "https://zepto.com/categories/sweet-craving?campaign=biscuits"}
    ],
    "sweet craving": [
        {"category": "Sweet Craving", "url": "https://zepto.com/categories/sweet-craving?campaign=sweets"},
        {"category": "Ice Creams & More", "url": "https://zepto.com/categories/ice-creams-more?campaign=sweets"}
    ],
    "meat": [
        {"category": "Meat, Fish & Eggs", "url": "https://zepto.com/categories/meat-fish-eggs?campaign=fresh_meat"},
        {"category": "Dairy,Bread & Eggs", "url": "https://zepto.com/categories/dairy-bread-eggs?campaign=fresh_meat"}
    ],
    "masala": [
        {"category": "Masala & Dry Fruits", "url": "https://zepto.com/categories/masala-dry-fruits?campaign=dry_fruits"},
        {"category": "Groceries & Staples", "url": "https://zepto.com/categories/groceries-staples?campaign=dry_fruits"}
    ],
    "ice cream": [
        {"category": "Ice Creams & More", "url": "https://zepto.com/categories/ice-creams-more?campaign=ice_creams"},
        {"category": "Sweet Craving", "url": "https://zepto.com/categories/sweet-craving?campaign=ice_creams"}
    ],
    "frozen": [
        {"category": "Frozen Food", "url": "https://zepto.com/categories/frozen-food?campaign=frozen"},
        {"category": "Zepto Cafe", "url": "https://zepto.com/categories/zepto-cafe?campaign=frozen"}
    ],
    "skincare": [
        {"category": "Skincare", "url": "https://zepto.com/categories/skincare?campaign=skincare"},
        {"category": "Self care Studio", "url": "https://zepto.com/categories/self-care-studio?campaign=skincare"}
    ],
    "makeup": [
        {"category": "Makeup & Beauty", "url": "https://zepto.com/categories/makeup-beauty?campaign=makeup"},
        {"category": "Fragrance", "url": "https://zepto.com/categories/fragrance?campaign=makeup"}
    ],
    "bath": [
        {"category": "Bath & Body", "url": "https://zepto.com/categories/bath-body?campaign=bath_body"},
        {"category": "Skincare", "url": "https://zepto.com/categories/skincare?campaign=bath_body"}
    ],
    "haircare": [
        {"category": "Haircare", "url": "https://zepto.com/categories/haircare?campaign=haircare"},
        {"category": "Bath & Body", "url": "https://zepto.com/categories/bath-body?campaign=haircare"}
    ],
    "self care": [
        {"category": "Self care Studio", "url": "https://zepto.com/categories/self-care-studio?campaign=self_care"},
        {"category": "Skincare", "url": "https://zepto.com/categories/skincare?campaign=self_care"}
    ],
    "fragrance": [
        {"category": "Fragrance", "url": "https://zepto.com/categories/fragrance?campaign=fragrance"},
        {"category": "Self care Studio", "url": "https://zepto.com/categories/self-care-studio?campaign=fragrance"}
    ],
    "baby care": [
        {"category": "Baby care", "url": "https://zepto.com/categories/baby-care?campaign=baby_care"},
        {"category": "Pharmacy & Wellness", "url": "https://zepto.com/categories/pharmacy-wellness?campaign=baby_care"}
    ],
    "pet care": [
        {"category": "Pet care", "url": "https://zepto.com/categories/pet-care?campaign=pet_care"},
        {"category": "Cleaning Essentials", "url": "https://zepto.com/categories/cleaning-essentials?campaign=pet_care"}
    ],
    "kitchen": [
        {"category": "Kitchen & Dining", "url": "https://zepto.com/categories/kitchen-dining?campaign=kitchen"},
        {"category": "Home needs", "url": "https://zepto.com/categories/home-needs?campaign=kitchen"}
    ],
    "home needs": [
        {"category": "Home needs", "url": "https://zepto.com/categories/home-needs?campaign=home_needs"},
        {"category": "Kitchen & Dining", "url": "https://zepto.com/categories/kitchen-dining?campaign=home_needs"}
    ],
    "pharmacy": [
        {"category": "Pharmacy & Wellness", "url": "https://zepto.com/categories/pharmacy-wellness?campaign=wellness"},
        {"category": "Protein & Nutrition", "url": "https://zepto.com/categories/protein-nutrition?campaign=wellness"}
    ],
    "protein": [
        {"category": "Protein & Nutrition", "url": "https://zepto.com/categories/protein-nutrition?campaign=protein"},
        {"category": "Pharmacy & Wellness", "url": "https://zepto.com/categories/pharmacy-wellness?campaign=protein"}
    ],
    "stationery": [
        {"category": "Stationery& Books", "url": "https://zepto.com/categories/stationery-books?campaign=stationery"},
        {"category": "Toys & games", "url": "https://zepto.com/categories/toys-games?campaign=stationery"}
    ],
    "toys": [
        {"category": "Toys & games", "url": "https://zepto.com/categories/toys-games?campaign=toys"},
        {"category": "Stationery& Books", "url": "https://zepto.com/categories/stationery-books?campaign=toys"}
    ],
    "apparel": [
        {"category": "Apparel", "url": "https://zepto.com/categories/apparel?campaign=apparel"},
        {"category": "Self care Studio", "url": "https://zepto.com/categories/self-care-studio?campaign=apparel"}
    ],
    "jewellery": [
        {"category": "Jewellery", "url": "https://zepto.com/categories/jewellery?campaign=jewellery"},
        {"category": "Sweet Craving", "url": "https://zepto.com/categories/sweet-craving?campaign=jewellery"}
    ],
    "gourmet": [
        {"category": "Gourmet", "url": "https://zepto.com/categories/gourmet?campaign=gourmet"},
        {"category": "Breakfast & Sauce", "url": "https://zepto.com/categories/breakfast-sauce?campaign=gourmet"}
    ],
    "gifting": [
        {"category": "Gifting", "url": "https://zepto.com/categories/gifting?campaign=gifting"},
        {"category": "Sweet Craving", "url": "https://zepto.com/categories/sweet-craving?campaign=gifting"}
    ],
    "plants": [
        {"category": "Plants", "url": "https://zepto.com/categories/plants?campaign=plants"},
        {"category": "Home Decor", "url": "https://zepto.com/categories/home-decor?campaign=plants"}
    ],
    "electronics": [
        {"category": "Electronics store", "url": "https://zepto.com/categories/electronics-store?campaign=electronics"},
        {"category": "Home needs", "url": "https://zepto.com/categories/home-needs?campaign=electronics"}
    ],
    "home decor": [
        {"category": "Home Decor", "url": "https://zepto.com/categories/home-decor?campaign=home_decor"},
        {"category": "Plants", "url": "https://zepto.com/categories/plants?campaign=home_decor"}
    ],
    "paan corner": [
        {"category": "Paan Corner", "url": "https://zepto.com/categories/paan-corner?campaign=paan_corner"},
        {"category": "Sweet Craving", "url": "https://zepto.com/categories/sweet-craving?campaign=paan_corner"},
        {"category": "Munchies", "url": "https://zepto.com/categories/munchies?campaign=paan_corner"}
    ]
}

BASKET_MAPPINGS = {
    "pasta": [
        {"category": "Breakfast & Sauce", "url": "https://zepto.com/categories/breakfast-sauce?ref=pasta_cross"},
        {"category": "Dairy,Bread & Eggs", "url": "https://zepto.com/categories/dairy-bread-eggs?ref=pasta_cross"},
        {"category": "Cold Drinks & Juices", "url": "https://zepto.com/categories/cold-drinks-juices?ref=pasta_cross"}
    ],
    "milk": [
        {"category": "Dairy,Bread & Eggs", "url": "https://zepto.com/categories/dairy-bread-eggs?ref=milk_cross"},
        {"category": "Breakfast & Sauce", "url": "https://zepto.com/categories/breakfast-sauce?ref=milk_cross"},
        {"category": "Biscuits & Cookies", "url": "https://zepto.com/categories/biscuits-cookies?ref=milk_cross"}
    ]
}

# --- PRIVACY & SANITIZATION HELPER ---
def sanitize_reco_url(url: str, is_fallback: bool) -> Optional[str]:
    """
    Cleans URLs returning to clients:
    1. If is_fallback is True (we don't know the query answer), we strip ALL query parameters
       to prevent any leakage of dynamic tracking or user PII.
    2. Otherwise, we strip any PII key-value params (user_id, name, address, etc.) but preserve campaign tags.
    """
    if not url:
        return None
        
    parsed = urlparse(url)
    
    if is_fallback:
        # Strip all query parameters completely
        return urlunparse((parsed.scheme, parsed.netloc, parsed.path, '', '', ''))
        
    # Standard query: strip specific sensitive parameters
    pii_params = {"user_id", "user", "uid", "name", "email", "phone", "address", "location", "lat", "lon"}
    q_items = parse_qsl(parsed.query)
    cleaned_items = [(k, v) for k, v in q_items if k.lower() not in pii_params]
    
    new_query = urlencode(cleaned_items)
    return urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment))


# --- RECO ENGINE LOGIC ---
def get_user_friction_boosts(user_id: str) -> List[str]:
    """
    Checks the staging SQLite database for previous negative feedback/complaints
    associated with this user.
    """
    boosts = []
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='classified_insights'")
        if not cursor.fetchone():
            conn.close()
            return boosts
            
        sql = """
        SELECT i.aspect_category
        FROM classified_insights i
        JOIN feedbacks f ON i.review_id = f.review_id
        WHERE i.sentiment = 'NEGATIVE' 
          AND (f.extra_metadata LIKE ? OR f.extra_metadata LIKE ?)
        """
        user_pattern = f'%"{user_id}"%'
        cursor.execute(sql, (user_pattern, user_pattern))
        rows = cursor.fetchall()
        for r in rows:
            aspect = r[0]
            if aspect not in boosts:
                boosts.append(aspect)
        conn.close()
    except Exception as e:
        logger.error(f"Error fetching user friction history: {e}")
        
    return boosts


# --- DARK STORE & GEOLOCATION DISPATCHER ---
DARK_STORES = {
    "411017": {"store_id": "DS-PIMPLE-SAUDAGAR-417", "name": "Pimple Saudagar, Pune", "pincode": "411017", "eta": "7 mins ⚡", "riders": 26},
    "411001": {"store_id": "DS-KOREGAON-401", "name": "Koregaon Park, Pune", "pincode": "411001", "eta": "8 mins ⚡", "riders": 22},
    "560038": {"store_id": "DS-INDIRANAGAR-204", "name": "Indiranagar, Bengaluru", "pincode": "560038", "eta": "7 mins ⚡", "riders": 28},
    "400050": {"store_id": "DS-BANDRA-102", "name": "Bandra West, Mumbai", "pincode": "400050", "eta": "9 mins ⚡", "riders": 31},
    "110001": {"store_id": "DS-CP-501", "name": "Connaught Place, Delhi", "pincode": "110001", "eta": "10 mins ⚡", "riders": 19},
}

def resolve_dark_store(pincode: Optional[str] = None, location: Optional[str] = None) -> dict:
    if pincode and pincode in DARK_STORES:
        return DARK_STORES[pincode]
    if location:
        loc_l = location.lower()
        if "pimple" in loc_l or "saudagar" in loc_l or "411017" in loc_l or "kalewadi" in loc_l or "rahatani" in loc_l:
            return DARK_STORES["411017"]
        if "bengaluru" in loc_l or "indiranagar" in loc_l or "560038" in loc_l:
            return DARK_STORES["560038"]
        if "mumbai" in loc_l or "bandra" in loc_l or "400050" in loc_l:
            return DARK_STORES["400050"]
        if "delhi" in loc_l or "connaught" in loc_l or "110001" in loc_l:
            return DARK_STORES["110001"]
    return DARK_STORES["411017"] if (pincode == "411017" or (location and "411017" in location)) else DARK_STORES["411001"]


# --- GROQ LLM EXPLANATION GENERATOR ---
def generate_groq_recommendation_explanation(
    query: Optional[str],
    basket: Optional[List[str]],
    recommendations: List[str],
    friction_boosts: List[str],
    location: Optional[str] = "Koregaon Park, Pune"
) -> str:
    """
    Calls Groq Chat Completions API to generate a personalized natural language
    explanation for the returned categories based on location context.
    """
    groq_api_key = os.environ.get("GROQ_API_KEY")
    reco_str = ", ".join(recommendations)
    basket_str = ", ".join(basket) if basket else "None"
    loc_str = location or "Koregaon Park, Pune"
    
    # 1. Fallback Text Template logic
    fallback_explanation = f"We suggested {reco_str} because it aligns with your preferences in {loc_str}."
    if basket:
        fallback_explanation = f"Since your cart in {loc_str} has {basket_str}, we recommended adjacent items like {reco_str}."
    elif query:
        fallback_explanation = f"Based on your search for '{query}' in {loc_str}, we suggested related categories like {reco_str}."
        
    if friction_boosts:
        fallback_explanation += f" We've also highlighted categories with verified fresh quality at your local {loc_str} dark store!"
        
    if not groq_api_key:
        logger.info("GROQ_API_KEY not found in environment. Using template explanation fallback.")
        return fallback_explanation
        
    # 2. Execute Groq API Request
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }
    
    system_prompt = (
        f"You are Zepto's friendly AI shopping assistant for {loc_str}. Explain why the given category "
        "recommendations are shown based on the user's query, cart, and location. "
        "Explain in a very short, single sentence. Focus on local dark-store freshness, speed (10 mins), or utility. "
        "DO NOT attach or mention any URLs, links, or customer personal names."
    )
    
    user_content = (
        f"Location: '{loc_str}'\n"
        f"Query: '{query or 'None'}'\n"
        f"Active Cart: '{basket_str}'\n"
        f"Recommended Categories: '{reco_str}'\n"
        f"Previous User Friction Aspects: '{', '.join(friction_boosts) if friction_boosts else 'None'}'"
    )
    
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        "temperature": 0.5,
        "max_tokens": 100
    }
    
    try:
        logger.info("Requesting explanation from Groq Llama-3.1-8b API...")
        # 1.5 second timeout to keep API latency low
        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            json=payload,
            headers=headers,
            timeout=1.5
        )
        if response.status_code == 200:
            res_json = response.json()
            explanation = res_json["choices"][0]["message"]["content"].strip()
            logger.info("Successfully received explanation from Groq.")
            return explanation
        else:
            logger.warning(f"Groq API returned status {response.status_code}. Falling back.")
    except Exception as e:
        logger.error(f"Error querying Groq API: {e}. Falling back to default explanation.")
        
    return fallback_explanation


# --- API REQUEST/RESPONSE MODELS ---
class RecommendationResponse(BaseModel):
    category: str
    url: Optional[str]
    is_fallback: bool
    friction_boosted: bool

class RecommendationsPayload(BaseModel):
    recommendations: List[RecommendationResponse]
    explanation: str
    variant: str

class TelemetryEventRequest(BaseModel):
    event_id: str
    user_id: str
    event_type: str  # reco_shown, reco_clicked, cart_added, purchase_completed, reco_dismissed, card_dismissed
    category: str
    timestamp: str
    variant: str

class VariantPerformance(BaseModel):
    variant: str
    reco_shown: int
    reco_clicked: int
    cart_added: int
    purchase_completed: int
    ctr: float
    atc: float
    conversion: float

class ExperimentMetricsResponse(BaseModel):
    total_events: int
    performance: List[VariantPerformance]


# --- DETERMINISTIC A/B TESTING ASSIGNMENT ---
def get_user_ab_variant(user_id: str) -> str:
    """
    Deterministically partitions users into CONTROL, TREATMENT_A, or TREATMENT_B
    based on the MD5 hash of their user_id.
    """
    import hashlib
    hash_val = int(hashlib.md5(user_id.encode("utf-8")).hexdigest(), 16)
    idx = hash_val % 3
    return ["CONTROL", "TREATMENT_A", "TREATMENT_B"][idx]


@app.get("/recommend", response_model=RecommendationsPayload)
def recommend_categories(
    user_id: str,
    query: Optional[str] = None,
    location: Optional[str] = "Koregaon Park, Pune",
    pincode: Optional[str] = "411001",
    active_basket: Optional[List[str]] = Query(None)
):
    """
    FastAPI endpoint yielding category recommendations and explanations.
    Customizes output based on the user's A/B test variant assignment & location.
    """
    logger.info(f"Incoming recommendation request for user {user_id} in {location} ({pincode}). Query: '{query}', Basket: {active_basket}")
    
    ds = resolve_dark_store(pincode, location)
    variant = get_user_ab_variant(user_id)
    logger.info(f"User '{user_id}' assigned to experiment variant: '{variant}', Dark Store: '{ds['store_id']}'")
    
    recommendations = []
    is_fallback = False
    
    # 1. Fetch user friction history to apply boosts
    friction_aspects = get_user_friction_boosts(user_id)
    
    # 2. Map recommendations based on Variant logic
    matched_recos = []
    matched_by_query = False
    matched_by_basket = False
    
    if variant == "CONTROL":
        # Control group always receives generic baseline recommendations
        logger.info("Control variant: Routing to static popular recommendations.")
        matched_recos = STATIC_FALLBACKS
        is_fallback = True
    else:
        # Treatment groups receive contextual recommendations
        if query:
            q_clean = query.strip().lower()
            # Sort keys by length descending to prevent substring collisions (e.g. matching 'snacks' before 'wellness')
            for key in sorted(QUERY_MAPPINGS.keys(), key=len, reverse=True):
                recos = QUERY_MAPPINGS[key]
                if key in q_clean:
                    matched_recos = recos
                    matched_by_query = True
                    break
                    
        if not matched_recos and active_basket:
            for item in active_basket:
                item_clean = item.strip().lower()
                if item_clean in BASKET_MAPPINGS:
                    matched_recos = BASKET_MAPPINGS[item_clean]
                    matched_by_basket = True
                    break
                    
        if not matched_recos:
            logger.info("Treatment variant had no query/basket match. Falling back to generic categories.")
            matched_recos = STATIC_FALLBACKS
            is_fallback = True

    # 3. Build final lists and apply variant-based boosts/sanitization
    reco_categories = []
    for r in matched_recos:
        category = r["category"]
        raw_url = r["url"]
        reco_categories.append(category)
        
        # Friction Boosting is exclusive to TREATMENT_B
        boosted = False
        if variant == "TREATMENT_B":
            if "Freshness" in friction_aspects and ("Fruit" in category or "Vegetable" in category):
                boosted = True
            
        clean_url = sanitize_reco_url(raw_url, is_fallback)
        
        recommendations.append(RecommendationResponse(
            category=category,
            url=clean_url,
            is_fallback=is_fallback,
            friction_boosted=boosted
        ))
        
    # 4. Generate natural language explanation using Groq
    explanation = generate_groq_recommendation_explanation(
        query=query if matched_by_query else None,
        basket=active_basket if matched_by_basket else None,
        recommendations=reco_categories,
        friction_boosts=friction_aspects if variant == "TREATMENT_B" else [],
        location=ds["name"]
    )
    
    return RecommendationsPayload(
        recommendations=recommendations,
        explanation=explanation,
        variant=variant
    )


# --- TELEMETRY AND EXPERIMENTATION BACKEND ---
@app.post("/telemetry/event")
def log_telemetry_event(event: TelemetryEventRequest):
    """
    Pipes user clicks and purchase events directly to the staging database logs.
    """
    logger.info(f"Logging telemetry event: '{event.event_type}' for user '{event.user_id}' in variant '{event.variant}'")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        sql = """
        INSERT INTO telemetry_events (event_id, user_id, event_type, category, timestamp, variant)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(event_id) DO NOTHING;
        """
        cursor.execute(sql, (
            event.event_id,
            event.user_id,
            event.event_type,
            event.category,
            event.timestamp,
            event.variant
        ))
        conn.commit()
        conn.close()
        return {"status": "success", "event_id": event.event_id}
    except Exception as e:
        logger.error(f"Failed to log telemetry event: {e}")
        return {"status": "error", "message": str(e)}


@app.get("/analytics/metrics", response_model=ExperimentMetricsResponse)
def get_experiment_analytics():
    """
    Queries telemetry_events logs, groups metrics by variant,
    and returns conversion rates.
    """
    logger.info("Computing A/B experiment conversion metrics...")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. Get total events
        cursor.execute("SELECT COUNT(*) FROM telemetry_events")
        total_events = cursor.fetchone()[0]
        
        # 2. Get counts grouped by variant and event type
        sql = """
        SELECT variant, event_type, COUNT(*) as count
        FROM telemetry_events
        GROUP BY variant, event_type
        """
        cursor.execute(sql)
        rows = cursor.fetchall()
        conn.close()
        
        # Structure raw data
        raw_metrics: Dict[str, Dict[str, int]] = {}
        for row in rows:
            var, evt, count = row
            if var not in raw_metrics:
                raw_metrics[var] = {"reco_shown": 0, "reco_clicked": 0, "cart_added": 0, "purchase_completed": 0}
            raw_metrics[var][evt] = count
            
        # Calculate rates
        performance = []
        # Enforce reporting of all three variants
        for var in ["CONTROL", "TREATMENT_A", "TREATMENT_B"]:
            counts = raw_metrics.get(var, {"reco_shown": 0, "reco_clicked": 0, "cart_added": 0, "purchase_completed": 0})
            
            reco_shown = counts["reco_shown"]
            reco_clicked = counts["reco_clicked"]
            cart_added = counts["cart_added"]
            purchase_completed = counts["purchase_completed"]
            
            ctr = round(reco_clicked / reco_shown, 4) if reco_shown > 0 else 0.0
            atc = round(cart_added / reco_shown, 4) if reco_shown > 0 else 0.0
            conversion = round(purchase_completed / reco_shown, 4) if reco_shown > 0 else 0.0
            
            performance.append(VariantPerformance(
                variant=var,
                reco_shown=reco_shown,
                reco_clicked=reco_clicked,
                cart_added=cart_added,
                purchase_completed=purchase_completed,
                ctr=ctr,
                atc=atc,
                conversion=conversion
            ))
            
        return ExperimentMetricsResponse(
            total_events=total_events,
            performance=performance
        )
    except Exception as e:
        logger.error(f"Failed to query analytics: {e}")
        return ExperimentMetricsResponse(total_events=0, performance=[])


@app.get("/analytics/thematic")
def get_thematic_insights():
    """
    Returns a summary of classified review aspects grouped by category and sentiment
    to populate the PM dashboard with qualitative insights.
    """
    logger.info("Fetching thematic insights summary...")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='classified_insights'")
        if not cursor.fetchone():
            conn.close()
            return JSONResponse(content={"aspects": [], "message": "No insights indexed yet. Run Phase 2 pipeline first."})

        sql = """
        SELECT aspect_category, sentiment, COUNT(*) as count, ROUND(AVG(friction_score), 1) as avg_friction
        FROM classified_insights
        GROUP BY aspect_category, sentiment
        ORDER BY aspect_category, sentiment
        """
        cursor.execute(sql)
        rows = cursor.fetchall()
        conn.close()

        aspects = []
        for row in rows:
            aspects.append({
                "aspect": row[0],
                "sentiment": row[1],
                "count": row[2],
                "avg_friction": row[3]
            })
        return JSONResponse(content={"aspects": aspects})
    except Exception as e:
        logger.error(f"Failed to fetch thematic insights: {e}")
        return JSONResponse(content={"aspects": [], "message": str(e)})


# --- REAL-TIME ZEPTO API STREAMING ENDPOINTS ---
@app.get("/realtime/catalog")
def get_realtime_catalog_status(pincode: Optional[str] = "411001", location: Optional[str] = None):
    """
    Returns real-time dark store status, live delivery ETA, and stock telemetry based on location.
    """
    ds = resolve_dark_store(pincode, location)
    return {
        "store_id": ds["store_id"],
        "pincode": ds["pincode"],
        "location": ds["name"],
        "live_eta_minutes": ds["eta"],
        "dark_store_status": "ACTIVE",
        "active_riders": ds["riders"],
        "surge_pricing": False,
        "trending_categories": ["Fresh Fruits", "Zepto Cafe", "Snacks & Munchies", "Healthy Snacks"]
    }

@app.get("/realtime/zepto-stream")
async def stream_zepto_realtime_response(user_id: str, query: str = "", pincode: Optional[str] = None, location: Optional[str] = None):
    """
    Real-time Server-Sent Events (SSE) stream delivering token-by-token AI response,
    dark store telemetry, and cross-selling product cards tailored to user location.
    """
    ds = resolve_dark_store(pincode, location)
    
    async def event_generator():
        # 1. Send store & ETA status event
        status_data = {
            "type": "telemetry",
            "dark_store": ds["name"],
            "store_id": ds["store_id"],
            "eta": ds["eta"],
            "riders_available": ds["riders"],
            "status": "LIVE_SYNC"
        }
        yield f"data: {json.dumps(status_data)}\n\n"
        await asyncio.sleep(0.08)

        # 2. Get full explanation
        variant = get_user_ab_variant(user_id)
        friction_aspects = get_user_friction_boosts(user_id) if variant == "TREATMENT_B" else []
        
        # Calculate matched categories
        matched_recos = []
        if query:
            q_clean = query.strip().lower()
            for key in sorted(QUERY_MAPPINGS.keys(), key=len, reverse=True):
                if key in q_clean:
                    matched_recos = QUERY_MAPPINGS[key]
                    break
        if not matched_recos:
            matched_recos = STATIC_FALLBACKS

        reco_cats = [r["category"] for r in matched_recos]
        
        full_text = generate_groq_recommendation_explanation(
            query=query,
            basket=None,
            recommendations=reco_cats,
            friction_boosts=friction_aspects,
            location=ds["name"]
        )

        # 3. Stream text words in real-time
        words = full_text.split(" ")
        accumulated = ""
        for i, word in enumerate(words):
            accumulated += (word + " " if i < len(words) - 1 else word)
            token_payload = {
                "type": "text_chunk",
                "text": accumulated,
                "token": word + " "
            }
            yield f"data: {json.dumps(token_payload)}\n\n"
            await asyncio.sleep(0.03)

        # 4. Final completion payload with live recommendations
        final_payload = {
            "type": "complete",
            "text": full_text,
            "recommendations": reco_cats,
            "variant": variant
        }
        yield f"data: {json.dumps(final_payload)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/")
def serve_dashboard():
    """Serve the Phase 4 frontend dashboard."""
    import os
    html_path = os.path.join(os.path.dirname(__file__), "..", "phase4_frontend", "index.html")
    html_path = os.path.normpath(html_path)
    if os.path.exists(html_path):
        return FileResponse(html_path, media_type="text/html", headers={"Cache-Control": "no-cache, no-store, must-revalidate"})
    return JSONResponse(content={"message": "Dashboard not found. Ensure phase4_frontend/index.html exists."})
