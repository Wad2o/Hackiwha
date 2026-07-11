import json, re
from dataclasses import dataclass
from typing import Callable, Optional
from huggingface_hub import InferenceClient

HF_MODEL = "Qwen/Qwen3-4B-Instruct-2507"


@dataclass
class Tool:
    name: str
    description: str
    parameters: dict
    function: Callable[..., str]


class LLMClient:
    def __init__(self, token: str):
        self.client = InferenceClient(provider="auto", token=token)

    def _complete(self, messages: list[dict]):
        resp = self.client.chat_completion(
            model=HF_MODEL, messages=messages, temperature=0.4, max_tokens=1000
        )
        return resp.choices[0].message.content or ""

    def run(
        self,
        system_prompt: str,
        user_prompt: str,
        tools: list[Tool] = None,
        max_iterations: int = 5,
    ):
        tools = tools or []
        tool_map = {t.name: t for t in tools}
        tool_block = "\n".join(
            f"{t.name}: {t.description} args={t.parameters}" for t in tools
        )

        sys = system_prompt + (
            f'\n\nTOOLS:\n{tool_block}\nCall Tool: reply ONLY {{"tool_call":{{"name":...,"arguments":{{...}}}}}}'
        )

        messages = [
            {"role": "system", "content": sys},
            {"role": "user", "content": user_prompt},
        ]

        for i in range(max_iterations):
            raw = self._complete(messages=messages)
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            data = json.loads(match.group(0)) if match else None

            if data and "tool_call" in data:
                call = data["tool_call"]
                tool = tool_map.get(call["name"])
                result = (
                    tool.function(**call.get("arguments", {}))
                    if tool
                    else "unknown tool call"
                )
                messages.append({"role": "assistant", "content": raw})
                messages.append(
                    {
                        "role": "user",
                        "content": f"[tool_result, Tool Calls Remaining: {max_iterations - (i + 1)}]: {result}",
                    }
                )
                continue

            if data:
                return data
            else:
                raise Exception({"error": "Malformed JSON outputted"})

        raise Exception({"error": "tool loop exhausted"})
