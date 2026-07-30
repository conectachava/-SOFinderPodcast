#!/usr/bin/env python3
"""
Main Pipeline Orchestrator v2.0
Executes SourceFinder, ScriptWriter, Storyboard Generator, TTS, Music & Audio Mixer.
"""

import argparse
from pathlib import Path
import subprocess
import sys

# --- Configuration ---
SOURCE_FINDER_SCRIPT = "source_finder.py"
SCRIPT_WRITER_SCRIPT = "generate_script_v2.py"
STORYBOARD_SCRIPT = "generate_storyboard.py"
TTS_SCRIPT = "generate_tts.py"
MUSIC_SCRIPT = "generate_music.py"
MIXER_SCRIPT = "mix_audio.py"


class Orchestrator:
    def __init__(self, topic: str, content_type: str, show_format: str, workspace: Path):
        self.topic = topic
        self.content_type = content_type
        self.show_format = show_format
        self.workspace = workspace

        # Rutas clave para los artefactos intermedios
        self.report_path = self.workspace / "intelligence_report.md"
        self.script_path = self.workspace / "script.md"
        self.storyboard_path = self.workspace / "storyboard.json"
        self.final_audio_path = self.workspace / "final_podcast.mp3"

        self.workspace.mkdir(parents=True, exist_ok=True)

    def _run_step(self, cmd_args: list, step_name: str):
        print(f"\n▶ Executing Step: {step_name}...")
        try:
            cmd = [sys.executable] + cmd_args
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            print(result.stdout)
        except subprocess.CalledProcessError as e:
            print(f"❌ ERROR in {step_name}:", file=sys.stderr)
            print(e.stderr, file=sys.stderr)
            sys.exit(1)

    def run_pipeline(self):
        print("🚀 Starting Podcast & Video Generation Pipeline...")
        
        # 1. Módulo de Búsqueda (SourceFinder)
        self._run_step(
            [SOURCE_FINDER_SCRIPT, "--topic", self.topic, "--type", self.content_type, "--output_path", str(self.report_path)],
            "Intelligence Gathering (SourceFinder)"
        )

        # 2. Módulo de Guion (ScriptWriter)
        self._run_step(
            [SCRIPT_WRITER_SCRIPT, "--report_path", str(self.report_path), "--style", self.show_format, "--output_path", str(self.script_path)],
            "Script Writing (v2.0)"
        )
        
        # ==========================================
        # NUEVO PASO: Módulo de Storyboard (Flow Video)
        # ==========================================
        self._run_step(
            [STORYBOARD_SCRIPT, "--script_path", str(self.script_path), "--output_path", str(self.storyboard_path)],
            "Visual Storyboard Generation (Flow/Video)"
        )
        # ==========================================

        print("✅ Pipeline Completed Successfully!")


def main():
    parser = argparse.ArgumentParser(description="Main Podcast & Video Generation Orchestrator")
    parser.add_argument("--topic", type=str, required=True, help="Topic for research")
    parser.add_argument("--type", type=str, default="General", help="Content type")
    parser.add_argument("--format", type=str, default="Debate", help="Podcast format style")
    parser.add_argument("--workspace", type=Path, default=Path("workspace"), help="Workspace folder")
    args = parser.parse_args()

    orchestrator = Orchestrator(
        topic=args.topic,
        content_type=args.type,
        show_format=args.format,
        workspace=args.workspace
    )
    orchestrator.run_pipeline()


if __name__ == "__main__":
    main()
