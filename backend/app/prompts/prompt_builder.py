# backend/app/prompts/prompt_builder.py
"""
Prompt Builder utility functions to dynamically assemble orchestrator system instructions.
"""

from app.prompts.base_rules import (
    get_gender_instruction,
    get_language_rule,
    get_core_conversational_rules,
)
from app.prompts.boundary_rules import GET_INDUSTRY_BOUNDARY_RULE
from app.prompts.industry_prompts import get_baseline_prompt


def get_industry_baseline_prompt(industry: str) -> str:
    """Helper to retrieve baseline onboarding prompt for an industry."""
    return get_baseline_prompt(industry)


def build_full_orchestrator_prompt(
    base_system_prompt: str,
    selected_language: str,
    agent_name: str,
    is_female: bool,
    industry: str = "Insurance"
) -> str:
    """
    Assembles the full system prompt used by VoiceOrchestrator for LLM completion.

    Pipeline assembly order:
    1. Industry Baseline Prompt (Foundation)
    2. Tenant Prompt (stored in DB, extends baseline)
    3. Language Rules
    4. Gender Rules & Core Conversation Rules
    5. Industry Boundary Rules

    Args:
        base_system_prompt: The tenant-specific prompt loaded from DB / Tenant model.
        selected_language: Language mode ('auto', 'hindi', 'english').
        agent_name: Name of the agent (e.g., Neha, Rohan).
        is_female: Gender flag for grammar rule injection.
        industry: Industry string to select baseline prompt & topic boundary lock.

    Returns:
        Fully augmented system prompt string ready for LLM.
    """
    # 1. Industry Baseline Prompt (Foundation)
    baseline_prompt = get_industry_baseline_prompt(industry)
    system_prompt = baseline_prompt

    # 2. Tenant Prompt (stored in database, extends the baseline)
    if base_system_prompt and base_system_prompt.strip():
        system_prompt += f"\n\n[TENANT INSTRUCTIONS]:\n{base_system_prompt.strip()}"

    # 3. Inject language rules
    lang_rule = get_language_rule(selected_language)
    if lang_rule:
        system_prompt += f"\n\n{lang_rule}"

    # 4. Gender Rules & Core Conversation Rules
    gender_instruction = get_gender_instruction(is_female)
    rules_list = get_core_conversational_rules(agent_name, gender_instruction)

    # 5. Industry Boundary Rules
    boundary_rule = GET_INDUSTRY_BOUNDARY_RULE(industry)
    if boundary_rule:
        rules_list.append(boundary_rule)

    # 6. Append CRITICAL CONVERSATIONAL RULES block & return final prompt
    rules_block = "\n\n[CRITICAL CONVERSATIONAL RULES]:\n" + "\n".join(rules_list)
    system_prompt += rules_block

    return system_prompt

