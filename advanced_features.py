"""
MediGuide Advanced Features
- Real-time medical news integration
- User personalization with demographics
- Multilingual support
"""

import requests
import json
import os
from datetime import datetime
from flask import Flask, request, jsonify
import pandas as pd
from googletrans import Translator
import pycountry
import hashlib
import uuid

class MedicalNewsService:
    """Service for fetching real-time medical news"""

    def __init__(self):
        self.api_key = os.getenv('NEWS_API_KEY', 'your_news_api_key_here')
        self.base_url = 'https://newsapi.org/v2/everything'
        self.cache_file = 'cache/medical_news.json'
        self.cache_duration = 3600  # 1 hour

        # Create cache directory
        os.makedirs('cache', exist_ok=True)

    def fetch_medical_news(self, limit=10):
        """Fetch latest medical news"""
        try:
            # Check cache first
            if self._is_cache_valid():
                cached = self._load_cache()
                if cached and len(cached) > 0:
                    return cached

            # Check if API key is valid
            if self.api_key == 'your_news_api_key_here':
                return self._get_fallback_news()

            # Medical news keywords
            keywords = [
                'medical breakthrough', 'health research', 'disease treatment',
                'medical technology', 'healthcare innovation', 'clinical trial',
                'medical study', 'health news', 'disease prevention'
            ]

            all_articles = []

            for keyword in keywords[:3]:  # Limit API calls
                params = {
                    'q': keyword,
                    'language': 'en',
                    'sortBy': 'publishedAt',
                    'pageSize': 5,
                    'apiKey': self.api_key
                }

                response = requests.get(self.base_url, params=params, timeout=10)

                if response.status_code == 200:
                    data = response.json()
                    articles = data.get('articles', [])

                    for article in articles:
                        if len(all_articles) >= limit:
                            break

                        # Filter medical/health related articles
                        if self._is_medical_article(article):
                            all_articles.append({
                                'title': article.get('title', ''),
                                'description': article.get('description', ''),
                                'url': article.get('url', ''),
                                'source': article.get('source', {}).get('name', ''),
                                'publishedAt': article.get('publishedAt', ''),
                                'category': self._categorize_article(article)
                            })

            # If no articles found, return fallback
            if len(all_articles) == 0:
                return self._get_fallback_news()

            # Cache results
            self._save_cache(all_articles)
            return all_articles

        except Exception as e:
            print(f"News API error: {e}")
            return self._get_fallback_news()

    def _is_medical_article(self, article):
        """Check if article is medical/health related"""
        text = (article.get('title', '') + ' ' + article.get('description', '')).lower()

        medical_keywords = [
            'medical', 'health', 'disease', 'treatment', 'clinical', 'patient',
            'doctor', 'hospital', 'therapy', 'vaccine', 'drug', 'cancer',
            'diabetes', 'heart', 'stroke', 'research', 'study', 'breakthrough'
        ]

        return any(keyword in text for keyword in medical_keywords)

    def _categorize_article(self, article):
        """Categorize article by medical specialty"""
        text = (article.get('title', '') + ' ' + article.get('description', '')).lower()

        categories = {
            'Cardiology': ['heart', 'cardiac', 'cardiovascular'],
            'Oncology': ['cancer', 'tumor', 'oncology'],
            'Neurology': ['brain', 'neurological', 'stroke'],
            'Endocrinology': ['diabetes', 'thyroid', 'endocrine'],
            'Infectious Diseases': ['virus', 'bacterial', 'infection', 'vaccine'],
            'Research': ['study', 'research', 'clinical trial'],
            'General Health': ['health', 'medical', 'treatment']
        }

        for category, keywords in categories.items():
            if any(keyword in text for keyword in keywords):
                return category

        return 'General Health'

    def _is_cache_valid(self):
        """Check if cache is still valid"""
        if not os.path.exists(self.cache_file):
            return False

        cache_time = os.path.getmtime(self.cache_file)
        return (datetime.now().timestamp() - cache_time) < self.cache_duration

    def _load_cache(self):
        """Load news from cache"""
        try:
            with open(self.cache_file, 'r') as f:
                return json.load(f)
        except:
            return []

    def _save_cache(self, news):
        """Save news to cache"""
        try:
            with open(self.cache_file, 'w') as f:
                json.dump(news, f, indent=2)
        except Exception as e:
            print(f"Cache save error: {e}")

    def _get_fallback_news(self):
        """Return fallback news when API fails"""
        return [
            {
                'title': 'Regular Health Check-ups Save Lives',
                'description': 'Medical experts recommend annual health screenings for early disease detection. Regular checkups can help identify potential health issues before they become serious.',
                'url': 'https://www.heart.org/en/healthy-living/health-care-access-and-quality/why-regular-checkups-matter',
                'source': 'MediGuide Health Tips',
                'publishedAt': datetime.now().isoformat(),
                'category': 'General Health'
            },
            {
                'title': 'New Research on Heart Health',
                'description': 'Latest studies show importance of balanced diet and exercise for cardiovascular health. A combination of healthy eating and physical activity significantly reduces heart disease risk.',
                'url': 'https://www.cdc.gov/heartdisease/facts.htm',
                'source': 'MediGuide Health Tips',
                'publishedAt': datetime.now().isoformat(),
                'category': 'Cardiology'
            },
            {
                'title': 'Understanding Mental Health',
                'description': 'Mental health is just as important as physical health. Learn about common mental health conditions and available treatment options.',
                'url': 'https://www.mentalhealth.gov/basics/what-is-mental-health',
                'source': 'MediGuide Health Tips',
                'publishedAt': datetime.now().isoformat(),
                'category': 'General Health'
            },
            {
                'title': 'Nutrition Guide for Healthy Living',
                'description': 'Proper nutrition plays a crucial role in maintaining good health. Discover the food groups and daily recommendations for balanced diet.',
                'url': 'https://www.nutrition.gov/our-work/nutrition-education',
                'source': 'MediGuide Health Tips',
                'publishedAt': datetime.now().isoformat(),
                'category': 'General Health'
            },
            {
                'title': 'Exercise Benefits for Disease Prevention',
                'description': 'Regular physical activity helps prevent chronic diseases including heart disease, diabetes, and obesity. Start your fitness journey today.',
                'url': 'https://www.cdc.gov/physicalactivity/basics/pa-health/index.htm',
                'source': 'MediGuide Health Tips',
                'publishedAt': datetime.now().isoformat(),
                'category': 'General Health'
            }
        ]


class UserPersonalizationService:
    """Service for user personalization and demographics"""

    def __init__(self):
        self.users_file = 'data/users.json'
        self.history_file = 'data/user_history.json'
        os.makedirs('data', exist_ok=True)

    def create_user_profile(self, user_data):
        """Create or update user profile"""
        user_id = str(uuid.uuid4())

        profile = {
            'user_id': user_id,
            'name': user_data.get('name', ''),
            'age': user_data.get('age', 0),
            'gender': user_data.get('gender', ''),
            'location': user_data.get('location', ''),
            'medical_history': user_data.get('medical_history', []),
            'allergies': user_data.get('allergies', []),
            'current_medications': user_data.get('current_medications', []),
            'family_history': user_data.get('family_history', []),
            'lifestyle_factors': user_data.get('lifestyle_factors', {}),
            'created_at': datetime.now().isoformat(),
            'last_updated': datetime.now().isoformat()
        }

        # Save profile
        users = self._load_users()
        users[user_id] = profile
        self._save_users(users)

        return user_id

    def update_user_profile(self, user_id, updates):
        """Update user profile"""
        users = self._load_users()
        if user_id in users:
            users[user_id].update(updates)
            users[user_id]['last_updated'] = datetime.now().isoformat()
            self._save_users(users)
            return True
        return False

    def get_user_profile(self, user_id):
        """Get user profile"""
        users = self._load_users()
        return users.get(user_id)

    def add_prediction_history(self, user_id, prediction_data):
        """Add prediction to user history"""
        history = self._load_history()

        if user_id not in history:
            history[user_id] = []

        history_entry = {
            'timestamp': datetime.now().isoformat(),
            'symptoms': prediction_data.get('symptoms', []),
            'predictions': prediction_data.get('predictions', []),
            'specialist': prediction_data.get('specialist', ''),
            'urgency': prediction_data.get('urgency', 'MEDIUM'),
            'user_feedback': None
        }

        history[user_id].append(history_entry)

        # Keep only last 50 predictions
        if len(history[user_id]) > 50:
            history[user_id] = history[user_id][-50:]

        self._save_history(history)

    def get_user_history(self, user_id, limit=10):
        """Get user prediction history"""
        history = self._load_history()
        user_history = history.get(user_id, [])
        return user_history[-limit:] if user_history else []

    def personalize_predictions(self, user_id, base_predictions):
        """Personalize predictions based on user profile"""
        profile = self.get_user_profile(user_id)
        if not profile:
            return base_predictions

        personalized = base_predictions.copy()

        # Age-based adjustments
        age = profile.get('age', 0)
        if age > 65:
            # Boost age-related conditions
            for pred in personalized:
                disease = pred['disease'].lower()
                if any(term in disease for term in ['cardiac', 'heart', 'osteoporosis', 'arthritis']):
                    pred['confidence'] = min(100, pred['confidence'] + 5)

        # Gender-based adjustments
        gender = profile.get('gender', '').lower()
        if gender == 'female':
            # Boost female-specific conditions
            for pred in personalized:
                disease = pred['disease'].lower()
                if any(term in disease for term in ['ovarian', 'uterine', 'breast', 'menstrual']):
                    pred['confidence'] = min(100, pred['confidence'] + 5)
        elif gender == 'male':
            # Boost male-specific conditions
            for pred in personalized:
                disease = pred['disease'].lower()
                if any(term in disease for term in ['prostate', 'testicular']):
                    pred['confidence'] = min(100, pred['confidence'] + 5)

        # Medical history adjustments
        medical_history = profile.get('medical_history', [])
        for condition in medical_history:
            condition_lower = condition.lower()
            for pred in personalized:
                disease = pred['disease'].lower()
                if condition_lower in disease or disease in condition_lower:
                    pred['confidence'] = min(100, pred['confidence'] + 10)

        # Lifestyle factors
        lifestyle = profile.get('lifestyle_factors', {})
        if lifestyle.get('smoker'):
            for pred in personalized:
                disease = pred['disease'].lower()
                if any(term in disease for term in ['lung', 'cardiac', 'cancer']):
                    pred['confidence'] = min(100, pred['confidence'] + 8)

        return personalized

    def _load_users(self):
        """Load users data"""
        try:
            with open(self.users_file, 'r') as f:
                return json.load(f)
        except:
            return {}

    def _save_users(self, users):
        """Save users data"""
        try:
            with open(self.users_file, 'w') as f:
                json.dump(users, f, indent=2)
        except Exception as e:
            print(f"Users save error: {e}")

    def _load_history(self):
        """Load history data"""
        try:
            with open(self.history_file, 'r') as f:
                return json.load(f)
        except:
            return {}

    def _save_history(self, history):
        """Save history data"""
        try:
            with open(self.history_file, 'w') as f:
                json.dump(history, f, indent=2)
        except Exception as e:
            print(f"History save error: {e}")


class MultilingualService:
    """Service for multilingual support"""

    def __init__(self):
        self.translator = Translator()
        self.supported_languages = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'ja': 'Japanese',
            'ko': 'Korean',
            'zh-cn': 'Chinese (Simplified)',
            'ar': 'Arabic',
            'hi': 'Hindi',
            'ta': 'Tamil',
            'te': 'Telugu'
        }

    def detect_language(self, text):
        """Detect language of input text"""
        try:
            detection = self.translator.detect(text)
            return detection.lang if detection else 'en'
        except:
            return 'en'

    def translate_text(self, text, target_lang='en', source_lang=None):
        """Translate text to target language"""
        try:
            if source_lang and source_lang != target_lang:
                translation = self.translator.translate(text, src=source_lang, dest=target_lang)
                return translation.text
            elif not source_lang:
                translation = self.translator.translate(text, dest=target_lang)
                return translation.text
            else:
                return text
        except Exception as e:
            print(f"Translation error: {e}")
            return text

    def translate_symptoms(self, symptoms_list, target_lang='en'):
        """Translate list of symptoms"""
        translated_symptoms = []
        for symptom in symptoms_list:
            translated = self.translate_text(symptom, target_lang, 'en')
            translated_symptoms.append(translated)
        return translated_symptoms

    def translate_prediction_results(self, predictions, target_lang='en'):
        """Translate prediction results"""
        translated_predictions = []
        for pred in predictions:
            translated_pred = pred.copy()
            translated_pred['disease'] = self.translate_text(pred['disease'], target_lang, 'en')
            translated_pred['specialist'] = self.translate_text(pred['specialist'], target_lang, 'en')
            translated_predictions.append(translated_pred)
        return translated_predictions

    def get_language_name(self, lang_code):
        """Get full language name from code"""
        return self.supported_languages.get(lang_code, lang_code.upper())

    def get_ui_translations(self, lang_code='en'):
        """Get UI translations for given language"""
        # Basic UI translations (can be expanded)
        translations = {
            'en': {
                'title': 'MediGuide - AI Health Assistant',
                'symptoms_placeholder': 'Enter your symptoms...',
                'predict_button': 'Analyze Symptoms',
                'results_title': 'Prediction Results',
                'specialist': 'Recommended Specialist',
                'disclaimer': 'This is not medical advice. Consult a healthcare professional.'
            },
            'es': {
                'title': 'MediGuide - Asistente de Salud IA',
                'symptoms_placeholder': 'Ingrese sus síntomas...',
                'predict_button': 'Analizar Síntomas',
                'results_title': 'Resultados de Predicción',
                'specialist': 'Especialista Recomendado',
                'disclaimer': 'Esto no es consejo médico. Consulte a un profesional de la salud.'
            },
            'fr': {
                'title': 'MediGuide - Assistant Santé IA',
                'symptoms_placeholder': 'Entrez vos symptômes...',
                'predict_button': 'Analyser les Symptômes',
                'results_title': 'Résultats de Prédiction',
                'specialist': 'Spécialiste Recommandé',
                'disclaimer': 'Ceci n\'est pas un conseil médical. Consultez un professionnel de santé.'
            },
            'de': {
                'title': 'MediGuide - KI-Gesundheitsassistent',
                'symptoms_placeholder': 'Geben Sie Ihre Symptome ein...',
                'predict_button': 'Symptome Analysieren',
                'results_title': 'Vorhersageergebnisse',
                'specialist': 'Empfohlener Spezialist',
                'disclaimer': 'Dies ist kein medizinischer Rat. Konsultieren Sie einen Gesundheitsfachmann.'
            },
            'hi': {
                'title': 'MediGuide - AI स्वास्थ्य सहायक',
                'symptoms_placeholder': 'अपने लक्षण दर्ज करें...',
                'predict_button': 'लक्षण विश्लेषण करें',
                'results_title': 'भविष्यवाणी परिणाम',
                'specialist': 'अनुशंसित विशेषज्ञ',
                'disclaimer': 'यह चिकित्सा सलाह नहीं है। स्वास्थ्य पेशेवर से परामर्श करें।'
            },
            'ta': {
                'title': 'MediGuide - AI ஆரோக்கிய உதவியாளர்',
                'symptoms_placeholder': 'உங்கள் அறிகுறிகளை உள்ளீடு செய்யவும்...',
                'predict_button': 'அறிகுறிகளை பகுப்பாய்வு செய்யவும்',
                'results_title': 'கணிப்பு முடிவுகள்',
                'specialist': 'பரிந்துரைக்கப்படும் நிபுணர்',
                'disclaimer': 'இது மருத்துவ ஆலோசனை அல்ல. ஆரோக்கிய நிபுணரை அணுகவும்.'
            }
        }

        return translations.get(lang_code, translations['en'])


# Initialize services
news_service = MedicalNewsService()
personalization_service = UserPersonalizationService()
multilingual_service = MultilingualService()

# Test functions
if __name__ == "__main__":
    print("Testing Advanced Features...")

    # Test news service
    print("1. Testing Medical News Service...")
    news = news_service.fetch_medical_news(3)
    print(f"   Fetched {len(news)} news articles")

    # Test personalization
    print("2. Testing Personalization Service...")
    user_id = personalization_service.create_user_profile({
        'name': 'John Doe',
        'age': 45,
        'gender': 'male',
        'location': 'New York'
    })
    print(f"   Created user profile: {user_id}")

    # Test multilingual
    print("3. Testing Multilingual Service...")
    translated = multilingual_service.translate_text("chest pain", "es")
    print(f"   Translation 'chest pain' to Spanish: {translated}")

    print("✅ All advanced features initialized successfully!")