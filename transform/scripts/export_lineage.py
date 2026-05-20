#!/usr/bin/env python3
"""
export_lineage.py
=================
Walks the dbt project under ../models and ../seeds, extracts
{{ ref('...') }} and {{ source('...', '...') }} calls from every .sql file,
and produces a static lineage.json for the Liner Notes SPA.

Output path: ../../liner-notes-app/public/lineage.json

Run from the transform/ directory or any location -- the script resolves
paths relative to its own __file__ location.
"""

import json
import os
import re
import sys


# ---------------------------------------------------------------------------
# Path resolution
# ---------------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TRANSFORM_DIR = os.path.dirname(SCRIPT_DIR)           # transform/
MODELS_DIR = os.path.join(TRANSFORM_DIR, "models")
SEEDS_DIR = os.path.join(TRANSFORM_DIR, "seeds")

REPO_ROOT = os.path.dirname(TRANSFORM_DIR)            # LinerNotes-ODI-Demo/
OUTPUT_PATH = os.path.join(REPO_ROOT, "liner-notes-app", "public", "lineage.json")

# ---------------------------------------------------------------------------
# Regex patterns for Jinja ref / source calls
# ---------------------------------------------------------------------------

REF_RE = re.compile(r"""\{\{\s*ref\(\s*['"]([^'"]+)['"]\s*\)\s*\}\}""")
SOURCE_RE = re.compile(
    r"""\{\{\s*source\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)\s*\}\}"""
)

# ---------------------------------------------------------------------------
# Model-type classification helpers
# ---------------------------------------------------------------------------

def classify_model(rel_path: str) -> str:
    """Return 'staging', 'mart', or 'seed' based on directory path."""
    parts = rel_path.replace("\\", "/").split("/")
    if "staging" in parts:
        return "staging"
    if "seeds" in parts or rel_path.endswith(".csv"):
        return "seed"
    # everything else under models/marts is a mart
    return "mart"


def model_subtype(rel_path: str) -> str:
    """Return the mart sub-layer (core, listening, curation) or empty string."""
    parts = rel_path.replace("\\", "/").split("/")
    mart_layers = {"core", "listening", "curation"}
    for part in parts:
        if part in mart_layers:
            return part
    return ""


# ---------------------------------------------------------------------------
# Walk SQL files and collect nodes + edges
# ---------------------------------------------------------------------------

def collect_sql_files(base_dir: str):
    """Yield (abs_path, rel_path_from_base_dir) for every .sql file."""
    for root, _dirs, files in os.walk(base_dir):
        for fname in files:
            if fname.endswith(".sql"):
                abs_path = os.path.join(root, fname)
                rel_path = os.path.relpath(abs_path, base_dir)
                yield abs_path, rel_path


def collect_seed_files(seeds_dir: str):
    """Yield (model_name) for every .csv seed file."""
    if not os.path.isdir(seeds_dir):
        return
    for fname in os.listdir(seeds_dir):
        if fname.endswith(".csv"):
            yield os.path.splitext(fname)[0]


def build_graph():
    nodes = {}   # node_id -> node dict
    edges = []   # list of {"from": ..., "to": ...}

    # ---- seeds ----
    for seed_name in collect_seed_files(SEEDS_DIR):
        node_id = seed_name
        nodes[node_id] = {
            "id": node_id,
            "type": "seed",
            "layer": "seed",
            "depends_on": [],
        }

    # ---- sql models ----
    for abs_path, rel_path in collect_sql_files(MODELS_DIR):
        model_name = os.path.splitext(os.path.basename(abs_path))[0]
        model_type = classify_model(rel_path)
        layer = model_subtype(rel_path) or model_type

        with open(abs_path, "r", encoding="utf-8") as fh:
            sql = fh.read()

        depends_on = []

        # {{ source('schema', 'table') }} -> source node id
        for schema, table in SOURCE_RE.findall(sql):
            source_node_id = f"{schema}.{table}"
            depends_on.append(source_node_id)
            # register source node if not already seen
            if source_node_id not in nodes:
                nodes[source_node_id] = {
                    "id": source_node_id,
                    "type": "source",
                    "layer": "source",
                    "schema": schema,
                    "table": table,
                    "depends_on": [],
                }
            edges.append({"from": source_node_id, "to": model_name})

        # {{ ref('model_name') }} -> model node id
        for ref_name in REF_RE.findall(sql):
            depends_on.append(ref_name)
            edges.append({"from": ref_name, "to": model_name})

        nodes[model_name] = {
            "id": model_name,
            "type": model_type,
            "layer": layer,
            "depends_on": depends_on,
        }

    return nodes, edges


# ---------------------------------------------------------------------------
# Read exposures.yml to build the exposure node
# ---------------------------------------------------------------------------

def parse_exposures_yml():
    """
    Lightweight YAML parser for the exposures file (avoids PyYAML dependency).
    Returns a list of exposure dicts with id and depends_on.
    """
    exposures_path = os.path.join(
        MODELS_DIR, "marts", "curation", "exposures.yml"
    )
    if not os.path.isfile(exposures_path):
        return []

    with open(exposures_path, "r", encoding="utf-8") as fh:
        content = fh.read()

    # Extract exposure name
    name_match = re.search(r"^\s*-\s*name:\s*(\S+)", content, re.MULTILINE)
    if not name_match:
        return []
    exposure_name = name_match.group(1)

    # Extract type
    type_match = re.search(r"^\s+type:\s*(\S+)", content, re.MULTILINE)
    exposure_type = type_match.group(1) if type_match else "application"

    # Extract ref() calls from depends_on block
    dep_refs = re.findall(r"ref\(['\"]([^'\"]+)['\"]\)", content)

    return [
        {
            "id": exposure_name,
            "type": exposure_type,
            "depends_on": dep_refs,
        }
    ]


# ---------------------------------------------------------------------------
# Assemble output JSON
# ---------------------------------------------------------------------------

def main():
    nodes_dict, edges = build_graph()
    exposures = parse_exposures_yml()

    # Convert nodes dict to list, sorted for determinism
    nodes_list = sorted(nodes_dict.values(), key=lambda n: n["id"])

    # De-duplicate edges (a model can ref() the same dependency twice via CTEs)
    seen_edges = set()
    unique_edges = []
    for e in edges:
        key = (e["from"], e["to"])
        if key not in seen_edges:
            seen_edges.add(key)
            unique_edges.append(e)
    unique_edges.sort(key=lambda e: (e["from"], e["to"]))

    output = {
        "generated_at": _iso_now(),
        "nodes": nodes_list,
        "edges": unique_edges,
        "exposures": exposures,
    }

    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as fh:
        json.dump(output, fh, indent=2)

    # --- summary ---
    node_count = len(nodes_list)
    edge_count = len(unique_edges)
    source_count = sum(1 for n in nodes_list if n["type"] == "source")
    staging_count = sum(1 for n in nodes_list if n["type"] == "staging")
    mart_count = sum(1 for n in nodes_list if n["type"] == "mart")
    seed_count = sum(1 for n in nodes_list if n["type"] == "seed")

    print(f"lineage.json written to: {OUTPUT_PATH}")
    print(f"  nodes : {node_count}  (source={source_count}, seed={seed_count}, staging={staging_count}, mart={mart_count})")
    print(f"  edges : {edge_count}")
    print(f"  exposures: {len(exposures)}")

    # Validate by re-reading the file
    with open(OUTPUT_PATH, "r", encoding="utf-8") as fh:
        _validate = json.load(fh)
    print("  JSON validation: OK")


def _iso_now() -> str:
    from datetime import datetime, timezone
    return datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


if __name__ == "__main__":
    sys.exit(main())
