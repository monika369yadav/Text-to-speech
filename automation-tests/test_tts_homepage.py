import time
from playwright.sync_api import Page, expect

BASE_URL = "https://text-to-speech-wcii.onrender.com"

def test_homepage_loads(page: Page):
    """Test that the homepage loads successfully with correct title"""
    page.goto(BASE_URL, timeout=60000)
    time.sleep(5)
    expect(page).to_have_title("Text to Speech - Gemini 3.1 Flash TTS", timeout=60000)

def test_voice_selector_visible(page: Page):
    """Test that voice persona selector is visible on page load"""
    page.goto(BASE_URL, timeout=60000)
    time.sleep(5)
    
    voice_selector = page.get_by_text("Select Voice Persona")
    voice_selector.highlight()
    time.sleep(5)
    
    expect(voice_selector).to_be_visible(timeout=60000)

def test_convert_button_visible(page: Page):
    """Test that Convert to Speech button is present"""
    page.goto(BASE_URL, timeout=60000)
    time.sleep(5)
    
    convert_button = page.get_by_role("button", name="Convert to Speech")
    convert_button.highlight()
    time.sleep(5)
    
    expect(convert_button).to_be_visible(timeout=60000)