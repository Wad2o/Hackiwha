from services.article_search import get_top_articles, summarize_articles


def search_web(query: str) -> str:
    print(f"[LOG] Web search tool used, {query}")
    top_articles = get_top_articles(query=query)
    print(f"[LOG] Got the articles for the web search")
    summary = summarize_articles(query, top_articles)
    print(f"[LOG] Finished getting summary from secondary AI")
    return summary


def search_twitter_drama(query: str, max_results: int = 5):
    # TODO: Only if time ALlows for this, because more down stream and stuff aaah
    print(f"[LOG] Twitter tool used, {query}")
