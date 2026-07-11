from app.schemas.brand import BrandImage
from app.schemas.post import Post


def build_brand_image_prompt(brand: BrandImage):
    brand_image = f"""
        ## Brand Image
        
        ### Visual Identity
        
        The brand has a clear visual identity and it is defined by:
        
        - Logo: {brand.visual.logo}
        - Typography: We use the following fonts in our brand:
            - For titles: {brand.visual.typography.titles}
            - For The Main Text: {brand.visual.typography.text}
            - For the little Effects, Extra, Non-important or Decorative texts: {brand.visual.typography.extra}
            - For the Highlighted text that we want to bring attention to: {brand.visual.typography.highlight}
        - Photography: The style we use for photography is best described as {brand.visual.photography}
        - Color palette: The Colors we use are the following {brand.visual.color_palette}
        
        ## Brand Tone
        
        Our brand maintains a specific tone across our videos, defined by:
        
        - Vocabulary: The words and vocabulary used in our videos are described as {brand.tone.vocabulary}
        - Humor: Our humor is described as {brand.tone.humor_level}
        - Formality: Our scripts usually follow a tone that is {brand.tone.formality}
        - Sentence Rhythm: Our scripts' sentences are {brand.tone.sentence_rhythm}
        
        ## Brand / Problem Positioning
        
        - Target Audience: Our video are usually watched by / targeted to: {brand.positioning.target_audience}
        - Problem Statement: Our brand fixes the following problem, {brand.positioning.problem_statement}
        - Flare: We bring to the table an additional flare:
            - {brand.positioning.flare}
    """
    return brand_image


def build_posts_history(posts: list[Post]):
    posts_raw = "\n\n".join(f"""
                            [POST]:
                            
                            - idea: {p.idea}
                            - script: {p.script}
                            - hook: {p.hook}
                            - platform: {p.platform}
                            - is loop: {p.is_loop}
                        """ for p in posts[:3])
    return posts_raw
