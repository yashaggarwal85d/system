import logging
from typing import Optional
import google.generativeai as genai

from utils.general.get_env import getenv

logger = logging.getLogger(__name__)
gemini_model = None

def configure_gemini():
    global gemini_model
    try:
        gemini_api_key = getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            logger.error("GEMINI_API_KEY environment variable not set. Gemini features will be disabled.")
            gemini_model = None
            return False
        else:
            genai.configure(api_key=gemini_api_key)
            gemini_model = genai.GenerativeModel('gemini-1.5-flash-latest')
            logger.info(f"Gemini model '{gemini_model.model_name}' initialized.")
            return True
    except Exception as e:
        logger.error(f"Failed to configure or initialize Gemini: {e}")
        gemini_model = None
        return False

def get_gemini_model() -> Optional[genai.GenerativeModel]:
    if gemini_model is None:
        logger.warning("Gemini model accessed before configuration. Attempting configuration now.")
        configure_gemini() 
    return gemini_model

configure_gemini()