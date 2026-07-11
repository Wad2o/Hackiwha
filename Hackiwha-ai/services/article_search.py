# article_search.py
import httpx
import trafilatura
import json
from ddgs import DDGS

from prompts.article_summarizer import ARTICLE_SUMMARIZER_SYSTEM_PROMPT
from services.llm import LLMClient
from app.settings import settings

SOCIAL_BLACKLIST = [
    "twitter.com",
    "x.com",
    "instagram.com",
    "tiktok.com",
    "reddit.com",
    "youtube.com",
    "facebook.com",
    "pinterest.com",
    "linkedin.com/posts",
    "threads.net",
]


def is_article_url(url: str) -> bool:
    url_lower = url.lower()
    if any(blocked in url_lower for blocked in SOCIAL_BLACKLIST):
        return False
    return True


def search_articles(query: str, max_results: int = 10) -> list[dict]:
    results = []
    with DDGS() as ddgs:
        for r in ddgs.text(query, max_results=max_results):
            results.append(
                {
                    "title": r.get("title"),
                    "url": r.get("href"),
                    "snippet": r.get("body"),
                }
            )
    return results


def fetch_and_extract(url: str) -> dict | None:
    try:
        resp = httpx.get(
            url,
            timeout=10.0,
            follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0"},
        )
        resp.raise_for_status()
    except (httpx.HTTPError, httpx.TimeoutException):
        return None

    extracted = trafilatura.extract(
        resp.text,
        include_comments=False,
        include_tables=False,
        favor_precision=True,
        output_format="json",
        with_metadata=True,
    )
    if not extracted:
        return None

    data = json.loads(extracted)
    text = data.get("text", "")

    if len(text.split()) < 100:
        return None

    return {
        "url": url,
        "title": data.get("title"),
        "author": data.get("author"),
        "date": data.get("date"),
        "text": text,
    }


def get_top_articles(query: str, n: int = 3, search_pool: int = 10) -> list[dict]:
    raw_results = search_articles(query, max_results=search_pool)
    article_candidates = [r for r in raw_results if is_article_url(r["url"])]

    extracted_articles = []
    for candidate in article_candidates:
        article = fetch_and_extract(candidate["url"])
        if article:
            extracted_articles.append(article)
        if len(extracted_articles) >= n:
            break

    return extracted_articles


def summarize_articles(query: str, articles: list[dict]) -> str:
    llm_client = LLMClient(token=settings.hf_token)

    articles_prompt = "\n\n".join(
        f"{indx}. {a["title"]} by {a["author"]} (Published: {a["date"]}):\n\n{a["text"]}"
        for indx, a in enumerate(articles, start=1)
    )

    user_prompt = f"""
        After the article web search "{query}" we have found the following articles.
        
        ## Articles
        
        {articles_prompt}     
    """

    response = llm_client.run(
        system_prompt=ARTICLE_SUMMARIZER_SYSTEM_PROMPT,
        user_prompt=user_prompt,
    )

    if "summary" in response:
        return response["summary"]
    else:
        return "No Summary Was produced for this query"
