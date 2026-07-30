# backend/tests/test_prompt_builder.py
"""
Unit tests for Prompt Builder utility functions and prompt assembly pipeline.
"""

import pytest
from app.prompts.prompt_builder import (
    get_industry_baseline_prompt,
    build_full_orchestrator_prompt,
)


def test_get_industry_baseline_prompt():
    """Verify that industry baseline prompts are retrieved properly."""
    insurance_prompt = get_industry_baseline_prompt("Insurance")
    assert "insurance sales assistant" in insurance_prompt.lower()

    healthcare_prompt = get_industry_baseline_prompt("Healthcare")
    assert "healthcare assistant" in healthcare_prompt.lower()
    assert "never provide medical diagnosis" in healthcare_prompt.lower()


def test_build_full_orchestrator_prompt_assembly_order():
    """Verify exact pipeline assembly order: Industry Baseline -> Tenant Prompt -> Language -> Rules -> Boundary."""
    tenant_prompt = "Custom Tenant Policy: We offer 10% discount on annual plans."
    industry = "Real Estate"
    
    full_prompt = build_full_orchestrator_prompt(
        base_system_prompt=tenant_prompt,
        selected_language="hindi",
        agent_name="Neha",
        is_female=True,
        industry=industry,
    )

    # 1. Industry Baseline Prompt should be at the start
    assert "professional real estate sales assistant" in full_prompt.lower()

    # 2. Tenant instructions appended after baseline
    assert "[TENANT INSTRUCTIONS]:" in full_prompt
    assert tenant_prompt in full_prompt

    # 3. Language rules included
    assert "[LANGUAGE RULE]:" in full_prompt

    # 4. Conversational Rules included
    assert "[CRITICAL CONVERSATIONAL RULES]:" in full_prompt
    assert "Agent Identity: Your name is Neha" in full_prompt

    # 5. Industry Boundary Rule included
    assert "STRICT TOPIC FOCUS: You are strictly a Real Estate Sales Voice Agent" in full_prompt


def test_build_full_orchestrator_prompt_empty_tenant_prompt():
    """Verify prompt builder works gracefully when tenant prompt is empty."""
    full_prompt = build_full_orchestrator_prompt(
        base_system_prompt="",
        selected_language="english",
        agent_name="Rohan",
        is_female=False,
        industry="IT Training",
    )

    assert "professional it training sales assistant" in full_prompt.lower()
    assert "[TENANT INSTRUCTIONS]" not in full_prompt
    assert "Agent Identity: Your name is Rohan" in full_prompt
