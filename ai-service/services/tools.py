from services.knowledge_base import knowledge_base_query
from services.llm import Tool
from services.partner_search import search_web

video_coach_tools = [
    Tool(
        name="search_knowledge_base",
        description="""
            Searches the knowledge base for:
                - relevant hook formulas 
                - hook psychological patterns
                - sound effect references 
                - visual references
            > These categories are based on content types.
            > thus the queries should be short and mention mostly the type of content you are going for
                
            You can use this on the user's prompt or do your own search like its a search engine.
        """,
        parameters={
            "type": "object",
            "properties": {"query": {"type": "string"}},
            "required": ["query"],
        },
        function=knowledge_base_query,
    ),
]

partner_evaluator_tools = [
    Tool(
        name="search_web_articles",
        description="""
            Searches the internet for articles then summarizes them.
            You can use this to search the internet about:
                - biography
                - company history
                - partnerships
                - sponsorships
                - collaborations
                - controversies
                - public perception
                - products
                - campaigns
                - achievements
                - legal matters
                - leadership
                - audience
                - values
            Of any given company / partner that is given to you.
            The structure of the queries should be kept simple, like the ones optimized for traditional search engines.
        """,
        parameters={
            "type": "object",
            "properties": {"query": {"type": "string"}},
            "required": ["query"],
        },
        function=search_web,
    )
]
