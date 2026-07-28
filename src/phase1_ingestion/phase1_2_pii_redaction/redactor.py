import re
import logging
from typing import Optional

# Configure logger
logger = logging.getLogger(__name__)

# Compile regex patterns for efficiency
EMAIL_REGEX = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b')

# Phone regex matches 10-digit Indian numbers, optional country code prefix, and spaces/dashes
PHONE_REGEX = re.compile(
    r'\b(?:\+?91[-.\s]?)?[6-9]\d{9}\b|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b'
)

# Indian Pin Code regex (6 digits)
PIN_CODE_REGEX = re.compile(r'\b[1-9]\d{5}\b')

# Luhn-like credit card pattern (16 digits separated by optional dashes/spaces)
CREDIT_CARD_REGEX = re.compile(r'\b(?:\d{4}[-\s]?){3}\d{4}\b')

# Generic Name extraction helper phrases (fallback when NER is not loaded)
NAME_PATTERNS = [
    re.compile(r'\b(?:[Mm]y\s+[Nn]ame\s+[Ii]s|[Cc]all\s+[Mm]e|[Tt]his\s+[Ii]s|[Tt]alk\s+[Tt]o|[Aa]gent|[Rr]ider|[Dd]elivery\s+[Bb]oy)\s+([A-Z][a-z]+)\b'),
    re.compile(r'\b(?:[Cc]ustomer|[Rr]epresentative)\s+([A-Z][a-z]+)\b')
]

# SpaCy NLP model holder
_nlp = None
_spacy_loaded = False

try:
    import spacy
    # Try to load the lightweight model
    try:
        _nlp = spacy.load("en_core_web_sm")
        _spacy_loaded = True
        logger.info("Successfully loaded SpaCy 'en_core_web_sm' for NER PII Redaction.")
    except IOError:
        logger.warning("SpaCy model 'en_core_web_sm' not found. Run 'python -m spacy download en_core_web_sm'. Falling back to regex-only redaction.")
except ImportError:
    logger.debug("SpaCy is not installed. Using regex-only redaction.")

def redact_text_regex(text: str) -> str:
    """
    Applies regex-based rules to redact phone numbers, emails, cards, and common name patterns.
    """
    if not text:
        return ""
        
    # 1. Redact Emails
    text = EMAIL_REGEX.sub("[REDACTED_EMAIL]", text)
    
    # 2. Redact Credit/Debit Cards
    text = CREDIT_CARD_REGEX.sub("[REDACTED_CARD]", text)
    
    # 3. Redact Phone Numbers
    text = PHONE_REGEX.sub("[REDACTED_PHONE]", text)
    
    # 4. Redact Pin Codes (excluding numeric versions in metadata if processed as raw text)
    text = PIN_CODE_REGEX.sub("[REDACTED_PIN]", text)
    
    # 5. Redact rule-based names (e.g. "My name is Amit" -> "My name is [REDACTED_NAME]")
    for pattern in NAME_PATTERNS:
        matches = pattern.finditer(text)
        for match in matches:
            name = match.group(1)
            # Ensure we don't redact common English stop words that happen to be capitalized
            if name.lower() not in {"i", "the", "a", "an", "on", "my", "to", "at", "by", "is"}:
                text = text.replace(name, "[REDACTED_NAME]")
                
    return text

def redact_text(text: str) -> str:
    """
    Main redaction interface. Performs hybrid redaction:
    1. Regular expressions for structural PII (phones, emails, PINs).
    2. SpaCy NER (Named Entity Recognition) for dynamic PII like names (PERSON) and addresses/locations (GPE).
    
    Falls back gracefully to regex-only parsing if SpaCy model is unavailable.
    """
    if not text:
        return ""
        
    # First, run regex rules
    redacted_text = redact_text_regex(text)
    
    # Second, run SpaCy NER if loaded
    if _spacy_loaded and _nlp:
        try:
            doc = _nlp(redacted_text)
            spacy_redacted = redacted_text
            
            # Extract PERSON and GPE (Geopolitical Entity / Location)
            for ent in doc.ents:
                if ent.label_ in ("PERSON", "GPE"):
                    # Check that we aren't redacting already masked tokens
                    if "[" not in ent.text and "]" not in ent.text:
                        mask = "[REDACTED_NAME]" if ent.label_ == "PERSON" else "[REDACTED_LOCATION]"
                        # We use exact replacement but check word boundary to avoid partial replacements
                        spacy_redacted = re.sub(r'\b' + re.escape(ent.text) + r'\b', mask, spacy_redacted)
            return spacy_redacted
        except Exception as e:
            logger.warning(f"Error during SpaCy NER parsing: {e}. Returning regex-redacted text.")
            return redacted_text
            
    return redacted_text

if __name__ == "__main__":
    # Test cases
    logging.basicConfig(level=logging.INFO)
    test_inputs = [
        "Call me at +91-9876543210 or email amit.patel@gmail.com immediately.",
        "My name is Sneha Reddy and I live in Bangalore 560001. Delivery rider Rahul was great.",
        "My card number is 4111 2222 3333 4444. Do not store it.",
        "Representative John helped me resolve the issue with order from Indiranagar."
    ]
    
    print("--- Testing PII Redaction ---")
    for t in test_inputs:
        print(f"Original: {t}")
        print(f"Redacted: {redact_text(t)}")
        print("-" * 40)
