import re
import unicodedata


def normalize_title(text: str) -> str:
    """
    Baja a minúsculas, saca acentos y colapsa lo que no sea alfanumérico.

    Es el germen del matcher de la fase 3: cuando lleguen los títulos de
    Mercado Libre, esta misma función se va a extender con la lista de
    palabras de ruido ('original', 'funcionando', 'leer descripcion').
    Vive acá y no en scripts/ justamente para que la ingesta la comparta.
    """
    text = unicodedata.normalize("NFKD", text.lower())
    text = "".join(c for c in text if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def slugify(text: str) -> str:
    return re.sub(r"\s+", "-", normalize_title(text))
